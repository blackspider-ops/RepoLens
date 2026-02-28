import axios from 'axios';
import { GitHubRepo } from './types';

export class GitHubFetcher {
  private baseUrl = 'https://api.github.com';
  private maxRetries = 3;
  private retryDelay = 1000;
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  /**
   * Get headers with optional authentication
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  parseGitHubUrl(url: string): GitHubRepo | null {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /^([^\/]+)\/([^\/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, '')
        };
      }
    }
    return null;
  }

  /**
   * Sleep helper for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, options: any, retries = this.maxRetries): Promise<any> {
    try {
      const response = await axios.get(url, options);
      return response;
    } catch (error: any) {
      if (retries > 0 && error.response?.status !== 404) {
        await this.sleep(this.retryDelay);
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Fetch file content from GitHub
   */
  async fetchFile(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: { 
            ...this.getHeaders(),
            Accept: 'application/vnd.github.v3.raw' 
          },
          timeout: 15000
        }
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch repository file tree
   */
  async fetchFileTree(owner: string, repo: string): Promise<string[]> {
    const branches = ['main', 'master', 'HEAD'];
    
    for (const branch of branches) {
      try {
        const response = await this.fetchWithRetry(
          `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
          { 
            headers: this.getHeaders(),
            timeout: 15000 
          }
        );
        
        if (response.data.tree) {
          return response.data.tree
            .filter((item: any) => item.type === 'blob')
            .map((item: any) => item.path);
        }
      } catch (error: any) {
        // Try next branch
        if (error.response?.status === 404) {
          continue;
        }
        // For other errors, throw with more context
        if (error.response?.status === 403) {
          const rateLimitMsg = this.token 
            ? 'GitHub API rate limit exceeded even with token. Please try again later.'
            : 'GitHub API rate limit exceeded. Add a GitHub token in settings to increase limit from 60 to 5,000 requests/hour.';
          throw new Error(rateLimitMsg);
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
    }
    
    throw new Error('Repository not found or inaccessible. Check the URL and repository visibility.');
  }

  /**
   * Fetch repository metadata (stars, forks, description, etc.)
   */
  async fetchRepoMetadata(owner: string, repo: string): Promise<any> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/repos/${owner}/${repo}`,
        { 
          headers: this.getHeaders(),
          timeout: 15000 
        }
      );
      
      return {
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        watchers: response.data.watchers_count,
        openIssues: response.data.open_issues_count,
        language: response.data.language,
        license: response.data.license?.name || 'No license',
        topics: response.data.topics || [],
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        homepage: response.data.homepage,
        size: response.data.size
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch multiple key files
   */
  async fetchKeyFiles(owner: string, repo: string): Promise<Record<string, string>> {
    const keyFiles = [
      'README.md',
      'package.json',
      'requirements.txt',
      'setup.py',
      'pyproject.toml',
      'Makefile',
      'Cargo.toml',
      'go.mod',
      'pom.xml',
      'build.gradle'
    ];

    const results: Record<string, string> = {};
    
    await Promise.all(
      keyFiles.map(async (file) => {
        const content = await this.fetchFile(owner, repo, file);
        if (content) {
          results[file] = content;
        }
      })
    );

    return results;
  }

  /**
   * Fetch sample code files for security analysis
   */
  async fetchCodeFiles(owner: string, repo: string, fileTree: string[]): Promise<Record<string, string>> {
    const codeExtensions = ['.js', '.ts', '.py', '.sh', '.bash', '.go', '.rs', '.java', '.php', '.rb'];
    
    // Get up to 20 code files for security scanning
    const codeFiles = fileTree
      .filter(file => {
        // Skip test files, node_modules, vendor, etc.
        if (file.includes('node_modules/') || 
            file.includes('vendor/') || 
            file.includes('test/') ||
            file.includes('tests/') ||
            file.includes('__tests__/') ||
            file.includes('.test.') ||
            file.includes('.spec.')) {
          return false;
        }
        return codeExtensions.some(ext => file.endsWith(ext));
      })
      .slice(0, 20); // Limit to 20 files to avoid rate limiting

    const results: Record<string, string> = {};
    
    await Promise.all(
      codeFiles.map(async (file) => {
        const content = await this.fetchFile(owner, repo, file);
        if (content) {
          results[file] = content;
        }
      })
    );

    return results;
  }
}

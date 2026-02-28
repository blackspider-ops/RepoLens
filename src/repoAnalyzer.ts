import { RepoAnalysis } from './types';

export class RepoAnalyzer {
  /**
   * Analyze repository structure and detect language, package manager, commands
   */
  analyze(fileTree: string[], keyFiles: Record<string, string>): RepoAnalysis {
    const language = this.detectLanguage(fileTree, keyFiles);
    const packageManager = this.detectPackageManager(keyFiles);
    const { installCommand, runCommand } = this.detectCommands(language, packageManager, keyFiles);
    const keyFilesList = Object.keys(keyFiles);
    const suspiciousFiles = this.detectSuspiciousFiles(fileTree);

    return {
      language,
      detectedPackageManager: packageManager,
      installCommand,
      runCommand,
      keyFiles: keyFilesList,
      suspiciousFiles,
      readme: keyFiles['README.md'],
      fileTree
    };
  }

  private detectLanguage(fileTree: string[], keyFiles: Record<string, string>): string {
    if (keyFiles['package.json']) return 'JavaScript/TypeScript';
    if (keyFiles['requirements.txt'] || keyFiles['setup.py'] || keyFiles['pyproject.toml']) return 'Python';
    if (keyFiles['Cargo.toml']) return 'Rust';
    if (keyFiles['go.mod']) return 'Go';
    if (keyFiles['pom.xml'] || keyFiles['build.gradle']) return 'Java';

    // Fallback: count file extensions
    const extensions: Record<string, number> = {};
    fileTree.forEach(file => {
      const ext = file.split('.').pop()?.toLowerCase();
      if (ext) {
        extensions[ext] = (extensions[ext] || 0) + 1;
      }
    });

    const sorted = Object.entries(extensions).sort((a, b) => b[1] - a[1]);
    const topExt = sorted[0]?.[0];

    const extMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'rs': 'Rust',
      'go': 'Go',
      'java': 'Java',
      'rb': 'Ruby',
      'php': 'PHP',
      'c': 'C',
      'cpp': 'C++',
      'cs': 'C#'
    };

    return extMap[topExt] || 'Unknown';
  }

  private detectPackageManager(keyFiles: Record<string, string>): string {
    if (keyFiles['package.json']) return 'npm/yarn';
    if (keyFiles['requirements.txt']) return 'pip';
    if (keyFiles['pyproject.toml']) return 'poetry/pip';
    if (keyFiles['Cargo.toml']) return 'cargo';
    if (keyFiles['go.mod']) return 'go';
    if (keyFiles['pom.xml']) return 'maven';
    if (keyFiles['build.gradle']) return 'gradle';
    return 'unknown';
  }

  private detectCommands(
    language: string,
    packageManager: string,
    keyFiles: Record<string, string>
  ): { installCommand: string; runCommand: string } {
    let installCommand = 'No install command detected';
    let runCommand = 'No run command detected';

    // JavaScript/TypeScript
    if (keyFiles['package.json']) {
      installCommand = 'npm install';
      try {
        const pkg = JSON.parse(keyFiles['package.json']);
        if (pkg.scripts) {
          if (pkg.scripts.start) runCommand = 'npm start';
          else if (pkg.scripts.dev) runCommand = 'npm run dev';
          else if (pkg.scripts.build) runCommand = 'npm run build';
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Python
    if (keyFiles['requirements.txt']) {
      installCommand = 'pip install -r requirements.txt';
      runCommand = 'python main.py (or check README)';
    }

    if (keyFiles['setup.py']) {
      installCommand = 'pip install -e .';
    }

    if (keyFiles['pyproject.toml']) {
      installCommand = 'poetry install';
      runCommand = 'poetry run python main.py';
    }

    // Rust
    if (keyFiles['Cargo.toml']) {
      installCommand = 'cargo build';
      runCommand = 'cargo run';
    }

    // Go
    if (keyFiles['go.mod']) {
      installCommand = 'go mod download';
      runCommand = 'go run .';
    }

    // Makefile
    if (keyFiles['Makefile']) {
      const makefile = keyFiles['Makefile'];
      if (makefile.includes('install:')) {
        installCommand = 'make install';
      }
      if (makefile.includes('run:')) {
        runCommand = 'make run';
      }
    }

    return { installCommand, runCommand };
  }

  private detectSuspiciousFiles(fileTree: string[]): string[] {
    const suspicious: string[] = [];
    const patterns = [
      /\.env$/,
      /\.key$/,
      /\.pem$/,
      /password/i,
      /secret/i,
      /token/i,
      /\.exe$/,
      /\.dll$/,
      /\.so$/,
      /\.dylib$/
    ];

    fileTree.forEach(file => {
      if (patterns.some(pattern => pattern.test(file))) {
        suspicious.push(file);
      }
    });

    return suspicious;
  }
}

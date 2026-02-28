import * as vscode from 'vscode';
import { GitHubFetcher } from './githubFetcher';
import { RepoAnalyzer } from './repoAnalyzer';
import { SecurityScanner } from './securityScanner';
import { OllamaProvider } from './providers/ollamaProvider';
import { UniversalApiProvider } from './providers/universalApiProvider';
import { OfflineProvider } from './providers/offlineProvider';
import { WebviewPanel } from './webviewPanel';
import { AIProvider, RepoAnalysis, SecurityFindings } from './types';

export function activate(context: vscode.ExtensionContext) {
  console.log('RepoLens extension activated');

  const provider = new RepoLensViewProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('repolens.sidebar', provider)
  );

  // Register command to analyze current repository
  context.subscriptions.push(
    vscode.commands.registerCommand('repolens.analyzeCurrentRepo', () => {
      analyzeCurrentRepo(context);
    })
  );

  // Auto-detect git repository and run CLI analysis
  autoDetectAndAnalyze(context);
}

async function analyzeCurrentRepo(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const fs = require('fs');
  const path = require('path');

  // Check if this is a git repository
  const gitPath = path.join(rootPath, '.git');
  if (!fs.existsSync(gitPath)) {
    vscode.window.showErrorMessage('Current folder is not a git repository');
    return;
  }

  // Check if CLI is available
  let cliInstalled = false;
  try {
    const { execSync } = require('child_process');
    execSync('command -v repolens', { stdio: 'ignore' });
    cliInstalled = true;
  } catch {
    cliInstalled = false;
  }

  const terminal = vscode.window.createTerminal({
    name: 'RepoLens CLI',
    cwd: rootPath
  });
  terminal.show();

  if (!cliInstalled) {
    // Install CLI automatically
    const extensionPath = context.extensionUri.fsPath;
    terminal.sendText('# 📦 Installing RepoLens CLI...');
    terminal.sendText(`cd ${extensionPath}/cli && npm install && npm run build && npm link && cd -`);
    await sleep(8000);
    terminal.sendText('');
  }

  // Run CLI
  terminal.sendText('repolens interactive');

  vscode.window.showInformationMessage('🔍 RepoLens CLI started!');
}

async function autoDetectAndAnalyze(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const fs = require('fs');
  const path = require('path');

  // Check if this is a git repository
  const gitPath = path.join(rootPath, '.git');
  if (!fs.existsSync(gitPath)) {
    return;
  }

  // Check for the marker file
  const markerPath = path.join(rootPath, '.repolens-setup');
  if (!fs.existsSync(markerPath)) {
    return;
  }

  // Read marker file
  let markerData;
  try {
    const markerContent = fs.readFileSync(markerPath, 'utf-8');
    markerData = JSON.parse(markerContent);
  } catch {
    return;
  }

  // Check if marker is recent (within last 5 minutes)
  const age = Date.now() - markerData.timestamp;
  if (age > 5 * 60 * 1000) {
    // Too old, delete it
    fs.unlinkSync(markerPath);
    return;
  }

  // Delete the marker file so we don't run again
  fs.unlinkSync(markerPath);

  // Wait a bit for the workspace to fully load
  await sleep(2000);

  // Check if CLI is available
  let cliInstalled = false;
  try {
    const { execSync } = require('child_process');
    execSync('command -v repolens', { stdio: 'ignore' });
    cliInstalled = true;
  } catch {
    cliInstalled = false;
  }

  const terminal = vscode.window.createTerminal({
    name: 'RepoLens CLI',
    cwd: rootPath
  });
  terminal.show();

  if (!cliInstalled) {
    // Install CLI automatically
    const extensionPath = markerData.extensionPath || context.extensionUri.fsPath;
    terminal.sendText('# 📦 Installing RepoLens CLI...');
    terminal.sendText(`cd ${extensionPath}/cli && npm install && npm run build && npm link && cd -`);
    await sleep(8000); // Wait for installation
    terminal.sendText('');
  }

  // Run CLI
  terminal.sendText('repolens interactive');

  vscode.window.showInformationMessage('🔍 RepoLens CLI started! Ask questions about this repository.');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function deactivate() {}

class RepoLensViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private currentAnalysis?: RepoAnalysis;
  private currentRepoUrl?: string;
  private installedRepoPath?: string;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    const webviewPanel = new WebviewPanel();
    webviewView.webview.html = webviewPanel.getHtml();

    // Check if we're in a git repository and show info
    this.checkCurrentRepository();

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'analyze':
          await this.analyzeRepository(message.url);
          break;
        case 'ask':
          await this.answerQuestion(message.question);
          break;
        case 'quickSetup':
          await this.quickSetup();
          break;
        case 'openTerminal':
          await this.openInTerminal();
          break;
        case 'analyzeCurrentRepo':
          await this.analyzeCurrentRepoFromSidebar();
          break;
      }
    });
  }

  private async checkCurrentRepository() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const fs = require('fs');
    const path = require('path');

    // Check if this is a git repository
    const gitPath = path.join(rootPath, '.git');
    if (!fs.existsSync(gitPath)) {
      return;
    }

    // Get repository name
    const repoName = path.basename(rootPath);

    // Send message to webview to show current repo info
    setTimeout(() => {
      this.view?.webview.postMessage({
        command: 'showCurrentRepo',
        repoName: repoName,
        repoPath: rootPath
      });
    }, 500);
  }

  private async analyzeCurrentRepoFromSidebar() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      this.sendError('No workspace folder open');
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    
    // Run CLI analysis
    vscode.commands.executeCommand('repolens.analyzeCurrentRepo');
  }

  private async analyzeRepository(url: string) {
    let analysis: RepoAnalysis | undefined;
    let securityFindings: SecurityFindings | undefined;
    let providerName = 'Unknown';
    
    // Store the URL for later use
    this.currentRepoUrl = url;
    
    try {
      // Get GitHub token from settings
      const config = vscode.workspace.getConfiguration('repolens');
      const githubToken = config.get<string>('githubToken', '');
      
      const fetcher = new GitHubFetcher(githubToken);
      const analyzer = new RepoAnalyzer();
      const scanner = new SecurityScanner();

      // Parse GitHub URL
      const repo = fetcher.parseGitHubUrl(url);
      if (!repo) {
        this.sendError('Invalid GitHub URL. Please use format: https://github.com/owner/repo');
        return;
      }

      // Step 1: Fetch repository data
      this.sendProgress(1);
      const [fileTree, keyFiles, metadata] = await Promise.all([
        fetcher.fetchFileTree(repo.owner, repo.repo),
        fetcher.fetchKeyFiles(repo.owner, repo.repo),
        fetcher.fetchRepoMetadata(repo.owner, repo.repo)
      ]);

      if (fileTree.length === 0) {
        this.sendError('Could not fetch repository. Check the URL or repository visibility.');
        return;
      }

      // Fetch code files for security analysis
      const codeFiles = await fetcher.fetchCodeFiles(repo.owner, repo.repo, fileTree);

      // Step 2: Analyze code structure
      this.sendProgress(2);
      analysis = analyzer.analyze(fileTree, keyFiles);
      this.currentAnalysis = analysis;

      // Step 3: Security scan
      this.sendProgress(3);
      securityFindings = scanner.scan(fileTree, { ...keyFiles, ...codeFiles });

      // Step 4: Generate AI insights
      this.sendProgress(4);
      const aiProvider = await this.getAIProvider();
      providerName = this.getProviderName(aiProvider);

      // Generate summaries
      const [summary, securityExplanation] = await Promise.all([
        aiProvider.summarizeRepo(analysis),
        aiProvider.explainSecurity(securityFindings)
      ]);

      // Generate setup instructions
      const setup = this.generateSetupInstructions(analysis);

      // Send results to webview
      this.view?.webview.postMessage({
        command: 'analysisComplete',
        summary,
        setup,
        security: securityExplanation,
        securityFindings: securityFindings,
        provider: providerName,
        metadata: metadata || {}
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful error messages and retry with offline mode
      if (errorMsg.includes('Ollama') && analysis && securityFindings) {
        // Retry with offline mode
        try {
          const { OfflineProvider } = await import('./providers/offlineProvider');
          const offlineProvider = new OfflineProvider();
          
          const [summary, securityExplanation] = await Promise.all([
            offlineProvider.summarizeRepo(analysis),
            offlineProvider.explainSecurity(securityFindings)
          ]);
          
          const setup = this.generateSetupInstructions(analysis);
          
          this.view?.webview.postMessage({
            command: 'analysisComplete',
            summary: '⚠️ Using Offline Mode (Ollama not running)\n\n' + summary,
            setup,
            security: securityExplanation
          });
          return;
        } catch (offlineError) {
          this.sendError('Analysis failed even in offline mode');
          return;
        }
      }
      
      if (errorMsg.includes('OpenAI')) {
        this.sendError('OpenAI API failed. Check your API key in settings or install Ollama for local AI.');
      } else {
        this.sendError(`Analysis failed: ${errorMsg}`);
      }
    }
  }

  private async answerQuestion(question: string) {
    try {
      if (!this.currentAnalysis) {
        this.sendAnswerError('Please analyze a repository first');
        return;
      }

      const aiProvider = await this.getAIProvider();
      const answer = await aiProvider.answerQuestion(question, this.currentAnalysis);

      this.view?.webview.postMessage({
        command: 'answerReady',
        answer
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry with offline mode if Ollama fails
      if (errorMsg.includes('Ollama') && this.currentAnalysis) {
        try {
          const offlineProvider = new OfflineProvider();
          const answer = await offlineProvider.answerQuestion(question, this.currentAnalysis);
          
          this.view?.webview.postMessage({
            command: 'answerReady',
            answer: '⚠️ Offline Mode\n\n' + answer
          });
          return;
        } catch (offlineError) {
          this.sendAnswerError('Failed to answer even in offline mode');
          return;
        }
      }
      
      this.sendAnswerError(`Failed to answer: ${errorMsg}`);
    }
  }

  private getProviderName(provider: AIProvider): string {
    const config = vscode.workspace.getConfiguration('repolens');
    const apiProvider = config.get<string>('apiProvider', 'openai');
    
    if (provider instanceof OllamaProvider) {
      return 'Ollama (Local)';
    } else if (provider instanceof UniversalApiProvider) {
      switch (apiProvider) {
        case 'openai': return 'OpenAI';
        case 'anthropic': return 'Claude';
        case 'gemini': return 'Gemini';
        default: return 'API';
      }
    } else if (provider instanceof OfflineProvider) {
      return 'Offline Mode';
    }
    return 'Unknown';
  }

  private async getAIProvider(): Promise<AIProvider> {
    const config = vscode.workspace.getConfiguration('repolens');
    const enableOllama = config.get<boolean>('enableOllama', true);
    const apiKey = config.get<string>('apiKey', '');
    const apiProvider = config.get<'openai' | 'anthropic' | 'gemini'>('apiProvider', 'openai');
    const apiModel = config.get<string>('apiModel', '');
    const defaultModel = config.get<string>('defaultModel', 'qwen');

    // Try Ollama first if enabled
    if (enableOllama) {
      const ollama = new OllamaProvider(defaultModel);
      if (await ollama.isAvailable()) {
        return ollama;
      }
    }

    // Try Universal API provider if API key is set
    if (apiKey) {
      return new UniversalApiProvider(apiKey, apiProvider, apiModel || undefined);
    }

    // Fallback to offline mode
    return new OfflineProvider();
  }

  private generateSetupInstructions(analysis: RepoAnalysis): string {
    const sections = [];

    sections.push('## Installation');
    sections.push('');
    sections.push('```bash');
    sections.push(analysis.installCommand);
    sections.push('```');
    sections.push('');

    sections.push('## Running');
    sections.push('');
    sections.push('```bash');
    sections.push(analysis.runCommand);
    sections.push('```');
    sections.push('');

    sections.push('## Requirements');
    sections.push(`- Language: ${analysis.language}`);
    sections.push(`- Package Manager: ${analysis.detectedPackageManager}`);
    sections.push('');

    if (analysis.readme) {
      sections.push('## Additional Notes');
      sections.push('Check the README for:');
      sections.push('- Environment variables');
      sections.push('- Configuration files');
      sections.push('- System dependencies');
      sections.push('- Platform-specific instructions');
    }

    sections.push('');
    sections.push('⚠️ **Important**: Do not run code you don\'t understand. Review the repository first.');

    return sections.join('\n');
  }

  private sendError(error: string) {
    this.view?.webview.postMessage({
      command: 'analysisError',
      error
    });
  }

  private sendProgress(step: number) {
    this.view?.webview.postMessage({
      command: 'progress',
      step
    });
  }

  private sendAnswerError(error: string) {
    this.view?.webview.postMessage({
      command: 'answerError',
      error
    });
  }

  private async quickSetup() {
    if (!this.currentAnalysis || !this.currentRepoUrl) {
      vscode.window.showErrorMessage('Please analyze a repository first');
      return;
    }

    const repoUrl = this.currentRepoUrl;
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';

    // Check if required package manager is available
    const installCmd = this.currentAnalysis.installCommand;
    if (installCmd && installCmd !== 'No install command detected') {
      const packageManager = this.getPackageManagerFromCommand(installCmd);
      const isAvailable = await this.checkPackageManagerAvailable(packageManager);
      
      if (!isAvailable) {
        const installUrl = this.getPackageManagerInstallUrl(packageManager);
        const choice = await vscode.window.showErrorMessage(
          `${packageManager} is not installed. Please install it first to set up this repository.`,
          'Open Installation Guide',
          'Cancel'
        );
        
        if (choice === 'Open Installation Guide') {
          vscode.env.openExternal(vscode.Uri.parse(installUrl));
        }
        return;
      }
    }

    // Get current workspace folder or home directory
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const defaultPath = workspaceFolders 
      ? workspaceFolders[0].uri.fsPath 
      : path.join(os.homedir(), 'Desktop');

    // Ask user for the path with a default value
    const targetPath = await vscode.window.showInputBox({
      prompt: `Where should we clone ${repoName}?`,
      value: defaultPath,
      placeHolder: 'e.g., /Users/username/Desktop or ~/Desktop',
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'Please enter a valid path';
        }
        
        // Expand ~ to home directory
        let expandedPath = value;
        if (value.startsWith('~')) {
          expandedPath = value.replace('~', os.homedir());
        }
        
        // Check if path exists
        if (!fs.existsSync(expandedPath)) {
          return `Path does not exist: ${expandedPath}. Please create the folder first or use an existing path.`;
        }
        return null;
      }
    });

    if (!targetPath) {
      return;
    }
    
    // Expand ~ to home directory
    const expandedPath = targetPath.startsWith('~') 
      ? targetPath.replace('~', os.homedir()) 
      : targetPath;
    
    // Show progress
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Setting up ${repoName}`,
      cancellable: false
    }, async (progress) => {
      try {
        // Step 1: Clone repository
        progress.report({ message: 'Cloning repository...', increment: 20 });
        const terminal = vscode.window.createTerminal({
          name: `RepoLens: ${repoName}`,
          cwd: expandedPath
        });
        
        terminal.sendText(`git clone ${repoUrl}`);
        await this.sleep(3000); // Wait for clone to start
        
        // Step 2: Navigate to repo
        progress.report({ message: 'Installing dependencies...', increment: 40 });
        terminal.sendText(`cd ${repoName}`);
        await this.sleep(1000);
        
        // Step 3: Install dependencies
        const installCmd = this.currentAnalysis?.installCommand;
        if (installCmd && installCmd !== 'No install command detected') {
          terminal.sendText(installCmd);
          await this.sleep(5000); // Wait for install to complete
          
          // Step 4: Fix vulnerabilities (only for npm/yarn/pnpm)
          progress.report({ message: 'Fixing vulnerabilities...', increment: 60 });
          
          if (installCmd.includes('npm')) {
            terminal.sendText('npm audit fix || echo "Audit fix skipped"');
            await this.sleep(3000);
          } else if (installCmd.includes('yarn')) {
            terminal.sendText('yarn audit fix || echo "Audit fix skipped"');
            await this.sleep(3000);
          } else if (installCmd.includes('pnpm')) {
            terminal.sendText('pnpm audit fix || echo "Audit fix skipped"');
            await this.sleep(3000);
          }
        }
        
        // Step 5: Show CLI installation instructions
        progress.report({ message: 'Setup complete!', increment: 90 });
        const repoPath = `${expandedPath}/${repoName}`;
        const extensionPath = this.extensionUri.fsPath;
        
        terminal.sendText('');
        terminal.sendText('# ✅ Repository setup complete!');
        terminal.sendText('');
        terminal.sendText('# 💡 Want to use RepoLens CLI for interactive analysis?');
        terminal.sendText('# Run these commands:');
        terminal.sendText(`# cd ${extensionPath}/cli`);
        terminal.sendText('# ./install.sh');
        terminal.sendText('# cd -');
        terminal.sendText('# repolens interactive');
        terminal.sendText('');
        
        progress.report({ message: 'Opening workspace...', increment: 95 });
        await this.sleep(1000);
        
        // Save the installed path
        this.installedRepoPath = repoPath;
        
        // Create a marker file to indicate Quick Setup was just completed
        const fs = require('fs');
        const markerPath = path.join(repoPath, '.repolens-setup');
        fs.writeFileSync(markerPath, JSON.stringify({
          timestamp: Date.now(),
          extensionPath: extensionPath
        }));
        
        // Step 4: Open the folder in VS Code
        const repoUri = vscode.Uri.file(repoPath);
        await vscode.commands.executeCommand('vscode.openFolder', repoUri, false);
        
        progress.report({ message: 'Done!', increment: 100 });
        
        terminal.show();
        vscode.window.showInformationMessage(`✅ ${repoName} setup complete!`);
        
      } catch (error) {
        vscode.window.showErrorMessage(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  private async openInTerminal() {
    if (!this.currentAnalysis || !this.currentRepoUrl) {
      vscode.window.showErrorMessage('Please analyze a repository first');
      return;
    }

    // Check if repository was installed via Quick Setup
    if (!this.installedRepoPath) {
      const choice = await vscode.window.showWarningMessage(
        'Repository not installed yet. Please use "Quick Setup" first to clone and install the repository.',
        'Quick Setup Now',
        'Cancel'
      );
      
      if (choice === 'Quick Setup Now') {
        await this.quickSetup();
      }
      return;
    }

    const repoName = this.currentRepoUrl.split('/').pop()?.replace('.git', '') || 'repo';
    
    // Open terminal in the installed repository folder
    const terminal = vscode.window.createTerminal({
      name: `RepoLens: ${repoName}`,
      cwd: this.installedRepoPath
    });
    
    terminal.show();
    terminal.sendText(`# RepoLens: ${repoName}`);
    terminal.sendText(`# Repository location: ${this.installedRepoPath}`);
    terminal.sendText('');
    terminal.sendText(`# Run the project:`);
    terminal.sendText(`${this.currentAnalysis.runCommand}`);
    
    vscode.window.showInformationMessage(`Terminal opened in ${repoName}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getPackageManagerFromCommand(command: string): string {
    if (command.includes('poetry')) { return 'poetry'; }
    if (command.includes('pip')) { return 'pip'; }
    if (command.includes('cargo')) { return 'cargo'; }
    if (command.includes('go ')) { return 'go'; }
    if (command.includes('mvn')) { return 'maven'; }
    if (command.includes('gradle')) { return 'gradle'; }
    if (command.includes('yarn')) { return 'yarn'; }
    if (command.includes('pnpm')) { return 'pnpm'; }
    if (command.includes('npm')) { return 'npm'; }
    if (command.includes('bundle')) { return 'bundler'; }
    if (command.includes('composer')) { return 'composer'; }
    return 'unknown';
  }

  private async checkPackageManagerAvailable(packageManager: string): Promise<boolean> {
    if (packageManager === 'unknown') {
      return true; // Don't block if we can't detect
    }

    try {
      const { execSync } = require('child_process');
      execSync(`command -v ${packageManager}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private getPackageManagerInstallUrl(packageManager: string): string {
    const urls: Record<string, string> = {
      'poetry': 'https://python-poetry.org/docs/#installation',
      'pip': 'https://pip.pypa.io/en/stable/installation/',
      'cargo': 'https://www.rust-lang.org/tools/install',
      'go': 'https://go.dev/doc/install',
      'maven': 'https://maven.apache.org/install.html',
      'gradle': 'https://gradle.org/install/',
      'yarn': 'https://yarnpkg.com/getting-started/install',
      'pnpm': 'https://pnpm.io/installation',
      'npm': 'https://nodejs.org/en/download/',
      'bundler': 'https://bundler.io/',
      'composer': 'https://getcomposer.org/download/'
    };
    return urls[packageManager] || 'https://www.google.com/search?q=how+to+install+' + packageManager;
  }
}

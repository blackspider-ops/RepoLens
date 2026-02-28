import * as fs from 'fs';
import * as path from 'path';

export interface RepoAnalysis {
  name: string;
  language: string;
  packageManager: string;
  installCommand: string;
  runCommand: string;
  fileCount: number;
  codeFiles: number;
  readme?: string;
}

export async function analyzeLocalRepo(repoPath: string): Promise<RepoAnalysis> {
  const files = getAllFiles(repoPath);
  const codeFiles = files.filter(f => isCodeFile(f));

  const language = detectLanguage(repoPath, files);
  const packageManager = detectPackageManager(repoPath);
  const { installCommand, runCommand } = detectCommands(repoPath, packageManager);

  const readmePath = path.join(repoPath, 'README.md');
  const readme = fs.existsSync(readmePath) 
    ? fs.readFileSync(readmePath, 'utf-8').substring(0, 1000)
    : undefined;

  return {
    name: path.basename(repoPath),
    language,
    packageManager,
    installCommand,
    runCommand,
    fileCount: files.length,
    codeFiles: codeFiles.length,
    readme
  };
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    // Skip node_modules, .git, etc.
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function isCodeFile(file: string): boolean {
  const codeExtensions = ['.js', '.ts', '.py', '.go', '.rs', '.java', '.php', '.rb', '.c', '.cpp'];
  return codeExtensions.some(ext => file.endsWith(ext));
}

function detectLanguage(repoPath: string, files: string[]): string {
  if (fs.existsSync(path.join(repoPath, 'package.json'))) return 'JavaScript/TypeScript';
  if (fs.existsSync(path.join(repoPath, 'requirements.txt'))) return 'Python';
  if (fs.existsSync(path.join(repoPath, 'Cargo.toml'))) return 'Rust';
  if (fs.existsSync(path.join(repoPath, 'go.mod'))) return 'Go';
  if (fs.existsSync(path.join(repoPath, 'pom.xml'))) return 'Java';

  // Count file extensions
  const extensions: Record<string, number> = {};
  files.forEach(file => {
    const ext = path.extname(file);
    extensions[ext] = (extensions[ext] || 0) + 1;
  });

  const sorted = Object.entries(extensions).sort((a, b) => b[1] - a[1]);
  const topExt = sorted[0]?.[0];

  const extMap: Record<string, string> = {
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.py': 'Python',
    '.rs': 'Rust',
    '.go': 'Go',
    '.java': 'Java'
  };

  return extMap[topExt] || 'Unknown';
}

function detectPackageManager(repoPath: string): string {
  if (fs.existsSync(path.join(repoPath, 'package.json'))) return 'npm';
  if (fs.existsSync(path.join(repoPath, 'requirements.txt'))) return 'pip';
  if (fs.existsSync(path.join(repoPath, 'Cargo.toml'))) return 'cargo';
  if (fs.existsSync(path.join(repoPath, 'go.mod'))) return 'go';
  return 'unknown';
}

function detectCommands(repoPath: string, packageManager: string): { installCommand: string; runCommand: string } {
  let installCommand = 'No install command detected';
  let runCommand = 'No run command detected';

  if (packageManager === 'npm') {
    installCommand = 'npm install';
    
    const pkgPath = path.join(repoPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts?.start) runCommand = 'npm start';
      else if (pkg.scripts?.dev) runCommand = 'npm run dev';
      else if (pkg.scripts?.build) runCommand = 'npm run build';
    }
  } else if (packageManager === 'pip') {
    installCommand = 'pip install -r requirements.txt';
    runCommand = 'python main.py';
  } else if (packageManager === 'cargo') {
    installCommand = 'cargo build';
    runCommand = 'cargo run';
  } else if (packageManager === 'go') {
    installCommand = 'go mod download';
    runCommand = 'go run .';
  }

  return { installCommand, runCommand };
}

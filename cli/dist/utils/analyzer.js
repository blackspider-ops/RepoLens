"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeLocalRepo = analyzeLocalRepo;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function analyzeLocalRepo(repoPath) {
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
function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        // Skip node_modules, .git, etc.
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
            return;
        }
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        }
        else {
            fileList.push(filePath);
        }
    });
    return fileList;
}
function isCodeFile(file) {
    const codeExtensions = ['.js', '.ts', '.py', '.go', '.rs', '.java', '.php', '.rb', '.c', '.cpp'];
    return codeExtensions.some(ext => file.endsWith(ext));
}
function detectLanguage(repoPath, files) {
    if (fs.existsSync(path.join(repoPath, 'package.json')))
        return 'JavaScript/TypeScript';
    if (fs.existsSync(path.join(repoPath, 'requirements.txt')))
        return 'Python';
    if (fs.existsSync(path.join(repoPath, 'Cargo.toml')))
        return 'Rust';
    if (fs.existsSync(path.join(repoPath, 'go.mod')))
        return 'Go';
    if (fs.existsSync(path.join(repoPath, 'pom.xml')))
        return 'Java';
    // Count file extensions
    const extensions = {};
    files.forEach(file => {
        const ext = path.extname(file);
        extensions[ext] = (extensions[ext] || 0) + 1;
    });
    const sorted = Object.entries(extensions).sort((a, b) => b[1] - a[1]);
    const topExt = sorted[0]?.[0];
    const extMap = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.py': 'Python',
        '.rs': 'Rust',
        '.go': 'Go',
        '.java': 'Java'
    };
    return extMap[topExt] || 'Unknown';
}
function detectPackageManager(repoPath) {
    if (fs.existsSync(path.join(repoPath, 'package.json')))
        return 'npm';
    if (fs.existsSync(path.join(repoPath, 'requirements.txt')))
        return 'pip';
    if (fs.existsSync(path.join(repoPath, 'Cargo.toml')))
        return 'cargo';
    if (fs.existsSync(path.join(repoPath, 'go.mod')))
        return 'go';
    return 'unknown';
}
function detectCommands(repoPath, packageManager) {
    let installCommand = 'No install command detected';
    let runCommand = 'No run command detected';
    if (packageManager === 'npm') {
        installCommand = 'npm install';
        const pkgPath = path.join(repoPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (pkg.scripts?.start)
                runCommand = 'npm start';
            else if (pkg.scripts?.dev)
                runCommand = 'npm run dev';
            else if (pkg.scripts?.build)
                runCommand = 'npm run build';
        }
    }
    else if (packageManager === 'pip') {
        installCommand = 'pip install -r requirements.txt';
        runCommand = 'python main.py';
    }
    else if (packageManager === 'cargo') {
        installCommand = 'cargo build';
        runCommand = 'cargo run';
    }
    else if (packageManager === 'go') {
        installCommand = 'go mod download';
        runCommand = 'go run .';
    }
    return { installCommand, runCommand };
}

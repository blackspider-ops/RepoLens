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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainFile = explainFile;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
async function explainFile(filePath) {
    const spinner = (0, ora_1.default)('Reading file...').start();
    try {
        if (!fs.existsSync(filePath)) {
            spinner.fail('File not found');
            return;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath);
        spinner.text = 'Analyzing code...';
        // Try Ollama
        try {
            const response = await axios_1.default.post('http://localhost:11434/api/generate', {
                model: 'qwen2.5:1.5b',
                prompt: `Explain this code file concisely (3-4 sentences):

File: ${fileName}
Language: ${getLanguage(ext)}

Code:
${content.substring(0, 2000)}

Provide a brief explanation of what this code does, its main purpose, and key functionality.`,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 250
                }
            }, { timeout: 30000 });
            if (response.data && response.data.response) {
                spinner.succeed('Explanation ready!');
                console.log(chalk_1.default.bold.cyan(`\n📄 ${fileName}\n`));
                console.log(chalk_1.default.white(response.data.response.trim()));
                console.log();
                return;
            }
        }
        catch (error) {
            // Fallback to heuristic
        }
        // Heuristic explanation
        spinner.succeed('Analysis complete!');
        console.log(chalk_1.default.bold.cyan(`\n📄 ${fileName}\n`));
        const lines = content.split('\n').length;
        const language = getLanguage(ext);
        console.log(chalk_1.default.gray('Language:'), chalk_1.default.white(language));
        console.log(chalk_1.default.gray('Lines:'), chalk_1.default.white(lines));
        console.log(chalk_1.default.gray('Size:'), chalk_1.default.white(formatBytes(content.length)));
        console.log();
        // Basic analysis
        if (content.includes('export') || content.includes('module.exports')) {
            console.log(chalk_1.default.white('This appears to be a module that exports functionality.'));
        }
        if (content.includes('class ')) {
            console.log(chalk_1.default.white('Contains class definitions.'));
        }
        if (content.includes('function ') || content.includes('=>')) {
            console.log(chalk_1.default.white('Contains function definitions.'));
        }
        if (content.includes('import ') || content.includes('require(')) {
            console.log(chalk_1.default.white('Imports external dependencies.'));
        }
        console.log(chalk_1.default.yellow('\n💡 Start Ollama for AI-powered explanations: ollama serve\n'));
    }
    catch (error) {
        spinner.fail('Failed to analyze file');
        console.error(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'));
    }
}
function getLanguage(ext) {
    const languages = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.py': 'Python',
        '.rs': 'Rust',
        '.go': 'Go',
        '.java': 'Java',
        '.rb': 'Ruby',
        '.php': 'PHP',
        '.sh': 'Shell',
        '.bash': 'Bash'
    };
    return languages[ext] || 'Unknown';
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return bytes + ' B';
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

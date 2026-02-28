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
exports.summarizeRepo = summarizeRepo;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const analyzer_1 = require("../utils/analyzer");
const axios_1 = __importDefault(require("axios"));
async function summarizeRepo(repoPath) {
    const spinner = (0, ora_1.default)('Analyzing repository...').start();
    try {
        if (!fs.existsSync(repoPath)) {
            spinner.fail('Repository path does not exist');
            return;
        }
        const analysis = await (0, analyzer_1.analyzeLocalRepo)(repoPath);
        spinner.text = 'Generating summary...';
        // Try Ollama
        try {
            const response = await axios_1.default.post('http://localhost:11434/api/generate', {
                model: 'qwen2.5:1.5b',
                prompt: `Provide a concise 2-3 sentence summary of this repository:

Name: ${analysis.name}
Language: ${analysis.language}
Package Manager: ${analysis.packageManager}
Files: ${analysis.fileCount} total, ${analysis.codeFiles} code files

README:
${analysis.readme?.substring(0, 1000) || 'No README'}

Summary:`,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 150
                }
            }, { timeout: 30000 });
            if (response.data && response.data.response) {
                spinner.succeed('Summary ready!');
                console.log(chalk_1.default.bold.cyan('\n📦 Repository Summary\n'));
                console.log(chalk_1.default.white(response.data.response.trim()));
                console.log();
                console.log(chalk_1.default.gray('Language:'), chalk_1.default.white(analysis.language));
                console.log(chalk_1.default.gray('Package Manager:'), chalk_1.default.white(analysis.packageManager));
                console.log(chalk_1.default.gray('Files:'), chalk_1.default.white(`${analysis.fileCount} total, ${analysis.codeFiles} code`));
                console.log();
                return;
            }
        }
        catch (error) {
            // Fallback to heuristic
        }
        // Heuristic summary
        spinner.succeed('Summary ready!');
        console.log(chalk_1.default.bold.cyan('\n📦 Repository Summary\n'));
        if (analysis.readme) {
            const firstLine = analysis.readme.split('\n').filter(l => l.trim() && !l.startsWith('#'))[0];
            if (firstLine) {
                console.log(chalk_1.default.white(firstLine.substring(0, 200)));
                console.log();
            }
        }
        console.log(chalk_1.default.gray('Language:'), chalk_1.default.white(analysis.language));
        console.log(chalk_1.default.gray('Package Manager:'), chalk_1.default.white(analysis.packageManager));
        console.log(chalk_1.default.gray('Files:'), chalk_1.default.white(`${analysis.fileCount} total, ${analysis.codeFiles} code`));
        console.log(chalk_1.default.gray('Install:'), chalk_1.default.green(analysis.installCommand));
        console.log(chalk_1.default.gray('Run:'), chalk_1.default.green(analysis.runCommand));
        console.log();
    }
    catch (error) {
        spinner.fail('Failed to generate summary');
        console.error(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'));
    }
}

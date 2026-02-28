#!/usr/bin/env node
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
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const analyze_1 = require("./commands/analyze");
const scan_1 = require("./commands/scan");
const interactive_1 = require("./commands/interactive");
const ask_1 = require("./commands/ask");
const explain_1 = require("./commands/explain");
const summary_1 = require("./commands/summary");
const program = new commander_1.Command();
program
    .name('repolens')
    .description('RepoLens CLI - Understand repositories from the command line')
    .version('1.0.0');
// Analyze command
program
    .command('analyze')
    .description('Analyze the current repository')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .option('-o, --output <file>', 'Output file for analysis report')
    .action(async (options) => {
    await (0, analyze_1.analyzeRepository)(options.path, options.output);
});
// Scan command
program
    .command('scan <file>')
    .description('Scan a specific file for security issues')
    .option('-v, --verbose', 'Show detailed output')
    .action(async (file, options) => {
    await (0, scan_1.scanFile)(file, options.verbose);
});
// Ask command
program
    .command('ask <question>')
    .description('Ask a question about the repository')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .action(async (question, options) => {
    await (0, ask_1.askQuestion)(question, options.path);
});
// Interactive mode
program
    .command('interactive')
    .alias('i')
    .description('Start interactive Q&A mode')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .action(async (options) => {
    await (0, interactive_1.interactiveMode)(options.path);
});
// Explain command
program
    .command('explain <file>')
    .description('Explain what a code file does')
    .action(async (file) => {
    await (0, explain_1.explainFile)(file);
});
// Summary command
program
    .command('summary')
    .alias('sum')
    .description('Generate a summary of the repository')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .action(async (options) => {
    await (0, summary_1.summarizeRepo)(options.path);
});
// Info command
program
    .command('info')
    .description('Show repository information')
    .option('-p, --path <path>', 'Repository path', process.cwd())
    .action(async (options) => {
    const spinner = (0, ora_1.default)('Loading repository info...').start();
    try {
        const packageJsonPath = path.join(options.path, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            spinner.succeed('Repository info loaded');
            console.log(chalk_1.default.bold.cyan('\n📦 Repository Information\n'));
            console.log(chalk_1.default.gray('Name:'), chalk_1.default.white(pkg.name || 'N/A'));
            console.log(chalk_1.default.gray('Version:'), chalk_1.default.white(pkg.version || 'N/A'));
            console.log(chalk_1.default.gray('Description:'), chalk_1.default.white(pkg.description || 'N/A'));
            console.log(chalk_1.default.gray('License:'), chalk_1.default.white(pkg.license || 'N/A'));
            if (pkg.scripts) {
                console.log(chalk_1.default.bold.cyan('\n⚙️  Available Scripts\n'));
                Object.entries(pkg.scripts).forEach(([name, script]) => {
                    console.log(chalk_1.default.gray(`  ${name}:`), chalk_1.default.white(script));
                });
            }
        }
        else {
            spinner.fail('No package.json found');
        }
    }
    catch (error) {
        spinner.fail('Failed to load repository info');
        console.error(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'));
    }
});
// Default action - show help
program.action(() => {
    console.log(chalk_1.default.bold.cyan('\n🔍 RepoLens CLI\n'));
    console.log(chalk_1.default.gray('Understand Before You Run\n'));
    program.help();
});
program.parse();

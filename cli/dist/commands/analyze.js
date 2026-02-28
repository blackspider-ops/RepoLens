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
exports.analyzeRepository = analyzeRepository;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const analyzer_1 = require("../utils/analyzer");
const scanner_1 = require("../utils/scanner");
async function analyzeRepository(repoPath, outputFile) {
    const spinner = (0, ora_1.default)('Analyzing repository...').start();
    try {
        // Check if path exists
        if (!fs.existsSync(repoPath)) {
            spinner.fail('Repository path does not exist');
            return;
        }
        spinner.text = 'Scanning files...';
        const analysis = await (0, analyzer_1.analyzeLocalRepo)(repoPath);
        spinner.text = 'Running security scan...';
        const security = await (0, scanner_1.scanForSecurity)(repoPath);
        spinner.succeed('Analysis complete!');
        // Display results
        console.log(chalk_1.default.bold.cyan('\n📋 Repository Analysis\n'));
        console.log(chalk_1.default.gray('Language:'), chalk_1.default.white(analysis.language));
        console.log(chalk_1.default.gray('Package Manager:'), chalk_1.default.white(analysis.packageManager));
        console.log(chalk_1.default.gray('Total Files:'), chalk_1.default.white(analysis.fileCount));
        console.log(chalk_1.default.gray('Code Files:'), chalk_1.default.white(analysis.codeFiles));
        console.log(chalk_1.default.bold.cyan('\n⚙️  Setup Commands\n'));
        console.log(chalk_1.default.gray('Install:'), chalk_1.default.green(analysis.installCommand));
        console.log(chalk_1.default.gray('Run:'), chalk_1.default.green(analysis.runCommand));
        console.log(chalk_1.default.bold.cyan('\n🔒 Security Analysis\n'));
        console.log(chalk_1.default.gray('Risk Level:'), getRiskColor(security.riskLevel));
        console.log(chalk_1.default.gray('Issues Found:'), chalk_1.default.white(security.issues.length));
        if (security.issues.length > 0) {
            console.log(chalk_1.default.bold.yellow('\n⚠️  Security Issues:\n'));
            security.issues.slice(0, 5).forEach((issue, i) => {
                console.log(chalk_1.default.gray(`${i + 1}.`), chalk_1.default.yellow(issue.file));
                console.log(chalk_1.default.gray('   →'), issue.description);
            });
            if (security.issues.length > 5) {
                console.log(chalk_1.default.gray(`\n   ... and ${security.issues.length - 5} more issues`));
            }
        }
        // Save to file if requested
        if (outputFile) {
            const report = {
                timestamp: new Date().toISOString(),
                path: repoPath,
                analysis,
                security
            };
            fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
            console.log(chalk_1.default.green(`\n✅ Report saved to ${outputFile}`));
        }
        console.log(chalk_1.default.gray('\n💡 Tip: Use'), chalk_1.default.cyan('repolens interactive'), chalk_1.default.gray('to ask questions about this repository'));
    }
    catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'));
    }
}
function getRiskColor(level) {
    switch (level) {
        case 'Low': return chalk_1.default.green(level);
        case 'Moderate': return chalk_1.default.yellow(level);
        case 'High': return chalk_1.default.red(level);
        default: return chalk_1.default.white(level);
    }
}

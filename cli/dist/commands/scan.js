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
exports.scanFile = scanFile;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const scanner_1 = require("../utils/scanner");
async function scanFile(filePath, verbose = false) {
    const spinner = (0, ora_1.default)(`Scanning ${filePath}...`).start();
    try {
        if (!fs.existsSync(filePath)) {
            spinner.fail('File does not exist');
            return;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const results = (0, scanner_1.scanFileContent)(content, filePath);
        spinner.succeed('Scan complete!');
        console.log(chalk_1.default.bold.cyan(`\n🔍 Security Scan: ${filePath}\n`));
        if (results.length === 0) {
            console.log(chalk_1.default.green('✅ No security issues found'));
        }
        else {
            console.log(chalk_1.default.yellow(`⚠️  Found ${results.length} potential issue(s):\n`));
            results.forEach((issue, i) => {
                console.log(chalk_1.default.gray(`${i + 1}.`), chalk_1.default.yellow(issue.pattern));
                console.log(chalk_1.default.gray('   Risk:'), issue.severity);
                console.log(chalk_1.default.gray('   Description:'), issue.description);
                if (verbose && issue.line) {
                    console.log(chalk_1.default.gray('   Line:'), issue.line);
                }
                console.log();
            });
            console.log(chalk_1.default.bold.yellow('Recommendations:'));
            console.log(chalk_1.default.gray('• Review the flagged code carefully'));
            console.log(chalk_1.default.gray('• Ensure proper input validation'));
            console.log(chalk_1.default.gray('• Consider safer alternatives'));
        }
    }
    catch (error) {
        spinner.fail('Scan failed');
        console.error(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'));
    }
}

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
exports.askQuestion = askQuestion;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const analyzer_1 = require("../utils/analyzer");
const ai_1 = require("../utils/ai");
async function askQuestion(question, repoPath) {
    const spinner = (0, ora_1.default)('Analyzing repository...').start();
    try {
        if (!fs.existsSync(repoPath)) {
            spinner.fail('Repository path does not exist');
            return;
        }
        spinner.text = 'Understanding repository...';
        const analysis = await (0, analyzer_1.analyzeLocalRepo)(repoPath);
        spinner.text = 'Generating answer...';
        const answer = await (0, ai_1.getAIResponse)(question, analysis, repoPath);
        spinner.succeed('Answer ready!');
        console.log(chalk_1.default.bold.cyan('\n💬 Question:\n'));
        console.log(chalk_1.default.white(question));
        console.log(chalk_1.default.bold.cyan('\n📝 Answer:\n'));
        console.log(chalk_1.default.white(answer));
    }
    catch (error) {
        spinner.fail('Failed to answer question');
        console.error(chalk_1.default.red(error instanceof Error ? error.message : 'Unknown error'));
    }
}

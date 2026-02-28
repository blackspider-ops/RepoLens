"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIResponse = getAIResponse;
const axios_1 = __importDefault(require("axios"));
async function getAIResponse(question, analysis, repoPath) {
    // Try Ollama first
    try {
        const response = await axios_1.default.post('http://localhost:11434/api/generate', {
            model: 'qwen',
            prompt: buildPrompt(question, analysis, repoPath),
            stream: false
        }, { timeout: 30000 });
        return response.data.response || 'No response generated';
    }
    catch (error) {
        // Fallback to heuristic response
        return getHeuristicResponse(question, analysis);
    }
}
function buildPrompt(question, analysis, repoPath) {
    return `You are analyzing a code repository. Answer the following question based on the repository information:

Repository: ${analysis.name}
Language: ${analysis.language}
Package Manager: ${analysis.packageManager}
Install Command: ${analysis.installCommand}
Run Command: ${analysis.runCommand}
Total Files: ${analysis.fileCount}
Code Files: ${analysis.codeFiles}

README excerpt:
${analysis.readme || 'No README available'}

Question: ${question}

Provide a clear, concise answer based on the available information.`;
}
function getHeuristicResponse(question, analysis) {
    const q = question.toLowerCase();
    if (q.includes('install') || q.includes('setup')) {
        return `To install this ${analysis.language} project:\n\n${analysis.installCommand}\n\nThis will install all required dependencies.`;
    }
    if (q.includes('run') || q.includes('start')) {
        return `To run this project:\n\n${analysis.runCommand}\n\nMake sure you've installed dependencies first.`;
    }
    if (q.includes('language') || q.includes('written')) {
        return `This project is written in ${analysis.language} and uses ${analysis.packageManager} for package management.`;
    }
    if (q.includes('files') || q.includes('structure')) {
        return `This repository contains ${analysis.fileCount} total files, with ${analysis.codeFiles} code files. The primary language is ${analysis.language}.`;
    }
    return `Based on the repository analysis:
- Language: ${analysis.language}
- Package Manager: ${analysis.packageManager}
- Install: ${analysis.installCommand}
- Run: ${analysis.runCommand}

For more detailed answers, ensure Ollama is running locally or check the README file.`;
}
//# sourceMappingURL=ai.js.map
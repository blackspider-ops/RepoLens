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
            model: 'qwen2.5:1.5b',
            prompt: buildPrompt(question, analysis, repoPath),
            stream: false,
            options: {
                temperature: 0.7,
                num_predict: 200 // Limit response length
            }
        }, { timeout: 30000 });
        if (response.data && response.data.response) {
            const answer = response.data.response.trim();
            // If answer is too generic or empty, use heuristic
            if (answer.length < 10) {
                return getHeuristicResponse(question, analysis);
            }
            return answer;
        }
        // If no response, fall back
        return getHeuristicResponse(question, analysis);
    }
    catch (error) {
        // Check if it's a connection error
        if (axios_1.default.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                console.log('⚠️  Ollama not running, using heuristic mode');
                return getHeuristicResponse(question, analysis);
            }
            if (error.response?.status === 404) {
                console.log('⚠️  Model not found, using heuristic mode');
                return getHeuristicResponse(question, analysis);
            }
        }
        // For other errors, also fallback
        console.log('⚠️  Ollama error, using heuristic mode:', error.message);
        return getHeuristicResponse(question, analysis);
    }
}
function buildPrompt(question, analysis, repoPath) {
    return `You are a helpful code repository assistant. Answer the user's question concisely and directly.

Repository Information:
- Name: ${analysis.name}
- Language: ${analysis.language}
- Package Manager: ${analysis.packageManager}
- Install: ${analysis.installCommand}
- Run: ${analysis.runCommand}

${analysis.readme ? `README Summary:\n${analysis.readme.substring(0, 500)}...\n` : ''}

User Question: ${question}

Instructions:
- Answer directly and concisely (2-3 sentences max)
- Don't repeat the repository information unless asked
- Don't suggest checking the README unless necessary
- Be conversational and helpful
- If you don't know, say so briefly

Answer:`;
}
function getHeuristicResponse(question, analysis) {
    const q = question.toLowerCase();
    // Greetings
    if (q.match(/^(hi|hello|hey|how are you)/)) {
        return `Hi! I'm ready to answer questions about ${analysis.name}. What would you like to know?`;
    }
    // What does it do
    if (q.includes('what') && (q.includes('do') || q.includes('does') || q.includes('purpose'))) {
        if (analysis.readme) {
            const lines = analysis.readme.split('\n').filter(l => l.trim() && !l.startsWith('#'));
            const firstLine = lines[0] || '';
            return firstLine.substring(0, 200) + (firstLine.length > 200 ? '...' : '');
        }
        return `This is a ${analysis.language} project. Check the README for details about its purpose.`;
    }
    // Installation
    if (q.includes('install') || q.includes('setup')) {
        return `Run: ${analysis.installCommand}`;
    }
    // Running
    if (q.includes('run') || q.includes('start') || q.includes('execute')) {
        return analysis.runCommand === 'No run command detected'
            ? `No run command detected. Check package.json scripts.`
            : `Run: ${analysis.runCommand}`;
    }
    // Language
    if (q.includes('language') || q.includes('written')) {
        return `${analysis.language} using ${analysis.packageManager}`;
    }
    // Structure/Files
    if (q.includes('files') || q.includes('structure')) {
        return `${analysis.fileCount} total files, ${analysis.codeFiles} code files`;
    }
    // Security
    if (q.includes('security') || q.includes('safe')) {
        return `Run 'repolens analyze' for a security scan`;
    }
    // Tests
    if (q.includes('test')) {
        return `Check package.json for test scripts (usually 'npm test')`;
    }
    // Default
    return `${analysis.language} project. Install: ${analysis.installCommand}. Run: ${analysis.runCommand}`;
}

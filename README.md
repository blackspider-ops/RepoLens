# RepoLens - Understand Before You Run

RepoLens is a VS Code extension that helps developers safely understand and run unfamiliar GitHub repositories using AI.

## Features

- 🔍 **Repository Analysis**: Automatically detect language, package manager, and key files
- 🤖 **AI-Powered Summaries**: Get intelligent summaries of what a repository does
- 🔒 **Security Scanning**: Lightweight security analysis to identify potential risks
- ⚙️ **Setup Instructions**: Auto-generated install and run commands
- 💬 **Interactive Q&A**: Ask questions about the repository

## AI Provider Support

RepoLens supports multiple AI providers:

1. **Ollama** (Local): Runs on your machine at `localhost:11434`
2. **OpenAI**: Uses GPT-4o-mini via API key
3. **Offline Mode**: Heuristic-based analysis when no AI is available

## Installation

1. Install the extension from VS Code Marketplace
2. (Optional) Install Ollama for local AI: https://ollama.ai
3. (Optional) Set OpenAI API key in settings

## Usage

1. Open the RepoLens sidebar panel
2. Paste a GitHub repository URL
3. Click "Analyze Repository"
4. Review the summary, setup instructions, and security analysis
5. Ask questions about the repository

## Configuration

- `repolens.openaiApiKey`: Your OpenAI API key
- `repolens.defaultModel`: Default Ollama model (default: qwen)
- `repolens.enableOllama`: Enable Ollama provider (default: true)

## Safety

RepoLens does NOT automatically execute code. It provides:
- Analysis and summaries
- Suggested commands
- Security warnings

You remain in full control of what runs on your system.

## Demo Flow

1. Paste: `https://github.com/owner/repo`
2. Click "Analyze"
3. View instant summary
4. Review security scan
5. Ask: "Does this make network requests?"
6. Get AI-powered answer

## Requirements

- VS Code 1.85.0 or higher
- Node.js (for extension runtime)
- (Optional) Ollama for local AI
- (Optional) OpenAI API key

## License

MIT

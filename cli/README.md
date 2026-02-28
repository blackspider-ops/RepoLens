# RepoLens CLI

Command-line interface for RepoLens - Understand repositories from your terminal.

## Installation

```bash
cd cli
npm install
npm run build
npm link
```

## Usage

### Analyze Repository
```bash
repolens analyze
repolens analyze --path /path/to/repo
repolens analyze --output report.json
```

### Scan File for Security Issues
```bash
repolens scan src/index.js
repolens scan src/index.js --verbose
```

### Ask Questions
```bash
repolens ask "How do I install this?"
repolens ask "What does this project do?" --path /path/to/repo
```

### Interactive Mode
```bash
repolens interactive
repolens i
```

Interactive mode allows you to ask multiple questions in a conversation-style interface.

### Repository Info
```bash
repolens info
repolens info --path /path/to/repo
```

## Commands

- `analyze` - Analyze the repository structure and dependencies
- `scan <file>` - Scan a specific file for security issues
- `ask <question>` - Ask a question about the repository
- `interactive` (or `i`) - Start interactive Q&A mode
- `info` - Show repository information

## Examples

```bash
# Analyze current directory
repolens analyze

# Scan a file for security issues
repolens scan src/auth.js --verbose

# Ask about installation
repolens ask "How do I set up this project?"

# Start interactive mode
repolens interactive

# Get repository info
repolens info
```

## Features

- 🔍 Repository analysis (language, dependencies, commands)
- 🔒 Security scanning (detect dangerous patterns)
- 💬 AI-powered Q&A (with Ollama support)
- 📊 Detailed reports (JSON export)
- 🎨 Beautiful CLI output (colors and spinners)
- ⚡ Fast and lightweight

## Requirements

- Node.js 16+
- (Optional) Ollama for AI-powered answers

## Tips

- Run `repolens` without arguments to see all available commands
- Use `--help` with any command for more details
- Interactive mode is great for exploring unfamiliar repositories
- Security scanning helps identify potential vulnerabilities before running code

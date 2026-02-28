# RepoLens CLI Guide

## 🚀 Quick Start

After using "Quick Setup" in the VS Code extension, the RepoLens CLI is automatically available in your terminal!

## 📦 Manual Installation

If you want to install the CLI separately:

```bash
cd cli
./install.sh
```

Or manually:

```bash
cd cli
npm install
npm run build
npm link
```

## 💻 Commands

### 1. Analyze Repository
```bash
repolens analyze
```

Analyzes the current directory and shows:
- Language and package manager
- File statistics
- Setup commands
- Security analysis

**Options:**
- `--path <path>` - Analyze a specific directory
- `--output <file>` - Save report to JSON file

**Example:**
```bash
repolens analyze --path ~/projects/myapp --output report.json
```

### 2. Interactive Mode (Recommended!)
```bash
repolens interactive
```

or

```bash
repolens i
```

Start an interactive Q&A session where you can ask multiple questions about the repository.

**Example session:**
```
💬 Ask: How do I install this?
✓ Answer: To install this JavaScript/TypeScript project: npm install

💬 Ask: What does this project do?
✓ Answer: This is an HTTP client library...

💬 Ask: exit
Goodbye! 👋
```

### 3. Ask Single Question
```bash
repolens ask "How do I run this project?"
```

Ask a one-off question about the repository.

**Examples:**
```bash
repolens ask "What language is this?"
repolens ask "Does this make network requests?"
repolens ask "How do I set up the development environment?"
```

### 4. Scan File for Security
```bash
repolens scan src/auth.js
```

Scan a specific file for security issues like:
- `eval()` usage
- `exec()` calls
- Shell execution
- Subprocess usage
- Template injection risks

**Options:**
- `--verbose` - Show detailed output with line numbers

**Example:**
```bash
repolens scan src/utils/exec.js --verbose
```

### 5. Repository Info
```bash
repolens info
```

Show quick repository information from package.json:
- Name, version, description
- Available scripts
- License

## 🎯 Use Cases

### After Quick Setup
```bash
# 1. Quick Setup clones and installs the repo
# 2. Open terminal in the installed folder
# 3. Start exploring:

repolens interactive
# Ask: "What are the main entry points?"
# Ask: "Are there any security concerns?"
# Ask: "How do I run tests?"
```

### Security Audit
```bash
# Analyze the whole repository
repolens analyze

# Scan specific files
repolens scan src/api/auth.js
repolens scan scripts/deploy.sh --verbose
```

### Learning a New Codebase
```bash
# Start interactive mode
repolens i

# Ask questions like:
# - "What does this project do?"
# - "How is the code organized?"
# - "What are the main dependencies?"
# - "How do I contribute?"
```

### Quick Reference
```bash
# Get install command
repolens ask "How do I install?"

# Get run command
repolens ask "How do I run this?"

# Check for issues
repolens analyze --output audit.json
```

## 🤖 AI Integration

The CLI uses the same AI providers as the extension:

1. **Ollama** (Local) - If running at `localhost:11434`
2. **Fallback** - Heuristic responses based on repository structure

To get better AI answers, make sure Ollama is running:
```bash
ollama serve
```

## 📊 Output Examples

### Analyze Command
```
📋 Repository Analysis

Language: JavaScript/TypeScript
Package Manager: npm
Total Files: 245
Code Files: 89

⚙️  Setup Commands

Install: npm install
Run: npm start

🔒 Security Analysis

Risk Level: Moderate
Issues Found: 3

⚠️  Security Issues:

1. src/utils/exec.js
   → Uses child_process - review command execution
```

### Scan Command
```
🔍 Security Scan: src/auth.js

⚠️  Found 2 potential issue(s):

1. Uses eval()
   Risk: High
   Description: Uses eval() - can execute arbitrary code
   Line: 45

2. Template string interpolation - check for injection
   Risk: Moderate
   Description: Template string interpolation - check for injection
   Line: 78

Recommendations:
• Review the flagged code carefully
• Ensure proper input validation
• Consider safer alternatives
```

## 🔧 Tips & Tricks

1. **Use Interactive Mode** - It's the best way to explore a new repository
2. **Scan Before Running** - Always scan security-sensitive files
3. **Save Reports** - Use `--output` to save analysis for later
4. **Combine with Git** - Run analysis after pulling changes
5. **Automate** - Add to your CI/CD pipeline

## 🆘 Troubleshooting

### "Command not found: repolens"
Run the installation again:
```bash
cd cli
npm link
```

### "No AI responses"
Make sure Ollama is running:
```bash
ollama serve
```

Or use the heuristic fallback (automatic).

### "Permission denied"
Make the install script executable:
```bash
chmod +x cli/install.sh
```

## 🎓 Examples

### Example 1: Exploring axios
```bash
cd axios
repolens interactive

💬 Ask: What is this library for?
💬 Ask: How do I make a GET request?
💬 Ask: Are there any security concerns?
```

### Example 2: Security Audit
```bash
repolens analyze --output security-report.json
repolens scan src/api/*.js
```

### Example 3: Quick Setup Workflow
```bash
# In VS Code: Use Quick Setup to clone repo
# Then in terminal:
repolens info
repolens analyze
repolens i  # Start asking questions
```

## 📚 Learn More

- Run `repolens --help` for all commands
- Run `repolens <command> --help` for command-specific help
- Check `cli/README.md` for development info

---

**Happy exploring! 🔍**

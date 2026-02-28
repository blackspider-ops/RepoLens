#!/bin/bash

echo "🔍 Installing RepoLens CLI..."

cd "$(dirname "$0")"

# Install dependencies
npm install

# Build TypeScript
npm run build

# Link globally
npm link

echo "✅ RepoLens CLI installed successfully!"
echo ""
echo "Try these commands:"
echo "  repolens analyze       - Analyze current repository"
echo "  repolens interactive   - Start interactive Q&A mode"
echo "  repolens scan <file>   - Scan a file for security issues"
echo "  repolens --help        - Show all commands"

import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export async function explainFile(filePath: string) {
  const spinner = ora('Reading file...').start();

  try {
    if (!fs.existsSync(filePath)) {
      spinner.fail('File not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);

    spinner.text = 'Analyzing code...';

    // Try Ollama
    try {
      const response = await axios.post(
        'http://localhost:11434/api/generate',
        {
          model: 'qwen2.5:1.5b',
          prompt: `Explain this code file concisely (3-4 sentences):

File: ${fileName}
Language: ${getLanguage(ext)}

Code:
${content.substring(0, 2000)}

Provide a brief explanation of what this code does, its main purpose, and key functionality.`,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 250
          }
        },
        { timeout: 30000 }
      );

      if (response.data && response.data.response) {
        spinner.succeed('Explanation ready!');
        console.log(chalk.bold.cyan(`\n📄 ${fileName}\n`));
        console.log(chalk.white(response.data.response.trim()));
        console.log();
        return;
      }
    } catch (error) {
      // Fallback to heuristic
    }

    // Heuristic explanation
    spinner.succeed('Analysis complete!');
    console.log(chalk.bold.cyan(`\n📄 ${fileName}\n`));
    
    const lines = content.split('\n').length;
    const language = getLanguage(ext);
    
    console.log(chalk.gray('Language:'), chalk.white(language));
    console.log(chalk.gray('Lines:'), chalk.white(lines));
    console.log(chalk.gray('Size:'), chalk.white(formatBytes(content.length)));
    console.log();
    
    // Basic analysis
    if (content.includes('export') || content.includes('module.exports')) {
      console.log(chalk.white('This appears to be a module that exports functionality.'));
    }
    if (content.includes('class ')) {
      console.log(chalk.white('Contains class definitions.'));
    }
    if (content.includes('function ') || content.includes('=>')) {
      console.log(chalk.white('Contains function definitions.'));
    }
    if (content.includes('import ') || content.includes('require(')) {
      console.log(chalk.white('Imports external dependencies.'));
    }
    
    console.log(chalk.yellow('\n💡 Start Ollama for AI-powered explanations: ollama serve\n'));

  } catch (error) {
    spinner.fail('Failed to analyze file');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function getLanguage(ext: string): string {
  const languages: Record<string, string> = {
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.py': 'Python',
    '.rs': 'Rust',
    '.go': 'Go',
    '.java': 'Java',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.sh': 'Shell',
    '.bash': 'Bash'
  };
  return languages[ext] || 'Unknown';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

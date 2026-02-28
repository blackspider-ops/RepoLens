import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeLocalRepo } from '../utils/analyzer';
import axios from 'axios';

export async function summarizeRepo(repoPath: string) {
  const spinner = ora('Analyzing repository...').start();

  try {
    if (!fs.existsSync(repoPath)) {
      spinner.fail('Repository path does not exist');
      return;
    }

    const analysis = await analyzeLocalRepo(repoPath);
    
    spinner.text = 'Generating summary...';

    // Try Ollama
    try {
      const response = await axios.post(
        'http://localhost:11434/api/generate',
        {
          model: 'qwen2.5:1.5b',
          prompt: `Provide a concise 2-3 sentence summary of this repository:

Name: ${analysis.name}
Language: ${analysis.language}
Package Manager: ${analysis.packageManager}
Files: ${analysis.fileCount} total, ${analysis.codeFiles} code files

README:
${analysis.readme?.substring(0, 1000) || 'No README'}

Summary:`,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 150
          }
        },
        { timeout: 30000 }
      );

      if (response.data && response.data.response) {
        spinner.succeed('Summary ready!');
        console.log(chalk.bold.cyan('\n📦 Repository Summary\n'));
        console.log(chalk.white(response.data.response.trim()));
        console.log();
        
        console.log(chalk.gray('Language:'), chalk.white(analysis.language));
        console.log(chalk.gray('Package Manager:'), chalk.white(analysis.packageManager));
        console.log(chalk.gray('Files:'), chalk.white(`${analysis.fileCount} total, ${analysis.codeFiles} code`));
        console.log();
        return;
      }
    } catch (error) {
      // Fallback to heuristic
    }

    // Heuristic summary
    spinner.succeed('Summary ready!');
    console.log(chalk.bold.cyan('\n📦 Repository Summary\n'));
    
    if (analysis.readme) {
      const firstLine = analysis.readme.split('\n').filter(l => l.trim() && !l.startsWith('#'))[0];
      if (firstLine) {
        console.log(chalk.white(firstLine.substring(0, 200)));
        console.log();
      }
    }
    
    console.log(chalk.gray('Language:'), chalk.white(analysis.language));
    console.log(chalk.gray('Package Manager:'), chalk.white(analysis.packageManager));
    console.log(chalk.gray('Files:'), chalk.white(`${analysis.fileCount} total, ${analysis.codeFiles} code`));
    console.log(chalk.gray('Install:'), chalk.green(analysis.installCommand));
    console.log(chalk.gray('Run:'), chalk.green(analysis.runCommand));
    console.log();

  } catch (error) {
    spinner.fail('Failed to generate summary');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
}

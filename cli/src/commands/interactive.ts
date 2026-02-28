import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import axios from 'axios';
import * as fs from 'fs';
import { analyzeLocalRepo } from '../utils/analyzer';
import { getAIResponse } from '../utils/ai';

async function checkOllamaStatus(): Promise<boolean> {
  try {
    await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

export async function interactiveMode(repoPath: string) {
  console.log(chalk.bold.cyan('\n🔍 RepoLens Interactive Mode\n'));
  console.log(chalk.gray('Ask questions about your repository. Type "exit" to quit.\n'));

  if (!fs.existsSync(repoPath)) {
    console.error(chalk.red('Repository path does not exist'));
    return;
  }

  // Check Ollama status
  const ollamaRunning = await checkOllamaStatus();
  if (ollamaRunning) {
    console.log(chalk.green('✓ Ollama connected') + chalk.gray(' - AI-powered answers'));
  } else {
    console.log(chalk.yellow('⚠ Ollama not running') + chalk.gray(' - Using heuristic mode'));
    console.log(chalk.gray('  Start Ollama: ollama serve\n'));
  }

  const spinner = ora('Loading repository...').start();
  
  try {
    const analysis = await analyzeLocalRepo(repoPath);
    spinner.succeed('Repository loaded!');

    console.log(chalk.gray('\nRepository:'), chalk.white(analysis.name || repoPath));
    console.log(chalk.gray('Language:'), chalk.white(analysis.language));
    console.log();

    while (true) {
      const { question } = await inquirer.prompt([
        {
          type: 'input',
          name: 'question',
          message: chalk.cyan('Ask:'),
          prefix: '💬'
        }
      ]);

      if (!question || question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
        console.log(chalk.gray('\nGoodbye! 👋\n'));
        break;
      }

      const answerSpinner = ora('Thinking...').start();

      try {
        const answer = await getAIResponse(question, analysis, repoPath);
        answerSpinner.succeed('Answer:');
        console.log(chalk.white(answer));
        console.log();
      } catch (error) {
        answerSpinner.fail('Failed to generate answer');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        console.log();
      }
    }

  } catch (error) {
    spinner.fail('Failed to load repository');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
}

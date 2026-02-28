import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeLocalRepo } from '../utils/analyzer';
import { getAIResponse } from '../utils/ai';

export async function askQuestion(question: string, repoPath: string) {
  const spinner = ora('Analyzing repository...').start();

  try {
    if (!fs.existsSync(repoPath)) {
      spinner.fail('Repository path does not exist');
      return;
    }

    spinner.text = 'Understanding repository...';
    const analysis = await analyzeLocalRepo(repoPath);

    spinner.text = 'Generating answer...';
    const answer = await getAIResponse(question, analysis, repoPath);

    spinner.succeed('Answer ready!');

    console.log(chalk.bold.cyan('\n💬 Question:\n'));
    console.log(chalk.white(question));

    console.log(chalk.bold.cyan('\n📝 Answer:\n'));
    console.log(chalk.white(answer));

  } catch (error) {
    spinner.fail('Failed to answer question');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
}

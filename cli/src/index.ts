#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeRepository } from './commands/analyze';
import { scanFile } from './commands/scan';
import { interactiveMode } from './commands/interactive';
import { askQuestion } from './commands/ask';
import { explainFile } from './commands/explain';
import { summarizeRepo } from './commands/summary';

const program = new Command();

program
  .name('repolens')
  .description('RepoLens CLI - Understand repositories from the command line')
  .version('1.0.0');

// Analyze command
program
  .command('analyze')
  .description('Analyze the current repository')
  .option('-p, --path <path>', 'Repository path', process.cwd())
  .option('-o, --output <file>', 'Output file for analysis report')
  .action(async (options) => {
    await analyzeRepository(options.path, options.output);
  });

// Scan command
program
  .command('scan <file>')
  .description('Scan a specific file for security issues')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (file, options) => {
    await scanFile(file, options.verbose);
  });

// Ask command
program
  .command('ask <question>')
  .description('Ask a question about the repository')
  .option('-p, --path <path>', 'Repository path', process.cwd())
  .action(async (question, options) => {
    await askQuestion(question, options.path);
  });

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start interactive Q&A mode')
  .option('-p, --path <path>', 'Repository path', process.cwd())
  .action(async (options) => {
    await interactiveMode(options.path);
  });

// Explain command
program
  .command('explain <file>')
  .description('Explain what a code file does')
  .action(async (file) => {
    await explainFile(file);
  });

// Summary command
program
  .command('summary')
  .alias('sum')
  .description('Generate a summary of the repository')
  .option('-p, --path <path>', 'Repository path', process.cwd())
  .action(async (options) => {
    await summarizeRepo(options.path);
  });

// Info command
program
  .command('info')
  .description('Show repository information')
  .option('-p, --path <path>', 'Repository path', process.cwd())
  .action(async (options) => {
    const spinner = ora('Loading repository info...').start();
    
    try {
      const packageJsonPath = path.join(options.path, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        spinner.succeed('Repository info loaded');
        
        console.log(chalk.bold.cyan('\n📦 Repository Information\n'));
        console.log(chalk.gray('Name:'), chalk.white(pkg.name || 'N/A'));
        console.log(chalk.gray('Version:'), chalk.white(pkg.version || 'N/A'));
        console.log(chalk.gray('Description:'), chalk.white(pkg.description || 'N/A'));
        console.log(chalk.gray('License:'), chalk.white(pkg.license || 'N/A'));
        
        if (pkg.scripts) {
          console.log(chalk.bold.cyan('\n⚙️  Available Scripts\n'));
          Object.entries(pkg.scripts).forEach(([name, script]) => {
            console.log(chalk.gray(`  ${name}:`), chalk.white(script));
          });
        }
      } else {
        spinner.fail('No package.json found');
      }
    } catch (error) {
      spinner.fail('Failed to load repository info');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Default action - show help
program.action(() => {
  console.log(chalk.bold.cyan('\n🔍 RepoLens CLI\n'));
  console.log(chalk.gray('Understand Before You Run\n'));
  program.help();
});

program.parse();

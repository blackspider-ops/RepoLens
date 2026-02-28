import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import { scanFileContent } from '../utils/scanner';

export async function scanFile(filePath: string, verbose: boolean = false) {
  const spinner = ora(`Scanning ${filePath}...`).start();

  try {
    if (!fs.existsSync(filePath)) {
      spinner.fail('File does not exist');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const results = scanFileContent(content, filePath);

    spinner.succeed('Scan complete!');

    console.log(chalk.bold.cyan(`\n🔍 Security Scan: ${filePath}\n`));

    if (results.length === 0) {
      console.log(chalk.green('✅ No security issues found'));
    } else {
      console.log(chalk.yellow(`⚠️  Found ${results.length} potential issue(s):\n`));

      results.forEach((issue, i) => {
        console.log(chalk.gray(`${i + 1}.`), chalk.yellow(issue.pattern));
        console.log(chalk.gray('   Risk:'), issue.severity);
        console.log(chalk.gray('   Description:'), issue.description);
        
        if (verbose && issue.line) {
          console.log(chalk.gray('   Line:'), issue.line);
        }
        console.log();
      });

      console.log(chalk.bold.yellow('Recommendations:'));
      console.log(chalk.gray('• Review the flagged code carefully'));
      console.log(chalk.gray('• Ensure proper input validation'));
      console.log(chalk.gray('• Consider safer alternatives'));
    }

  } catch (error) {
    spinner.fail('Scan failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
}

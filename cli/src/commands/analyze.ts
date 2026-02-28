import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeLocalRepo } from '../utils/analyzer';
import { scanForSecurity } from '../utils/scanner';

export async function analyzeRepository(repoPath: string, outputFile?: string) {
  const spinner = ora('Analyzing repository...').start();

  try {
    // Check if path exists
    if (!fs.existsSync(repoPath)) {
      spinner.fail('Repository path does not exist');
      return;
    }

    spinner.text = 'Scanning files...';
    const analysis = await analyzeLocalRepo(repoPath);

    spinner.text = 'Running security scan...';
    const security = await scanForSecurity(repoPath);

    spinner.succeed('Analysis complete!');

    // Display results
    console.log(chalk.bold.cyan('\n📋 Repository Analysis\n'));
    console.log(chalk.gray('Language:'), chalk.white(analysis.language));
    console.log(chalk.gray('Package Manager:'), chalk.white(analysis.packageManager));
    console.log(chalk.gray('Total Files:'), chalk.white(analysis.fileCount));
    console.log(chalk.gray('Code Files:'), chalk.white(analysis.codeFiles));

    console.log(chalk.bold.cyan('\n⚙️  Setup Commands\n'));
    console.log(chalk.gray('Install:'), chalk.green(analysis.installCommand));
    console.log(chalk.gray('Run:'), chalk.green(analysis.runCommand));

    console.log(chalk.bold.cyan('\n🔒 Security Analysis\n'));
    console.log(chalk.gray('Risk Level:'), getRiskColor(security.riskLevel));
    console.log(chalk.gray('Issues Found:'), chalk.white(security.issues.length));

    if (security.issues.length > 0) {
      console.log(chalk.bold.yellow('\n⚠️  Security Issues:\n'));
      security.issues.slice(0, 5).forEach((issue, i) => {
        console.log(chalk.gray(`${i + 1}.`), chalk.yellow(issue.file));
        console.log(chalk.gray('   →'), issue.description);
      });
      
      if (security.issues.length > 5) {
        console.log(chalk.gray(`\n   ... and ${security.issues.length - 5} more issues`));
      }
    }

    // Save to file if requested
    if (outputFile) {
      const report = {
        timestamp: new Date().toISOString(),
        path: repoPath,
        analysis,
        security
      };
      fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
      console.log(chalk.green(`\n✅ Report saved to ${outputFile}`));
    }

    console.log(chalk.gray('\n💡 Tip: Use'), chalk.cyan('repolens interactive'), chalk.gray('to ask questions about this repository'));

  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'Low': return chalk.green(level);
    case 'Moderate': return chalk.yellow(level);
    case 'High': return chalk.red(level);
    default: return chalk.white(level);
  }
}

import { AIProvider, RepoAnalysis, SecurityFindings } from '../types';

export class OfflineProvider implements AIProvider {
  /**
   * Generate heuristic-based summary without AI
   */
  async summarizeRepo(data: RepoAnalysis): Promise<string> {
    const sections = [];

    sections.push('## What This Tool Does');
    if (data.readme) {
      const firstPara = data.readme.split('\n\n')[0];
      sections.push(firstPara.substring(0, 300));
    } else {
      sections.push(`A ${data.language} project using ${data.detectedPackageManager}.`);
    }

    sections.push('\n## Who It Is For');
    sections.push(`Developers working with ${data.language}.`);

    sections.push('\n## Core Functionality');
    sections.push(`- Language: ${data.language}`);
    sections.push(`- Package Manager: ${data.detectedPackageManager}`);
    sections.push(`- Key Files: ${data.keyFiles.slice(0, 5).join(', ')}`);

    sections.push('\n## External Effects');
    const effects = this.detectEffects(data);
    sections.push(effects.length > 0 ? effects.join('\n') : '- Unknown (check README for details)');

    sections.push('\n*Note: This is a heuristic analysis. Enable AI for deeper insights.*');

    return sections.join('\n');
  }

  async explainSecurity(findings: SecurityFindings): Promise<string> {
    const sections = [];

    sections.push(`## Risk Level: ${findings.riskLevel}`);
    sections.push('');

    if (findings.flaggedFiles.length === 0) {
      sections.push('No significant security concerns detected in the initial scan.');
      sections.push('');
      sections.push('**Recommendations:**');
      sections.push('- Always review code before running');
      sections.push('- Check for recent security advisories');
      sections.push('- Run in isolated environment if unsure');
    } else {
      sections.push('**Flagged Issues:**');
      findings.flaggedFiles.forEach(f => {
        sections.push(`- \`${f.file}\`: ${f.reason}`);
      });
      sections.push('');
      sections.push('**What This Means:**');
      
      if (findings.riskLevel === 'High') {
        sections.push('High-risk patterns detected. Exercise caution.');
      } else if (findings.riskLevel === 'Moderate') {
        sections.push('Some potentially risky operations found. Review before running.');
      } else {
        sections.push('Low risk, but always verify code you run.');
      }

      sections.push('');
      sections.push('**Recommendations:**');
      sections.push('- Review flagged files manually');
      sections.push('- Understand what the code does before execution');
      sections.push('- Use a sandboxed environment for testing');
    }

    sections.push('');
    sections.push('*Note: This is a basic static analysis. Enable AI for detailed security insights.*');

    return sections.join('\n');
  }

  async answerQuestion(question: string, context: RepoAnalysis): Promise<string> {
    const q = question.toLowerCase();

    // Simple keyword matching
    if (q.includes('install') || q.includes('setup')) {
      return `To install this project:\n\n\`\`\`\n${context.installCommand}\n\`\`\`\n\nCheck the README for additional setup steps.`;
    }

    if (q.includes('run') || q.includes('start')) {
      return `To run this project:\n\n\`\`\`\n${context.runCommand}\n\`\`\`\n\nCheck the README for additional options.`;
    }

    if (q.includes('language') || q.includes('written')) {
      return `This project is written in ${context.language} and uses ${context.detectedPackageManager}.`;
    }

    if (q.includes('network') || q.includes('internet') || q.includes('request')) {
      return 'Unable to determine network behavior without AI analysis. Please review the code manually or enable AI provider.';
    }

    // Default response
    return `I can provide basic information about this repository:

- Language: ${context.language}
- Package Manager: ${context.detectedPackageManager}
- Install: ${context.installCommand}
- Run: ${context.runCommand}

For detailed answers, please enable an AI provider (Ollama or OpenAI) in settings.`;
  }

  private detectEffects(data: RepoAnalysis): string[] {
    const effects: string[] = [];

    if (data.keyFiles.some(f => f.includes('database') || f.includes('db'))) {
      effects.push('- May interact with databases');
    }

    if (data.keyFiles.some(f => f.includes('api') || f.includes('server'))) {
      effects.push('- May make network requests');
    }

    if (data.keyFiles.some(f => f.includes('config') || f.includes('.env'))) {
      effects.push('- May require configuration');
    }

    return effects;
  }
}

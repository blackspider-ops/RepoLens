import axios from 'axios';
import { AIProvider, RepoAnalysis, SecurityFindings } from '../types';

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model = 'gpt-4o-mini';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async summarizeRepo(data: RepoAnalysis): Promise<string> {
    const prompt = `Analyze this GitHub repository and provide a clear summary:

Language: ${data.language}
Package Manager: ${data.detectedPackageManager}
Key Files: ${data.keyFiles.join(', ')}

README excerpt:
${data.readme?.substring(0, 1000) || 'No README available'}

Provide a structured summary with:
1. What this tool does
2. Who it is for
3. Core functionality
4. External effects (file system, network, etc.)

Keep it concise and clear.`;

    return this.chat(prompt);
  }

  async explainSecurity(findings: SecurityFindings): Promise<string> {
    const prompt = `Analyze these security findings for a GitHub repository:

Risk Level: ${findings.riskLevel}
Flagged Issues: ${findings.reasons.join(', ')}

Flagged Files:
${findings.flaggedFiles.map(f => `- ${f.file}: ${f.reason}`).join('\n')}

Provide a brief security explanation:
1. What the risks mean
2. Whether they are normal for this type of project
3. Recommendations for safe usage

Be practical and helpful.`;

    return this.chat(prompt);
  }

  async answerQuestion(question: string, context: RepoAnalysis): Promise<string> {
    const prompt = `Answer this question about a GitHub repository:

Question: ${question}

Repository Context:
- Language: ${context.language}
- Package Manager: ${context.detectedPackageManager}
- Install: ${context.installCommand}
- Run: ${context.runCommand}
- Key Files: ${context.keyFiles.join(', ')}

README excerpt:
${context.readme?.substring(0, 800) || 'No README'}

Provide a clear, helpful answer based on the available information.`;

    return this.chat(prompt);
  }

  private async chat(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      throw new Error('OpenAI request failed');
    }
  }
}

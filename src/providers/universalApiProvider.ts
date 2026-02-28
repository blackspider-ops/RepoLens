import axios from 'axios';
import { AIProvider, RepoAnalysis, SecurityFindings } from '../types';

export class UniversalApiProvider implements AIProvider {
  private apiKey: string;
  private provider: 'openai' | 'anthropic' | 'gemini';
  private model: string;

  constructor(apiKey: string, provider: 'openai' | 'anthropic' | 'gemini', model?: string) {
    this.apiKey = apiKey;
    this.provider = provider;
    
    // Set default models if not specified
    if (model) {
      this.model = model;
    } else {
      switch (provider) {
        case 'openai':
          this.model = 'gpt-4o-mini';
          break;
        case 'anthropic':
          this.model = 'claude-3-5-sonnet-20241022';
          break;
        case 'gemini':
          this.model = 'gemini-2-5-flash';
          break;
      }
    }
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
      switch (this.provider) {
        case 'openai':
          return await this.chatOpenAI(prompt);
        case 'anthropic':
          return await this.chatAnthropic(prompt);
        case 'gemini':
          return await this.chatGemini(prompt);
        default:
          throw new Error('Unknown provider');
      }
    } catch (error) {
      throw new Error(`${this.provider} API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async chatOpenAI(prompt: string): Promise<string> {
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
  }

  private async chatAnthropic(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.content[0]?.text || 'No response generated';
  }

  private async chatGemini(prompt: string): Promise<string> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
  }
}

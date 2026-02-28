// Core types for RepoLens

export interface RepoAnalysis {
  language: string;
  detectedPackageManager: string;
  installCommand: string;
  runCommand: string;
  keyFiles: string[];
  suspiciousFiles: string[];
  readme?: string;
  fileTree: string[];
}

export interface SecurityFindings {
  riskLevel: 'Low' | 'Moderate' | 'High';
  flaggedFiles: Array<{ file: string; reason: string }>;
  reasons: string[];
}

export interface AIProvider {
  summarizeRepo(data: RepoAnalysis): Promise<string>;
  explainSecurity(findings: SecurityFindings): Promise<string>;
  answerQuestion(question: string, context: RepoAnalysis): Promise<string>;
}

export interface GitHubRepo {
  owner: string;
  repo: string;
}

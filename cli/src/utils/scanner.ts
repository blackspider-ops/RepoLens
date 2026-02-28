import * as fs from 'fs';
import * as path from 'path';

export interface SecurityIssue {
  file: string;
  pattern: string;
  severity: 'Low' | 'Moderate' | 'High';
  description: string;
  line?: number;
}

export interface SecurityReport {
  riskLevel: 'Low' | 'Moderate' | 'High';
  issues: SecurityIssue[];
}

const dangerousPatterns = [
  { pattern: /\beval\s*\(/g, severity: 'High' as const, description: 'Uses eval() - can execute arbitrary code' },
  { pattern: /\bexec\s*\(/g, severity: 'High' as const, description: 'Uses exec() - can execute system commands' },
  { pattern: /subprocess\./g, severity: 'Moderate' as const, description: 'Uses subprocess - review command execution' },
  { pattern: /os\.system/g, severity: 'High' as const, description: 'Uses os.system() - can execute shell commands' },
  { pattern: /child_process/g, severity: 'Moderate' as const, description: 'Uses child_process - review command execution' },
  { pattern: /shell\s*=\s*True/g, severity: 'High' as const, description: 'Shell execution enabled - security risk' },
  { pattern: /rm\s+-rf/g, severity: 'High' as const, description: 'Destructive file operation detected' },
  { pattern: /\$\{.*\}/g, severity: 'Moderate' as const, description: 'Template string interpolation - check for injection' }
];

export function scanFileContent(content: string, filePath: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = content.split('\n');

  dangerousPatterns.forEach(({ pattern, severity, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      // Find line number
      let lineNum: number | undefined;
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          lineNum = i + 1;
          break;
        }
      }

      issues.push({
        file: filePath,
        pattern: pattern.source,
        severity,
        description,
        line: lineNum
      });
    }
  });

  return issues;
}

export async function scanForSecurity(repoPath: string): Promise<SecurityReport> {
  const issues: SecurityIssue[] = [];
  const codeExtensions = ['.js', '.ts', '.py', '.sh', '.bash'];

  function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      // Skip node_modules, .git, etc.
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
        return;
      }

      if (fs.statSync(filePath).isDirectory()) {
        scanDirectory(filePath);
      } else if (codeExtensions.some(ext => file.endsWith(ext))) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const fileIssues = scanFileContent(content, path.relative(repoPath, filePath));
          issues.push(...fileIssues);
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
  }

  scanDirectory(repoPath);

  // Calculate risk level
  let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  const highRiskCount = issues.filter(i => i.severity === 'High').length;
  const moderateRiskCount = issues.filter(i => i.severity === 'Moderate').length;

  if (highRiskCount > 0) {
    riskLevel = 'High';
  } else if (moderateRiskCount > 3) {
    riskLevel = 'Moderate';
  } else if (issues.length > 0) {
    riskLevel = 'Low';
  }

  return { riskLevel, issues };
}

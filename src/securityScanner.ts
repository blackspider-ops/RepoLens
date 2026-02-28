import { SecurityFindings } from './types';

export class SecurityScanner {
  /**
   * Perform lightweight security scan on file tree and content
   */
  scan(fileTree: string[], keyFiles: Record<string, string>): SecurityFindings {
    const flaggedFiles: Array<{ file: string; reason: string }> = [];
    const reasons: string[] = [];

    // Scan file tree for suspicious patterns
    this.scanFileTree(fileTree, flaggedFiles);

    // Scan key files content
    this.scanFileContent(keyFiles, flaggedFiles);

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(flaggedFiles);

    // Generate reasons summary
    if (flaggedFiles.length > 0) {
      const uniqueReasons = [...new Set(flaggedFiles.map(f => f.reason))];
      reasons.push(...uniqueReasons);
    }

    return {
      riskLevel,
      flaggedFiles,
      reasons
    };
  }

  private scanFileTree(fileTree: string[], flaggedFiles: Array<{ file: string; reason: string }>) {
    const suspiciousExtensions = ['.exe', '.dll', '.so', '.dylib', '.bin'];
    const suspiciousNames = ['miner', 'crypto', 'keylogger'];

    fileTree.forEach(file => {
      const lower = file.toLowerCase();
      
      // Check extensions
      if (suspiciousExtensions.some(ext => lower.endsWith(ext))) {
        flaggedFiles.push({ file, reason: 'Binary executable file' });
      }

      // Check names
      if (suspiciousNames.some(name => lower.includes(name))) {
        flaggedFiles.push({ file, reason: 'Suspicious filename pattern' });
      }
    });
  }

  private scanFileContent(keyFiles: Record<string, string>, flaggedFiles: Array<{ file: string; reason: string }>) {
    const dangerousPatterns = [
      { pattern: /\beval\s*\(/gi, reason: 'Uses eval()' },
      { pattern: /\bexec\s*\(/gi, reason: 'Uses exec()' },
      { pattern: /subprocess\./gi, reason: 'Uses subprocess' },
      { pattern: /os\.system/gi, reason: 'Uses os.system()' },
      { pattern: /child_process/gi, reason: 'Uses child_process' },
      { pattern: /shell\s*=\s*True/gi, reason: 'Shell execution enabled' },
      { pattern: /rm\s+-rf/gi, reason: 'Destructive file operation' },
      { pattern: /curl\s+.*\|\s*bash/gi, reason: 'Pipes curl to bash' },
      { pattern: /wget\s+.*\|\s*sh/gi, reason: 'Pipes wget to shell' }
    ];

    Object.entries(keyFiles).forEach(([filename, content]) => {
      dangerousPatterns.forEach(({ pattern, reason }) => {
        if (pattern.test(content)) {
          flaggedFiles.push({ file: filename, reason });
        }
      });

      // Check for network requests
      if (
        /axios|fetch|requests|urllib|http\.get|http\.post/gi.test(content)
      ) {
        flaggedFiles.push({ file: filename, reason: 'Makes network requests' });
      }

      // Check for file system writes
      if (
        /fs\.write|open\(.*['"]w['"]|file\.write/gi.test(content)
      ) {
        flaggedFiles.push({ file: filename, reason: 'Writes to file system' });
      }
    });
  }

  private calculateRiskLevel(flaggedFiles: Array<{ file: string; reason: string }>): 'Low' | 'Moderate' | 'High' {
    if (flaggedFiles.length === 0) return 'Low';

    const highRiskPatterns = ['eval()', 'exec()', 'shell execution', 'Binary executable'];
    const hasHighRisk = flaggedFiles.some(f => 
      highRiskPatterns.some(pattern => f.reason.includes(pattern))
    );

    if (hasHighRisk) return 'High';
    if (flaggedFiles.length > 5) return 'Moderate';
    return 'Low';
  }
}

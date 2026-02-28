"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanFileContent = scanFileContent;
exports.scanForSecurity = scanForSecurity;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dangerousPatterns = [
    { pattern: /\beval\s*\(/g, severity: 'High', description: 'Uses eval() - can execute arbitrary code' },
    { pattern: /\bexec\s*\(/g, severity: 'High', description: 'Uses exec() - can execute system commands' },
    { pattern: /subprocess\./g, severity: 'Moderate', description: 'Uses subprocess - review command execution' },
    { pattern: /os\.system/g, severity: 'High', description: 'Uses os.system() - can execute shell commands' },
    { pattern: /child_process/g, severity: 'Moderate', description: 'Uses child_process - review command execution' },
    { pattern: /shell\s*=\s*True/g, severity: 'High', description: 'Shell execution enabled - security risk' },
    { pattern: /rm\s+-rf/g, severity: 'High', description: 'Destructive file operation detected' },
    { pattern: /\$\{.*\}/g, severity: 'Moderate', description: 'Template string interpolation - check for injection' }
];
function scanFileContent(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    dangerousPatterns.forEach(({ pattern, severity, description }) => {
        const matches = content.match(pattern);
        if (matches) {
            // Find line number
            let lineNum;
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
async function scanForSecurity(repoPath) {
    const issues = [];
    const codeExtensions = ['.js', '.ts', '.py', '.sh', '.bash'];
    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            // Skip node_modules, .git, etc.
            if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
                return;
            }
            if (fs.statSync(filePath).isDirectory()) {
                scanDirectory(filePath);
            }
            else if (codeExtensions.some(ext => file.endsWith(ext))) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const fileIssues = scanFileContent(content, path.relative(repoPath, filePath));
                    issues.push(...fileIssues);
                }
                catch (error) {
                    // Skip files that can't be read
                }
            }
        });
    }
    scanDirectory(repoPath);
    // Calculate risk level
    let riskLevel = 'Low';
    const highRiskCount = issues.filter(i => i.severity === 'High').length;
    const moderateRiskCount = issues.filter(i => i.severity === 'Moderate').length;
    if (highRiskCount > 0) {
        riskLevel = 'High';
    }
    else if (moderateRiskCount > 3) {
        riskLevel = 'Moderate';
    }
    else if (issues.length > 0) {
        riskLevel = 'Low';
    }
    return { riskLevel, issues };
}

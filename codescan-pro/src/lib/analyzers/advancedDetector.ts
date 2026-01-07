/**
 * Advanced Code Detection System
 * Latest standards and best practices detection (2024)
 * Supports: JavaScript, TypeScript, Python, Java, Kotlin, Swift, Go, Rust, C++, C#, PHP, Ruby
 */

import type { CodeIssue, SecurityFinding, Language } from '../../types/analysis';
import { runKotlinDetection } from './kotlinDetector';
import { runSwiftDetection } from './swiftDetector';

// Detection Rules based on latest standards
export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'performance' | 'style' | 'best-practice' | 'error' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  pattern: RegExp | ((code: string, ast?: any) => boolean);
  message: string;
  suggestion: string;
  references: string[];
  autoFixable: boolean;
  fix?: (code: string, match: RegExpMatchArray) => string;
}

// Comprehensive Detection Rules - Latest 2024 Standards
export const DETECTION_RULES: DetectionRule[] = [
  // ============ SECURITY RULES ============
  {
    id: 'SEC001',
    name: 'SQL Injection',
    description: 'Detects potential SQL injection vulnerabilities',
    category: 'security',
    severity: 'critical',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE).*(?:\+\s*\w+|\$\{|\`\$\{)/gi,
    message: 'Potential SQL injection vulnerability. User input appears to be concatenated into SQL query.',
    suggestion: 'Use parameterized queries or an ORM. Never concatenate user input into SQL.',
    references: ['OWASP A03:2021', 'CWE-89'],
    autoFixable: false,
  },
  {
    id: 'SEC002',
    name: 'Hardcoded Password',
    description: 'Detects hardcoded passwords and credentials',
    category: 'security',
    severity: 'critical',
    pattern: /(?:password|passwd|pwd|secret|credential|auth_token)\s*[=:]\s*["'`][^"'`]{3,}["'`]/gi,
    message: 'Hardcoded credential detected. Sensitive data should never be stored in source code.',
    suggestion: 'Use environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault).',
    references: ['OWASP A02:2021', 'CWE-798'],
    autoFixable: true,
    fix: (code, match) => code.replace(match[0], `${match[0].split(/[=:]/)[0]}= process.env.${match[0].split(/[=:]/)[0].trim().toUpperCase()}`),
  },
  {
    id: 'SEC003',
    name: 'Hardcoded API Key',
    description: 'Detects hardcoded API keys',
    category: 'security',
    severity: 'critical',
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret|access[_-]?key|auth[_-]?key)\s*[=:]\s*["'`][A-Za-z0-9_\-]{16,}["'`]/gi,
    message: 'Hardcoded API key detected. API keys should be stored securely.',
    suggestion: 'Store API keys in environment variables or use a secrets manager.',
    references: ['OWASP A02:2021', 'CWE-798'],
    autoFixable: true,
    fix: (code, match) => code.replace(match[0], `${match[0].split(/[=:]/)[0]}= process.env.${match[0].split(/[=:]/)[0].trim().toUpperCase().replace(/[^A-Z0-9]/g, '_')}`),
  },
  {
    id: 'SEC004',
    name: 'Exposed AWS Credentials',
    description: 'Detects AWS access keys in code',
    category: 'security',
    severity: 'critical',
    pattern: /(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/g,
    message: 'AWS Access Key ID detected in source code.',
    suggestion: 'Remove AWS credentials and use IAM roles or environment variables.',
    references: ['AWS Security Best Practices', 'CWE-798'],
    autoFixable: false,
  },
  {
    id: 'SEC005',
    name: 'JWT Secret Exposure',
    description: 'Detects hardcoded JWT secrets',
    category: 'security',
    severity: 'critical',
    pattern: /(?:jwt[_-]?secret|token[_-]?secret|signing[_-]?key)\s*[=:]\s*["'`][^"'`]{8,}["'`]/gi,
    message: 'Hardcoded JWT secret detected.',
    suggestion: 'Store JWT secrets in environment variables with proper rotation policy.',
    references: ['OWASP A02:2021', 'JWT Best Practices'],
    autoFixable: true,
    fix: (code, match) => code.replace(match[0], `${match[0].split(/[=:]/)[0]}= process.env.JWT_SECRET`),
  },
  {
    id: 'SEC006',
    name: 'XSS via innerHTML',
    description: 'Detects potential XSS through innerHTML',
    category: 'security',
    severity: 'high',
    pattern: /\.innerHTML\s*=\s*(?!["'`]<)/g,
    message: 'Potential XSS vulnerability. innerHTML with dynamic content can execute malicious scripts.',
    suggestion: 'Use textContent for text, or sanitize HTML with DOMPurify before using innerHTML.',
    references: ['OWASP A03:2021', 'CWE-79'],
    autoFixable: false,
  },
  {
    id: 'SEC007',
    name: 'XSS via document.write',
    description: 'Detects document.write usage',
    category: 'security',
    severity: 'high',
    pattern: /document\.write\s*\(/g,
    message: 'document.write() is dangerous and can lead to XSS.',
    suggestion: 'Use DOM methods like createElement and appendChild instead.',
    references: ['OWASP A03:2021', 'CWE-79'],
    autoFixable: false,
  },
  {
    id: 'SEC008',
    name: 'Eval Usage',
    description: 'Detects eval() function usage',
    category: 'security',
    severity: 'critical',
    pattern: /\beval\s*\(/g,
    message: 'eval() is dangerous and can execute arbitrary code.',
    suggestion: 'Avoid eval(). Use JSON.parse() for JSON, or Function constructor if absolutely necessary.',
    references: ['OWASP A03:2021', 'CWE-95'],
    autoFixable: false,
  },
  {
    id: 'SEC009',
    name: 'SSRF Risk',
    description: 'Detects potential SSRF vulnerabilities',
    category: 'security',
    severity: 'high',
    pattern: /fetch\s*\(\s*(?!\s*["'`])[^)]+\)|axios\s*\.\s*(?:get|post|put|delete|patch)\s*\(\s*(?!\s*["'`])/g,
    message: 'Potential SSRF vulnerability. URL appears to be dynamically constructed.',
    suggestion: 'Validate and whitelist allowed URLs. Block internal IP ranges.',
    references: ['OWASP A10:2021', 'CWE-918'],
    autoFixable: false,
  },
  {
    id: 'SEC010',
    name: 'Insecure Randomness',
    description: 'Detects Math.random() for security purposes',
    category: 'security',
    severity: 'medium',
    pattern: /Math\.random\s*\(\s*\)/g,
    message: 'Math.random() is not cryptographically secure.',
    suggestion: 'Use crypto.randomUUID() or crypto.getRandomValues() for security-sensitive operations.',
    references: ['CWE-330', 'Web Crypto API'],
    autoFixable: true,
    fix: (code, match) => code.replace(match[0], 'crypto.randomUUID()'),
  },
  {
    id: 'SEC011',
    name: 'Prototype Pollution',
    description: 'Detects potential prototype pollution',
    category: 'security',
    severity: 'high',
    pattern: /\[["'`]__proto__["'`]\]|\[["'`]constructor["'`]\]|\[["'`]prototype["'`]\]/g,
    message: 'Potential prototype pollution vulnerability.',
    suggestion: 'Validate object keys and use Object.create(null) for dictionaries.',
    references: ['CWE-1321', 'Prototype Pollution'],
    autoFixable: false,
  },
  {
    id: 'SEC012',
    name: 'Path Traversal',
    description: 'Detects potential path traversal',
    category: 'security',
    severity: 'high',
    pattern: /(?:readFile|writeFile|readdir|unlink|rmdir|mkdir)\s*\(\s*(?!["'`])[^)]+\)/g,
    message: 'Potential path traversal vulnerability. File path appears to be user-controlled.',
    suggestion: 'Validate and sanitize file paths. Use path.resolve() and check against allowed directories.',
    references: ['OWASP A01:2021', 'CWE-22'],
    autoFixable: false,
  },
  {
    id: 'SEC013',
    name: 'Command Injection',
    description: 'Detects potential command injection',
    category: 'security',
    severity: 'critical',
    pattern: /(?:exec|execSync|spawn|spawnSync|execFile)\s*\(\s*(?!["'`])[^)]+\)/g,
    message: 'Potential command injection vulnerability.',
    suggestion: 'Avoid shell commands with user input. Use specific APIs or sanitize thoroughly.',
    references: ['OWASP A03:2021', 'CWE-78'],
    autoFixable: false,
  },

  // ============ BEST PRACTICE RULES ============
  {
    id: 'BP001',
    name: 'Use Strict Equality',
    description: 'Detects loose equality operators',
    category: 'best-practice',
    severity: 'medium',
    pattern: /[^=!<>]==[^=]|[^=!]!=[^=]/g,
    message: 'Use strict equality (=== or !==) instead of loose equality (== or !=).',
    suggestion: 'Replace == with === and != with !== to avoid type coercion issues.',
    references: ['ESLint eqeqeq', 'JavaScript Equality'],
    autoFixable: true,
    fix: (code, match) => code.replace(/([^=!<>])==([^=])/g, '$1===$2').replace(/([^=!])!=([^=])/g, '$1!==$2'),
  },
  {
    id: 'BP002',
    name: 'Avoid var',
    description: 'Detects var declarations',
    category: 'best-practice',
    severity: 'low',
    pattern: /\bvar\s+\w+/g,
    message: 'Avoid using var. Use const or let instead.',
    suggestion: 'Use const for values that won\'t be reassigned, let for variables that will.',
    references: ['ESLint no-var', 'ES6 Specification'],
    autoFixable: true,
    fix: (code, match) => code.replace(/\bvar\s+/g, 'const '),
  },
  {
    id: 'BP003',
    name: 'Prefer const',
    description: 'Detects let that could be const',
    category: 'best-practice',
    severity: 'info',
    pattern: /\blet\s+(\w+)\s*=\s*[^;]+;(?![^]*\1\s*=)/g,
    message: 'Variable is never reassigned. Use const instead of let.',
    suggestion: 'Use const when the variable is not reassigned.',
    references: ['ESLint prefer-const'],
    autoFixable: true,
    fix: (code, match) => code.replace(match[0], match[0].replace('let ', 'const ')),
  },
  {
    id: 'BP004',
    name: 'Use Template Literals',
    description: 'Detects string concatenation',
    category: 'best-practice',
    severity: 'info',
    pattern: /["'][^"']*["']\s*\+\s*\w+|\w+\s*\+\s*["'][^"']*["']/g,
    message: 'Use template literals instead of string concatenation.',
    suggestion: 'Replace string concatenation with template literals: `Hello ${name}`',
    references: ['ES6 Template Literals'],
    autoFixable: false,
  },
  {
    id: 'BP005',
    name: 'Use Optional Chaining',
    description: 'Detects verbose null checks',
    category: 'best-practice',
    severity: 'info',
    pattern: /\w+\s*&&\s*\w+\.\w+\s*&&\s*\w+\.\w+\.\w+/g,
    message: 'Use optional chaining (?.) for cleaner null checks.',
    suggestion: 'Replace obj && obj.prop && obj.prop.value with obj?.prop?.value',
    references: ['ES2020 Optional Chaining'],
    autoFixable: false,
  },
  {
    id: 'BP006',
    name: 'Use Nullish Coalescing',
    description: 'Detects || for default values',
    category: 'best-practice',
    severity: 'info',
    pattern: /\w+\s*\|\|\s*["'`\d]/g,
    message: 'Consider using nullish coalescing (??) instead of || for default values.',
    suggestion: '|| treats 0, "", false as falsy. ?? only checks null/undefined.',
    references: ['ES2020 Nullish Coalescing'],
    autoFixable: false,
  },
  {
    id: 'BP007',
    name: 'Async Function Without Await',
    description: 'Detects async functions that don\'t use await',
    category: 'best-practice',
    severity: 'low',
    pattern: /async\s+(?:function\s+\w+|(?:\w+|\([^)]*\))\s*=>)\s*\{[^}]*\}/g,
    message: 'Async function doesn\'t use await.',
    suggestion: 'Remove async keyword if not using await, or add await for async operations.',
    references: ['ESLint require-await'],
    autoFixable: false,
  },
  {
    id: 'BP008',
    name: 'Console in Production',
    description: 'Detects console statements',
    category: 'best-practice',
    severity: 'low',
    pattern: /console\.(log|warn|error|info|debug|trace)\s*\(/g,
    message: 'Console statements should be removed in production code.',
    suggestion: 'Use a proper logging library (winston, pino) or remove console statements.',
    references: ['ESLint no-console'],
    autoFixable: true,
    fix: (code, match) => code.replace(match[0], '// ' + match[0]),
  },
  {
    id: 'BP009',
    name: 'Empty Catch Block',
    description: 'Detects empty catch blocks',
    category: 'best-practice',
    severity: 'high',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    message: 'Empty catch block silently swallows errors.',
    suggestion: 'Handle errors properly or at minimum log them.',
    references: ['ESLint no-empty', 'Error Handling Best Practices'],
    autoFixable: false,
  },
  {
    id: 'BP010',
    name: 'Magic Numbers',
    description: 'Detects magic numbers',
    category: 'best-practice',
    severity: 'info',
    pattern: /(?<![.\d])\b(?!0\b|1\b|2\b|-1\b)\d{2,}\b(?![.\d])/g,
    message: 'Magic number detected. Use named constants for clarity.',
    suggestion: 'Extract magic numbers into named constants: const MAX_RETRIES = 5;',
    references: ['ESLint no-magic-numbers', 'Clean Code'],
    autoFixable: false,
  },

  // ============ PERFORMANCE RULES ============
  {
    id: 'PERF001',
    name: 'Array in Loop',
    description: 'Detects array methods in loops',
    category: 'performance',
    severity: 'medium',
    pattern: /for\s*\([^)]+\)\s*\{[^}]*\.(?:includes|indexOf|find|filter)\s*\([^}]*\}/g,
    message: 'Array method inside loop causes O(n²) complexity.',
    suggestion: 'Convert array to Set or Map before the loop for O(n) complexity.',
    references: ['Big O Notation', 'JavaScript Performance'],
    autoFixable: false,
  },
  {
    id: 'PERF002',
    name: 'Synchronous File Operations',
    description: 'Detects sync file operations',
    category: 'performance',
    severity: 'medium',
    pattern: /(?:readFileSync|writeFileSync|readdirSync|statSync|existsSync)\s*\(/g,
    message: 'Synchronous file operation blocks the event loop.',
    suggestion: 'Use async versions (readFile, writeFile) with await.',
    references: ['Node.js Best Practices'],
    autoFixable: false,
  },
  {
    id: 'PERF003',
    name: 'Large Object Spread',
    description: 'Detects spreading large objects in loops',
    category: 'performance',
    severity: 'low',
    pattern: /\.map\s*\([^)]*=>\s*\(\s*\{\s*\.{3}/g,
    message: 'Object spread in map() creates new objects for each iteration.',
    suggestion: 'Consider mutating objects in place if performance is critical.',
    references: ['JavaScript Performance'],
    autoFixable: false,
  },

  // ============ ERROR HANDLING RULES ============
  {
    id: 'ERR001',
    name: 'Unhandled Promise',
    description: 'Detects promises without catch',
    category: 'error',
    severity: 'high',
    pattern: /\.then\s*\([^)]+\)(?!\s*\.catch|\s*\.finally)/g,
    message: 'Promise chain without .catch() handler.',
    suggestion: 'Add .catch() handler or use try/catch with async/await.',
    references: ['Promise Error Handling'],
    autoFixable: false,
  },
  {
    id: 'ERR002',
    name: 'Throwing String',
    description: 'Detects throwing strings instead of Error',
    category: 'error',
    severity: 'medium',
    pattern: /throw\s+["'`][^"'`]+["'`]/g,
    message: 'Throw Error objects instead of strings.',
    suggestion: 'Use: throw new Error("message") for proper stack traces.',
    references: ['Error Handling Best Practices'],
    autoFixable: true,
    fix: (code, match) => {
      const stringMatch = match[0].match(/throw\s+["'`]([^"'`]+)["'`]/);
      return stringMatch ? code.replace(match[0], `throw new Error("${stringMatch[1]}")`) : code;
    },
  },

  // ============ REACT SPECIFIC RULES ============
  {
    id: 'REACT001',
    name: 'Missing Key Prop',
    description: 'Detects missing key in mapped elements',
    category: 'warning',
    severity: 'medium',
    pattern: /\.map\s*\([^)]*=>\s*(?:<\w+(?!\s+key)[^>]*>|\(\s*<\w+(?!\s+key))/g,
    message: 'Missing key prop in mapped elements.',
    suggestion: 'Add a unique key prop: <Item key={item.id} />',
    references: ['React Keys', 'React Reconciliation'],
    autoFixable: false,
  },
  {
    id: 'REACT002',
    name: 'Index as Key',
    description: 'Detects using index as key',
    category: 'warning',
    severity: 'low',
    pattern: /\.map\s*\(\s*\([^,)]+,\s*(\w+)\s*\)[^}]*key\s*=\s*\{\s*\1\s*\}/g,
    message: 'Using array index as key can cause issues with reordering.',
    suggestion: 'Use a stable unique identifier as key instead of index.',
    references: ['React Keys'],
    autoFixable: false,
  },
  {
    id: 'REACT003',
    name: 'Direct State Mutation',
    description: 'Detects direct state mutation',
    category: 'error',
    severity: 'high',
    pattern: /(?:this\.state|state)\.\w+\s*(?:=|\+\+|--|\+=|-=)/g,
    message: 'Direct state mutation detected. This won\'t trigger re-render.',
    suggestion: 'Use setState() or the setter from useState().',
    references: ['React State', 'Immutability'],
    autoFixable: false,
  },
  {
    id: 'REACT004',
    name: 'useEffect Missing Deps',
    description: 'Detects useEffect with empty deps using external values',
    category: 'warning',
    severity: 'high',
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\b(?!const|let|var|function)\w+[^}]*\}\s*,\s*\[\s*\]\s*\)/g,
    message: 'useEffect with empty dependency array may have missing dependencies.',
    suggestion: 'Include all values from component scope used inside the effect.',
    references: ['React useEffect', 'Rules of Hooks'],
    autoFixable: false,
  },
  {
    id: 'REACT005',
    name: 'Dangerous innerHTML',
    description: 'Detects dangerouslySetInnerHTML usage',
    category: 'security',
    severity: 'high',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
    message: 'dangerouslySetInnerHTML can lead to XSS vulnerabilities.',
    suggestion: 'Sanitize HTML with DOMPurify before using dangerouslySetInnerHTML.',
    references: ['React XSS', 'DOMPurify'],
    autoFixable: false,
  },

  // ============ TYPESCRIPT RULES ============
  {
    id: 'TS001',
    name: 'Explicit Any',
    description: 'Detects explicit any type',
    category: 'best-practice',
    severity: 'medium',
    pattern: /:\s*any\b/g,
    message: 'Avoid using explicit any type.',
    suggestion: 'Use unknown for truly unknown types, or define proper interfaces.',
    references: ['TypeScript any vs unknown'],
    autoFixable: false,
  },
  {
    id: 'TS002',
    name: 'Non-null Assertion',
    description: 'Detects non-null assertion operator',
    category: 'warning',
    severity: 'low',
    pattern: /\w+!/g,
    message: 'Non-null assertion (!) bypasses type checking.',
    suggestion: 'Use proper null checks or optional chaining instead.',
    references: ['TypeScript Non-null Assertion'],
    autoFixable: false,
  },
  {
    id: 'TS003',
    name: 'Type Assertion',
    description: 'Detects type assertions',
    category: 'warning',
    severity: 'info',
    pattern: /as\s+\w+(?:<[^>]+>)?(?!\s*\))/g,
    message: 'Type assertion detected. Prefer type guards when possible.',
    suggestion: 'Use type guards for runtime type checking.',
    references: ['TypeScript Type Guards'],
    autoFixable: false,
  },
];

/**
 * Runs all detection rules against the code
 * Includes language-specific rules for Kotlin, Swift, and more
 */
export function runAdvancedDetection(
  code: string,
  language: string
): { issues: CodeIssue[]; securityFindings: SecurityFinding[] } {
  const issues: CodeIssue[] = [];
  const securityFindings: SecurityFinding[] = [];
  const lines = code.split('\n');

  // Run language-specific detection first
  if (language === 'kotlin') {
    const kotlinResults = runKotlinDetection(code);
    issues.push(...kotlinResults.issues);
    securityFindings.push(...kotlinResults.securityFindings);
  }
  
  if (language === 'swift') {
    const swiftResults = runSwiftDetection(code);
    issues.push(...swiftResults.issues);
    securityFindings.push(...swiftResults.securityFindings);
  }

  // Run general detection rules
  for (const rule of DETECTION_RULES) {
    // Skip React rules for non-JS/TS
    if (rule.id.startsWith('REACT') && !['javascript', 'typescript'].includes(language)) {
      continue;
    }
    
    // Skip TS rules for non-TypeScript
    if (rule.id.startsWith('TS') && language !== 'typescript') {
      continue;
    }
    
    // Skip JS/TS specific rules for other languages
    if (['kotlin', 'swift', 'python', 'java', 'go', 'rust'].includes(language)) {
      // Skip rules that are very JS/TS specific
      if (['BP002', 'BP003', 'BP004', 'BP005', 'BP006'].includes(rule.id)) {
        continue;
      }
    }

    if (rule.pattern instanceof RegExp) {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        // Find line number
        const beforeMatch = code.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const column = match.index - beforeMatch.lastIndexOf('\n');

        const issue: CodeIssue = {
          id: `${rule.id}-${lineNumber}-${column}`,
          ruleId: rule.id,
          title: rule.name,
          description: rule.message,
          severity: rule.severity === 'critical' ? 'error' : 
                   rule.severity === 'high' ? 'error' :
                   rule.severity === 'medium' ? 'warning' : 'info',
          location: {
            line: lineNumber,
            column,
            endLine: lineNumber,
            endColumn: column + match[0].length,
            file: 'input',
          },
          category: rule.category as any,
          suggestion: rule.suggestion,
          autoFixable: rule.autoFixable,
          references: rule.references,
          codeSnippet: match[0],
        };

        issues.push(issue);

        // Add to security findings if security-related
        if (rule.category === 'security') {
          securityFindings.push({
            id: issue.id,
            type: rule.name,
            severity: rule.severity,
            vulnerability: rule.name,
            description: rule.message,
            location: {
              line: lineNumber,
              column,
            },
            cwe: rule.references.find(r => r.startsWith('CWE-')),
            owaspCategory: rule.references.find(r => r.startsWith('OWASP')),
            recommendation: rule.suggestion,
            references: rule.references,
          });
        }
      }
    }
  }

  // Sort by severity and line number
  const severityOrder = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    return sevDiff !== 0 ? sevDiff : (a.location?.line || 0) - (b.location?.line || 0);
  });

  return { issues, securityFindings };
}

/**
 * Applies auto-fixes to the code
 */
export function applyAutoFixes(code: string, issues: CodeIssue[]): string {
  let fixedCode = code;
  const fixableIssues = issues.filter(i => i.autoFixable);

  // Sort by position (reverse) to avoid offset issues
  fixableIssues.sort((a, b) => (b.location?.line || 0) - (a.location?.line || 0) || (b.location?.column || 0) - (a.location?.column || 0));

  for (const issue of fixableIssues) {
    const rule = DETECTION_RULES.find(r => r.id === issue.ruleId);
    if (rule?.fix && issue.codeSnippet) {
      const match = issue.codeSnippet.match(rule.pattern);
      if (match) {
        fixedCode = rule.fix(fixedCode, match);
      }
    }
  }

  return fixedCode;
}

/**
 * Gets fix suggestions for an issue
 */
export function getFixSuggestion(issue: Issue): string | null {
  const rule = DETECTION_RULES.find(r => r.id === issue.rule);
  return rule?.suggestion || null;
}

/**
 * Checks if code passes all critical rules
 */
export function passesSecurityAudit(code: string, language: string): {
  passed: boolean;
  criticalIssues: Issue[];
  score: number;
} {
  const { issues } = runAdvancedDetection(code, language);
  const criticalIssues = issues.filter(
    i => i.severity === 'error' && 
    DETECTION_RULES.find(r => r.id === i.rule)?.category === 'security'
  );

  // Calculate security score (100 - deductions)
  let score = 100;
  for (const issue of issues) {
    const rule = DETECTION_RULES.find(r => r.id === issue.rule);
    if (rule?.category === 'security') {
      switch (rule.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
  }

  return {
    passed: criticalIssues.length === 0,
    criticalIssues,
    score: Math.max(0, score),
  };
}


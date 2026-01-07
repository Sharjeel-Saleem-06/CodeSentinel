/**
 * Security Scanner - Phase 6: Security Analysis (SAST)
 * Pattern matching for OWASP Top 10 vulnerabilities
 * Maps findings to CWE IDs
 */

import type { 
  CodeIssue, 
  SecurityScanResult, 
  OWASPCoverage,
  SourceLocation,
  CWEReference,
  OWASPReference
} from '../../types/analysis';

// Security pattern definition
interface SecurityPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: CodeIssue['severity'];
  category: 'security';
  description: string;
  suggestion: string;
  cwe: CWEReference;
  owasp: OWASPReference;
}

// OWASP Top 10 2021 Security Patterns
const SECURITY_PATTERNS: SecurityPattern[] = [
  // A03:2021 - Injection
  {
    id: 'SEC001',
    name: 'SQL Injection Risk',
    pattern: /(?:query|sql|execute|exec)\s*(?:\(|=)\s*(?:["'`].*?\+|.*?\+\s*["'`]|\$\{)/gi,
    severity: 'critical',
    category: 'security',
    description: 'Potential SQL injection vulnerability detected. User input appears to be concatenated directly into a SQL query.',
    suggestion: 'Use parameterized queries or prepared statements instead of string concatenation.',
    cwe: { id: 'CWE-89', name: 'SQL Injection', url: 'https://cwe.mitre.org/data/definitions/89.html' },
    owasp: { id: 'A03', name: 'Injection', year: 2021 },
  },
  {
    id: 'SEC002',
    name: 'Command Injection Risk',
    pattern: /(?:exec|spawn|system|shell_exec|popen)\s*\(\s*(?:["'`].*?\+|.*?\+\s*["'`]|\$\{)/gi,
    severity: 'critical',
    category: 'security',
    description: 'Potential command injection vulnerability. User input may be executed as a system command.',
    suggestion: 'Sanitize and validate all user inputs. Use safe APIs that don\'t invoke shell commands.',
    cwe: { id: 'CWE-78', name: 'OS Command Injection', url: 'https://cwe.mitre.org/data/definitions/78.html' },
    owasp: { id: 'A03', name: 'Injection', year: 2021 },
  },
  {
    id: 'SEC003',
    name: 'XSS Vulnerability',
    pattern: /(?:innerHTML|outerHTML|document\.write)\s*(?:=|\()\s*(?:.*?\+|.*?\$\{)/gi,
    severity: 'high',
    category: 'security',
    description: 'Potential Cross-Site Scripting (XSS) vulnerability. Unsanitized data may be inserted into the DOM.',
    suggestion: 'Use textContent instead of innerHTML, or sanitize HTML with a library like DOMPurify.',
    cwe: { id: 'CWE-79', name: 'Cross-site Scripting (XSS)', url: 'https://cwe.mitre.org/data/definitions/79.html' },
    owasp: { id: 'A03', name: 'Injection', year: 2021 },
  },
  {
    id: 'SEC004',
    name: 'Eval Usage',
    pattern: /\beval\s*\(/gi,
    severity: 'critical',
    category: 'security',
    description: 'Use of eval() is extremely dangerous and can lead to code injection attacks.',
    suggestion: 'Avoid eval() entirely. Use JSON.parse() for JSON data or safer alternatives.',
    cwe: { id: 'CWE-95', name: 'Improper Neutralization of Directives in Dynamically Evaluated Code', url: 'https://cwe.mitre.org/data/definitions/95.html' },
    owasp: { id: 'A03', name: 'Injection', year: 2021 },
  },
  {
    id: 'SEC005',
    name: 'Function Constructor',
    pattern: /new\s+Function\s*\(/gi,
    severity: 'high',
    category: 'security',
    description: 'Using Function constructor is similar to eval() and poses security risks.',
    suggestion: 'Avoid dynamic code generation. Use predefined functions instead.',
    cwe: { id: 'CWE-95', name: 'Improper Neutralization of Directives in Dynamically Evaluated Code', url: 'https://cwe.mitre.org/data/definitions/95.html' },
    owasp: { id: 'A03', name: 'Injection', year: 2021 },
  },

  // A02:2021 - Cryptographic Failures
  {
    id: 'SEC010',
    name: 'Hardcoded Password',
    pattern: /(?:password|passwd|pwd|secret|apikey|api_key|token|auth)\s*(?:=|:)\s*["'`][^"'`]{3,}["'`]/gi,
    severity: 'critical',
    category: 'security',
    description: 'Hardcoded credential detected. Sensitive data should never be stored in source code.',
    suggestion: 'Use environment variables or a secure secrets management system.',
    cwe: { id: 'CWE-798', name: 'Use of Hard-coded Credentials', url: 'https://cwe.mitre.org/data/definitions/798.html' },
    owasp: { id: 'A02', name: 'Cryptographic Failures', year: 2021 },
  },
  {
    id: 'SEC011',
    name: 'Exposed API Key',
    pattern: /(?:sk[-_]|pk[-_]|api[-_]?key|apikey|access[-_]?token|bearer)\s*(?:=|:)\s*["'`][a-zA-Z0-9_-]{20,}["'`]/gi,
    severity: 'critical',
    category: 'security',
    description: 'Potential API key or access token exposed in source code.',
    suggestion: 'Store API keys in environment variables and add them to .gitignore.',
    cwe: { id: 'CWE-798', name: 'Use of Hard-coded Credentials', url: 'https://cwe.mitre.org/data/definitions/798.html' },
    owasp: { id: 'A02', name: 'Cryptographic Failures', year: 2021 },
  },
  {
    id: 'SEC012',
    name: 'Weak Cryptography (MD5)',
    pattern: /(?:md5|MD5)\s*\(/gi,
    severity: 'high',
    category: 'security',
    description: 'MD5 is cryptographically broken and should not be used for security purposes.',
    suggestion: 'Use SHA-256 or stronger algorithms for hashing. Use bcrypt or Argon2 for passwords.',
    cwe: { id: 'CWE-327', name: 'Use of a Broken or Risky Cryptographic Algorithm', url: 'https://cwe.mitre.org/data/definitions/327.html' },
    owasp: { id: 'A02', name: 'Cryptographic Failures', year: 2021 },
  },
  {
    id: 'SEC013',
    name: 'Weak Cryptography (SHA1)',
    pattern: /(?:sha1|SHA1)\s*\(/gi,
    severity: 'medium',
    category: 'security',
    description: 'SHA-1 is considered weak and should be avoided for security-critical operations.',
    suggestion: 'Use SHA-256 or SHA-3 for cryptographic operations.',
    cwe: { id: 'CWE-327', name: 'Use of a Broken or Risky Cryptographic Algorithm', url: 'https://cwe.mitre.org/data/definitions/327.html' },
    owasp: { id: 'A02', name: 'Cryptographic Failures', year: 2021 },
  },

  // A01:2021 - Broken Access Control
  {
    id: 'SEC020',
    name: 'Path Traversal Risk',
    pattern: /(?:readFile|writeFile|createReadStream|open)\s*\(\s*(?:.*?\+|.*?\$\{|req\.|request\.)/gi,
    severity: 'high',
    category: 'security',
    description: 'Potential path traversal vulnerability. User input may be used in file operations.',
    suggestion: 'Validate and sanitize file paths. Use path.resolve() and check against a whitelist.',
    cwe: { id: 'CWE-22', name: 'Path Traversal', url: 'https://cwe.mitre.org/data/definitions/22.html' },
    owasp: { id: 'A01', name: 'Broken Access Control', year: 2021 },
  },
  {
    id: 'SEC021',
    name: 'CORS Wildcard',
    pattern: /(?:Access-Control-Allow-Origin|cors)\s*(?:=|:)\s*["'`]\*["'`]/gi,
    severity: 'medium',
    category: 'security',
    description: 'CORS wildcard (*) allows any origin to access the resource.',
    suggestion: 'Specify allowed origins explicitly instead of using wildcard.',
    cwe: { id: 'CWE-942', name: 'Permissive Cross-domain Policy', url: 'https://cwe.mitre.org/data/definitions/942.html' },
    owasp: { id: 'A01', name: 'Broken Access Control', year: 2021 },
  },

  // A05:2021 - Security Misconfiguration
  {
    id: 'SEC030',
    name: 'Debug Mode Enabled',
    pattern: /(?:debug|DEBUG)\s*(?:=|:)\s*(?:true|1|["'`]true["'`])/gi,
    severity: 'medium',
    category: 'security',
    description: 'Debug mode appears to be enabled. This may expose sensitive information.',
    suggestion: 'Ensure debug mode is disabled in production environments.',
    cwe: { id: 'CWE-489', name: 'Active Debug Code', url: 'https://cwe.mitre.org/data/definitions/489.html' },
    owasp: { id: 'A05', name: 'Security Misconfiguration', year: 2021 },
  },
  {
    id: 'SEC031',
    name: 'Console Log in Production',
    pattern: /console\.(?:log|debug|info|warn|error)\s*\(/gi,
    severity: 'low',
    category: 'security',
    description: 'Console logging may expose sensitive information in production.',
    suggestion: 'Remove or disable console logs in production builds.',
    cwe: { id: 'CWE-532', name: 'Insertion of Sensitive Information into Log File', url: 'https://cwe.mitre.org/data/definitions/532.html' },
    owasp: { id: 'A09', name: 'Security Logging and Monitoring Failures', year: 2021 },
  },

  // A07:2021 - Identification and Authentication Failures
  {
    id: 'SEC040',
    name: 'Insecure Cookie',
    pattern: /(?:cookie|Cookie).*(?:httpOnly|secure)\s*(?:=|:)\s*false/gi,
    severity: 'high',
    category: 'security',
    description: 'Cookie security flags are disabled, making it vulnerable to attacks.',
    suggestion: 'Enable httpOnly and secure flags for cookies containing sensitive data.',
    cwe: { id: 'CWE-614', name: 'Sensitive Cookie in HTTPS Session Without Secure Attribute', url: 'https://cwe.mitre.org/data/definitions/614.html' },
    owasp: { id: 'A07', name: 'Identification and Authentication Failures', year: 2021 },
  },

  // A10:2021 - Server-Side Request Forgery (SSRF)
  {
    id: 'SEC050',
    name: 'SSRF Risk',
    pattern: /(?:fetch|axios|request|http\.get|https\.get)\s*\(\s*(?:.*?\+|.*?\$\{|req\.|request\.)/gi,
    severity: 'high',
    category: 'security',
    description: 'Potential Server-Side Request Forgery (SSRF) vulnerability.',
    suggestion: 'Validate and whitelist URLs before making requests. Block internal IP ranges.',
    cwe: { id: 'CWE-918', name: 'Server-Side Request Forgery (SSRF)', url: 'https://cwe.mitre.org/data/definitions/918.html' },
    owasp: { id: 'A10', name: 'Server-Side Request Forgery', year: 2021 },
  },

  // A08:2021 - Software and Data Integrity Failures
  {
    id: 'SEC060',
    name: 'Insecure Deserialization',
    pattern: /(?:JSON\.parse|deserialize|unserialize|pickle\.loads)\s*\(\s*(?:req\.|request\.|user|input)/gi,
    severity: 'high',
    category: 'security',
    description: 'Potential insecure deserialization of user-controlled data.',
    suggestion: 'Validate and sanitize data before deserialization. Use safe parsing methods.',
    cwe: { id: 'CWE-502', name: 'Deserialization of Untrusted Data', url: 'https://cwe.mitre.org/data/definitions/502.html' },
    owasp: { id: 'A08', name: 'Software and Data Integrity Failures', year: 2021 },
  },

  // Additional patterns
  {
    id: 'SEC070',
    name: 'Prototype Pollution Risk',
    pattern: /\[["'`]__proto__["'`]\]|\[["'`]constructor["'`]\]|\[["'`]prototype["'`]\]/gi,
    severity: 'high',
    category: 'security',
    description: 'Potential prototype pollution vulnerability detected.',
    suggestion: 'Use Object.create(null) for dictionaries or validate object keys.',
    cwe: { id: 'CWE-1321', name: 'Improperly Controlled Modification of Object Prototype Attributes', url: 'https://cwe.mitre.org/data/definitions/1321.html' },
    owasp: { id: 'A03', name: 'Injection', year: 2021 },
  },
  {
    id: 'SEC071',
    name: 'Regular Expression DoS',
    pattern: /new\s+RegExp\s*\(\s*(?:.*?\+|.*?\$\{|req\.|request\.|user|input)/gi,
    severity: 'medium',
    category: 'security',
    description: 'Dynamic regex creation with user input may lead to ReDoS attacks.',
    suggestion: 'Use static regex patterns or validate user input before creating RegExp.',
    cwe: { id: 'CWE-1333', name: 'Inefficient Regular Expression Complexity', url: 'https://cwe.mitre.org/data/definitions/1333.html' },
    owasp: { id: 'A03', name: 'Injection', year: 2021 },
  },
  {
    id: 'SEC072',
    name: 'Unsafe Redirect',
    pattern: /(?:redirect|location\.href|window\.location)\s*(?:=|\()\s*(?:req\.|request\.|user|input|\$\{)/gi,
    severity: 'medium',
    category: 'security',
    description: 'Potential open redirect vulnerability with user-controlled URL.',
    suggestion: 'Validate redirect URLs against a whitelist of allowed destinations.',
    cwe: { id: 'CWE-601', name: 'URL Redirection to Untrusted Site', url: 'https://cwe.mitre.org/data/definitions/601.html' },
    owasp: { id: 'A01', name: 'Broken Access Control', year: 2021 },
  },
];

/**
 * Find line number for a match in code
 */
function getLineNumber(code: string, index: number): SourceLocation {
  const lines = code.substring(0, index).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length;
  return { line, column };
}

/**
 * Extract code snippet around a match
 */
function extractSnippet(code: string, index: number, length: number): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(code.length, index + length + 20);
  let snippet = code.substring(start, end);
  
  if (start > 0) snippet = '...' + snippet;
  if (end < code.length) snippet = snippet + '...';
  
  return snippet.replace(/\n/g, ' ').trim();
}

/**
 * Scan code for security vulnerabilities
 */
export function scanSecurity(code: string): SecurityScanResult {
  const issues: CodeIssue[] = [];
  const owaspHits: Record<string, number> = {};

  // Initialize OWASP coverage tracking
  SECURITY_PATTERNS.forEach((pattern) => {
    owaspHits[pattern.owasp.id] = owaspHits[pattern.owasp.id] || 0;
  });

  // Scan for each pattern
  SECURITY_PATTERNS.forEach((secPattern) => {
    let match;
    const regex = new RegExp(secPattern.pattern.source, secPattern.pattern.flags);
    
    while ((match = regex.exec(code)) !== null) {
      const location = getLineNumber(code, match.index);
      const snippet = extractSnippet(code, match.index, match[0].length);
      
      issues.push({
        id: `${secPattern.id}-${match.index}`,
        title: secPattern.name,
        description: secPattern.description,
        severity: secPattern.severity,
        category: secPattern.category,
        location,
        codeSnippet: snippet,
        suggestion: secPattern.suggestion,
        cwe: secPattern.cwe,
        owasp: secPattern.owasp,
        ruleId: secPattern.id,
      });

      owaspHits[secPattern.owasp.id]++;
    }
  });

  // Calculate OWASP coverage
  const owaspCoverage: OWASPCoverage = {
    a01_broken_access_control: owaspHits['A01'] || 0,
    a02_cryptographic_failures: owaspHits['A02'] || 0,
    a03_injection: owaspHits['A03'] || 0,
    a04_insecure_design: owaspHits['A04'] || 0,
    a05_security_misconfiguration: owaspHits['A05'] || 0,
    a06_vulnerable_components: owaspHits['A06'] || 0,
    a07_auth_failures: owaspHits['A07'] || 0,
    a08_software_integrity: owaspHits['A08'] || 0,
    a09_logging_failures: owaspHits['A09'] || 0,
    a10_ssrf: owaspHits['A10'] || 0,
  };

  // Calculate risk score (0-100)
  const severityWeights: Record<string, number> = { critical: 25, high: 15, medium: 8, low: 3, info: 1, error: 25, warning: 8 };
  let riskScore = issues.reduce((score, issue) => {
    return score + (severityWeights[issue.severity] ?? 1);
  }, 0);
  riskScore = Math.min(100, riskScore);

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (owaspHits['A03'] > 0) {
    recommendations.push('Review and fix injection vulnerabilities immediately - they are critical security risks.');
  }
  if (owaspHits['A02'] > 0) {
    recommendations.push('Remove hardcoded credentials and use environment variables or a secrets manager.');
  }
  if (owaspHits['A01'] > 0) {
    recommendations.push('Implement proper access controls and validate all file paths.');
  }
  if (issues.length === 0) {
    recommendations.push('No security issues detected. Continue following security best practices.');
  }

  return {
    issues,
    owaspCoverage,
    riskScore,
    recommendations,
  };
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: CodeIssue['severity']): string {
  const colors: Record<string, string> = {
    critical: '#ff453a',
    high: '#ff9f0a',
    medium: '#ffd60a',
    low: '#0a84ff',
    info: '#00ffd5',
    error: '#ff453a',
    warning: '#ffd60a',
  };
  return colors[severity] ?? '#00ffd5';
}

/**
 * Get severity label
 */
export function getSeverityLabel(severity: CodeIssue['severity']): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}


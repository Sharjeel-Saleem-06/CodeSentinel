/**
 * Code Analyzer - Main orchestrator for the analysis pipeline
 * Coordinates all 8 phases of analysis with advanced detection
 */

import { parseCode } from './astParser';
import { runAdvancedDetection } from './advancedDetector';
import { detectLanguageAdvanced } from './languageDetector';
import { runSemanticAnalysis } from './semanticAnalyzer';
import { buildControlFlowGraph } from './cfgBuilder';
import { scanSecurity } from '../security/securityScanner';
import { calculateAllMetrics, calculateCyclomaticComplexity } from '../metrics/codeMetrics';
import { runCustomRules, loadCustomRules } from '../rules/customRulesEngine';
import type { 
  AnalysisResult, 
  Language, 
  AnalysisOptions,
  CodeIssue,
  ControlFlowGraph,
  CFGNode,
  CFGEdge,
} from '../../types/analysis';

// Simple ID generator
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
};

// Re-export for backward compatibility
export { detectLanguageAdvanced };

/**
 * Detect programming language from code content (backward compatible)
 */
export function detectLanguage(code: string, fileName?: string): Language {
  return detectLanguageAdvanced(code, fileName).language;
}


/**
 * Find code quality issues (bugs, style, etc.)
 */
function findQualityIssues(code: string, parseResult: ReturnType<typeof parseCode>): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = code.split('\n');

  // Check for unused variables
  parseResult.variables.forEach(variable => {
    if (variable.isUnused && variable.kind !== 'const') {
      issues.push({
        id: generateId(),
        title: 'Unused Variable',
        description: `Variable '${variable.name}' is declared but never used.`,
        severity: 'low',
        category: 'quality',
        location: variable.location,
        suggestion: `Remove the unused variable '${variable.name}' or use it in your code.`,
        ruleId: 'no-unused-vars',
      });
    }
  });

  // Check for long functions
  parseResult.functions.forEach(fn => {
    if (fn.linesOfCode > 50) {
      issues.push({
        id: generateId(),
        title: 'Function Too Long',
        description: `Function '${fn.name}' has ${fn.linesOfCode} lines. Consider breaking it into smaller functions.`,
        severity: 'medium',
        category: 'complexity',
        location: fn.location,
        suggestion: 'Extract related logic into separate, well-named helper functions.',
        ruleId: 'max-lines-per-function',
      });
    }

    // Check complexity per function
    const fnCode = lines.slice(fn.location.line - 1, (fn.location.endLine || fn.location.line + fn.linesOfCode)).join('\n');
    const complexity = calculateCyclomaticComplexity(fnCode);
    fn.complexity = complexity;

    if (complexity > 10) {
      issues.push({
        id: generateId(),
        title: 'High Cyclomatic Complexity',
        description: `Function '${fn.name}' has a cyclomatic complexity of ${complexity}. This makes it hard to test and maintain.`,
        severity: complexity > 20 ? 'high' : 'medium',
        category: 'complexity',
        location: fn.location,
        suggestion: 'Reduce complexity by extracting conditions into separate functions or using early returns.',
        ruleId: 'complexity',
      });
    }
  });

  // Check for console.log statements
  lines.forEach((line, index) => {
    if (/console\.(log|debug|info)\s*\(/.test(line)) {
      issues.push({
        id: generateId(),
        title: 'Console Statement',
        description: 'Console statements should be removed in production code.',
        severity: 'info',
        category: 'quality',
        location: { line: index + 1, column: line.indexOf('console') },
        codeSnippet: line.trim(),
        suggestion: 'Remove console statements or use a proper logging library.',
        ruleId: 'no-console',
      });
    }
  });

  // Check for TODO/FIXME comments
  lines.forEach((line, index) => {
    const todoMatch = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX):\s*(.*)/i);
    if (todoMatch) {
      issues.push({
        id: generateId(),
        title: `${todoMatch[1].toUpperCase()} Comment`,
        description: todoMatch[2] || 'No description provided',
        severity: 'info',
        category: 'quality',
        location: { line: index + 1, column: line.indexOf(todoMatch[0]) },
        codeSnippet: line.trim(),
        suggestion: 'Address this TODO item or create a ticket to track it.',
        ruleId: 'no-warning-comments',
      });
    }
  });

  // Check for magic numbers
  const magicNumberPattern = /(?<![a-zA-Z_$])\b(?!0|1|2|-1|100|1000)\d{2,}\b(?![a-zA-Z_$])/g;
  lines.forEach((line, index) => {
    // Skip comments and imports
    if (line.trim().startsWith('//') || line.trim().startsWith('import')) return;
    
    let match;
    while ((match = magicNumberPattern.exec(line)) !== null) {
      issues.push({
        id: generateId(),
        title: 'Magic Number',
        description: `Magic number ${match[0]} should be extracted to a named constant.`,
        severity: 'low',
        category: 'style',
        location: { line: index + 1, column: match.index },
        suggestion: `Extract ${match[0]} to a descriptively named constant.`,
        ruleId: 'no-magic-numbers',
      });
    }
  });

  // Check for == instead of ===
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//')) return;
    
    const eqMatch = line.match(/[^=!]==[^=]/);
    if (eqMatch) {
      issues.push({
        id: generateId(),
        title: 'Loose Equality',
        description: 'Use strict equality (===) instead of loose equality (==).',
        severity: 'low',
        category: 'bug',
        location: { line: index + 1, column: line.indexOf('==') },
        suggestion: 'Replace == with === for type-safe comparison.',
        ruleId: 'eqeqeq',
        fixable: true,
        fix: {
          description: 'Replace with strict equality',
          replacement: line.replace('==', '==='),
          range: { line: index + 1, column: 0 },
        },
      });
    }
  });

  // Check for var usage
  lines.forEach((line, index) => {
    if (/\bvar\s+\w+/.test(line) && !line.trim().startsWith('//')) {
      issues.push({
        id: generateId(),
        title: 'Avoid var',
        description: 'Use let or const instead of var for better scoping.',
        severity: 'low',
        category: 'style',
        location: { line: index + 1, column: line.indexOf('var') },
        suggestion: 'Replace var with let (if reassigned) or const (if not reassigned).',
        ruleId: 'no-var',
        fixable: true,
      });
    }
  });

  // Check for empty catch blocks
  const catchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
  let catchMatch;
  while ((catchMatch = catchPattern.exec(code)) !== null) {
    const lineNum = code.substring(0, catchMatch.index).split('\n').length;
    issues.push({
      id: generateId(),
      title: 'Empty Catch Block',
      description: 'Empty catch blocks silently swallow errors.',
      severity: 'medium',
      category: 'bug',
      location: { line: lineNum, column: 0 },
      suggestion: 'Handle the error or at least log it for debugging.',
      ruleId: 'no-empty-catch',
    });
  }

  return issues;
}

/**
 * Main analysis function - orchestrates all phases
 */
export async function analyzeCode(
  code: string,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  const startTime = performance.now();
  const id = generateId();

  try {
    // Phase 1 & 2: Lexical and Syntax Analysis (AST parsing)
    const language = options.language || detectLanguage(code);
    const parseResult = parseCode(code, language);

    // Phase 3 & 5: Semantic and Data Flow Analysis (via parseResult)
    // Already includes variable tracking, usage analysis

    // Phase 6: Security Analysis
    const security = options.enableSecurity !== false 
      ? scanSecurity(code) 
      : { issues: [], owaspCoverage: {} as any, riskScore: 0, recommendations: [] };

    // Phase 7: Code Metrics
    const metrics = options.enableMetrics !== false
      ? calculateAllMetrics(code, parseResult.functions)
      : {} as any;

    // Update metrics with class and import counts
    if (metrics) {
      metrics.classCount = parseResult.classes.length;
      metrics.importCount = parseResult.imports.length;
    }

    // Phase 4: Control Flow Analysis
    const controlFlowGraph = options.enableCFG !== false
      ? buildControlFlowGraph(code, language)
      : undefined;

    // Find quality issues
    const qualityIssues = findQualityIssues(code, parseResult);

    // Run advanced detection (latest standards 2024)
    const advancedDetection = runAdvancedDetection(code, language);
    
    // Run semantic analysis (SwiftUI, Kotlin architectural patterns)
    const semanticAnalysis = runSemanticAnalysis(code, language);
    
    // Run custom rules
    const customRuleMatches = runCustomRules(code, language);
    
    // Convert custom rule matches to CodeIssues
    const customRuleIssues: CodeIssue[] = customRuleMatches.map(match => ({
      id: `custom-${match.ruleId}-${match.line}`,
      title: match.ruleName,
      description: match.message,
      severity: match.severity === 'error' ? 'high' : match.severity === 'warning' ? 'medium' : 'low',
      category: 'custom' as any,
      location: { line: match.line, column: match.column },
      suggestion: match.suggestion,
      ruleId: match.ruleId,
    }));
    
    // Merge security findings from advanced detection
    const mergedSecurityFindings = [
      ...security.issues.map(issue => ({
        ...issue,
        id: issue.id || generateId(),
      })),
      ...advancedDetection.securityFindings.filter(
        finding => !security.issues.some(s => 
          s.location?.line === finding.location?.line && 
          s.vulnerability === finding.vulnerability
        )
      ),
    ];

    // Update security object with merged findings
    const enhancedSecurity = {
      ...security,
      issues: mergedSecurityFindings,
      riskScore: Math.min(100, security.riskScore + (advancedDetection.securityFindings.length * 5)),
    };

    // Combine all issues (avoiding duplicates)
    const existingLines = new Set<string>();
    const allIssues = [...security.issues, ...qualityIssues, ...customRuleIssues, ...semanticAnalysis.codeIssues];
    
    // Add advanced detection issues (avoiding duplicates)
    advancedDetection.issues.forEach(issue => {
      const line = issue.location?.line || 0;
      const key = `${line}-${issue.ruleId}`;
      if (!existingLines.has(key)) {
        existingLines.add(key);
        allIssues.push(issue);
      }
    });

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Apply max issues limit
    const issues = options.maxIssues 
      ? allIssues.slice(0, options.maxIssues) 
      : allIssues;

    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      id,
      timestamp: new Date(),
      language,
      status: 'complete',
      executionTimeMs,
      sourceCode: code,
      ast: parseResult.astTree,
      functions: parseResult.functions,
      classes: parseResult.classes,
      imports: parseResult.imports,
      variables: parseResult.variables,
      issues,
      controlFlowGraph,
      metrics,
      security: enhancedSecurity,
      securityFindings: mergedSecurityFindings,
    };
  } catch (error) {
    const executionTimeMs = Math.round(performance.now() - startTime);
    
    return {
      id,
      timestamp: new Date(),
      language: options.language || 'javascript',
      status: 'error',
      executionTimeMs,
      sourceCode: code,
      functions: [],
      classes: [],
      imports: [],
      variables: [],
      issues: [],
      metrics: {} as any,
      security: { issues: [], owaspCoverage: {} as any, riskScore: 0, recommendations: [] },
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get summary statistics from analysis result
 */
export function getAnalysisSummary(result: AnalysisResult) {
  const issueCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  result.issues.forEach(issue => {
    issueCounts[issue.severity]++;
  });

  return {
    totalIssues: result.issues.length,
    issueCounts,
    securityRisk: result.security.riskScore,
    maintainability: result.metrics?.maintainabilityIndex || 0,
    complexity: result.metrics?.cyclomaticComplexity || 0,
    linesOfCode: result.metrics?.codeLines || 0,
    functionCount: result.functions.length,
    classCount: result.classes.length,
  };
}


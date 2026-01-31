/**
 * Code Analyzer - Main orchestrator for the analysis pipeline
 * Coordinates all 8 phases of analysis with advanced detection
 * 
 * UPGRADED: Now includes AI-powered detection and language-aware filtering
 */

import { parseCode } from './astParser';
import { runAdvancedDetection } from './advancedDetector';
import { detectLanguageAdvanced } from './languageDetector';
import { runSemanticAnalysis } from './semanticAnalyzer';
import { buildControlFlowGraph } from './cfgBuilder';
import { scanSecurity } from '../security/securityScanner';
import { calculateAllMetrics, calculateCyclomaticComplexity } from '../metrics/codeMetrics';
import { runCustomRules } from '../rules/customRulesEngine';
import { aiDetector } from '../ai/aiDetector';
import { buildLanguageContext, type LanguageContext } from '../ai/languageContext';
import type { 
  AnalysisResult, 
  Language, 
  AnalysisOptions,
  CodeIssue,
  Severity,
  SecurityFinding,
} from '../../types/analysis';

// Languages that use === vs == (JavaScript/TypeScript only)
const STRICT_EQUALITY_LANGUAGES = ['javascript', 'typescript'];

// Languages that use var (JavaScript only - not Kotlin's val/var)
const VAR_LANGUAGES = ['javascript'];

// Languages where print/console is typically debug code (not CLI apps)
const CONSOLE_DEBUG_LANGUAGES = ['javascript', 'typescript'];

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
 * NOW LANGUAGE-AWARE: Only applies rules that make sense for the detected language
 */
function findQualityIssues(
  code: string, 
  parseResult: ReturnType<typeof parseCode>,
  language: Language,
  context?: LanguageContext
): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = code.split('\n');
  
  // Determine if this is a CLI application (print statements are expected)
  const isCliApp = context?.isCliApp || 
    (language === 'python' && /if\s+__name__\s*==\s*['"]__main__['"]/.test(code)) ||
    (language === 'python' && /argparse|click|typer/.test(code));

  // Check for unused variables (universal)
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

  // Check for long functions (universal)
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

  // Check for console.log statements - ONLY for JS/TS and NOT for CLI apps
  if (CONSOLE_DEBUG_LANGUAGES.includes(language) && !isCliApp) {
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
  }

  // Check for TODO/FIXME comments (universal)
  lines.forEach((line, index) => {
    const todoMatch = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX):\s*(.*)/i) ||
                      line.match(/#\s*(TODO|FIXME|HACK|XXX):\s*(.*)/i); // Python comments
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

  // Check for magic numbers - WITH CONTEXT AWARENESS
  // Skip for mobile languages where UI values are normal
  const skipMagicNumbersForUI = ['kotlin', 'swift', 'dart'].includes(language);
  
  if (!skipMagicNumbersForUI) {
    const magicNumberPattern = /(?<![a-zA-Z_$])\b(?!0|1|2|-1|100|1000)\d{2,}\b(?![a-zA-Z_$])/g;
    lines.forEach((line, index) => {
      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('import')) return;
      
      // Skip HTTP status codes and common numbers
      if (/\b(200|201|204|301|302|400|401|403|404|500|502|503)\b/.test(line)) return;
      
      // Skip port numbers
      if (/port|PORT|localhost:\d+/.test(line)) return;
      
      // Skip timeout/delay values
      if (/timeout|delay|interval|duration|ms\b|seconds/i.test(line)) return;
      
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
  }

  // Check for == instead of === - ONLY for JavaScript/TypeScript
  // CRITICAL: Kotlin and Python use == for value equality (correct!)
  if (STRICT_EQUALITY_LANGUAGES.includes(language)) {
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
  }

  // Check for var usage - ONLY for JavaScript (not Kotlin's val/var)
  if (VAR_LANGUAGES.includes(language)) {
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
  }

  // Check for empty catch blocks (universal - but pattern may vary by language)
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
 * Extended analysis options
 */
interface ExtendedAnalysisOptions extends AnalysisOptions {
  enableAIDetection?: boolean;      // Enable AI-powered detection (default: false for speed)
  enableAIValidation?: boolean;     // Enable AI false-positive validation (default: false)
  analysisDepth?: 'quick' | 'standard' | 'deep'; // Analysis depth level
}

/**
 * Main analysis function - orchestrates all phases
 * UPGRADED: Now includes language context building and optional AI detection
 */
export async function analyzeCode(
  code: string,
  options: ExtendedAnalysisOptions = {}
): Promise<AnalysisResult> {
  const startTime = performance.now();
  const id = generateId();

  try {
    // Phase 1 & 2: Lexical and Syntax Analysis (AST parsing)
    const language = options.language || detectLanguage(code);
    const parseResult = parseCode(code, language);
    
    // NEW: Build comprehensive language context for AI and rule filtering
    const languageContext = buildLanguageContext(code);
    console.log(`[Analysis] Language: ${language}, Frameworks: ${languageContext.frameworks.join(', ') || 'none'}, Type: ${languageContext.projectType || 'unknown'}`);

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

    // Find quality issues - NOW WITH LANGUAGE CONTEXT
    const qualityIssues = findQualityIssues(code, parseResult, language, languageContext);

    // Run advanced detection (latest standards 2024) - NOW WITH PROPER LANGUAGE FILTERING
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
          (s as unknown as SecurityFinding).vulnerability === finding.vulnerability
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
    let allIssues = [...security.issues, ...qualityIssues, ...customRuleIssues, ...semanticAnalysis.codeIssues];
    
    // Add advanced detection issues (avoiding duplicates)
    advancedDetection.issues.forEach(issue => {
      const line = issue.location?.line || 0;
      const key = `${line}-${issue.ruleId}`;
      if (!existingLines.has(key)) {
        existingLines.add(key);
        allIssues.push(issue);
      }
    });
    
    // NEW: Optional AI-powered false positive validation
    if (options.enableAIValidation && allIssues.length > 0) {
      try {
        console.log(`[Analysis] Running AI validation on ${allIssues.length} issues...`);
        allIssues = await aiDetector.validateIssues(allIssues, code, languageContext);
        console.log(`[Analysis] After AI validation: ${allIssues.length} issues remain`);
      } catch (error) {
        console.warn('[Analysis] AI validation failed, using original issues:', error);
      }
    }
    
    // NEW: Optional AI-powered detection for additional issues
    if (options.enableAIDetection) {
      try {
        console.log('[Analysis] Running AI detection...');
        const aiResult = await aiDetector.detectIssues(code, languageContext, allIssues);
        
        // Add AI-detected issues that aren't duplicates
        aiResult.issues.forEach(aiIssue => {
          const isDuplicate = allIssues.some(existing => 
            existing.location?.line === aiIssue.line &&
            existing.title.toLowerCase().includes(aiIssue.title.toLowerCase().split(' ')[0])
          );
          
          if (!isDuplicate && aiIssue.confidence >= 70) {
            allIssues.push({
              id: aiIssue.id,
              title: aiIssue.title,
              description: aiIssue.description,
              severity: aiIssue.severity,
              category: aiIssue.category as any,
              location: { line: aiIssue.line || 1, column: 0 },
              suggestion: aiIssue.suggestion,
              codeSnippet: aiIssue.codeExample,
              ruleId: `ai-${aiIssue.category}`,
            });
          }
        });
        
        // Add AI security findings
        aiResult.securityFindings.forEach(finding => {
          if (finding.confidence >= 80) {
            mergedSecurityFindings.push({
              id: generateId(),
              type: finding.type,
              severity: finding.severity,
              vulnerability: finding.type,
              description: finding.description,
              location: finding.line ? { line: finding.line, column: 0, file: 'input' } : undefined,
              cwe: finding.cwe,
              owaspCategory: finding.owasp,
              recommendation: finding.recommendation,
              references: [],
            });
          }
        });
        
        console.log(`[Analysis] AI detection added ${aiResult.issues.filter(i => i.confidence >= 70).length} issues`);
      } catch (error) {
        console.warn('[Analysis] AI detection failed:', error);
      }
    }

    // Sort by severity
    const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4, error: 0, warning: 2 };
    allIssues.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

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
      security: enhancedSecurity as AnalysisResult['security'],
      securityFindings: mergedSecurityFindings as SecurityFinding[],
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
    const sev = issue.severity as keyof typeof issueCounts;
    if (sev in issueCounts) {
      issueCounts[sev]++;
    }
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


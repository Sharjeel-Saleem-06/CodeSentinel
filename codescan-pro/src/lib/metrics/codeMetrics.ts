/**
 * Code Metrics Calculator - Phase 7: Code Metrics Calculation
 * Computes Cyclomatic Complexity, Halstead Metrics, Maintainability Index, etc.
 */

import type { 
  CodeMetrics, 
  HalsteadMetrics,
  FunctionInfo 
} from '../../types/analysis';

// JavaScript/TypeScript operators
const OPERATORS = new Set([
  '+', '-', '*', '/', '%', '**',
  '=', '+=', '-=', '*=', '/=', '%=', '**=',
  '==', '===', '!=', '!==', '<', '>', '<=', '>=',
  '&&', '||', '!', '??', '?.',
  '&', '|', '^', '~', '<<', '>>', '>>>',
  '++', '--',
  '?', ':',
  '.', ',', ';',
  '(', ')', '[', ']', '{', '}',
  '=>', '...',
  'typeof', 'instanceof', 'in', 'delete', 'void', 'new',
  'if', 'else', 'switch', 'case', 'default',
  'for', 'while', 'do', 'break', 'continue',
  'try', 'catch', 'finally', 'throw',
  'return', 'yield', 'await',
  'function', 'class', 'const', 'let', 'var',
  'import', 'export', 'from', 'as',
]);

// Reserved keywords (not operators)
const KEYWORDS = new Set([
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  'this', 'super', 'arguments',
]);

/**
 * Count lines of code (total, code, comments, blank)
 */
export function countLines(code: string): { total: number; code: number; comments: number; blank: number } {
  const lines = code.split('\n');
  let total = lines.length;
  let blank = 0;
  let comments = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      blank++;
      continue;
    }

    // Check for block comment start/end
    if (inBlockComment) {
      comments++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*')) {
      comments++;
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }

    if (trimmed.startsWith('//')) {
      comments++;
      continue;
    }
  }

  return {
    total,
    code: total - blank - comments,
    comments,
    blank,
  };
}

/**
 * Calculate Cyclomatic Complexity (McCabe)
 * CC = E - N + 2P where E=edges, N=nodes, P=connected components
 * Simplified: CC = 1 + number of decision points
 */
export function calculateCyclomaticComplexity(code: string): number {
  let complexity = 1; // Base complexity

  // Decision points that increase complexity
  const decisionPatterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bdo\s*\{/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /\?\s*[^:]/g,  // Ternary operator
    /&&/g,
    /\|\|/g,
    /\?\?/g,  // Nullish coalescing
  ];

  for (const pattern of decisionPatterns) {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

/**
 * Calculate Cognitive Complexity
 * More nuanced than cyclomatic - penalizes nested structures more
 */
export function calculateCognitiveComplexity(code: string): number {
  let complexity = 0;
  let nestingLevel = 0;
  const lines = code.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Track nesting
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    
    // Structural complexity (adds 1 + nesting level)
    if (/\b(if|else\s+if|for|while|do|switch|catch)\b/.test(trimmed)) {
      complexity += 1 + nestingLevel;
    }
    
    // Fundamental complexity (adds 1 regardless of nesting)
    if (/\belse\b(?!\s+if)/.test(trimmed)) complexity += 1;
    if (/\?\s*[^:]/.test(trimmed)) complexity += 1; // Ternary
    if (/&&|\|\||\?\?/.test(trimmed)) complexity += 1; // Logical operators
    
    // Recursion (high penalty)
    // Would need AST analysis to detect properly
    
    // Update nesting level
    nestingLevel += openBraces - closeBraces;
    nestingLevel = Math.max(0, nestingLevel);
  }

  return complexity;
}

/**
 * Calculate Halstead Metrics
 */
export function calculateHalsteadMetrics(code: string): HalsteadMetrics {
  // Tokenize the code (simplified)
  const tokens = tokenize(code);
  
  const operators = new Map<string, number>();
  const operands = new Map<string, number>();

  for (const token of tokens) {
    if (OPERATORS.has(token) || /^[+\-*/%=<>!&|^~?:.,;(){}\[\]]$/.test(token)) {
      operators.set(token, (operators.get(token) || 0) + 1);
    } else if (!KEYWORDS.has(token) && token.length > 0) {
      operands.set(token, (operands.get(token) || 0) + 1);
    }
  }

  const n1 = operators.size;      // Distinct operators
  const n2 = operands.size;       // Distinct operands
  const N1 = Array.from(operators.values()).reduce((a, b) => a + b, 0); // Total operators
  const N2 = Array.from(operands.values()).reduce((a, b) => a + b, 0); // Total operands

  const vocabulary = n1 + n2;
  const length = N1 + N2;
  const volume = length > 0 && vocabulary > 0 ? length * Math.log2(vocabulary) : 0;
  const difficulty = n2 > 0 ? (n1 / 2) * (N2 / n2) : 0;
  const effort = difficulty * volume;
  const time = effort / 18; // Seconds
  const bugs = volume / 3000; // Estimated bugs

  return {
    operators: n1,
    operands: n2,
    totalOperators: N1,
    totalOperands: N2,
    vocabulary,
    length,
    volume: Math.round(volume * 100) / 100,
    difficulty: Math.round(difficulty * 100) / 100,
    effort: Math.round(effort * 100) / 100,
    time: Math.round(time * 100) / 100,
    bugs: Math.round(bugs * 1000) / 1000,
  };
}

/**
 * Simple tokenizer for Halstead metrics
 */
function tokenize(code: string): string[] {
  // Remove comments
  code = code.replace(/\/\/.*$/gm, '');
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove strings (to avoid counting string contents)
  code = code.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  code = code.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  code = code.replace(/`(?:[^`\\]|\\.)*`/g, '``');

  // Tokenize
  const tokenPattern = /\b\w+\b|[+\-*/%=<>!&|^~?:.,;(){}\[\]]/g;
  return code.match(tokenPattern) || [];
}

/**
 * Calculate Maintainability Index
 * MI = 171 - 5.2 * ln(V) - 0.23 * CC - 16.2 * ln(LOC)
 * Normalized to 0-100 scale
 */
export function calculateMaintainabilityIndex(
  volume: number,
  cyclomaticComplexity: number,
  linesOfCode: number,
  commentPercentage: number
): number {
  if (linesOfCode === 0 || volume === 0) return 100;

  // Original formula
  let mi = 171 
    - 5.2 * Math.log(volume) 
    - 0.23 * cyclomaticComplexity 
    - 16.2 * Math.log(linesOfCode);

  // Bonus for comments (optional)
  mi += 50 * Math.sin(Math.sqrt(2.4 * commentPercentage));

  // Normalize to 0-100
  mi = Math.max(0, Math.min(100, mi * 100 / 171));

  return Math.round(mi * 10) / 10;
}

/**
 * Calculate maximum nesting depth
 */
export function calculateMaxNestingDepth(code: string): number {
  let maxDepth = 0;
  let currentDepth = 0;

  for (const char of code) {
    if (char === '{') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === '}') {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  }

  return maxDepth;
}

/**
 * Detect code duplication (simplified)
 * Returns percentage of duplicated lines
 */
export function detectDuplication(code: string): number {
  const lines = code.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 10); // Only consider substantial lines

  if (lines.length === 0) return 0;

  const lineCount = new Map<string, number>();
  for (const line of lines) {
    lineCount.set(line, (lineCount.get(line) || 0) + 1);
  }

  let duplicatedLines = 0;
  for (const [, count] of lineCount) {
    if (count > 1) {
      duplicatedLines += count - 1;
    }
  }

  return Math.round((duplicatedLines / lines.length) * 100 * 10) / 10;
}

/**
 * Calculate all code metrics
 */
export function calculateAllMetrics(code: string, functions: FunctionInfo[]): CodeMetrics {
  const lineStats = countLines(code);
  const cyclomaticComplexity = calculateCyclomaticComplexity(code);
  const cognitiveComplexity = calculateCognitiveComplexity(code);
  const halstead = calculateHalsteadMetrics(code);
  
  const commentPercentage = lineStats.total > 0 
    ? (lineStats.comments / lineStats.total) * 100 
    : 0;
  
  const maintainabilityIndex = calculateMaintainabilityIndex(
    halstead.volume,
    cyclomaticComplexity,
    lineStats.code,
    commentPercentage
  );

  const maxNestingDepth = calculateMaxNestingDepth(code);
  const duplicateCodePercentage = detectDuplication(code);

  // Calculate average function length
  const averageFunctionLength = functions.length > 0
    ? functions.reduce((sum, fn) => sum + fn.linesOfCode, 0) / functions.length
    : 0;

  return {
    totalLines: lineStats.total,
    codeLines: lineStats.code,
    commentLines: lineStats.comments,
    blankLines: lineStats.blank,
    cyclomaticComplexity,
    cognitiveComplexity,
    halstead,
    maintainabilityIndex,
    maxNestingDepth,
    averageFunctionLength: Math.round(averageFunctionLength * 10) / 10,
    duplicateCodePercentage,
    functionCount: functions.length,
    classCount: 0, // Will be set by caller
    importCount: 0, // Will be set by caller
  };
}

/**
 * Get metric rating (A-F grade)
 */
export function getMetricGrade(value: number, metric: string): string {
  const thresholds: Record<string, number[]> = {
    maintainabilityIndex: [80, 60, 40, 20], // Higher is better
    cyclomaticComplexity: [5, 10, 20, 30],  // Lower is better
    cognitiveComplexity: [5, 15, 25, 35],   // Lower is better
    maxNestingDepth: [3, 5, 7, 10],         // Lower is better
    duplicateCodePercentage: [5, 10, 20, 30], // Lower is better
  };

  const grades = ['A', 'B', 'C', 'D', 'F'];
  const bounds = thresholds[metric];

  if (!bounds) return 'N/A';

  // For maintainability (higher is better)
  if (metric === 'maintainabilityIndex') {
    for (let i = 0; i < bounds.length; i++) {
      if (value >= bounds[i]) return grades[i];
    }
    return 'F';
  }

  // For other metrics (lower is better)
  for (let i = 0; i < bounds.length; i++) {
    if (value <= bounds[i]) return grades[i];
  }
  return 'F';
}

/**
 * Get color for metric grade
 */
export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A': '#32d74b',
    'B': '#00ffd5',
    'C': '#ffd60a',
    'D': '#ff9f0a',
    'F': '#ff453a',
    'N/A': '#8592ab',
  };
  return colors[grade] || colors['N/A'];
}


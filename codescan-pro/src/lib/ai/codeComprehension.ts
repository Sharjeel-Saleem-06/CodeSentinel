/**
 * Advanced Code Comprehension System
 * Deep analysis of code purpose, patterns, architecture, and intent
 * Provides rich context for AI-powered optimization
 */

import type { AnalysisResult, FunctionInfo, ClassInfo, ImportInfo } from '../../types/analysis';

// Code Purpose Categories
export type CodePurpose = 
  | 'api-endpoint'
  | 'data-processing'
  | 'authentication'
  | 'database-operation'
  | 'file-handling'
  | 'ui-component'
  | 'utility-function'
  | 'business-logic'
  | 'validation'
  | 'error-handling'
  | 'configuration'
  | 'testing'
  | 'middleware'
  | 'state-management'
  | 'event-handling'
  | 'unknown';

// Design Patterns
export type DesignPattern =
  | 'singleton'
  | 'factory'
  | 'observer'
  | 'strategy'
  | 'decorator'
  | 'adapter'
  | 'facade'
  | 'repository'
  | 'service'
  | 'controller'
  | 'module'
  | 'hook'
  | 'hoc'
  | 'render-props'
  | 'compound-component'
  | 'none';

// Architecture Layer
export type ArchitectureLayer =
  | 'presentation'
  | 'business'
  | 'data-access'
  | 'infrastructure'
  | 'cross-cutting';

// Code Comprehension Result
export interface CodeComprehension {
  // High-level understanding
  purpose: CodePurpose;
  purposeConfidence: number;
  summary: string;
  
  // Architecture
  layer: ArchitectureLayer;
  patterns: DesignPattern[];
  
  // Dependencies & Data Flow
  externalDependencies: string[];
  internalDependencies: string[];
  dataFlow: DataFlowAnalysis;
  
  // Code Quality Indicators
  qualityIndicators: QualityIndicators;
  
  // Semantic Understanding
  semanticAnalysis: SemanticAnalysis;
  
  // Optimization Opportunities
  optimizationOpportunities: OptimizationOpportunity[];
  
  // Context for AI
  aiContext: AIContext;
}

export interface DataFlowAnalysis {
  inputs: { name: string; type: string; source: string }[];
  outputs: { name: string; type: string; destination: string }[];
  transformations: string[];
  sideEffects: string[];
  stateModifications: string[];
}

export interface QualityIndicators {
  readability: number; // 0-100
  maintainability: number; // 0-100
  testability: number; // 0-100
  reusability: number; // 0-100
  securityScore: number; // 0-100
  performanceScore: number; // 0-100
}

export interface SemanticAnalysis {
  mainConcepts: string[];
  businessDomain: string;
  technicalDomain: string;
  keyOperations: string[];
  errorScenarios: string[];
  edgeCases: string[];
}

export interface OptimizationOpportunity {
  type: 'security' | 'performance' | 'readability' | 'maintainability' | 'best-practice';
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  suggestion: string;
  codeExample?: string;
}

export interface AIContext {
  codeIntent: string;
  expectedBehavior: string;
  constraints: string[];
  assumptions: string[];
  criticalPaths: string[];
  securityRequirements: string[];
  performanceRequirements: string[];
}

/**
 * Detect the primary purpose of the code
 */
function detectPurpose(code: string, functions: FunctionInfo[], _classes: ClassInfo[], imports: ImportInfo[]): { purpose: CodePurpose; confidence: number } {
  const patterns: { pattern: RegExp; purpose: CodePurpose; weight: number }[] = [
    // API/HTTP
    { pattern: /\b(fetch|axios|http|request|response|req|res|get|post|put|delete|patch)\b/gi, purpose: 'api-endpoint', weight: 3 },
    { pattern: /\b(router|route|endpoint|api|rest|graphql)\b/gi, purpose: 'api-endpoint', weight: 2 },
    
    // Authentication
    { pattern: /\b(auth|login|logout|session|token|jwt|password|credential|user|oauth)\b/gi, purpose: 'authentication', weight: 3 },
    { pattern: /\b(bcrypt|hash|encrypt|decrypt|verify)\b/gi, purpose: 'authentication', weight: 2 },
    
    // Database
    { pattern: /\b(query|select|insert|update|delete|from|where|join|table|database|db|sql|mongo|prisma|sequelize)\b/gi, purpose: 'database-operation', weight: 3 },
    { pattern: /\b(find|findOne|findMany|create|save|remove)\b/gi, purpose: 'database-operation', weight: 2 },
    
    // File handling
    { pattern: /\b(file|fs|path|read|write|stream|buffer|upload|download)\b/gi, purpose: 'file-handling', weight: 3 },
    
    // UI Component
    { pattern: /\b(useState|useEffect|useContext|useMemo|useCallback|useRef|render|component|props|state)\b/gi, purpose: 'ui-component', weight: 3 },
    { pattern: /\b(jsx|tsx|html|css|style|className|onClick|onChange)\b/gi, purpose: 'ui-component', weight: 2 },
    
    // Data Processing
    { pattern: /\b(map|filter|reduce|sort|transform|parse|serialize|convert|process)\b/gi, purpose: 'data-processing', weight: 2 },
    { pattern: /\b(data|array|list|collection|item|element)\b/gi, purpose: 'data-processing', weight: 1 },
    
    // Validation
    { pattern: /\b(validate|validator|schema|check|verify|ensure|assert|sanitize)\b/gi, purpose: 'validation', weight: 3 },
    { pattern: /\b(required|optional|min|max|length|pattern|regex)\b/gi, purpose: 'validation', weight: 2 },
    
    // Error Handling
    { pattern: /\b(error|exception|throw|catch|try|finally|reject|fail)\b/gi, purpose: 'error-handling', weight: 2 },
    
    // Configuration
    { pattern: /\b(config|configuration|settings|options|env|environment)\b/gi, purpose: 'configuration', weight: 3 },
    
    // Testing
    { pattern: /\b(test|spec|describe|it|expect|assert|mock|stub|spy|jest|mocha)\b/gi, purpose: 'testing', weight: 4 },
    
    // Middleware
    { pattern: /\b(middleware|next|use|app\.use)\b/gi, purpose: 'middleware', weight: 3 },
    
    // State Management
    { pattern: /\b(store|dispatch|action|reducer|state|zustand|redux|mobx|recoil)\b/gi, purpose: 'state-management', weight: 3 },
    
    // Event Handling
    { pattern: /\b(event|emit|on|off|listener|subscribe|publish|handler)\b/gi, purpose: 'event-handling', weight: 2 },
  ];

  const scores: Record<CodePurpose, number> = {} as Record<CodePurpose, number>;
  
  for (const { pattern, purpose, weight } of patterns) {
    const matches = code.match(pattern) || [];
    scores[purpose] = (scores[purpose] || 0) + matches.length * weight;
  }

  // Check function names for additional context
  for (const fn of functions) {
    const name = fn.name.toLowerCase();
    if (name.includes('handle') || name.includes('on')) scores['event-handling'] = (scores['event-handling'] || 0) + 2;
    if (name.includes('fetch') || name.includes('get') || name.includes('post')) scores['api-endpoint'] = (scores['api-endpoint'] || 0) + 2;
    if (name.includes('validate') || name.includes('check')) scores['validation'] = (scores['validation'] || 0) + 2;
    if (name.includes('render') || name.includes('component')) scores['ui-component'] = (scores['ui-component'] || 0) + 2;
    if (name.includes('calculate') || name.includes('compute') || name.includes('process')) scores['data-processing'] = (scores['data-processing'] || 0) + 2;
  }

  // Check imports
  for (const imp of imports) {
    const source = imp.source.toLowerCase();
    if (source.includes('react')) scores['ui-component'] = (scores['ui-component'] || 0) + 5;
    if (source.includes('express') || source.includes('fastify') || source.includes('koa')) scores['api-endpoint'] = (scores['api-endpoint'] || 0) + 5;
    if (source.includes('prisma') || source.includes('mongoose') || source.includes('typeorm')) scores['database-operation'] = (scores['database-operation'] || 0) + 5;
    if (source.includes('zod') || source.includes('joi') || source.includes('yup')) scores['validation'] = (scores['validation'] || 0) + 5;
  }

  const sortedPurposes = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedPurposes.length === 0) {
    return { purpose: 'utility-function', confidence: 0.5 };
  }

  const topPurpose = sortedPurposes[0];
  const totalScore = sortedPurposes.reduce((sum, [_, score]) => sum + score, 0);
  const confidence = Math.min(topPurpose[1] / totalScore + 0.3, 1);

  return { purpose: topPurpose[0] as CodePurpose, confidence };
}

/**
 * Detect design patterns in the code
 */
function detectPatterns(code: string, classes: ClassInfo[], _functions: FunctionInfo[]): DesignPattern[] {
  const patterns: DesignPattern[] = [];

  // Singleton
  if (/private\s+(static\s+)?instance|getInstance\s*\(|new\s+\w+\s*\(\s*\).*instance/i.test(code)) {
    patterns.push('singleton');
  }

  // Factory
  if (/create\w+|factory|make\w+/i.test(code) && /return\s+new\s+\w+/i.test(code)) {
    patterns.push('factory');
  }

  // Observer/Event
  if (/subscribe|unsubscribe|notify|observer|listener|emit|on\(/i.test(code)) {
    patterns.push('observer');
  }

  // Strategy
  if (/strategy|algorithm|setStrategy|execute/i.test(code)) {
    patterns.push('strategy');
  }

  // Repository
  if (/repository|findById|findAll|save|delete|update/i.test(code) && classes.some(c => c.name.toLowerCase().includes('repository'))) {
    patterns.push('repository');
  }

  // Service
  if (classes.some(c => c.name.toLowerCase().includes('service'))) {
    patterns.push('service');
  }

  // Controller
  if (classes.some(c => c.name.toLowerCase().includes('controller')) || /req,\s*res|request,\s*response/i.test(code)) {
    patterns.push('controller');
  }

  // React Hooks
  if (/use[A-Z]\w*\s*=\s*\(|function\s+use[A-Z]/i.test(code)) {
    patterns.push('hook');
  }

  // HOC
  if (/with[A-Z]\w*\s*=|export\s+default\s+with[A-Z]/i.test(code)) {
    patterns.push('hoc');
  }

  // Module pattern
  if (/export\s+(const|function|class)|module\.exports/i.test(code)) {
    patterns.push('module');
  }

  return patterns.length > 0 ? patterns : ['none'];
}

/**
 * Determine architecture layer
 */
function detectArchitectureLayer(purpose: CodePurpose, patterns: DesignPattern[]): ArchitectureLayer {
  if (purpose === 'ui-component' || patterns.includes('hook') || patterns.includes('hoc')) {
    return 'presentation';
  }
  if (purpose === 'database-operation' || patterns.includes('repository')) {
    return 'data-access';
  }
  if (purpose === 'business-logic' || patterns.includes('service') || purpose === 'validation') {
    return 'business';
  }
  if (purpose === 'configuration' || purpose === 'middleware' || purpose === 'error-handling') {
    return 'cross-cutting';
  }
  return 'infrastructure';
}

/**
 * Analyze data flow
 */
function analyzeDataFlow(code: string, functions: FunctionInfo[]): DataFlowAnalysis {
  const inputs: DataFlowAnalysis['inputs'] = [];
  const outputs: DataFlowAnalysis['outputs'] = [];
  const transformations: string[] = [];
  const sideEffects: string[] = [];
  const stateModifications: string[] = [];

  // Detect inputs (parameters, external data)
  for (const fn of functions) {
    for (const param of fn.parameters) {
      inputs.push({
        name: param.name,
        type: param.type || 'unknown',
        source: `function parameter: ${fn.name}`,
      });
    }
  }

  // Detect fetch/API inputs
  if (/fetch\(|axios\.|http\./i.test(code)) {
    inputs.push({ name: 'apiData', type: 'Promise<Response>', source: 'HTTP request' });
  }

  // Detect file inputs
  if (/readFile|createReadStream/i.test(code)) {
    inputs.push({ name: 'fileData', type: 'Buffer | string', source: 'File system' });
  }

  // Detect outputs
  if (/return\s+/i.test(code)) {
    outputs.push({ name: 'returnValue', type: 'inferred', destination: 'caller' });
  }
  if (/res\.(json|send|render)/i.test(code)) {
    outputs.push({ name: 'httpResponse', type: 'Response', destination: 'HTTP client' });
  }
  if (/writeFile|createWriteStream/i.test(code)) {
    outputs.push({ name: 'fileOutput', type: 'void', destination: 'File system' });
  }

  // Detect transformations
  if (/\.map\s*\(/i.test(code)) transformations.push('Array mapping');
  if (/\.filter\s*\(/i.test(code)) transformations.push('Array filtering');
  if (/\.reduce\s*\(/i.test(code)) transformations.push('Array reduction');
  if (/JSON\.parse|JSON\.stringify/i.test(code)) transformations.push('JSON serialization');
  if (/parseInt|parseFloat|Number\(|String\(/i.test(code)) transformations.push('Type conversion');

  // Detect side effects
  if (/console\.(log|warn|error)/i.test(code)) sideEffects.push('Console logging');
  if (/localStorage|sessionStorage/i.test(code)) sideEffects.push('Browser storage');
  if (/document\.|window\./i.test(code)) sideEffects.push('DOM manipulation');
  if (/fetch\(|axios\./i.test(code)) sideEffects.push('Network request');

  // Detect state modifications
  if (/setState|set[A-Z]\w*\(/i.test(code)) stateModifications.push('React state update');
  if (/this\.\w+\s*=/i.test(code)) stateModifications.push('Instance property mutation');
  if (/\.push\(|\.pop\(|\.splice\(/i.test(code)) stateModifications.push('Array mutation');

  return { inputs, outputs, transformations, sideEffects, stateModifications };
}

/**
 * Calculate quality indicators
 */
function calculateQualityIndicators(code: string, result: AnalysisResult): QualityIndicators {
  const lines = code.split('\n');
  const totalLines = lines.length;
  
  // Readability (based on line length, nesting, naming)
  const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / totalLines;
  const longLines = lines.filter(l => l.length > 100).length;
  const readability = Math.max(0, 100 - (avgLineLength > 80 ? 20 : 0) - (longLines * 2) - (result.metrics?.maxNestingDepth || 0) * 5);

  // Maintainability (from metrics)
  const maintainability = result.metrics?.maintainabilityIndex || 50;

  // Testability (based on function size, dependencies, side effects)
  const avgFunctionSize = result.functions.length > 0 
    ? result.functions.reduce((sum, f) => sum + f.linesOfCode, 0) / result.functions.length 
    : 0;
  const testability = Math.max(0, 100 - (avgFunctionSize > 30 ? 30 : avgFunctionSize) - result.imports.length * 2);

  // Reusability (based on parameters, exports, modularity)
  const hasExports = /export\s+(default\s+)?/i.test(code);
  const hasParams = result.functions.some(f => f.parameters.length > 0);
  const reusability = (hasExports ? 40 : 0) + (hasParams ? 30 : 0) + (result.functions.length > 1 ? 30 : 15);

  // Security score (inverse of risk)
  const securityScore = Math.max(0, 100 - result.security.riskScore);

  // Performance score (based on complexity and patterns)
  const complexity = result.metrics?.cyclomaticComplexity || 0;
  const hasNestedLoops = /for\s*\([^)]*\)[^}]*for\s*\(/i.test(code);
  const performanceScore = Math.max(0, 100 - complexity * 3 - (hasNestedLoops ? 30 : 0));

  return {
    readability: Math.round(Math.min(100, Math.max(0, readability))),
    maintainability: Math.round(Math.min(100, Math.max(0, maintainability))),
    testability: Math.round(Math.min(100, Math.max(0, testability))),
    reusability: Math.round(Math.min(100, Math.max(0, reusability))),
    securityScore: Math.round(Math.min(100, Math.max(0, securityScore))),
    performanceScore: Math.round(Math.min(100, Math.max(0, performanceScore))),
  };
}

/**
 * Perform semantic analysis
 */
function performSemanticAnalysis(code: string, purpose: CodePurpose, functions: FunctionInfo[]): SemanticAnalysis {
  const mainConcepts: string[] = [];
  const keyOperations: string[] = [];
  const errorScenarios: string[] = [];
  const edgeCases: string[] = [];

  // Extract main concepts from identifiers
  const identifiers = code.match(/\b[a-z][a-zA-Z0-9]*\b/g) || [];
  const conceptCounts = new Map<string, number>();
  for (const id of identifiers) {
    if (id.length > 3) {
      conceptCounts.set(id, (conceptCounts.get(id) || 0) + 1);
    }
  }
  mainConcepts.push(...[...conceptCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([concept]) => concept));

  // Determine business domain
  let businessDomain = 'general';
  if (/user|customer|account|profile/i.test(code)) businessDomain = 'user-management';
  else if (/order|cart|product|payment/i.test(code)) businessDomain = 'e-commerce';
  else if (/post|comment|like|share|feed/i.test(code)) businessDomain = 'social-media';
  else if (/file|document|upload|download/i.test(code)) businessDomain = 'file-management';
  else if (/message|chat|notification/i.test(code)) businessDomain = 'communication';

  // Determine technical domain
  let technicalDomain = 'general';
  if (purpose === 'ui-component') technicalDomain = 'frontend';
  else if (purpose === 'api-endpoint' || purpose === 'database-operation') technicalDomain = 'backend';
  else if (purpose === 'data-processing') technicalDomain = 'data-engineering';

  // Extract key operations from function names
  for (const fn of functions) {
    const name = fn.name;
    if (/^(get|fetch|load|read)/i.test(name)) keyOperations.push(`Read: ${name}`);
    else if (/^(set|save|write|update|create)/i.test(name)) keyOperations.push(`Write: ${name}`);
    else if (/^(delete|remove|clear)/i.test(name)) keyOperations.push(`Delete: ${name}`);
    else if (/^(validate|check|verify)/i.test(name)) keyOperations.push(`Validate: ${name}`);
    else if (/^(transform|convert|parse|format)/i.test(name)) keyOperations.push(`Transform: ${name}`);
    else if (/^(handle|on|process)/i.test(name)) keyOperations.push(`Handle: ${name}`);
  }

  // Identify error scenarios
  if (/null|undefined/i.test(code)) errorScenarios.push('Null/undefined values');
  if (/fetch|axios|http/i.test(code)) errorScenarios.push('Network failures');
  if (/parse|JSON/i.test(code)) errorScenarios.push('Invalid data format');
  if (/auth|login|token/i.test(code)) errorScenarios.push('Authentication failures');
  if (/file|fs/i.test(code)) errorScenarios.push('File system errors');

  // Identify edge cases
  if (/length|size|count/i.test(code)) edgeCases.push('Empty collections');
  if (/\[\d+\]|index/i.test(code)) edgeCases.push('Out of bounds access');
  if (/parseInt|parseFloat|Number/i.test(code)) edgeCases.push('Invalid number formats');
  if (/\.split\(|\.slice\(/i.test(code)) edgeCases.push('Empty strings');
  if (/async|await|Promise/i.test(code)) edgeCases.push('Concurrent operations');

  return {
    mainConcepts,
    businessDomain,
    technicalDomain,
    keyOperations,
    errorScenarios,
    edgeCases,
  };
}

/**
 * Identify optimization opportunities
 */
function identifyOptimizationOpportunities(
  code: string,
  result: AnalysisResult,
  quality: QualityIndicators
): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];

  // Security opportunities
  if (quality.securityScore < 70) {
    for (const issue of result.issues.filter(i => i.category === 'security').slice(0, 3)) {
      opportunities.push({
        type: 'security',
        description: issue.title,
        impact: issue.severity === 'critical' || issue.severity === 'high' ? 'high' : 'medium',
        effort: 'medium',
        suggestion: issue.suggestion || 'Fix security vulnerability',
      });
    }
  }

  // Performance opportunities
  if (/for\s*\([^)]*\)[^}]*\.includes\(|\.indexOf\(/i.test(code)) {
    opportunities.push({
      type: 'performance',
      description: 'Array search inside loop',
      impact: 'high',
      effort: 'low',
      suggestion: 'Convert array to Set before loop for O(1) lookups',
      codeExample: 'const set = new Set(array);\nfor (const item of items) {\n  if (set.has(item)) { ... }\n}',
    });
  }

  if (/await\s+\w+\([^)]*\);\s*await\s+\w+\(/i.test(code)) {
    opportunities.push({
      type: 'performance',
      description: 'Sequential async operations',
      impact: 'medium',
      effort: 'low',
      suggestion: 'Use Promise.all for independent async operations',
      codeExample: 'const [result1, result2] = await Promise.all([fetch1(), fetch2()]);',
    });
  }

  // Readability opportunities
  if (quality.readability < 60) {
    opportunities.push({
      type: 'readability',
      description: 'Code readability needs improvement',
      impact: 'medium',
      effort: 'medium',
      suggestion: 'Break long functions into smaller ones, use descriptive names, reduce nesting',
    });
  }

  // Best practice opportunities
  if (/var\s+\w+/i.test(code)) {
    opportunities.push({
      type: 'best-practice',
      description: 'Using var instead of const/let',
      impact: 'low',
      effort: 'low',
      suggestion: 'Replace var with const (preferred) or let',
    });
  }

  if (/console\.(log|warn|error)/i.test(code)) {
    opportunities.push({
      type: 'best-practice',
      description: 'Console statements in code',
      impact: 'low',
      effort: 'low',
      suggestion: 'Remove console statements or use a proper logging library',
    });
  }

  if (/==(?!=)/i.test(code)) {
    opportunities.push({
      type: 'best-practice',
      description: 'Using loose equality',
      impact: 'medium',
      effort: 'low',
      suggestion: 'Use strict equality (===) instead of loose equality (==)',
    });
  }

  return opportunities;
}

/**
 * Build AI context for advanced optimization
 */
function buildAIContext(
  code: string,
  purpose: CodePurpose,
  semantic: SemanticAnalysis,
  dataFlow: DataFlowAnalysis,
  result: AnalysisResult
): AIContext {
  // Determine code intent
  let codeIntent = '';
  switch (purpose) {
    case 'api-endpoint':
      codeIntent = 'Handle HTTP requests and return appropriate responses';
      break;
    case 'authentication':
      codeIntent = 'Manage user authentication and authorization';
      break;
    case 'database-operation':
      codeIntent = 'Perform database operations (CRUD)';
      break;
    case 'ui-component':
      codeIntent = 'Render UI and handle user interactions';
      break;
    case 'data-processing':
      codeIntent = 'Transform and process data';
      break;
    case 'validation':
      codeIntent = 'Validate and sanitize input data';
      break;
    default:
      codeIntent = 'Perform utility operations';
  }

  // Expected behavior
  const expectedBehavior = `
- Process ${dataFlow.inputs.length} input(s): ${dataFlow.inputs.map(i => i.name).join(', ') || 'none'}
- Produce ${dataFlow.outputs.length} output(s): ${dataFlow.outputs.map(o => o.name).join(', ') || 'none'}
- Apply transformations: ${dataFlow.transformations.join(', ') || 'none'}
- Handle errors for: ${semantic.errorScenarios.join(', ') || 'standard errors'}
`.trim();

  // Constraints
  const constraints: string[] = [];
  if (result.security.riskScore > 50) constraints.push('Must fix all security vulnerabilities');
  if (dataFlow.sideEffects.length > 0) constraints.push(`Manage side effects: ${dataFlow.sideEffects.join(', ')}`);
  if (semantic.technicalDomain === 'frontend') constraints.push('Must be React-compatible');
  if (/async|await|Promise/i.test(code)) constraints.push('Must handle async operations properly');

  // Assumptions
  const assumptions: string[] = [];
  if (dataFlow.inputs.length > 0) assumptions.push('Input data is provided by caller');
  if (/fetch|axios/i.test(code)) assumptions.push('Network is available');
  if (/process\.env/i.test(code)) assumptions.push('Environment variables are configured');

  // Critical paths
  const criticalPaths = semantic.keyOperations.slice(0, 5);

  // Security requirements
  const securityRequirements: string[] = [];
  if (/password|credential|secret|key/i.test(code)) securityRequirements.push('Protect sensitive data');
  if (/sql|query|select|insert/i.test(code)) securityRequirements.push('Prevent SQL injection');
  if (/innerHTML|dangerouslySetInnerHTML/i.test(code)) securityRequirements.push('Prevent XSS');
  if (/fetch|axios|http/i.test(code)) securityRequirements.push('Validate URLs, prevent SSRF');

  // Performance requirements
  const performanceRequirements: string[] = [];
  if (/for\s*\(|while\s*\(/i.test(code)) performanceRequirements.push('Optimize loops');
  if (/async|await/i.test(code)) performanceRequirements.push('Minimize async overhead');
  if (/useState|useEffect/i.test(code)) performanceRequirements.push('Prevent unnecessary re-renders');

  return {
    codeIntent,
    expectedBehavior,
    constraints,
    assumptions,
    criticalPaths,
    securityRequirements,
    performanceRequirements,
  };
}

/**
 * Generate comprehensive code summary
 */
function generateSummary(
  purpose: CodePurpose,
  patterns: DesignPattern[],
  semantic: SemanticAnalysis,
  functions: FunctionInfo[],
  classes: ClassInfo[]
): string {
  const parts: string[] = [];

  // Main purpose
  parts.push(`This code is primarily a ${purpose.replace(/-/g, ' ')} implementation`);

  // Patterns
  if (patterns.length > 0 && patterns[0] !== 'none') {
    parts.push(`using ${patterns.join(', ')} pattern(s)`);
  }

  // Domain
  parts.push(`in the ${semantic.businessDomain} domain`);

  // Structure
  if (functions.length > 0 || classes.length > 0) {
    const structure: string[] = [];
    if (functions.length > 0) structure.push(`${functions.length} function(s)`);
    if (classes.length > 0) structure.push(`${classes.length} class(es)`);
    parts.push(`containing ${structure.join(' and ')}`);
  }

  // Key operations
  if (semantic.keyOperations.length > 0) {
    parts.push(`that ${semantic.keyOperations.slice(0, 3).map(op => op.toLowerCase()).join(', ')}`);
  }

  return parts.join(' ') + '.';
}

/**
 * Main function: Comprehend code deeply
 */
export function comprehendCode(code: string, result: AnalysisResult): CodeComprehension {
  const { purpose, confidence } = detectPurpose(code, result.functions, result.classes, result.imports);
  const patterns = detectPatterns(code, result.classes, result.functions);
  const layer = detectArchitectureLayer(purpose, patterns);
  const dataFlow = analyzeDataFlow(code, result.functions);
  const quality = calculateQualityIndicators(code, result);
  const semantic = performSemanticAnalysis(code, purpose, result.functions);
  const opportunities = identifyOptimizationOpportunities(code, result, quality);
  const aiContext = buildAIContext(code, purpose, semantic, dataFlow, result);
  const summary = generateSummary(purpose, patterns, semantic, result.functions, result.classes);

  // Extract dependencies
  const externalDependencies = result.imports
    .filter(i => !i.source.startsWith('.') && !i.source.startsWith('/'))
    .map(i => i.source);
  const internalDependencies = result.imports
    .filter(i => i.source.startsWith('.') || i.source.startsWith('/'))
    .map(i => i.source);

  return {
    purpose,
    purposeConfidence: confidence,
    summary,
    layer,
    patterns,
    externalDependencies,
    internalDependencies,
    dataFlow,
    qualityIndicators: quality,
    semanticAnalysis: semantic,
    optimizationOpportunities: opportunities,
    aiContext,
  };
}

/**
 * Generate advanced optimization prompt with full context
 */
export function generateAdvancedOptimizationPrompt(
  code: string,
  comprehension: CodeComprehension,
  result: AnalysisResult
): string {
  const issuesList = result.issues
    .slice(0, 10)
    .map((issue, i) => `${i + 1}. [${issue.severity.toUpperCase()}] Line ${issue.location.line}: ${issue.title} - ${issue.description}`)
    .join('\n');

  const opportunitiesList = comprehension.optimizationOpportunities
    .map((op, i) => `${i + 1}. [${op.type.toUpperCase()}] ${op.description} (Impact: ${op.impact}, Effort: ${op.effort})\n   Suggestion: ${op.suggestion}${op.codeExample ? `\n   Example:\n   ${op.codeExample}` : ''}`)
    .join('\n\n');

  return `You are CodeSentinel AI, an expert code optimization engine. Your task is to generate a COMPLETELY OPTIMIZED, PRODUCTION-READY version of the provided code.

## DEEP CODE UNDERSTANDING

### Code Summary
${comprehension.summary}

### Code Intent
${comprehension.aiContext.codeIntent}

### Expected Behavior
${comprehension.aiContext.expectedBehavior}

### Architecture
- Layer: ${comprehension.layer}
- Patterns: ${comprehension.patterns.join(', ')}
- Business Domain: ${comprehension.semanticAnalysis.businessDomain}
- Technical Domain: ${comprehension.semanticAnalysis.technicalDomain}

### Data Flow
- Inputs: ${comprehension.dataFlow.inputs.map(i => `${i.name} (${i.type})`).join(', ') || 'None'}
- Outputs: ${comprehension.dataFlow.outputs.map(o => `${o.name} (${o.type})`).join(', ') || 'None'}
- Transformations: ${comprehension.dataFlow.transformations.join(', ') || 'None'}
- Side Effects: ${comprehension.dataFlow.sideEffects.join(', ') || 'None'}

### Quality Scores (Current)
- Readability: ${comprehension.qualityIndicators.readability}/100
- Maintainability: ${comprehension.qualityIndicators.maintainability}/100
- Security: ${comprehension.qualityIndicators.securityScore}/100
- Performance: ${comprehension.qualityIndicators.performanceScore}/100
- Testability: ${comprehension.qualityIndicators.testability}/100

## ISSUES TO FIX (${result.issues.length} total)
${issuesList || 'No issues detected'}

## OPTIMIZATION OPPORTUNITIES
${opportunitiesList || 'No specific opportunities identified'}

## CONSTRAINTS
${comprehension.aiContext.constraints.map(c => `- ${c}`).join('\n') || '- None'}

## SECURITY REQUIREMENTS
${comprehension.aiContext.securityRequirements.map(r => `- ${r}`).join('\n') || '- Standard security practices'}

## PERFORMANCE REQUIREMENTS
${comprehension.aiContext.performanceRequirements.map(r => `- ${r}`).join('\n') || '- Standard performance practices'}

## ORIGINAL CODE
\`\`\`${result.language}
${code}
\`\`\`

## YOUR TASK
Generate a FULLY OPTIMIZED version that:

1. **FIXES ALL ISSUES** - Every security vulnerability, bug, and code smell must be resolved
2. **MAINTAINS EXACT FUNCTIONALITY** - The optimized code must do exactly what the original does
3. **APPLIES BEST PRACTICES** - Use modern ${result.language} patterns and conventions
4. **IS PRODUCTION-READY** - Code should be deployable as-is
5. **INCLUDES PROPER ERROR HANDLING** - Handle all error scenarios: ${comprehension.semanticAnalysis.errorScenarios.join(', ')}
6. **HANDLES EDGE CASES** - Account for: ${comprehension.semanticAnalysis.edgeCases.join(', ')}
7. **IS WELL-DOCUMENTED** - Add JSDoc/TSDoc comments for all public functions
8. **USES TYPESCRIPT TYPES** - Add proper type annotations if applicable

## RESPONSE FORMAT

\`\`\`${result.language}
// Your fully optimized code here
\`\`\`

### Changes Made
- List each significant change with explanation

### Quality Improvements
- Security: X → Y
- Performance: X → Y
- Readability: X → Y`;
}


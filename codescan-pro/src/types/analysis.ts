/**
 * Core types for CodeSentinel static analysis platform
 */

// Severity levels for issues
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Supported programming languages
export type Language = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'kotlin'
  | 'swift'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'php'
  | 'ruby'
  | 'dart'
  | 'scala';

// Analysis status
export type AnalysisStatus = 'idle' | 'parsing' | 'analyzing' | 'complete' | 'error';

// Issue category
export type IssueCategory = 
  | 'security'
  | 'performance'
  | 'quality'
  | 'style'
  | 'bug'
  | 'complexity'
  | 'deprecated';

// CWE (Common Weakness Enumeration) reference
export interface CWEReference {
  id: string;
  name: string;
  url: string;
}

// OWASP Top 10 reference
export interface OWASPReference {
  id: string;
  name: string;
  year: number;
}

// Source code location
export interface SourceLocation {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

// Code issue/finding
export interface CodeIssue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: IssueCategory;
  location: SourceLocation;
  codeSnippet?: string;
  suggestion?: string;
  cwe?: CWEReference;
  owasp?: OWASPReference;
  ruleId?: string;
  fixable?: boolean;
  fix?: CodeFix;
}

// Auto-fix suggestion
export interface CodeFix {
  description: string;
  replacement: string;
  range: SourceLocation;
}

// AST Node information
export interface ASTNode {
  type: string;
  name?: string;
  location: SourceLocation;
  children?: ASTNode[];
  metadata?: Record<string, unknown>;
}

// Function/method information
export interface FunctionInfo {
  name: string;
  location: SourceLocation;
  parameters: ParameterInfo[];
  returnType?: string;
  complexity: number;
  linesOfCode: number;
  isAsync: boolean;
  isGenerator: boolean;
  isExported: boolean;
}

// Parameter information
export interface ParameterInfo {
  name: string;
  type?: string;
  defaultValue?: string;
  isOptional: boolean;
  isRest: boolean;
}

// Class information
export interface ClassInfo {
  name: string;
  location: SourceLocation;
  superClass?: string;
  interfaces?: string[];
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  isAbstract: boolean;
  isExported: boolean;
}

// Property information
export interface PropertyInfo {
  name: string;
  type?: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isReadonly: boolean;
}

// Import information
export interface ImportInfo {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
  location: SourceLocation;
}

// Variable information
export interface VariableInfo {
  name: string;
  kind: 'var' | 'let' | 'const';
  type?: string;
  location: SourceLocation;
  usages: SourceLocation[];
  isUnused: boolean;
}

// Control Flow Graph node
export interface CFGNode {
  id: string;
  type: 'entry' | 'exit' | 'statement' | 'condition' | 'loop' | 'return' | 'throw' | 'class' | 'method' | 'function' | 'property' | 'constructor';
  label: string;
  location?: SourceLocation;
  edges: CFGEdge[];
  code?: string;
  // Enhanced properties for hierarchy
  parentId?: string;        // Parent node ID for hierarchy
  children?: string[];      // Child node IDs
  isExpanded?: boolean;     // For collapsible nodes
  depth?: number;           // Nesting depth
  nodeGroup?: string;       // Group identifier (class name, function name)
  metadata?: {
    isAsync?: boolean;
    isStatic?: boolean;
    isConstructor?: boolean;
    visibility?: 'public' | 'private' | 'protected';
    returnType?: string;
    parameters?: string[];
    className?: string;
    methodName?: string;
  };
}

// Control Flow Graph edge
export interface CFGEdge {
  from: string;
  to: string;
  label?: string;
  condition?: 'true' | 'false' | 'default' | 'exception' | 'call' | 'return' | 'contains' | 'inherits';
  edgeType?: 'flow' | 'hierarchy' | 'call' | 'inheritance';  // Edge type for styling
}

// Control Flow Graph
export interface ControlFlowGraph {
  nodes: CFGNode[];
  edges: CFGEdge[];
  entryNode: string;
  exitNodes: string[];
  // Enhanced properties
  classes?: CFGClassInfo[];
  functions?: CFGFunctionInfo[];
  callGraph?: Map<string, string[]>;
}

// Class info for CFG
export interface CFGClassInfo {
  id: string;
  name: string;
  parentClass?: string;
  methods: string[];  // Node IDs of methods
  properties: string[];  // Node IDs of properties
  nodeId: string;  // The class node ID in CFG
}

// Function info for CFG
export interface CFGFunctionInfo {
  id: string;
  name: string;
  className?: string;  // Parent class if method
  nodeId: string;  // Entry node ID
  exitNodeId: string;  // Exit node ID
  calls: string[];  // Functions this function calls
}

// Code metrics
export interface CodeMetrics {
  // Basic metrics
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  
  // Complexity metrics
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  
  // Halstead metrics
  halstead: HalsteadMetrics;
  
  // Maintainability
  maintainabilityIndex: number;
  
  // Other metrics
  maxNestingDepth: number;
  averageFunctionLength: number;
  duplicateCodePercentage: number;
  
  // Counts
  functionCount: number;
  classCount: number;
  importCount: number;
}

// Halstead complexity metrics
export interface HalsteadMetrics {
  operators: number;        // n1: number of distinct operators
  operands: number;         // n2: number of distinct operands
  totalOperators: number;   // N1: total number of operators
  totalOperands: number;    // N2: total number of operands
  vocabulary: number;       // n = n1 + n2
  length: number;           // N = N1 + N2
  volume: number;           // V = N * log2(n)
  difficulty: number;       // D = (n1/2) * (N2/n2)
  effort: number;           // E = D * V
  time: number;             // T = E / 18 (seconds)
  bugs: number;             // B = V / 3000
}

// Security scan results
export interface SecurityScanResult {
  issues: CodeIssue[];
  owaspCoverage: OWASPCoverage;
  riskScore: number;
  recommendations: string[];
}

// OWASP coverage
export interface OWASPCoverage {
  a01_broken_access_control: number;
  a02_cryptographic_failures: number;
  a03_injection: number;
  a04_insecure_design: number;
  a05_security_misconfiguration: number;
  a06_vulnerable_components: number;
  a07_auth_failures: number;
  a08_software_integrity: number;
  a09_logging_failures: number;
  a10_ssrf: number;
}

// Security finding from advanced detection
export interface SecurityFinding {
  id: string;
  type: string;
  severity: Severity;
  vulnerability: string;
  description: string;
  location?: SourceLocation;
  cwe?: string;
  owaspCategory?: string;
  recommendation?: string;
  references?: string[];
}

// Issue from advanced detector
export interface Issue {
  id: string;
  rule?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  source?: string;
  category?: string;
  suggestion?: string;
  autoFixable?: boolean;
  references?: string[];
}

// Complete analysis result
export interface AnalysisResult {
  id: string;
  timestamp: Date;
  language: Language;
  status: AnalysisStatus;
  executionTimeMs: number;
  
  // Source info
  sourceCode: string;
  fileName?: string;
  
  // AST analysis
  ast?: ASTNode;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: ImportInfo[];
  variables: VariableInfo[];
  
  // Issues
  issues: CodeIssue[];
  
  // Control flow
  controlFlowGraph?: ControlFlowGraph;
  
  // Metrics
  metrics: CodeMetrics;
  
  // Security
  security: SecurityScanResult;
  securityFindings?: SecurityFinding[];
  
  // AI explanation (optional)
  aiExplanation?: string;
  
  // Error if analysis failed
  error?: string;
}

// Analysis options
export interface AnalysisOptions {
  language?: Language;
  enableSecurity?: boolean;
  enableMetrics?: boolean;
  enableCFG?: boolean;
  enableAI?: boolean;
  maxIssues?: number;
  severityThreshold?: Severity;
}

// User preferences
export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  editorFontSize: number;
  autoAnalyze: boolean;
  showLineNumbers: boolean;
  wordWrap: boolean;
  minimap: boolean;
}

// Analysis history item
export interface AnalysisHistoryItem {
  id: string;
  title: string;
  language: Language;
  timestamp: Date;
  issueCount: number;
  severity: Severity;
}


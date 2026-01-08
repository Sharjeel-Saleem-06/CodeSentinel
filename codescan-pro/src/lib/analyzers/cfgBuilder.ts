/**
 * Advanced Control Flow Graph Builder v4.0
 * Creates professional developer-style flowcharts with proper hierarchy
 * 
 * KEY IMPROVEMENT (v4.0):
 * - Fixed internal flow connections: Loop bodies, condition branches, and 
 *   all internal logic are now properly connected within their parent function
 * - Recursive block processing ensures nested structures are correctly linked
 * - Language-agnostic pattern matching for multi-language support
 * 
 * Features:
 * - Multi-language support (JS/TS, Kotlin, Swift, Python, Java, Go, Rust, etc.)
 * - Class and method hierarchy visualization
 * - Nested function/method detection with proper grouping
 * - Professional flowchart standards (swimlanes, hierarchy)
 * - Clean hierarchical layout with collapsible groups
 * - Call graph integration
 * - Proper scope handling
 * - PROPER INTERNAL FLOW: All statements within a function are connected
 *   in correct execution order (loops contain their bodies, conditions
 *   have true/false branches properly linked)
 * 
 * Follows standard flowchart conventions:
 * - Classes as container nodes (swimlanes)
 * - Methods/Functions as entry points within containers
 * - Control flow within methods (properly connected)
 * - Loop bodies connected to loop condition with iterate edge
 * - Condition branches (true/false) properly separated
 * - Inter-method calls shown as dashed lines
 */

import type { ControlFlowGraph, CFGNode, CFGEdge, CFGClassInfo, CFGFunctionInfo } from '../../types/analysis';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface BuilderContext {
  nodes: CFGNode[];
  edges: CFGEdge[];
  nodeCounter: number;
  lines: string[];
  language: string;
  classes: ClassScope[];
  functions: FunctionScope[];
  callGraph: Map<string, string[]>; // function -> called functions
  cfgClasses: CFGClassInfo[];       // Class info for CFG export
  cfgFunctions: CFGFunctionInfo[];  // Function info for CFG export
}

interface ClassScope {
  name: string;
  startLine: number;
  endLine: number;
  methods: FunctionScope[];
  properties: string[];
  parentClass?: string;
  entryNodeId?: string;
}

interface FunctionScope {
  name: string;
  startLine: number;
  endLine: number;
  entryNodeId: string;
  exitNodeId: string;
  parentClass?: string;
  isConstructor: boolean;
  isAsync: boolean;
  parameters: string[];
  calls: string[]; // Functions this function calls
  depth: number; // Nesting depth
}

// ControlBlock interface - kept for potential future use in advanced block tracking
// interface ControlBlock {
//   type: 'if' | 'else' | 'loop' | 'try' | 'catch' | 'finally' | 'switch' | 'case' | 'with';
//   nodeId: string;
//   startLine: number;
//   depth: number;
//   exitNodeId?: string;
//   falseNodeId?: string;
//   conditionNodeId?: string;
// }

interface LineAnalysis {
  type: CFGNode['type'];
  label: string;
  isBlockStart: boolean;
  isBlockEnd: boolean;
  isMethodCall: boolean;
  calledMethod?: string;
  isDeclaration: boolean;
  declarationName?: string;
}

// ============================================================================
// Node and Edge Creation
// ============================================================================

interface CreateNodeOptions {
  parentId?: string;
  depth?: number;
  nodeGroup?: string;
  metadata?: CFGNode['metadata'];
  children?: string[];
}

function createNode(
  ctx: BuilderContext,
  type: CFGNode['type'],
  label: string,
  line?: number,
  codeSnippet?: string,
  options?: CreateNodeOptions
): string {
  const nodeId = `node_${ctx.nodeCounter++}`;
  const node: CFGNode = {
    id: nodeId,
    type,
    label,
    location: line ? { line, column: 0 } : undefined,
    edges: [],
    code: codeSnippet,
    parentId: options?.parentId,
    depth: options?.depth ?? 0,
    nodeGroup: options?.nodeGroup,
    metadata: options?.metadata,
    children: options?.children ?? [],
    isExpanded: true,
  };
  
  ctx.nodes.push(node);
  return nodeId;
}

function addEdge(
  ctx: BuilderContext,
  from: string,
  to: string,
  condition?: CFGEdge['condition'],
  label?: string,
  edgeType?: CFGEdge['edgeType']
): void {
  // Prevent duplicate edges
  const existingEdge = ctx.edges.find(e => e.from === from && e.to === to && e.condition === condition);
  if (existingEdge) return;

  const edge: CFGEdge = { from, to };
  if (condition) edge.condition = condition;
  if (label) edge.label = label;
  if (edgeType) edge.edgeType = edgeType;
  
  ctx.edges.push(edge);
  
  const node = ctx.nodes.find(n => n.id === from);
  if (node) {
    node.edges.push(edge);
  }
}

// ============================================================================
// Code Analysis Utilities
// ============================================================================

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  const spaces = match[1];
  // Treat 2 spaces or 1 tab as 1 indent level
  return Math.floor(spaces.replace(/\t/g, '  ').length / 2);
}

function extractFunctionCalls(line: string): string[] {
  const calls: string[] = [];
  
  // Match function/method calls
  const patterns = [
    /\b(\w+)\s*\(/g,                           // Regular function calls
    /\b(\w+)\s*\.\s*(\w+)\s*\(/g,              // Method calls
    /await\s+(\w+)\s*\(/g,                     // Async function calls
    /await\s+(\w+)\s*\.\s*(\w+)\s*\(/g,        // Async method calls
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const funcName = match[2] || match[1];
      // Exclude control flow keywords
      if (!['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'throw', 'new', 'typeof', 'instanceof'].includes(funcName)) {
        calls.push(funcName);
      }
    }
  });
  
  return [...new Set(calls)];
}

function analyzeLineType(_line: string, trimmedLine: string, language: string): LineAnalysis {
  let type: CFGNode['type'] = 'statement';
  let label = trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? '...' : '');
  let isBlockStart = false;
  let isBlockEnd = /^[}\])]/.test(trimmedLine) || trimmedLine.endsWith('}');
  let isMethodCall = false;
  let calledMethod: string | undefined;
  let isDeclaration = false;
  let declarationName: string | undefined;

  // ==================== Conditional Statements ====================
  
  // If-else conditions (all languages)
  if (/^(?:if|else\s+if|elif)\s*[\(\{:]/.test(trimmedLine) || /^if\s+/.test(trimmedLine)) {
    type = 'condition';
    const condition = trimmedLine.match(/[\(\{:]\s*([^)\}:]+)/)?.[1] || 
                      trimmedLine.match(/if\s+(.+?)[\s{:]/)?.[1] || '';
    label = `if (${condition.substring(0, 30).trim()}${condition.length > 30 ? '...' : ''})`;
    isBlockStart = true;
  }
  // Guard statements (Swift)
  else if (/^guard\s+/.test(trimmedLine)) {
    type = 'condition';
    const condition = trimmedLine.match(/guard\s+(.+?)\s+else/)?.[1] || '';
    label = `guard ${condition.substring(0, 25)}${condition.length > 25 ? '...' : ''}`;
    isBlockStart = true;
  }
  // When expression (Kotlin)
  else if (/^when\s*[\(\{]/.test(trimmedLine)) {
    type = 'condition';
    const expr = trimmedLine.match(/when\s*\(([^)]+)\)/)?.[1] || '';
    label = `when (${expr.substring(0, 25)}${expr.length > 25 ? '...' : ''})`;
    isBlockStart = true;
  }
  // Else block
  else if (/^else\s*[\{:]?$/.test(trimmedLine)) {
    type = 'condition';
    label = 'else';
    isBlockStart = true;
  }
  // Ternary/conditional expression
  else if (/\?\s*.+\s*:\s*.+/.test(trimmedLine) && !trimmedLine.startsWith('?')) {
    type = 'condition';
    label = 'conditional expression';
  }

  // ==================== Loop Statements ====================
  
  // For loops (C-style)
  else if (/^for\s*\(/.test(trimmedLine)) {
    type = 'loop';
    const parts = trimmedLine.match(/for\s*\(([^;]*);([^;]*);([^)]*)\)/);
    if (parts) {
      label = `for (${parts[2]?.trim().substring(0, 20) || '...'}${parts[2]?.length > 20 ? '...' : ''})`;
    } else {
      // For-in / for-of
      const match = trimmedLine.match(/for\s*\(([^)]+)\)/);
      label = `for (${match?.[1]?.substring(0, 25) || '...'}${(match?.[1]?.length ?? 0) > 25 ? '...' : ''})`;
    }
    isBlockStart = true;
  }
  // For loops (Python/Kotlin style)
  else if (/^for\s+\w+\s+in\s+/.test(trimmedLine)) {
    type = 'loop';
    const match = trimmedLine.match(/for\s+(\w+)\s+in\s+([^:\{]+)/);
    label = `for ${match?.[1]} in ${match?.[2]?.substring(0, 15) || '...'}`;
    isBlockStart = true;
  }
  // While loops
  else if (/^while\s*[\(\{]/.test(trimmedLine) || /^while\s+/.test(trimmedLine)) {
    type = 'loop';
    const condition = trimmedLine.match(/while\s*[\(\{]?\s*([^)\}:]+)/)?.[1] || '';
    label = `while (${condition.substring(0, 20)}${condition.length > 20 ? '...' : ''})`;
    isBlockStart = true;
  }
  // Do-while loops
  else if (/^do\s*\{?$/.test(trimmedLine)) {
    type = 'loop';
    label = 'do';
    isBlockStart = true;
  }
  // Repeat-while (Swift)
  else if (/^repeat\s*\{?$/.test(trimmedLine)) {
    type = 'loop';
    label = 'repeat';
    isBlockStart = true;
  }
  // forEach / map / filter / etc.
  else if (/\.(forEach|map|filter|reduce|flatMap|compactMap|some|every|find|findIndex)\s*[\(\{]/.test(trimmedLine)) {
    type = 'loop';
    const method = trimmedLine.match(/\.(\w+)\s*[\(\{]/)?.[1] || '';
    label = `.${method}(...)`;
    isMethodCall = true;
    calledMethod = method;
  }
  // Loop (Rust)
  else if (/^loop\s*\{/.test(trimmedLine)) {
    type = 'loop';
    label = 'loop';
    isBlockStart = true;
  }

  // ==================== Control Flow ====================
  
  // Return statements
  else if (/^return\b/.test(trimmedLine)) {
    type = 'return';
    const returnVal = trimmedLine.replace(/^return\s*/, '').replace(/[;]$/, '');
    label = returnVal ? `return ${returnVal.substring(0, 30)}${returnVal.length > 30 ? '...' : ''}` : 'return';
  }
  // Throw statements
  else if (/^throw\b/.test(trimmedLine)) {
    type = 'throw';
    const throwVal = trimmedLine.replace(/^throw\s*/, '').replace(/[;]$/, '');
    label = `throw ${throwVal.substring(0, 25)}${throwVal.length > 25 ? '...' : ''}`;
  }
  // Yield statements (generators)
  else if (/^yield\b/.test(trimmedLine)) {
    type = 'return';
    const yieldVal = trimmedLine.replace(/^yield\s*/, '').replace(/[;]$/, '');
    label = `yield ${yieldVal.substring(0, 25)}${yieldVal.length > 25 ? '...' : ''}`;
  }
  // Break statements
  else if (/^break\b/.test(trimmedLine)) {
    type = 'statement';
    const breakLabel = trimmedLine.match(/break\s+(\w+)/)?.[1];
    label = breakLabel ? `break ${breakLabel}` : 'break';
  }
  // Continue statements
  else if (/^continue\b/.test(trimmedLine)) {
    type = 'statement';
    const continueLabel = trimmedLine.match(/continue\s+(\w+)/)?.[1];
    label = continueLabel ? `continue ${continueLabel}` : 'continue';
  }

  // ==================== Exception Handling ====================
  
  // Try blocks
  else if (/^try\s*[\{\:]?$/.test(trimmedLine) || /^try\s*\{/.test(trimmedLine)) {
    type = 'statement';
    label = 'try';
    isBlockStart = true;
  }
  // Catch blocks
  else if (/^catch\s*[\(\{]/.test(trimmedLine) || /^except\s*/.test(trimmedLine)) {
    type = 'condition';
    const param = trimmedLine.match(/[\(\{]\s*([^)\}]+)/)?.[1] || 'error';
    label = `catch (${param.substring(0, 15)}${param.length > 15 ? '...' : ''})`;
    isBlockStart = true;
  }
  // Finally blocks
  else if (/^finally\s*[\{\:]?$/.test(trimmedLine) || /^defer\s*\{/.test(trimmedLine)) {
    type = 'statement';
    label = language === 'swift' || language === 'go' ? 'defer' : 'finally';
    isBlockStart = true;
  }

  // ==================== Switch/Match ====================
  
  // Switch statements
  else if (/^switch\s*[\(\{]/.test(trimmedLine) || /^match\s+/.test(trimmedLine)) {
    type = 'condition';
    const expr = trimmedLine.match(/(?:switch|match)\s*[\(\{]?\s*([^)\}:\{]+)/)?.[1] || '';
    label = `switch (${expr.substring(0, 20)}${expr.length > 20 ? '...' : ''})`;
    isBlockStart = true;
  }
  // Case statements
  else if (/^case\s+/.test(trimmedLine) || /^is\s+/.test(trimmedLine)) {
    type = 'condition';
    const caseVal = trimmedLine.match(/(?:case|is)\s+([^:]+)/)?.[1] || '';
    label = `case ${caseVal.substring(0, 20)}${caseVal.length > 20 ? '...' : ''}`;
  }
  // Default case
  else if (/^default\s*:/.test(trimmedLine) || /^else\s*->/.test(trimmedLine)) {
    type = 'condition';
    label = 'default';
  }

  // ==================== Async/Await ====================
  
  // Await expressions
  else if (/^(?:const|let|var|val)?\s*\w*\s*=?\s*await\b/.test(trimmedLine)) {
    type = 'statement';
    const match = trimmedLine.match(/await\s+([^;]+)/);
    label = `await ${match?.[1]?.substring(0, 25) || '...'}`;
    isMethodCall = true;
    calledMethod = match?.[1]?.match(/(\w+)\s*\(/)?.[1];
  }
  // Async let (Swift)
  else if (/^async\s+let\s+/.test(trimmedLine)) {
    type = 'statement';
    const varName = trimmedLine.match(/async\s+let\s+(\w+)/)?.[1] || '';
    label = `async let ${varName}`;
    isDeclaration = true;
    declarationName = varName;
  }

  // ==================== Variable Declarations ====================
  
  // Variable declarations with initialization
  else if (/^(?:const|let|var|val|final)\s+\w+\s*[:=]/.test(trimmedLine)) {
    type = 'statement';
    const match = trimmedLine.match(/(?:const|let|var|val|final)\s+(\w+)\s*[:=]/);
    if (match) {
      label = `${match[1]} = ...`;
      isDeclaration = true;
      declarationName = match[1];
    }
  }
  // Property declarations
  else if (/^(?:private|public|protected|internal)?\s*(?:var|val|let)\s+\w+/.test(trimmedLine)) {
    type = 'statement';
    const match = trimmedLine.match(/(?:var|val|let)\s+(\w+)/);
    if (match) {
      label = `${match[1]} = ...`;
      isDeclaration = true;
      declarationName = match[1];
    }
  }

  // ==================== Function/Method Calls ====================
  
  // Standalone function calls
  else if (/^\w+\s*\(/.test(trimmedLine) && !['if', 'for', 'while', 'switch', 'catch', 'function', 'func', 'def', 'fn'].some(k => trimmedLine.startsWith(k))) {
    type = 'statement';
    const funcName = trimmedLine.match(/^(\w+)\s*\(/)?.[1] || '';
    label = `${funcName}(...)`;
    isMethodCall = true;
    calledMethod = funcName;
  }
  // Method calls on objects
  else if (/^\w+\s*\.\s*\w+\s*\(/.test(trimmedLine)) {
    type = 'statement';
    const match = trimmedLine.match(/^(\w+)\s*\.\s*(\w+)\s*\(/);
    if (match) {
      label = `${match[1]}.${match[2]}(...)`;
      isMethodCall = true;
      calledMethod = match[2];
    }
  }
  // Self/this method calls
  else if (/^(?:self|this)\s*\.\s*\w+\s*\(/.test(trimmedLine)) {
    type = 'statement';
    const method = trimmedLine.match(/(?:self|this)\s*\.\s*(\w+)/)?.[1] || '';
    label = `this.${method}(...)`;
    isMethodCall = true;
    calledMethod = method;
  }

  // ==================== Assertions/Logging ====================
  
  // Assert statements
  else if (/^(?:assert|require|check|precondition)\s*[\(\{]/.test(trimmedLine)) {
    type = 'condition';
    const assertion = trimmedLine.match(/(?:assert|require|check|precondition)\s*[\(\{]\s*([^)\}]+)/)?.[1] || '';
    label = `assert (${assertion.substring(0, 20)}${assertion.length > 20 ? '...' : ''})`;
  }
  // Print/Log statements
  else if (/^(?:print|println|console\.|Log\.|NSLog|debugPrint)\s*[\(\.]/.test(trimmedLine)) {
    type = 'statement';
    label = 'log(...)';
    isMethodCall = true;
  }

  return { type, label, isBlockStart, isBlockEnd, isMethodCall, calledMethod, isDeclaration, declarationName };
}

// ============================================================================
// Class Detection
// ============================================================================

function detectClasses(ctx: BuilderContext): ClassScope[] {
  const classes: ClassScope[] = [];
  
  const classPatterns = [
    // JavaScript/TypeScript
    /^\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/,
    // Kotlin
    /^\s*(?:open\s+|abstract\s+|data\s+|sealed\s+)?class\s+(\w+)(?:\s*:\s*(\w+))?/,
    // Swift
    /^\s*(?:final\s+|open\s+)?class\s+(\w+)(?:\s*:\s*(\w+))?/,
    // Python
    /^\s*class\s+(\w+)(?:\s*\(\s*(\w+)\s*\))?/,
    // Java/C#
    /^\s*(?:public\s+|private\s+)?(?:abstract\s+|final\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/,
    // Rust struct (treat as class)
    /^\s*(?:pub\s+)?struct\s+(\w+)/,
  ];

  for (let i = 0; i < ctx.lines.length; i++) {
    const line = ctx.lines[i];
    const trimmedLine = line.trim();
    
    for (const pattern of classPatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        const className = match[1];
        const parentClass = match[2];
        
        // Find end of class using bracket matching
        let depth = 0;
        let endLine = i;
        let foundStart = false;
        
        for (let j = i; j < ctx.lines.length; j++) {
          const currentLine = ctx.lines[j];
          for (const char of currentLine) {
            if (char === '{') {
              depth++;
              foundStart = true;
            }
            if (char === '}') {
              depth--;
            }
          }
          if (foundStart && depth === 0) {
            endLine = j;
            break;
          }
        }
        
        if (endLine > i) {
          classes.push({
            name: className,
            startLine: i,
            endLine,
            methods: [],
            properties: [],
            parentClass,
          });
        }
        break;
      }
    }
  }
  
  return classes;
}

// ============================================================================
// Function Detection
// ============================================================================

function detectFunctions(ctx: BuilderContext): FunctionScope[] {
  const functions: FunctionScope[] = [];
  
  const functionPatterns = [
    // JavaScript/TypeScript - regular functions
    { pattern: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/, async: true },
    // JavaScript/TypeScript - arrow functions
    { pattern: /^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[\w]+)\s*=>/, async: true },
    // JavaScript/TypeScript - class methods
    { pattern: /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*[\w<>[\]|&?,\s]+)?\s*\{/, async: true },
    // Kotlin functions
    { pattern: /^\s*(?:private|public|internal|protected)?\s*(?:suspend\s+)?fun\s+(\w+)\s*\(([^)]*)\)/, async: false },
    // Swift functions
    { pattern: /^\s*(?:private|public|internal|fileprivate|open)?\s*(?:static\s+)?func\s+(\w+)\s*\(([^)]*)\)/, async: false },
    // Python functions
    { pattern: /^\s*(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/, async: true },
    // Go functions
    { pattern: /^\s*func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(([^)]*)\)/, async: false },
    // Rust functions
    { pattern: /^\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*\(([^)]*)\)/, async: true },
    // Java/C# methods
    { pattern: /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)?(\w+)\s*\(([^)]*)\)\s*(?:throws\s+\w+)?\s*\{/, async: false },
    // Constructor patterns
    { pattern: /^\s*(?:public|private|protected)?\s*constructor\s*\(([^)]*)\)/, async: false, isConstructor: true },
    { pattern: /^\s*init\s*\(([^)]*)\)/, async: false, isConstructor: true },
    { pattern: /^\s*def\s+__init__\s*\(([^)]*)\)/, async: false, isConstructor: true },
  ];

  // First, detect which class each line belongs to
  const lineToClass = new Map<number, ClassScope>();
  ctx.classes.forEach(cls => {
    for (let i = cls.startLine; i <= cls.endLine; i++) {
      lineToClass.set(i, cls);
    }
  });

  for (let i = 0; i < ctx.lines.length; i++) {
    const line = ctx.lines[i];
    const trimmedLine = line.trim();
    
    for (const { pattern, async: hasAsync, isConstructor } of functionPatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        const funcName = isConstructor ? 'constructor' : (match[1] || 'anonymous');
        const params = (isConstructor ? match[1] : match[2]) || '';
        
        // Find end of function using bracket matching
        let depth = 0;
        let endLine = i;
        let foundStart = false;
        
        for (let j = i; j < ctx.lines.length; j++) {
          const currentLine = ctx.lines[j];
          for (const char of currentLine) {
            if (char === '{') {
              depth++;
              foundStart = true;
            }
            if (char === '}') {
              depth--;
            }
          }
          if (foundStart && depth === 0) {
            endLine = j;
            break;
          }
        }
        
        // For Python-style (no braces), use indentation
        if (!foundStart && ctx.language === 'python') {
          const baseIndent = getIndentLevel(line);
          for (let j = i + 1; j < ctx.lines.length; j++) {
            const nextLine = ctx.lines[j].trim();
            if (nextLine && getIndentLevel(ctx.lines[j]) <= baseIndent) {
              endLine = j - 1;
              break;
            }
            endLine = j;
          }
        }
        
        if (endLine >= i) {
          const parentClass = lineToClass.get(i);
          const isAsync = hasAsync && /async|suspend/.test(trimmedLine);
          
          // Extract function calls within this function
          const calls: string[] = [];
          for (let j = i + 1; j <= endLine && j < ctx.lines.length; j++) {
            calls.push(...extractFunctionCalls(ctx.lines[j]));
          }
          
          const funcScope: FunctionScope = {
            name: funcName,
            startLine: i,
            endLine,
            entryNodeId: '',
            exitNodeId: '',
            parentClass: parentClass?.name,
            isConstructor: isConstructor || funcName === 'constructor' || funcName === '__init__' || funcName === 'init',
            isAsync,
            parameters: params.split(',').map(p => p.trim().split(/[:\s]/)[0]).filter(Boolean),
            calls: [...new Set(calls)],
            depth: parentClass ? 1 : 0,
          };
          
          functions.push(funcScope);
          
          // Add to class methods if within a class
          if (parentClass) {
            parentClass.methods.push(funcScope);
          }
        }
        break;
      }
    }
  }

  // If no functions found, treat entire code as main
  if (functions.length === 0) {
    const calls: string[] = [];
    ctx.lines.forEach(line => calls.push(...extractFunctionCalls(line)));
    
    functions.push({
      name: 'main',
      startLine: 0,
      endLine: ctx.lines.length - 1,
      entryNodeId: '',
      exitNodeId: '',
      isConstructor: false,
      isAsync: false,
      parameters: [],
      calls: [...new Set(calls)],
      depth: 0,
    });
  }

  // Build call graph
  functions.forEach(func => {
    ctx.callGraph.set(func.name, func.calls);
  });

  return functions;
}

// ============================================================================
// Line Skip Logic
// ============================================================================

function shouldSkipLine(trimmedLine: string): boolean {
  return (
    !trimmedLine ||
    trimmedLine === '{' ||
    trimmedLine === '}' ||
    trimmedLine === '};' ||
    trimmedLine === '},' ||
    trimmedLine === ');' ||
    trimmedLine === ']' ||
    trimmedLine === '];' ||
    trimmedLine.startsWith('//') ||
    trimmedLine.startsWith('/*') ||
    trimmedLine.startsWith('*') ||
    trimmedLine.startsWith('*/') ||
    trimmedLine.startsWith('#') && !trimmedLine.startsWith('#include') ||
    /^import\s/.test(trimmedLine) ||
    /^from\s+\w+\s+import/.test(trimmedLine) ||
    /^require\s*\(/.test(trimmedLine) ||
    /^package\s/.test(trimmedLine) ||
    /^using\s/.test(trimmedLine) ||
    /^#include/.test(trimmedLine) ||
    /^@\w+/.test(trimmedLine) || // Decorators/annotations
    /^\/\//.test(trimmedLine) ||
    /^"""/.test(trimmedLine) ||
    /^'''/.test(trimmedLine)
  );
}

// ============================================================================
// Function CFG Builder - Enhanced with proper internal flow connections
// ============================================================================

// BlockContext interface - kept for potential future use in advanced block tracking
// interface BlockContext {
//   type: 'if' | 'else' | 'loop' | 'try' | 'catch' | 'finally' | 'switch' | 'case';
//   nodeId: string;
//   startLine: number;
//   endLine: number;
//   depth: number;
//   exitNodeId?: string;
//   mergeNodeId?: string;  // Node where branches merge
//   loopBackNodeId?: string; // For loops: the condition node to loop back to
//   branchNodes: string[]; // Nodes at end of each branch
// }

function findBlockEnd(lines: string[], startLine: number, startIndent: number): number {
  let depth = 0;
  let foundStart = false;
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
      if (char === '{') {
        depth++;
        foundStart = true;
      }
      if (char === '}') {
        depth--;
        if (foundStart && depth === 0) {
          return i;
        }
      }
    }
  }
  
  // Fallback: use indentation for Python-style
  for (let i = startLine + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed && getIndentLevel(line) <= startIndent) {
      return i - 1;
    }
  }
  
  return lines.length - 1;
}

function buildFunctionCFG(ctx: BuilderContext, func: FunctionScope): void {
  // Find parent class node if exists
  const parentClassInfo = ctx.cfgClasses.find(c => c.name === func.parentClass);
  const parentNodeId = parentClassInfo?.nodeId;
  
  // Determine node type based on context
  const nodeType: CFGNode['type'] = func.isConstructor 
    ? 'constructor' 
    : func.parentClass 
      ? 'method' 
      : 'function';
  
  // Create entry node with rich metadata
  const entryLabel = `${func.name}(${func.parameters.slice(0, 2).join(', ')}${func.parameters.length > 2 ? '...' : ''})`;
  
  const entryId = createNode(
    ctx, 
    nodeType, 
    entryLabel, 
    func.startLine + 1,
    undefined,
    {
      parentId: parentNodeId,
      depth: func.depth,
      nodeGroup: func.parentClass || func.name,
      metadata: {
      isAsync: func.isAsync,
      isConstructor: func.isConstructor,
      parameters: func.parameters,
        className: func.parentClass,
        methodName: func.name,
      },
    }
  );
  func.entryNodeId = entryId;
  
  // Add to parent class's children
  if (parentNodeId) {
    const parentNode = ctx.nodes.find(n => n.id === parentNodeId);
    if (parentNode && parentNode.children) {
      parentNode.children.push(entryId);
    }
    // Add hierarchy edge
    addEdge(ctx, parentNodeId, entryId, 'contains', 'contains', 'hierarchy');
  }
  
  // Create exit node
  const exitLabel = `return`;
  const exitId = createNode(ctx, 'exit', exitLabel, func.endLine + 1, undefined, {
    parentId: entryId,
    depth: func.depth + 1,
    nodeGroup: func.parentClass || func.name,
  });
  func.exitNodeId = exitId;
  
  // Build internal control flow
  const result = buildBlockCFG(ctx, func, func.startLine + 1, func.endLine, entryId, exitId, 0);
  
  // Connect last node to exit if not already connected
  if (result.lastNodeId && result.lastNodeId !== exitId) {
    // Check if already connected to exit
    const hasExitEdge = ctx.edges.some(e => e.from === result.lastNodeId && e.to === exitId);
    if (!hasExitEdge) {
      addEdge(ctx, result.lastNodeId, exitId);
    }
  }
  
  // Connect any pending branch ends to exit
  result.pendingNodes.forEach(nodeId => {
    if (!ctx.edges.some(e => e.from === nodeId && e.to === exitId)) {
      addEdge(ctx, nodeId, exitId);
    }
  });
  
  // Ensure entry connects to something
  if (!ctx.edges.some(e => e.from === entryId)) {
    addEdge(ctx, entryId, exitId);
  }
}

interface BlockCFGResult {
  lastNodeId: string;
  pendingNodes: string[]; // Nodes that need to be connected to next statement
  hasReturn: boolean;
}

function buildBlockCFG(
  ctx: BuilderContext, 
  func: FunctionScope, 
  startLine: number, 
  endLine: number, 
  prevNodeId: string,
  exitId: string,
  depth: number
): BlockCFGResult {
  let currentPrevId = prevNodeId;
  const pendingFalseNodes: string[] = []; // Nodes waiting for false/else branch
  const pendingBreakNodes: string[] = [];
  const loopStack: { nodeId: string; endLine: number }[] = [];
  let hasReturn = false;
  
  let i = startLine;
  while (i <= endLine && i < ctx.lines.length) {
    const line = ctx.lines[i];
    const trimmedLine = line.trim();
    const lineNum = i + 1;
    const lineIndent = getIndentLevel(line);
    
    // Skip empty lines, comments, imports, etc.
    if (shouldSkipLine(trimmedLine)) {
      i++;
      continue;
    }
    
    // Skip closing braces
    if (trimmedLine === '}' || trimmedLine === '};' || trimmedLine === '},') {
      // Check if we're exiting a loop
      if (loopStack.length > 0 && i >= loopStack[loopStack.length - 1].endLine) {
        const loop = loopStack.pop()!;
        // Connect back to loop condition
        if (currentPrevId && currentPrevId !== loop.nodeId) {
          addEdge(ctx, currentPrevId, loop.nodeId, undefined, 'iterate');
        }
        // Connect pending break nodes to next statement (will be handled after loop)
      }
      i++;
      continue;
    }
    
    // Check if this is a nested function definition - skip it entirely
    const nestedFunc = ctx.functions.find(f => 
      f !== func && 
      f.startLine === i && 
      f.startLine > func.startLine && 
      f.endLine < func.endLine
    );
      if (nestedFunc) {
      i = nestedFunc.endLine + 1;
        continue;
    }
    
    const analysis = analyzeLineType(line, trimmedLine, ctx.language);
    
    // Handle else block - connect from pending false nodes
    if (trimmedLine.startsWith('else') || trimmedLine === '} else {' || trimmedLine === '} else') {
      i++;
      continue; // else is handled by the if block processing
    }
    
    // ==================== LOOP HANDLING ====================
    if (analysis.type === 'loop') {
      const loopBlockEnd = findBlockEnd(ctx.lines, i, lineIndent);
      
      // Create loop condition node
      const loopNodeId = createNode(ctx, 'loop', analysis.label, lineNum, trimmedLine, {
        parentId: func.entryNodeId,
        depth: func.depth + 1 + depth,
        nodeGroup: func.parentClass || func.name,
      });
      
      // Connect from previous
      if (currentPrevId) {
        addEdge(ctx, currentPrevId, loopNodeId);
      }
      
      // Connect pending false branches to loop
      pendingFalseNodes.forEach(nodeId => {
        addEdge(ctx, nodeId, loopNodeId, 'false', 'else');
      });
      pendingFalseNodes.length = 0;
      
      // Track this loop for break/continue handling
      loopStack.push({ nodeId: loopNodeId, endLine: loopBlockEnd });
      
      // Build loop body
      const bodyResult = buildBlockCFG(ctx, func, i + 1, loopBlockEnd, loopNodeId, exitId, depth + 1);
      
      // Connect loop body start with 'body' label
      const firstBodyEdge = ctx.edges.find(e => e.from === loopNodeId);
      if (firstBodyEdge) {
        firstBodyEdge.condition = 'true';
        firstBodyEdge.label = 'body';
      }
      
      // Connect end of loop body back to condition
      if (bodyResult.lastNodeId && bodyResult.lastNodeId !== loopNodeId && !bodyResult.hasReturn) {
        addEdge(ctx, bodyResult.lastNodeId, loopNodeId, undefined, 'iterate');
      }
      
      // Loop exit goes to next statement (false path)
      loopStack.pop();
      currentPrevId = loopNodeId;
      pendingFalseNodes.push(loopNodeId); // Loop exit is "false" path
      
      // Connect any break statements to after loop
      pendingBreakNodes.forEach(_nodeId => {
        // Will be connected to next statement after loop exits
      });
      
      i = loopBlockEnd + 1;
      continue;
    }
    
    // ==================== CONDITION HANDLING ====================
    if (analysis.type === 'condition' && (trimmedLine.startsWith('if') || /^(?:else\s+if|elif)/.test(trimmedLine))) {
      const ifBlockEnd = findBlockEnd(ctx.lines, i, lineIndent);
      
      // Create condition node
      const condNodeId = createNode(ctx, 'condition', analysis.label, lineNum, trimmedLine, {
        parentId: func.entryNodeId,
        depth: func.depth + 1 + depth,
        nodeGroup: func.parentClass || func.name,
      });
      
      // Connect from previous
      if (currentPrevId) {
        addEdge(ctx, currentPrevId, condNodeId);
      }
      
      // Connect pending false branches
      pendingFalseNodes.forEach(nodeId => {
        addEdge(ctx, nodeId, condNodeId, 'false', 'else');
      });
      pendingFalseNodes.length = 0;
      
      // Build true branch (then block)
      const thenResult = buildBlockCFG(ctx, func, i + 1, ifBlockEnd, condNodeId, exitId, depth + 1);
      
      // Mark the edge to then block as "true"
      const thenEdge = ctx.edges.find(e => e.from === condNodeId && e.to !== exitId);
      if (thenEdge) {
        thenEdge.condition = 'true';
        thenEdge.label = 'then';
      }
      
      // Check for else block
      let elseBlockStart = -1;
      let elseBlockEnd = -1;
      
      // Look for else on the same line as closing brace or next line
      for (let j = ifBlockEnd; j <= Math.min(ifBlockEnd + 1, ctx.lines.length - 1); j++) {
        const elseLine = ctx.lines[j]?.trim() || '';
        if (elseLine.includes('else')) {
          elseBlockStart = j;
          elseBlockEnd = findBlockEnd(ctx.lines, j, lineIndent);
          break;
        }
      }
      
      const branchEndNodes: string[] = [];
      
      if (!thenResult.hasReturn && thenResult.lastNodeId) {
        branchEndNodes.push(thenResult.lastNodeId);
      }
      
      if (elseBlockStart !== -1) {
        // Build else branch
        const elseResult = buildBlockCFG(ctx, func, elseBlockStart + 1, elseBlockEnd, condNodeId, exitId, depth + 1);
        
        // Mark the edge to else block as "false"
        const elseEdge = ctx.edges.find(e => e.from === condNodeId && !e.condition);
        if (elseEdge) {
          elseEdge.condition = 'false';
          elseEdge.label = 'else';
      } else {
          // Create edge if not exists
          const elseFirstNode = ctx.nodes.find(n => 
            n.location?.line && 
            n.location.line > elseBlockStart && 
            n.location.line <= elseBlockEnd + 1
          );
          if (elseFirstNode) {
            addEdge(ctx, condNodeId, elseFirstNode.id, 'false', 'else');
          }
        }
        
        if (!elseResult.hasReturn && elseResult.lastNodeId) {
          branchEndNodes.push(elseResult.lastNodeId);
        }
        
        i = elseBlockEnd + 1;
      } else {
        // No else block - condition's false path goes to next statement
        pendingFalseNodes.push(condNodeId);
        i = ifBlockEnd + 1;
      }
      
      // Set current prev to the merge point
      if (branchEndNodes.length > 0) {
        currentPrevId = branchEndNodes[0]; // First branch end becomes prev
        // Other branch ends become pending
        for (let k = 1; k < branchEndNodes.length; k++) {
          pendingFalseNodes.push(branchEndNodes[k]);
        }
      } else if (thenResult.hasReturn && elseBlockStart === -1) {
        // Only then branch and it returns, false path continues
        currentPrevId = '';
      } else {
        currentPrevId = '';
      }
      
      continue;
    }
    
    // ==================== RETURN/THROW HANDLING ====================
    if (analysis.type === 'return' || analysis.type === 'throw') {
      const nodeId = createNode(ctx, analysis.type, analysis.label, lineNum, trimmedLine, {
        parentId: func.entryNodeId,
        depth: func.depth + 1 + depth,
        nodeGroup: func.parentClass || func.name,
      });
      
      // Connect from previous
      if (currentPrevId) {
        addEdge(ctx, currentPrevId, nodeId);
      }
      
      // Connect pending false branches
      pendingFalseNodes.forEach(pendingId => {
        addEdge(ctx, pendingId, nodeId, 'false', 'else');
      });
      pendingFalseNodes.length = 0;
      
      // Connect to exit
      addEdge(ctx, nodeId, exitId);
      
      hasReturn = true;
      currentPrevId = '';
      i++;
      continue;
    }
    
    // ==================== BREAK/CONTINUE HANDLING ====================
    if (analysis.label.startsWith('break')) {
      const nodeId = createNode(ctx, 'statement', analysis.label, lineNum, trimmedLine, {
        parentId: func.entryNodeId,
        depth: func.depth + 1 + depth,
        nodeGroup: func.parentClass || func.name,
      });
      
      if (currentPrevId) {
        addEdge(ctx, currentPrevId, nodeId);
      }
      
      pendingFalseNodes.forEach(pendingId => {
        addEdge(ctx, pendingId, nodeId, 'false', 'else');
      });
      pendingFalseNodes.length = 0;
      
      pendingBreakNodes.push(nodeId);
      currentPrevId = '';
      i++;
      continue;
    }
    
    if (analysis.label.startsWith('continue')) {
      const nodeId = createNode(ctx, 'statement', analysis.label, lineNum, trimmedLine, {
        parentId: func.entryNodeId,
        depth: func.depth + 1 + depth,
        nodeGroup: func.parentClass || func.name,
      });
      
      if (currentPrevId) {
        addEdge(ctx, currentPrevId, nodeId);
      }
      
      pendingFalseNodes.forEach(pendingId => {
        addEdge(ctx, pendingId, nodeId, 'false', 'else');
      });
      pendingFalseNodes.length = 0;
      
      // Connect to current loop condition
      if (loopStack.length > 0) {
        addEdge(ctx, nodeId, loopStack[loopStack.length - 1].nodeId, undefined, 'continue');
      }
      
      currentPrevId = '';
      i++;
      continue;
    }
    
    // ==================== REGULAR STATEMENT ====================
    const nodeId = createNode(ctx, analysis.type, analysis.label, lineNum, trimmedLine, {
      parentId: func.entryNodeId,
      depth: func.depth + 1 + depth,
      nodeGroup: func.parentClass || func.name,
      metadata: analysis.isMethodCall ? { methodName: analysis.calledMethod } : undefined,
    });
    
    // Connect from previous node
    if (currentPrevId) {
      addEdge(ctx, currentPrevId, nodeId);
    }
    
    // Connect pending false branches
    pendingFalseNodes.forEach(pendingId => {
      addEdge(ctx, pendingId, nodeId, 'false', 'else');
    });
    pendingFalseNodes.length = 0;
    
    // Connect pending break nodes (they exit to after loop)
    pendingBreakNodes.forEach(breakId => {
      addEdge(ctx, breakId, nodeId, undefined, 'break');
    });
    pendingBreakNodes.length = 0;
    
    currentPrevId = nodeId;
    
    // Track method calls for call graph
    if (analysis.isMethodCall && analysis.calledMethod) {
      const calledFunc = ctx.functions.find(f => f.name === analysis.calledMethod);
      if (calledFunc && calledFunc.entryNodeId) {
        addEdge(ctx, nodeId, calledFunc.entryNodeId, 'call', 'calls', 'call');
      }
    }
    
    i++;
  }
  
  return {
    lastNodeId: currentPrevId,
    pendingNodes: [...pendingFalseNodes, ...pendingBreakNodes],
    hasReturn,
  };
}

// ============================================================================
// Main Build Function
// ============================================================================

export function buildControlFlowGraph(
  code: string,
  language: string = 'javascript'
): ControlFlowGraph {
  const ctx: BuilderContext = {
    nodes: [],
    edges: [],
    nodeCounter: 0,
    lines: code.split('\n'),
    language,
    classes: [],
    functions: [],
    callGraph: new Map(),
    cfgClasses: [],
    cfgFunctions: [],
  };
  
  // Detect classes first
  ctx.classes = detectClasses(ctx);
  
  // Create class nodes (container nodes for hierarchy)
  ctx.classes.forEach(cls => {
    const classNodeId = createNode(
      ctx,
      'class',
      cls.name,
      cls.startLine + 1,
      undefined,
      {
        depth: 0,
        nodeGroup: cls.name,
        metadata: {
          className: cls.name,
        },
        children: [],
      }
    );
    cls.entryNodeId = classNodeId;
    
    // Add to CFG classes info
    ctx.cfgClasses.push({
      id: `class_${cls.name}`,
      name: cls.name,
      parentClass: cls.parentClass,
      methods: [],
      properties: [],
      nodeId: classNodeId,
    });
    
    // Add inheritance edge if has parent
    if (cls.parentClass) {
      const parentCls = ctx.classes.find(c => c.name === cls.parentClass);
      if (parentCls?.entryNodeId) {
        addEdge(ctx, classNodeId, parentCls.entryNodeId, 'inherits', 'extends', 'inheritance');
      }
    }
  });
  
  // Detect functions (including methods within classes)
  ctx.functions = detectFunctions(ctx);
  
  // Build CFG for each function
  ctx.functions.forEach(func => {
    buildFunctionCFG(ctx, func);
    
    // Add to CFG functions info
    ctx.cfgFunctions.push({
      id: `func_${func.parentClass ? func.parentClass + '_' : ''}${func.name}`,
      name: func.name,
      className: func.parentClass,
      nodeId: func.entryNodeId,
      exitNodeId: func.exitNodeId,
      calls: func.calls,
    });
    
    // Update class info with method
    if (func.parentClass) {
      const classInfo = ctx.cfgClasses.find(c => c.name === func.parentClass);
      if (classInfo) {
        classInfo.methods.push(func.entryNodeId);
      }
    }
  });
  
  // Add inter-function call edges
  ctx.functions.forEach(func => {
    const calls = ctx.callGraph.get(func.name) || [];
    calls.forEach(calledName => {
      const calledFunc = ctx.functions.find(f => f.name === calledName);
      if (calledFunc && calledFunc.entryNodeId && func.entryNodeId) {
        // Find a statement node in func that makes the call
        const callerNodes = ctx.nodes.filter(n => 
          n.nodeGroup === (func.parentClass || func.name) &&
          n.code?.includes(calledName)
        );
        
        callerNodes.forEach(callerNode => {
          addEdge(ctx, callerNode.id, calledFunc.entryNodeId, 'call', 'calls', 'call');
        });
      }
    });
  });
  
  // Handle edge case: no nodes created
  if (ctx.nodes.length === 0) {
    const entryId = createNode(ctx, 'entry', 'start', 1);
    const exitId = createNode(ctx, 'exit', 'end', ctx.lines.length);
    addEdge(ctx, entryId, exitId);
  }
  
  return {
    nodes: ctx.nodes,
    edges: ctx.edges,
    entryNode: ctx.nodes[0]?.id || 'entry',
    exitNodes: ctx.nodes.filter(n => n.type === 'exit').map(n => n.id),
    classes: ctx.cfgClasses,
    functions: ctx.cfgFunctions,
    callGraph: ctx.callGraph,
  };
}

// ============================================================================
// Layout Calculation (for non-Dagre fallback)
// ============================================================================

export function calculateNodePositions(
  cfg: ControlFlowGraph
): Map<string, { x: number; y: number; level: number; branch?: 'left' | 'right' | 'center' }> {
  const positions = new Map<string, { x: number; y: number; level: number; branch?: 'left' | 'right' | 'center' }>();
  
  if (!cfg.nodes.length) return positions;
  
  // Build adjacency structures
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  
  cfg.nodes.forEach(node => {
    children.set(node.id, []);
    parents.set(node.id, []);
  });
  
  cfg.edges.forEach(edge => {
    // Skip call edges for layout purposes
    if (edge.condition === 'call') return;
    
    const childList = children.get(edge.from) || [];
    if (!childList.includes(edge.to)) {
      childList.push(edge.to);
    }
    children.set(edge.from, childList);
    
    const parentList = parents.get(edge.to) || [];
    if (!parentList.includes(edge.from)) {
      parentList.push(edge.from);
    }
    parents.set(edge.to, parentList);
  });
  
  // BFS to assign levels
  const levelMap = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; level: number }[] = [{ id: cfg.entryNode, level: 0 }];
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    
    levelMap.set(id, level);
    
    const nodeChildren = children.get(id) || [];
    nodeChildren.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 });
      }
    });
  }
  
  // Handle unvisited nodes (disconnected components)
  cfg.nodes.forEach(node => {
    if (!levelMap.has(node.id)) {
      levelMap.set(node.id, 0);
    }
  });
  
  // Group nodes by level
  const levels = new Map<number, string[]>();
  cfg.nodes.forEach(node => {
    const level = levelMap.get(node.id) ?? 0;
    const levelNodes = levels.get(level) || [];
    levelNodes.push(node.id);
    levels.set(level, levelNodes);
  });
  
  // Layout parameters
  const nodeWidth = 200;
  const nodeHeight = 80;
  const horizontalGap = 100;
  const verticalGap = 120;
  
  // Calculate subtree widths
  const subtreeWidths = new Map<string, number>();
  
  function calculateSubtreeWidth(nodeId: string, visited: Set<string> = new Set()): number {
    if (visited.has(nodeId)) return nodeWidth;
    visited.add(nodeId);
    
    if (subtreeWidths.has(nodeId)) return subtreeWidths.get(nodeId)!;
    
    const nodeChildren = children.get(nodeId) || [];
    if (nodeChildren.length === 0) {
      subtreeWidths.set(nodeId, nodeWidth);
      return nodeWidth;
    }
    
    let totalWidth = 0;
    nodeChildren.forEach((childId, idx) => {
      totalWidth += calculateSubtreeWidth(childId, new Set(visited));
      if (idx < nodeChildren.length - 1) {
        totalWidth += horizontalGap;
      }
    });
    
    const width = Math.max(nodeWidth, totalWidth);
    subtreeWidths.set(nodeId, width);
    return width;
  }
  
  calculateSubtreeWidth(cfg.entryNode);
  
  // Assign positions
  function assignPositions(nodeId: string, x: number, y: number, branch?: 'left' | 'right' | 'center') {
    if (positions.has(nodeId)) return;
    
    const level = levelMap.get(nodeId) ?? 0;
    positions.set(nodeId, { x, y, level, branch });
    
    const nodeChildren = children.get(nodeId) || [];
    if (nodeChildren.length === 0) return;
    
    let totalChildWidth = 0;
    nodeChildren.forEach((childId, idx) => {
      totalChildWidth += subtreeWidths.get(childId) || nodeWidth;
      if (idx < nodeChildren.length - 1) {
        totalChildWidth += horizontalGap;
      }
    });
    
    let childX = x - totalChildWidth / 2;
    nodeChildren.forEach((childId, idx) => {
      const childWidth = subtreeWidths.get(childId) || nodeWidth;
      const childCenterX = childX + childWidth / 2;
      const childY = y + nodeHeight + verticalGap;
      
      let childBranch: 'left' | 'right' | 'center' = 'center';
      if (nodeChildren.length === 2) {
        childBranch = idx === 0 ? 'left' : 'right';
      } else if (nodeChildren.length > 2) {
        if (idx === 0) childBranch = 'left';
        else if (idx === nodeChildren.length - 1) childBranch = 'right';
      }
      
      assignPositions(childId, childCenterX, childY, childBranch);
      childX += childWidth + horizontalGap;
    });
  }
  
  assignPositions(cfg.entryNode, 0, 0, 'center');
  
  // Handle disconnected nodes
  let disconnectedY = 0;
  cfg.nodes.forEach(node => {
    if (!positions.has(node.id)) {
      positions.set(node.id, { x: 600, y: disconnectedY, level: 0, branch: 'center' });
      disconnectedY += nodeHeight + verticalGap;
    }
  });
  
  return positions;
}

// ============================================================================
// Tree Structure Export
// ============================================================================

export interface CFGTreeNode {
  id: string;
  label: string;
  type: string;
  line?: number;
  children: CFGTreeNode[];
  isConditional: boolean;
  branchType?: 'true' | 'false' | 'default';
  metadata?: Record<string, unknown>;
}

export function buildCFGTree(cfg: ControlFlowGraph): CFGTreeNode | null {
  if (!cfg.nodes.length) return null;
  
  const visited = new Set<string>();
  
  function buildNode(nodeId: string, branchType?: 'true' | 'false' | 'default'): CFGTreeNode | null {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);
    
    const node = cfg.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    const children: CFGTreeNode[] = [];
    const isConditional = node.type === 'condition' || node.type === 'loop';
    
    // Get child edges (excluding call edges)
    const childEdges = cfg.edges.filter(e => e.from === nodeId && e.condition !== 'call');
    
    childEdges.forEach(edge => {
      const childNode = buildNode(
        edge.to, 
        edge.condition as 'true' | 'false' | 'default' | undefined
      );
      if (childNode) {
        children.push(childNode);
      }
    });
    
    return {
      id: node.id,
      label: node.label,
      type: node.type,
      line: node.location?.line,
      children,
      isConditional,
      branchType,
      metadata: (node as CFGNode & { metadata?: Record<string, unknown> }).metadata,
    };
  }
  
  return buildNode(cfg.entryNode);
}

// ============================================================================
// Call Graph Export
// ============================================================================

export interface CallGraphNode {
  name: string;
  calls: string[];
  calledBy: string[];
  isMethod: boolean;
  parentClass?: string;
}

export function buildCallGraph(cfg: ControlFlowGraph, _ctx?: BuilderContext): Map<string, CallGraphNode> {
  const callGraph = new Map<string, CallGraphNode>();
  
  // Extract function names from entry nodes
  cfg.nodes
    .filter(n => n.type === 'entry')
    .forEach(node => {
      const name = node.label.replace(/[()]/g, '');
      callGraph.set(name, {
        name,
        calls: [],
        calledBy: [],
        isMethod: name.includes('.'),
        parentClass: name.includes('.') ? name.split('.')[0] : undefined,
      });
    });
  
  // Build call relationships from edges
  cfg.edges
    .filter(e => e.condition === 'call')
    .forEach(edge => {
      const fromNode = cfg.nodes.find(n => n.id === edge.from);
      const toNode = cfg.nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        // Find the function that contains fromNode
        const callerEntry = cfg.nodes.find(n => 
          n.type === 'entry' && 
          cfg.edges.some(e => e.from === n.id && isDescendant(cfg, e.to, fromNode.id))
        );
        
        if (callerEntry) {
          const callerName = callerEntry.label.replace(/[()]/g, '');
          const calleeName = toNode.label.replace(/[()]/g, '');
          
          const caller = callGraph.get(callerName);
          const callee = callGraph.get(calleeName);
          
          if (caller && !caller.calls.includes(calleeName)) {
            caller.calls.push(calleeName);
          }
          if (callee && !callee.calledBy.includes(callerName)) {
            callee.calledBy.push(callerName);
          }
        }
      }
    });
  
  return callGraph;
}

function isDescendant(cfg: ControlFlowGraph, startId: string, targetId: string): boolean {
  const visited = new Set<string>();
  const queue = [startId];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    
    cfg.edges
      .filter(e => e.from === current && e.condition !== 'call')
      .forEach(e => queue.push(e.to));
  }
  
  return false;
}

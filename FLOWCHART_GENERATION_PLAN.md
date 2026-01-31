# Advanced Code-to-Flowchart Generation System
## From Basic Visualization to Intelligent Flow Diagram Creation

---

## 📋 EXECUTIVE SUMMARY

**Current State Analysis:**
- **Method:** Basic AST traversal with simple node conversion
- **Quality:** Creates diagrams but doesn't properly show flow
- **Issues:**
  - Doesn't capture actual execution flow
  - Missing conditional paths (if/else branches)
  - No loop visualization
  - Async/await flows not shown
  - Error handling paths missing
  - Multiple execution paths not clear
  - Over-simplified or over-complicated

**Target State:**
- **Method:** Control Flow Graph (CFG) + Data Flow Analysis + AI Enhancement
- **Quality:** Professional, readable flow diagrams that show ALL execution paths
- **Features:**
  - Clear conditional branching (if/else, switch/when)
  - Loop structures (for, while, do-while)
  - Async/await flow with suspension points
  - Error handling (try/catch/finally)
  - Function calls with return flows
  - Multiple execution paths clearly marked
  - Smart simplification (not too complex, not too simple)

---

## 🎯 CORE PROBLEMS WITH CURRENT FLOWCHART

### Problem 1: Not Showing Actual Flow
**Current Issue:**
```
Code:
fun processUser(user: User?) {
    if (user == null) return
    val name = user.name
    if (name.isEmpty()) {
        showError()
        return
    }
    saveUser(user)
}

Current Flowchart:
┌─────────────────┐
│ processUser     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check user null │  ❌ Doesn't show WHERE flow goes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get name        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check empty     │  ❌ Doesn't show error path
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save user       │
└─────────────────┘
```

**What It Should Look Like:**
```
         ┌─────────────────┐
         │  processUser    │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
    ┌────┤  user == null?  │
    │    └────────┬────────┘
    │ yes         │ no
    │             ▼
    │    ┌─────────────────┐
    │    │  name = user.name│
    │    └────────┬────────┘
    │             │
    │             ▼
    │    ┌─────────────────┐
    │ ┌──┤ name.isEmpty()? │
    │ │  └────────┬────────┘
    │ │ yes       │ no
    │ │           │
    │ │           ▼
    │ │  ┌─────────────────┐
    │ │  │  saveUser()     │
    │ │  └────────┬────────┘
    │ │           │
    │ │  ┌────────▼────────┐
    │ │  │     Return      │
    │ │  └─────────────────┘
    │ │           ▲
    │ │  ┌────────┴────────┐
    │ └─►│   showError()   │
    │    └─────────────────┘
    │             ▲
    └─────────────┘
```

### Problem 2: No Loop Representation
**Current Issue:**
```kotlin
for (item in items) {
    if (item.isValid()) {
        process(item)
    }
}
```

**Current Flowchart:**
```
┌─────────────┐
│ For loop    │  ❌ Just shows "loop" - no flow!
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Check valid │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Process     │
└─────────────┘
```

**What It Should Show:**
```
       ┌──────────────┐
       │  Start loop  │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
    ┌──┤ Has next item?│
    │  └──────┬───────┘
    │ no      │ yes
    │         ▼
    │  ┌──────────────┐
    │  │ Get next item│
    │  └──────┬───────┘
    │         │
    │         ▼
    │  ┌──────────────┐
    │ ┌┤ item.isValid?│
    │ │└──────┬───────┘
    │ │ no    │ yes
    │ │       │
    │ │       ▼
    │ │ ┌──────────────┐
    │ │ │ process(item)│
    │ │ └──────┬───────┘
    │ │        │
    │ └────────┴───────┐
    │                  │
    │   ◄──────────────┘
    │   (back to loop check)
    │
    ▼
┌────────────┐
│  Continue  │
└────────────┘
```

### Problem 3: Async/Await Not Represented
**Current Issue:**
```kotlin
suspend fun fetchData() {
    val result = api.getData()  // suspension point
    processData(result)
}
```

**Current Flowchart:**
```
┌─────────────┐
│ fetchData   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ getData     │  ❌ Doesn't show it suspends!
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ processData │
└─────────────┘
```

**What It Should Show:**
```
┌────────────────┐
│   fetchData    │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│   api.getData()│
└────────┬───────┘
         │
    ⏸️ SUSPEND
    (coroutine pauses)
         │
    ⏯️ RESUME
    (when data ready)
         │
         ▼
┌────────────────┐
│ processData()  │
└────────────────┘
```

### Problem 4: No Error Handling Flow
**Current Issue:**
```kotlin
try {
    riskyOperation()
    processResult()
} catch (e: Exception) {
    handleError(e)
} finally {
    cleanup()
}
```

**Current Flowchart:**
```
┌─────────────┐
│ Try block   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ risky op    │  ❌ Where does error go?
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ process     │
└─────────────┘
```

**What It Should Show:**
```
         ┌──────────────┐
         │  Try block   │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
      ┌──┤ riskyOp()    │──┐
      │  └──────┬───────┘  │ exception
success│        │           │
      │         ▼           │
      │  ┌──────────────┐  │
      │  │ processResult│  │
      │  └──────┬───────┘  │
      │         │           │
      └─────────┼───────────┘
                │
                ▼
         ┌──────────────┐
         │   cleanup()  │ ← always runs
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
      ┌──┤ Had error?   │
      │  └──────┬───────┘
error │ yes     │ no
      │         │
      ▼         ▼
┌──────────┐ ┌──────────┐
│handleErr │ │ Continue │
└──────────┘ └──────────┘
```

### Problem 5: Complex Functions Too Simplified or Too Complex

**Issue A: Over-Simplified**
```kotlin
// Complex function with 20 lines, 5 decisions
fun complexLogic() {
    // ... lots of logic
}
```

**Current:**
```
┌─────────────┐
│ complexLogic│  ❌ Useless! Shows nothing!
└─────────────┘
```

**Issue B: Over-Detailed**
```kotlin
fun simple() {
    val x = 1
    val y = 2
    val z = x + y
    return z
}
```

**Current:**
```
┌─────────────┐
│  x = 1      │  ❌ Too detailed! Should be
└──────┬──────┘     one "Calculate" node
       │
       ▼
┌─────────────┐
│  y = 2      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  z = x + y  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  return z   │
└─────────────┘
```

---

## 🏗️ SOLUTION ARCHITECTURE

### Three-Layer System

```
┌─────────────────────────────────────────────────┐
│  LAYER 1: CONTROL FLOW GRAPH (CFG) BUILDER     │
│  - Parse code into CFG (not just AST)          │
│  - Identify basic blocks                        │
│  - Track execution paths                        │
│  - Handle branching, loops, exceptions          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  LAYER 2: FLOW ANALYSIS & OPTIMIZATION         │
│  - Analyze execution paths                      │
│  - Simplify trivial paths                       │
│  - Identify critical decision points            │
│  - Detect unreachable code                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  LAYER 3: AI-ENHANCED VISUALIZATION             │
│  - Smart node grouping                          │
│  - Meaningful node labels                       │
│  - Layout optimization                          │
│  - Generate Mermaid/D3 diagrams                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
           ┌────────────┐
           │  FLOWCHART │
           └────────────┘
```

---

## 🔧 DETAILED IMPLEMENTATION

### PHASE 1: Control Flow Graph (CFG) Generation

#### 1.1 Understanding CFG Basics

**What is a CFG?**
A Control Flow Graph is a directed graph where:
- **Nodes** = Basic Blocks (sequences of statements with no branches)
- **Edges** = Control flow (how execution moves between blocks)

**Example:**
```kotlin
fun example(x: Int) {
    val y = x * 2        // Block 1
    if (y > 10) {        // Block 1 ends
        print("big")     // Block 2
    } else {
        print("small")   // Block 3
    }
    print("done")        // Block 4
}
```

**CFG:**
```
Block 1: [val y = x * 2, check y > 10]
   ├─ true  → Block 2: [print("big")]
   └─ false → Block 3: [print("small")]
        ↓           ↓
        └───→ Block 4: [print("done")]
```

#### 1.2 CFG Builder Implementation Strategy

```typescript
interface BasicBlock {
  id: string;
  statements: Statement[];
  successors: Edge[];     // Outgoing edges
  predecessors: Edge[];   // Incoming edges
  type: 'entry' | 'exit' | 'normal' | 'decision' | 'loop';
}

interface Edge {
  from: BasicBlock;
  to: BasicBlock;
  condition?: string;     // "true", "false", "exception", etc.
  label?: string;         // Human-readable label
}

interface ControlFlowGraph {
  entry: BasicBlock;      // Start of function
  exit: BasicBlock;       // End of function
  blocks: BasicBlock[];
  edges: Edge[];
}

class CFGBuilder {
  buildCFG(ast: AST, language: string): ControlFlowGraph {
    // 1. Identify basic blocks
    const blocks = this.identifyBasicBlocks(ast);
    
    // 2. Connect blocks with edges
    const edges = this.connectBlocks(blocks);
    
    // 3. Handle special constructs
    this.handleLoops(blocks, edges);
    this.handleExceptions(blocks, edges);
    this.handleAsync(blocks, edges, language);
    
    return {
      entry: blocks[0],
      exit: blocks[blocks.length - 1],
      blocks,
      edges
    };
  }
}
```

#### 1.3 Language-Specific CFG Construction

**Kotlin CFG Builder:**

```typescript
class KotlinCFGBuilder {
  buildCFG(ast: KotlinAST): ControlFlowGraph {
    const cfg = new ControlFlowGraph();
    
    // Handle Kotlin-specific constructs
    for (const node of ast.nodes) {
      switch (node.type) {
        case 'if':
          this.handleIf(node, cfg);
          break;
        case 'when':  // Kotlin's switch
          this.handleWhen(node, cfg);
          break;
        case 'for':
        case 'while':
          this.handleLoop(node, cfg);
          break;
        case 'try':
          this.handleTryCatch(node, cfg);
          break;
        case 'suspend_function':
          this.handleSuspendFunction(node, cfg);
          break;
        case 'coroutine_launch':
          this.handleCoroutineLaunch(node, cfg);
          break;
      }
    }
    
    return cfg;
  }
  
  private handleIf(node: IfNode, cfg: ControlFlowGraph) {
    // Create decision block
    const decisionBlock = cfg.createBlock('decision');
    decisionBlock.statements = [node.condition];
    
    // Create then block
    const thenBlock = this.buildBlocksFromStatements(node.thenBranch);
    
    // Create else block (if exists)
    const elseBlock = node.elseBranch 
      ? this.buildBlocksFromStatements(node.elseBranch)
      : null;
    
    // Create merge block (where both paths join)
    const mergeBlock = cfg.createBlock('normal');
    
    // Connect edges
    cfg.addEdge(decisionBlock, thenBlock, { condition: 'true', label: 'yes' });
    cfg.addEdge(decisionBlock, elseBlock || mergeBlock, { condition: 'false', label: 'no' });
    cfg.addEdge(thenBlock, mergeBlock);
    if (elseBlock) {
      cfg.addEdge(elseBlock, mergeBlock);
    }
  }
  
  private handleWhen(node: WhenNode, cfg: ControlFlowGraph) {
    // Kotlin when is like switch/case
    const decisionBlock = cfg.createBlock('decision');
    const mergeBlock = cfg.createBlock('normal');
    
    for (const branch of node.branches) {
      const branchBlock = this.buildBlocksFromStatements(branch.statements);
      cfg.addEdge(decisionBlock, branchBlock, { 
        condition: branch.condition,
        label: this.formatCondition(branch.condition)
      });
      cfg.addEdge(branchBlock, mergeBlock);
    }
    
    // Handle else branch
    if (node.elseBranch) {
      const elseBlock = this.buildBlocksFromStatements(node.elseBranch);
      cfg.addEdge(decisionBlock, elseBlock, { label: 'else' });
      cfg.addEdge(elseBlock, mergeBlock);
    }
  }
  
  private handleLoop(node: LoopNode, cfg: ControlFlowGraph) {
    // Create loop header (condition check)
    const headerBlock = cfg.createBlock('loop');
    headerBlock.statements = [node.condition];
    
    // Create loop body
    const bodyBlocks = this.buildBlocksFromStatements(node.body);
    const bodyEntry = bodyBlocks[0];
    const bodyExit = bodyBlocks[bodyBlocks.length - 1];
    
    // Create exit block
    const exitBlock = cfg.createBlock('normal');
    
    // Connect edges
    cfg.addEdge(headerBlock, bodyEntry, { condition: 'true', label: 'continue' });
    cfg.addEdge(headerBlock, exitBlock, { condition: 'false', label: 'exit' });
    cfg.addEdge(bodyExit, headerBlock, { label: 'loop back' }); // Back edge
    
    // Handle break/continue statements in body
    this.handleBreakContinue(bodyBlocks, headerBlock, exitBlock);
  }
  
  private handleSuspendFunction(node: SuspendFunctionNode, cfg: ControlFlowGraph) {
    // Identify suspension points (await calls)
    for (const statement of node.statements) {
      if (this.isSuspensionPoint(statement)) {
        // Split block at suspension point
        const beforeSuspend = cfg.createBlock('normal');
        const suspendBlock = cfg.createBlock('suspend');
        suspendBlock.statements = [statement];
        const afterSuspend = cfg.createBlock('normal');
        
        // Mark suspension
        cfg.addEdge(beforeSuspend, suspendBlock, { label: 'call' });
        cfg.addEdge(suspendBlock, afterSuspend, { 
          label: '⏸️ suspend → ⏯️ resume',
          style: 'dashed'
        });
      }
    }
  }
  
  private handleTryCatch(node: TryCatchNode, cfg: ControlFlowGraph) {
    // Create try block
    const tryBlocks = this.buildBlocksFromStatements(node.tryBody);
    
    // Create catch blocks
    const catchBlocks = node.catchBlocks.map(catchNode => ({
      exceptionType: catchNode.exceptionType,
      blocks: this.buildBlocksFromStatements(catchNode.body)
    }));
    
    // Create finally block (if exists)
    const finallyBlocks = node.finallyBody 
      ? this.buildBlocksFromStatements(node.finallyBody)
      : null;
    
    // Create merge block
    const mergeBlock = cfg.createBlock('normal');
    
    // Connect try to success path and exception paths
    for (const tryBlock of tryBlocks) {
      // Normal flow
      cfg.addEdge(tryBlock, tryBlocks[tryBlocks.indexOf(tryBlock) + 1] || (finallyBlocks?.[0] || mergeBlock));
      
      // Exception flow
      for (const catchBlock of catchBlocks) {
        cfg.addEdge(tryBlock, catchBlock.blocks[0], {
          condition: 'exception',
          label: `throws ${catchBlock.exceptionType}`
        });
      }
    }
    
    // Connect catch blocks to finally/merge
    for (const catchBlock of catchBlocks) {
      const lastCatchBlock = catchBlock.blocks[catchBlock.blocks.length - 1];
      cfg.addEdge(lastCatchBlock, finallyBlocks?.[0] || mergeBlock);
    }
    
    // Finally always executes
    if (finallyBlocks) {
      cfg.addEdge(finallyBlocks[finallyBlocks.length - 1], mergeBlock);
    }
  }
}
```

**Swift CFG Builder:**

```typescript
class SwiftCFGBuilder {
  buildCFG(ast: SwiftAST): ControlFlowGraph {
    // Handle Swift-specific constructs
    
    // Guard statements (early return pattern)
    this.handleGuard(ast);
    
    // Optional chaining (?. operator)
    this.handleOptionalChaining(ast);
    
    // Defer statements (cleanup code)
    this.handleDefer(ast);
    
    // Async/await
    this.handleAsync(ast);
  }
  
  private handleGuard(node: GuardNode, cfg: ControlFlowGraph) {
    // guard let x = optional else { return }
    
    const guardBlock = cfg.createBlock('decision');
    guardBlock.statements = [node.condition];
    
    // Else block (early exit)
    const elseBlock = this.buildBlocksFromStatements(node.elseBody);
    const elseExit = elseBlock[elseBlock.length - 1];
    elseExit.type = 'exit'; // Mark as early return
    
    // Success path (continues after guard)
    const continueBlock = cfg.createBlock('normal');
    
    cfg.addEdge(guardBlock, elseBlock[0], { condition: 'false', label: 'fail' });
    cfg.addEdge(guardBlock, continueBlock, { condition: 'true', label: 'pass' });
  }
  
  private handleOptionalChaining(node: OptionalChainingNode, cfg: ControlFlowGraph) {
    // obj?.property?.method()
    
    // Each ?. is a potential nil check
    const checks = node.chainElements;
    let currentBlock = cfg.currentBlock;
    
    for (const check of checks) {
      const checkBlock = cfg.createBlock('decision');
      checkBlock.statements = [`${check} != nil?`];
      
      const nilBlock = cfg.createBlock('normal');
      nilBlock.statements = ['return nil'];
      
      const successBlock = cfg.createBlock('normal');
      
      cfg.addEdge(currentBlock, checkBlock);
      cfg.addEdge(checkBlock, nilBlock, { condition: 'false', label: 'nil' });
      cfg.addEdge(checkBlock, successBlock, { condition: 'true', label: 'not nil' });
      
      currentBlock = successBlock;
    }
  }
}
```

**C# CFG Builder:**

```typescript
class CSharpCFGBuilder {
  private handleAsync(node: AsyncMethodNode, cfg: ControlFlowGraph) {
    // Track Task-returning methods
    for (const statement of node.statements) {
      if (statement.type === 'await') {
        // Mark await point
        const awaitBlock = cfg.createBlock('suspend');
        awaitBlock.statements = [statement];
        awaitBlock.metadata = {
          label: 'await (async pause)',
          style: 'dashed'
        };
      }
      
      // Detect deadlock patterns (.Result or .Wait())
      if (statement.method === 'Result' || statement.method === 'Wait') {
        const warningBlock = cfg.createBlock('warning');
        warningBlock.statements = [statement];
        warningBlock.metadata = {
          label: '⚠️ Potential deadlock',
          style: 'danger'
        };
      }
    }
  }
  
  private handleLinq(node: LinqNode, cfg: ControlFlowGraph) {
    // LINQ is deferred execution - show as lazy evaluation
    
    // Query definition
    const queryDefBlock = cfg.createBlock('normal');
    queryDefBlock.statements = [node.query];
    queryDefBlock.metadata = { label: 'Define LINQ query (deferred)' };
    
    // Execution point (when enumerated)
    const execBlock = cfg.createBlock('normal');
    execBlock.statements = [node.execution];
    execBlock.metadata = { label: 'Execute LINQ query' };
    
    cfg.addEdge(queryDefBlock, execBlock, { 
      label: 'deferred until enumeration',
      style: 'dotted'
    });
  }
}
```

**Python CFG Builder:**

```typescript
class PythonCFGBuilder {
  private handleAsync(node: AsyncFunctionNode, cfg: ControlFlowGraph) {
    // Handle async/await
    for (const statement of node.statements) {
      if (statement.type === 'await') {
        const awaitBlock = cfg.createBlock('suspend');
        awaitBlock.statements = [statement];
        awaitBlock.metadata = { label: 'await (coroutine pause)' };
      }
    }
  }
  
  private handleWith(node: WithNode, cfg: ControlFlowGraph) {
    // with statement (context manager)
    
    // Enter block
    const enterBlock = cfg.createBlock('normal');
    enterBlock.statements = [`${node.resource}.__enter__()`];
    
    // Body blocks
    const bodyBlocks = this.buildBlocksFromStatements(node.body);
    
    // Exit block (always runs, even on exception)
    const exitBlock = cfg.createBlock('normal');
    exitBlock.statements = [`${node.resource}.__exit__()`];
    exitBlock.metadata = { label: 'cleanup (always runs)' };
    
    // Connect
    cfg.addEdge(enterBlock, bodyBlocks[0]);
    cfg.addEdge(bodyBlocks[bodyBlocks.length - 1], exitBlock);
    
    // Exception path also goes to exit
    for (const bodyBlock of bodyBlocks) {
      cfg.addEdge(bodyBlock, exitBlock, { 
        condition: 'exception',
        label: 'error (cleanup still runs)'
      });
    }
  }
  
  private handleComprehension(node: ComprehensionNode, cfg: ControlFlowGraph) {
    // List/dict/set comprehension
    // [x * 2 for x in items if x > 0]
    
    // This is actually a loop + filter
    const loopBlock = cfg.createBlock('loop');
    const filterBlock = cfg.createBlock('decision');
    const transformBlock = cfg.createBlock('normal');
    
    cfg.addEdge(loopBlock, filterBlock);
    cfg.addEdge(filterBlock, transformBlock, { condition: 'true' });
    cfg.addEdge(transformBlock, loopBlock, { label: 'next item' });
  }
}
```

---

### PHASE 2: Flow Analysis & Optimization

#### 2.1 Path Analysis

```typescript
class FlowAnalyzer {
  analyzeExecutionPaths(cfg: ControlFlowGraph): ExecutionPath[] {
    // Find all possible execution paths
    const paths: ExecutionPath[] = [];
    
    function traverse(block: BasicBlock, path: BasicBlock[] = []) {
      if (block.type === 'exit') {
        paths.push({ blocks: [...path, block] });
        return;
      }
      
      if (path.includes(block)) {
        // Cycle detected (loop)
        paths.push({ 
          blocks: [...path, block], 
          hasLoop: true,
          loopEntry: block
        });
        return;
      }
      
      for (const edge of block.successors) {
        traverse(edge.to, [...path, block]);
      }
    }
    
    traverse(cfg.entry);
    return paths;
  }
  
  identifyHotPaths(paths: ExecutionPath[]): ExecutionPath[] {
    // "Hot paths" are the most common/important execution flows
    // These should be emphasized in the diagram
    
    return paths.filter(path => {
      // Success path (no exceptions)
      const hasNoExceptions = !path.blocks.some(b => 
        b.successors.some(e => e.condition === 'exception')
      );
      
      // Most direct path (fewest blocks)
      const isShortPath = path.blocks.length <= this.calculateAverage(paths);
      
      return hasNoExceptions && isShortPath;
    });
  }
  
  detectUnreachableCode(cfg: ControlFlowGraph): BasicBlock[] {
    // Find blocks that can never be reached
    const visited = new Set<BasicBlock>();
    
    function visit(block: BasicBlock) {
      if (visited.has(block)) return;
      visited.add(block);
      
      for (const edge of block.successors) {
        visit(edge.to);
      }
    }
    
    visit(cfg.entry);
    
    return cfg.blocks.filter(b => !visited.has(b));
  }
}
```

#### 2.2 Simplification Engine

```typescript
class FlowchartSimplifier {
  simplify(cfg: ControlFlowGraph, complexity: 'low' | 'medium' | 'high'): ControlFlowGraph {
    // Smart simplification based on code complexity
    
    if (complexity === 'low') {
      // Simple function - can be more detailed
      return cfg;
    } else if (complexity === 'medium') {
      // Merge trivial blocks
      return this.mergeTrivialBlocks(cfg);
    } else {
      // Complex function - aggressive simplification
      return this.aggressiveSimplification(cfg);
    }
  }
  
  private mergeTrivialBlocks(cfg: ControlFlowGraph): ControlFlowGraph {
    // Merge blocks that are just sequential statements
    
    const newBlocks: BasicBlock[] = [];
    let currentMergedBlock: BasicBlock | null = null;
    
    for (const block of cfg.blocks) {
      // If block has only one successor and no decision
      if (block.successors.length === 1 && block.type === 'normal') {
        if (!currentMergedBlock) {
          currentMergedBlock = { ...block };
        } else {
          // Merge into current
          currentMergedBlock.statements.push(...block.statements);
        }
      } else {
        // Decision point or multiple successors - can't merge
        if (currentMergedBlock) {
          newBlocks.push(currentMergedBlock);
          currentMergedBlock = null;
        }
        newBlocks.push(block);
      }
    }
    
    return { ...cfg, blocks: newBlocks };
  }
  
  private aggressiveSimplification(cfg: ControlFlowGraph): ControlFlowGraph {
    // For complex functions, only show key decision points
    
    const keyBlocks = cfg.blocks.filter(block => {
      // Keep decision points
      if (block.type === 'decision') return true;
      
      // Keep loop headers
      if (block.type === 'loop') return true;
      
      // Keep function calls
      if (block.statements.some(s => s.type === 'call')) return true;
      
      // Keep return statements
      if (block.statements.some(s => s.type === 'return')) return true;
      
      // Keep error handling
      if (block.successors.some(e => e.condition === 'exception')) return true;
      
      return false;
    });
    
    // Create new CFG with only key blocks
    return this.rebuildCFG(keyBlocks);
  }
  
  private groupRelatedBlocks(cfg: ControlFlowGraph): BlockGroup[] {
    // Group related blocks into higher-level constructs
    
    const groups: BlockGroup[] = [];
    
    // Group 1: Error handling
    const errorBlocks = cfg.blocks.filter(b => 
      b.statements.some(s => s.type === 'throw' || s.type === 'catch')
    );
    if (errorBlocks.length > 0) {
      groups.push({
        type: 'error_handling',
        blocks: errorBlocks,
        label: 'Error Handling',
        color: 'red'
      });
    }
    
    // Group 2: Data validation
    const validationBlocks = cfg.blocks.filter(b =>
      b.statements.some(s => 
        s.includes('validate') || 
        s.includes('check') ||
        s.includes('isEmpty') ||
        s.includes('isNull')
      )
    );
    if (validationBlocks.length > 0) {
      groups.push({
        type: 'validation',
        blocks: validationBlocks,
        label: 'Input Validation',
        color: 'blue'
      });
    }
    
    // Group 3: Business logic
    const businessBlocks = cfg.blocks.filter(b =>
      b.type === 'normal' && 
      !errorBlocks.includes(b) && 
      !validationBlocks.includes(b)
    );
    if (businessBlocks.length > 0) {
      groups.push({
        type: 'business_logic',
        blocks: businessBlocks,
        label: 'Core Logic',
        color: 'green'
      });
    }
    
    return groups;
  }
}
```

#### 2.3 Smart Decision Point Detection

```typescript
class DecisionPointAnalyzer {
  identifyCriticalDecisions(cfg: ControlFlowGraph): CriticalDecision[] {
    const decisions: CriticalDecision[] = [];
    
    for (const block of cfg.blocks) {
      if (block.type !== 'decision') continue;
      
      // Analyze impact of this decision
      const impact = this.analyzeImpact(block, cfg);
      
      decisions.push({
        block,
        impact: impact.score,
        affectedPaths: impact.paths,
        label: this.generateDecisionLabel(block, impact)
      });
    }
    
    // Sort by impact
    return decisions.sort((a, b) => b.impact - a.impact);
  }
  
  private analyzeImpact(decision: BasicBlock, cfg: ControlFlowGraph): DecisionImpact {
    // How many execution paths diverge from this decision?
    
    const truePathBlocks = this.getReachableBlocks(decision.successors[0].to);
    const falsePathBlocks = this.getReachableBlocks(decision.successors[1].to);
    
    const divergence = this.calculateDivergence(truePathBlocks, falsePathBlocks);
    
    return {
      score: divergence,
      paths: [truePathBlocks, falsePathBlocks],
      convergeAt: this.findConvergencePoint(truePathBlocks, falsePathBlocks)
    };
  }
  
  private generateDecisionLabel(block: BasicBlock, impact: DecisionImpact): string {
    // Generate human-readable label for decision
    
    const statement = block.statements[0];
    
    // Use AI to generate better label
    return this.aiEnhanceLabel(statement, impact);
  }
}
```

---

### PHASE 3: AI-Enhanced Visualization

#### 3.1 AI-Powered Node Labeling

```typescript
class AIFlowchartEnhancer {
  async enhanceLabels(cfg: ControlFlowGraph, context: LanguageContext): Promise<EnhancedCFG> {
    // Use AI to create meaningful, concise labels
    
    const enhancedBlocks = await Promise.all(
      cfg.blocks.map(async block => {
        const originalStatements = block.statements.map(s => s.code).join('\n');
        
        const label = await this.generateLabel(originalStatements, block.type, context);
        
        return {
          ...block,
          displayLabel: label,
          originalCode: originalStatements
        };
      })
    );
    
    return { ...cfg, blocks: enhancedBlocks };
  }
  
  private async generateLabel(
    statements: string,
    blockType: string,
    context: LanguageContext
  ): Promise<string> {
    
    const prompt = `
You are generating a concise flowchart label for ${context.language} code.

Block type: ${blockType}
Code:
${statements}

Requirements:
1. Max 50 characters
2. Describe WHAT happens, not HOW
3. Use active voice
4. No implementation details
5. For decisions, use question format

Examples:
- "if (user != null)" → "User exists?"
- "for (item in items)" → "For each item"
- "val result = api.call()" → "Call API"
- "try { ... } catch" → "Handle errors"

Generate label for this code:
    `;
    
    const response = await this.aiProvider.chat(prompt);
    return response.trim();
  }
  
  async optimizeLayout(cfg: EnhancedCFG): Promise<LayoutOptimization> {
    // Use AI to suggest optimal diagram layout
    
    const prompt = `
Given this control flow graph structure:

Entry block → ${cfg.entry.displayLabel}
${cfg.blocks.map(b => `  ${b.displayLabel} → [${b.successors.map(s => s.to.displayLabel).join(', ')}]`).join('\n')}

Suggest optimal layout:
1. Which blocks should be vertically aligned?
2. Which blocks should be side-by-side?
3. Which paths should be emphasized (thicker lines)?
4. Which paths are error paths (red)?
5. Suggest grouping/subgraphs

Return JSON with layout recommendations.
    `;
    
    const response = await this.aiProvider.chat(prompt);
    return JSON.parse(response);
  }
}
```

#### 3.2 Intelligent Diagram Generation

```typescript
class FlowchartGenerator {
  generateMermaid(cfg: EnhancedCFG, layout: LayoutOptimization): string {
    // Generate Mermaid.js flowchart syntax
    
    let mermaid = 'flowchart TD\n';
    
    // Add styles
    mermaid += this.generateStyles(cfg);
    
    // Add nodes
    for (const block of cfg.blocks) {
      const nodeId = `node${block.id}`;
      const shape = this.getNodeShape(block.type);
      
      mermaid += `  ${nodeId}${shape}${block.displayLabel}${shape.split('[')[1]}\n`;
    }
    
    // Add edges
    for (const block of cfg.blocks) {
      for (const edge of block.successors) {
        const fromId = `node${block.id}`;
        const toId = `node${edge.to.id}`;
        
        const edgeLabel = edge.label ? `|${edge.label}|` : '';
        const edgeStyle = this.getEdgeStyle(edge);
        
        mermaid += `  ${fromId} ${edgeStyle}${edgeLabel} ${toId}\n`;
      }
    }
    
    // Add styling
    mermaid += this.addStyling(cfg, layout);
    
    return mermaid;
  }
  
  private getNodeShape(type: string): string {
    switch (type) {
      case 'decision':
        return '{'; // Diamond shape
      case 'loop':
        return '[['; // Double rectangle
      case 'suspend':
        return '(['; // Stadium shape
      case 'entry':
      case 'exit':
        return '(['; // Rounded rectangle
      default:
        return '['; // Regular rectangle
    }
  }
  
  private getEdgeStyle(edge: Edge): string {
    if (edge.condition === 'exception') {
      return '-.->'; // Dotted line for exceptions
    }
    if (edge.style === 'dashed') {
      return '-->'; // Dashed for async
    }
    return '-->'; // Solid line
  }
  
  private addStyling(cfg: EnhancedCFG, layout: LayoutOptimization): string {
    let styling = '\n';
    
    // Color code by path type
    styling += 'classDef successPath fill:#90EE90\n';
    styling += 'classDef errorPath fill:#FFB6C6\n';
    styling += 'classDef loopPath fill:#ADD8E6\n';
    styling += 'classDef asyncPath fill:#FFE4B5\n';
    
    // Apply classes
    for (const block of cfg.blocks) {
      if (layout.successPathBlocks.includes(block.id)) {
        styling += `class node${block.id} successPath\n`;
      } else if (layout.errorPathBlocks.includes(block.id)) {
        styling += `class node${block.id} errorPath\n`;
      } else if (block.type === 'loop') {
        styling += `class node${block.id} loopPath\n`;
      } else if (block.type === 'suspend') {
        styling += `class node${block.id} asyncPath\n`;
      }
    }
    
    return styling;
  }
  
  generateD3(cfg: EnhancedCFG, layout: LayoutOptimization): D3GraphData {
    // Alternative: Generate D3.js force-directed graph
    
    const nodes = cfg.blocks.map(block => ({
      id: block.id,
      label: block.displayLabel,
      type: block.type,
      x: layout.positions[block.id].x,
      y: layout.positions[block.id].y
    }));
    
    const links = cfg.edges.map(edge => ({
      source: edge.from.id,
      target: edge.to.id,
      label: edge.label,
      type: edge.condition
    }));
    
    return { nodes, links };
  }
}
```

#### 3.3 Interactive Features

```typescript
class InteractiveFlowchart {
  addInteractivity(diagram: FlowchartDiagram, code: string): InteractiveDiagram {
    // Add clickable nodes that show code
    
    for (const node of diagram.nodes) {
      node.onClick = () => {
        this.showCodeModal(node.originalCode);
      };
      
      node.onHover = () => {
        this.highlightPath(node);
        this.showTooltip(node);
      };
    }
    
    // Add path highlighting
    diagram.addPathHighlight = (startNode: Node) => {
      const paths = this.getAllPathsFrom(startNode);
      
      for (const path of paths) {
        this.highlightPath(path, 'success');
      }
    };
    
    // Add complexity toggle
    diagram.addComplexityToggle = () => {
      // Toggle between simplified and detailed view
      this.simplified = !this.simplified;
      this.regenerateDiagram(this.simplified ? 'simple' : 'detailed');
    };
    
    return diagram;
  }
  
  private showCodeModal(code: string) {
    // Show original code in modal
    const modal = createModal({
      title: 'Original Code',
      content: `<pre><code>${code}</code></pre>`,
      buttons: ['Close']
    });
    modal.show();
  }
  
  private highlightPath(node: Node) {
    // Highlight all paths from this node
    const reachable = this.getReachableNodes(node);
    
    for (const n of reachable) {
      n.element.classList.add('highlighted');
    }
  }
  
  private showTooltip(node: Node) {
    // Show detailed info on hover
    const tooltip = createTooltip({
      title: node.label,
      content: `
        <div>
          <strong>Type:</strong> ${node.type}<br>
          <strong>Line:</strong> ${node.line}<br>
          <strong>Outgoing paths:</strong> ${node.successors.length}<br>
          <strong>Complexity:</strong> ${node.complexity}
        </div>
      `
    });
    tooltip.show(node.position);
  }
}
```

---

### PHASE 4: Advanced Features

#### 4.1 Multi-Function Flowcharts

```typescript
class MultiFunctionFlowchart {
  async generateCallGraph(
    functions: FunctionInfo[],
    context: LanguageContext
  ): Promise<CallGraphDiagram> {
    
    // Build call graph showing function relationships
    const callGraph: CallGraph = {
      nodes: functions.map(f => ({
        id: f.name,
        type: 'function',
        complexity: f.complexity,
        cfg: await this.cfgBuilder.buildCFG(f.ast, context.language)
      })),
      edges: []
    };
    
    // Identify function calls
    for (const func of functions) {
      const calls = this.extractFunctionCalls(func);
      
      for (const call of calls) {
        callGraph.edges.push({
          from: func.name,
          to: call.target,
          label: call.context
        });
      }
    }
    
    return this.visualizeCallGraph(callGraph);
  }
  
  async generateExpandableFlowchart(
    mainFunction: FunctionInfo,
    allFunctions: FunctionInfo[]
  ): Promise<ExpandableFlowchart> {
    
    // Main flowchart with expandable function call nodes
    
    const mainCFG = await this.cfgBuilder.buildCFG(mainFunction.ast);
    
    // Find function call blocks
    for (const block of mainCFG.blocks) {
      for (const statement of block.statements) {
        if (statement.type === 'call') {
          const calledFunc = allFunctions.find(f => f.name === statement.function);
          
          if (calledFunc) {
            // Make this node expandable
            block.expandable = true;
            block.expandedCFG = await this.cfgBuilder.buildCFG(calledFunc.ast);
          }
        }
      }
    }
    
    return mainCFG;
  }
}
```

#### 4.2 Diff Flowcharts (Before/After)

```typescript
class FlowchartDiffer {
  async generateDiffFlowchart(
    oldCode: string,
    newCode: string,
    context: LanguageContext
  ): Promise<DiffFlowchart> {
    
    // Generate CFGs for both versions
    const oldCFG = await this.cfgBuilder.buildCFG(oldCode, context);
    const newCFG = await this.cfgBuilder.buildCFG(newCode, context);
    
    // Compare CFGs
    const diff = this.compareCFGs(oldCFG, newCFG);
    
    // Visualize differences
    return {
      removed: diff.removedBlocks,
      added: diff.addedBlocks,
      modified: diff.modifiedBlocks,
      unchanged: diff.unchangedBlocks,
      diagram: this.visualizeDiff(diff)
    };
  }
  
  private compareCFGs(old: ControlFlowGraph, new: ControlFlowGraph): CFGDiff {
    // Find differences between two CFGs
    
    const oldBlocks = new Set(old.blocks.map(b => this.hashBlock(b)));
    const newBlocks = new Set(new.blocks.map(b => this.hashBlock(b)));
    
    const removed = old.blocks.filter(b => !newBlocks.has(this.hashBlock(b)));
    const added = new.blocks.filter(b => !oldBlocks.has(this.hashBlock(b)));
    
    // Find modified blocks (same position, different content)
    const modified = new.blocks.filter(b => {
      const oldBlock = old.blocks.find(ob => ob.id === b.id);
      return oldBlock && this.hashBlock(oldBlock) !== this.hashBlock(b);
    });
    
    return { removed, added, modified };
  }
}
```

#### 4.3 Performance Hotspot Visualization

```typescript
class PerformanceFlowchart {
  async addPerformanceMetrics(
    cfg: ControlFlowGraph,
    profilerData: ProfilerData
  ): Promise<PerformanceAnnotatedCFG> {
    
    // Add execution time and frequency to each block
    
    for (const block of cfg.blocks) {
      const metrics = profilerData.blocks[block.id];
      
      if (metrics) {
        block.executionTime = metrics.averageTime;
        block.executionCount = metrics.count;
        block.percentage = (metrics.totalTime / profilerData.totalTime) * 100;
        
        // Color code by performance
        if (block.percentage > 10) {
          block.color = 'red'; // Hot spot
        } else if (block.percentage > 5) {
          block.color = 'orange'; // Warm
        } else {
          block.color = 'green'; // Cool
        }
      }
    }
    
    return cfg;
  }
}
```

---

## 📊 IMPLEMENTATION ROADMAP

### Week 1-2: CFG Foundation (Focus: Kotlin)

**Tasks:**
1. **Day 1-3:** CFG Theory & Design
   - Study CFG concepts
   - Design data structures
   - Plan algorithm

2. **Day 4-7:** Basic CFG Builder
   - Implement BasicBlock and Edge classes
   - Build simple sequential flow
   - Test with linear code

3. **Day 8-10:** Kotlin CFG Builder
   - Handle if/else
   - Handle when statements
   - Handle loops (for, while)
   - Test with real Kotlin code

4. **Day 11-14:** Advanced Kotlin Features
   - Suspend functions
   - Coroutines
   - Try/catch/finally
   - Test with complex code

**Deliverable:** Working CFG builder for Kotlin

### Week 3: Flow Analysis

**Tasks:**
1. **Day 15-17:** Path Analysis
   - Implement path finding
   - Detect loops
   - Find unreachable code

2. **Day 18-21:** Simplification
   - Merge trivial blocks
   - Group related blocks
   - Smart simplification

**Deliverable:** CFG optimizer

### Week 4: Visualization

**Tasks:**
1. **Day 22-24:** Mermaid Generation
   - Generate Mermaid syntax
   - Add styling
   - Test rendering

2. **Day 25-28:** AI Enhancement
   - Label generation with AI
   - Layout optimization
   - Interactive features

**Deliverable:** Working flowchart generator for Kotlin

### Week 5-6: Other Languages

**Tasks:**
1. **Week 5:** Swift CFG Builder
   - Guard statements
   - Optional chaining
   - Swift concurrency

2. **Week 6:** C# and Python
   - C#: async/await, LINQ
   - Python: with, comprehensions

**Deliverable:** Multi-language support

### Week 7-8: Advanced Features

**Tasks:**
1. **Week 7:** Call graphs and multi-function
2. **Week 8:** Diff flowcharts, performance

**Deliverable:** Complete feature set

---

## 🎯 SUCCESS METRICS

### Quality Metrics

**Correctness:**
- All execution paths represented: 100%
- Conditional branches shown: 100%
- Loop back-edges present: 100%
- Exception paths visible: 100%

**Readability:**
- Node labels under 50 chars: 95%+
- Diagram not cluttered: User feedback
- Easy to follow flow: User feedback

**Completeness:**
- Async/await shown: 100%
- Error handling visible: 100%
- Early returns tracked: 100%

### Performance Metrics

**Generation Speed:**
- Simple functions (<20 lines): <1 second
- Medium functions (20-100 lines): <3 seconds
- Complex functions (>100 lines): <10 seconds

**Diagram Size:**
- Small code: 5-10 nodes
- Medium code: 10-30 nodes
- Large code: 30-50 nodes (with simplification)

---

## 💡 CURSOR PROMPT TO START

```markdown
I need to build an advanced code-to-flowchart system for CodeSentinel.

**Current Problem:**
- Flowcharts don't show actual execution flow
- Missing conditional branches (if/else not clear)
- Loops not represented properly
- No async/await visualization
- Error handling paths invisible
- Too simple or too complex

**Goal:**
Build Control Flow Graph (CFG) based flowchart generator that shows ALL execution paths clearly.

**Phase 1 - Kotlin CFG Builder:**

1. **CFG Foundation:**
   - Design BasicBlock and Edge data structures
   - Build CFG from Kotlin AST
   - Handle sequential statements

2. **Control Structures:**
   - If/else branching (show true/false paths)
   - When statements (multiple branches)
   - For/while loops (back edges)
   - Try/catch/finally (exception paths)

3. **Kotlin-Specific:**
   - Suspend functions (show suspension points)
   - Coroutine launches
   - Early returns (guard clauses)

4. **Visualization:**
   - Generate Mermaid.js diagrams
   - Color-code paths (success=green, error=red)
   - Use AI for node labels (keep under 50 chars)

**Example Target Output:**

For this code:
```kotlin
suspend fun fetchUser(id: String) {
    if (id.isEmpty()) throw IllegalArgumentException()
    val user = api.getUser(id) // suspend
    if (user == null) return
    saveUser(user)
}
```

Should generate flowchart showing:
- Entry
- id.isEmpty check → true: throw exception, false: continue
- api.getUser call with suspend marker
- user == null check → true: early return, false: continue  
- saveUser call
- Exit

**What I Need:**
1. CFG data structure design
2. Algorithm to build CFG from AST
3. How to handle loops (back edges)
4. How to visualize with Mermaid
5. File/module structure

Focus: Get Kotlin CFG builder working first before other languages.

Please help me design the architecture without writing code yet.
```

---

## 🚨 CRITICAL POINTS

### 1. CFG is Not AST
- AST = syntax tree (code structure)
- CFG = execution flow (how code runs)
- Must convert AST → CFG

### 2. Handle All Edge Cases
- Early returns
- Break/continue in loops
- Multiple exception handlers
- Async suspension points
- Nested control structures

### 3. Balance Simplicity and Detail
- Too simple = useless
- Too detailed = overwhelming
- Use AI to find balance

### 4. Test with Real Code
- Not just toy examples
- Real production functions
- Edge cases and complex logic

### 5. Make It Interactive
- Click to see code
- Hover for details
- Expand/collapse sections
- Toggle simplified view

---

## 📚 RESOURCES NEEDED

### Theory
- Control Flow Graph fundamentals
- Data Flow Analysis
- Graph algorithms (path finding, cycle detection)

### Tools
- Graph visualization (Mermaid.js, D3.js)
- Layout algorithms (Dagre)
- AST parsers (already have)

### Testing
- Sample functions (simple → complex)
- Expected flowcharts
- User feedback

---

**Remember:** A flowchart should answer "What paths can the code take?" not "What code is written?" Focus on execution flow, not code structure.

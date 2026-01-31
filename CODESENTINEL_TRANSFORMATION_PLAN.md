# CodeSentinel Transformation Plan
## From Basic Pattern Matching to Advanced Language-Aware Analysis

---

## 📋 EXECUTIVE SUMMARY

**Project:** CodeSentinel - Professional Static Code Analysis Platform

**Current State Analysis:**
- **Detection Method:** 477+ hardcoded regex patterns
- **AI Usage:** Limited to explanations only (not actual analysis)
- **Accuracy:** 3.5-4/10 (per actual ChatGPT evaluation of real outputs)
  - **Kotlin Analysis:** 3.5/10 - Applying JavaScript rules to Kotlin
  - **Python Analysis:** 4/10 - False positives on hardcoded passwords, print statements
- **Main Issues:**
  - **Critical Flaw:** Applying JavaScript rules (`===` vs `==`) to Kotlin/Python
  - **False Positives:** Flagging normal code as issues (print statements, UI padding numbers)
  - **Context Blindness:** Doesn't understand language idioms or project type
  - **Wrong Severity:** Treating warnings as critical errors
  - **Missing Language Rules:** No understanding of language-specific best practices

**Target State:**
- **Detection Method:** Language-aware AST parsing + AI-powered analysis
- **AI Usage:** Integrated at every analysis layer
- **Accuracy Target:** 9+/10
- **Focus Languages (Priority Order):**
  1. **Kotlin** (Android, Jetpack Compose, Coroutines)
  2. **Swift** (iOS, SwiftUI, Concurrency)
  3. **.NET/C#** (ASP.NET Core, async/await)
  4. **Python** (FastAPI, Django, async)

---

## 🎯 CORE PROBLEMS IDENTIFIED

### Problem 1: Shallow Detection Engine
**Current Issue:**
```typescript
// Generic regex pattern applied to ALL languages
const MAGIC_NUMBER_PATTERN = /\b\d+\b/g;
// Results in false positives like HTTP 404, 200, etc.

// CRITICAL FLAW: JavaScript rules applied to Kotlin
const STRICT_EQUALITY = /==/g;  
// Suggests === in Kotlin where it means REFERENCE equality
```

**Real Example from ChatGPT Evaluation (3.5/10 score):**

**Kotlin Code:**
```kotlin
if (user == null) return
if (name.isEmpty()) showError()
setPadding(16)  // UI padding
```

**Current Scanner Output:**
```
❌ Issue: Use strict equality (===) instead of ==
   Severity: Medium
   Why wrong: In Kotlin, === checks reference equality, not value equality!
   "A" == "A" → TRUE (correct for value comparison)
   "A" === "A" → may be FALSE depending on string interning
   
❌ Issue: Magic number detected (16)
   Severity: Medium
   Why wrong: UI padding values are normal in Android!
   setPadding(16) is idiomatic, not a magic number
   
❌ Issue: Loose equality detected
   Why wrong: Kotlin doesn't have "loose" vs "strict" equality like JavaScript
```

**Python Code:**
```python
password = getpass.getpass("Choose password: ")
if username == "admin":
    print("Welcome admin")
```

**Current Scanner Output (4/10 score):**
```
❌ CRITICAL: Hardcoded password detected
   Line: password = getpass.getpass("Choose password: ")
   Why wrong: This is reading user input, NOT a hardcoded password!
   The scanner saw the string "password" and flagged it
   
❌ Issue: Use === instead of ==
   Why wrong: Python doesn't have === operator!
   This is a JavaScript rule applied to Python
   
❌ Issue: Debug print statement should be removed
   Line: print("Welcome admin")
   Why wrong: This is a CLI application - printing is normal!
   Not a debug statement to remove
```

**Why It Fails:**
- Can't understand code context (is this a CLI app or production API?)
- Doesn't know language-specific operators (`===` doesn't exist in Python/Kotlin)
- Treats all numbers as "magic numbers" (even UI values, HTTP codes)
- Pattern matches strings without understanding meaning (`"password"` in user input ≠ hardcoded password)
- Example: Suggests Python solutions for Kotlin code, JavaScript patterns for Python

**Impact:**
- 60%+ false positive rate
- Flags idiomatic code as problematic
- Misses actual issues hidden in structure

### Problem 2: Weak AI Integration
**Current Implementation:**
```typescript
// AI only formats pre-detected issues
async function explainIssue(issue: DetectedIssue) {
  return await groqAPI.explain(issue.description);
}
```

**Why It Fails:**
- AI sees results AFTER wrong detection
- Can't provide context or validate findings
- "Garbage in, garbage out" - explains wrong issues beautifully

**Impact:**
- AI explains non-issues
- Recommendations don't match language best practices
- No architectural insights

### Problem 3: No Language Context Awareness
**Real Example from ChatGPT Evaluation:**

**Kotlin Android Code:**
```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)
        val usernameField = findViewById<EditText>(R.id.usernameInput)
    }
}
```

**Current Detection (from actual screenshot):**
```
❌ Issue: onDestroy Cleanup Missing
   Severity: Medium
   Message: "Resources registered in onCreate should be cleaned up in onDestroy"
   Line: 15 (onCreate method)
   
WHY THIS IS WRONG:
- No resources to clean up! 
- findViewById creates no persistent listeners
- No BroadcastReceivers registered
- No sensors registered
- No coroutines launched
- Just UI initialization

This is a FALSE POSITIVE from blind pattern matching.
```

**What Actually Needs Cleanup:**
```kotlin
// ✅ These DO need cleanup:
override fun onCreate(savedInstanceState: Bundle?) {
    // 1. BroadcastReceiver
    registerReceiver(myReceiver, filter)  // ← needs unregisterReceiver
    
    // 2. Sensors
    sensorManager.registerListener(this, sensor)  // ← needs unregisterListener
    
    // 3. Coroutines without lifecycle scope
    GlobalScope.launch { }  // ← needs cancellation
    
    // 4. Manual observers
    viewModel.data.observeForever(observer)  // ← needs removeObserver
}

// ❌ These DON'T need cleanup:
override fun onCreate(savedInstanceState: Bundle?) {
    findViewById<Button>(R.id.btn).setOnClickListener { }  // ← lifecycle handles this
    val adapter = MyAdapter()  // ← no cleanup needed
    recyclerView.adapter = adapter  // ← no cleanup needed
}
```

**More False Positives:**

**Kotlin idiomatic code:**
```kotlin
val repository by lazy { RepositoryImpl() }
```

**Current Detection:**
```
❌ Issue: Lazy initialization detected
   Suggestion: Use eager initialization
   
WHY WRONG: `by lazy` is IDIOMATIC Kotlin delegation!
This is the CORRECT way to do lazy initialization in Kotlin.
```

**Swift idiomatic code:**
```swift
guard let user = optionalUser else { return }
```

**Current Detection:**
```
❌ Issue: Early return detected
   Suggestion: Use proper control flow
   
WHY WRONG: Guard statements with early returns are IDIOMATIC Swift!
This is the recommended pattern by Apple.
```

**Python CLI code:**
```python
username = input("Enter username: ")
password = getpass.getpass("Enter password: ")
print("Welcome!")
```

**Current Detection:**
```
❌ CRITICAL: Hardcoded password: getpass.getpass("Enter password: ")
❌ Issue: Debug print statement: print("Welcome!")
   
WHY WRONG:
1. This is reading user input, not hardcoding a password
2. This is a CLI app - printing is the INTENDED output, not debug code
```

**The Core Problem:**
The scanner sees keywords (`password`, `print`, `lazy`, `return`) and flags them WITHOUT understanding:
- What language is this?
- What's the project type? (CLI, Android app, web API, library)
- Is this idiomatic for this language?
- Is this the correct pattern for this framework?

**Impact:**
- 60%+ false positive rate on production-quality code
- Developers lose trust in the tool
- Real issues ignored due to noise
- Suggests anti-patterns as "fixes"

### Problem 4: Missing Architecture Intelligence
**Current Analysis Level:**
```
✓ Line 15: Variable name too short
✓ Line 23: Function is 51 lines (max 50)
✗ Missing: This class violates MVVM - UI logic in ViewModel
✗ Missing: Data layer leaking into presentation
✗ Missing: Missing error handling strategy
```

**Why It Matters:**
- Line-level issues are trivial
- Architecture issues cause maintenance nightmares
- Can't see the forest for the trees

### Problem 5: Generic Code Health Scoring
**Current Scoring:**
```typescript
complexity = calculateCyclomaticComplexity(code);
score = complexity > 10 ? "Poor" : "Good";
```

**Why Inadequate:**
- Doesn't understand language context
- Kotlin suspend functions complexity ≠ regular functions
- SwiftUI declarative code reads different than imperative
- No framework-specific metrics

---

## 🔴 ACTUAL CHATGPT EVALUATION RESULTS

### Kotlin Android Analysis (3.5/10)

**Test Code:** Login Activity with basic UI setup

**Scanner Output Breakdown:**

| Issue Detected | Scanner Verdict | Reality | Score |
|----------------|----------------|---------|-------|
| "Use === instead of ==" | ❌ Error | FALSE POSITIVE - Kotlin doesn't work like JS | 0/10 |
| "findViewById deprecated" | ✅ Warning | CORRECT - ViewBinding is better | 10/10 |
| "Magic numbers" (padding) | ❌ Warning | FALSE POSITIVE - UI values are normal | 0/10 |
| "Large class" at line 9 | ❌ Warning | FALSE POSITIVE - Class hasn't been read yet | 0/10 |
| "onDestroy cleanup missing" | ❌ Warning | FALSE POSITIVE - No resources to clean | 0/10 |

**Total Score: 3.5/10** (only 1 correct out of 5-6 findings)

**Key Failures:**
1. ❌ Applied JavaScript strict equality rules to Kotlin
2. ❌ Flagged normal Android UI patterns as issues
3. ❌ Assumed cleanup needed when no resources were allocated
4. ❌ Detected "large class" before reading the full class
5. ❌ No understanding of Android lifecycle patterns

---

### Python CLI Script Analysis (4/10)

**Test Code:** Simple password manager with bcrypt

**Scanner Output Breakdown:**

| Issue Detected | Scanner Verdict | Reality | Score |
|----------------|----------------|---------|-------|
| "Hardcoded password" | ❌ CRITICAL | FALSE POSITIVE - It's user INPUT | 0/10 |
| "Use === instead of ==" | ❌ Error | FALSE POSITIVE - Python has no === | 0/10 |
| "Remove print statements" | ❌ Warning | FALSE POSITIVE - CLI apps print output | 0/10 |
| "Missing input validation" | ✅ Warning | CORRECT - Should check empty strings | 10/10 |
| "No password complexity check" | ✅ Warning | CORRECT - Should enforce min length | 10/10 |
| "Missing error handling" | ✅ Warning | CORRECT - bcrypt could fail | 10/10 |
| "In-memory storage warning" | ✅ Info | CORRECT - Data lost on exit | 10/10 |
| "Missing type hints" | ⚠️ Info | OVERLY STRICT - Not required for scripts | 5/10 |

**Total Score: 4/10** (4 correct, 3 completely wrong, 1 overly strict)

**Key Failures:**
1. ❌ Saw "password" string and assumed hardcoded credential
2. ❌ Applied JavaScript syntax rules to Python
3. ❌ Flagged normal CLI output as debug code
4. ⚠️ Too aggressive on type hints for small scripts
5. ✅ Some security suggestions were actually good

---

## 📊 PATTERN OF FAILURES (Root Causes)

### 1. Language Rule Mixing (CRITICAL)
```
JavaScript Rule: === vs == (strict vs loose equality)
   ↓
Applied to Kotlin → WRONG (=== is reference equality)
Applied to Python → WRONG (=== doesn't exist)
Applied to C# → WRONG (uses .Equals or ==)
```

### 2. Keyword-Based Detection Without Context
```
Pattern: /password/i
   ↓
Matches: password = getpass.getpass(...)  → "HARDCODED PASSWORD" ❌
Should be: User input, not hardcoded

Pattern: /\d+/
   ↓  
Matches: setPadding(16)  → "MAGIC NUMBER" ❌
Should be: Normal UI value

Pattern: /print\(/
   ↓
Matches: print("Welcome")  → "DEBUG STATEMENT" ❌
Should be: CLI application output
```

### 3. No Project Type Awareness
```
Code: print("Welcome admin")
   ↓
Scanner thinks: "Debug statement to remove"
Reality: CLI application - printing is the PURPOSE
```

### 4. No Framework Understanding
```
Code: onCreate() { findViewById(...) }
   ↓
Scanner thinks: "Must cleanup in onDestroy"
Reality: Android lifecycle handles this automatically
```

### 5. False Positive Generator
```
ACTUAL ISSUES DETECTED: 5/15 (33%)
FALSE POSITIVES: 8/15 (53%)
OVERLY STRICT: 2/15 (13%)

User trust destroyed by 50%+ false positive rate.
```

---

## 🎯 SPECIFIC IMPROVEMENTS NEEDED

Based on ChatGPT evaluation, the system MUST:

### 1. Language-Specific Rule Isolation
```typescript
// WRONG (current):
const rules = {
  strict_equality: /==/g,  // applied to all languages
  magic_numbers: /\d+/g    // applied to all languages
};

// RIGHT (target):
const rules = {
  javascript: {
    strict_equality: /==/g,  // only for JS
    truthy_checks: /if\s*\(/  // only for JS
  },
  kotlin: {
    null_safety: /!!/g,       // Kotlin-specific
    lateinit_usage: /lateinit/g
  },
  python: {
    mutable_defaults: /def.*=\[\]/g  // Python-specific
  }
};
```

### 2. Context-Aware Detection
```typescript
// Must understand:
- Project type (CLI, Android app, web API, library)
- Framework (Jetpack Compose, SwiftUI, FastAPI)
- Language version (Kotlin 1.9 vs 2.0)
- Idiomatic patterns per language

if (language === 'python' && projectType === 'cli') {
  // print() statements are EXPECTED, not debug code
  suppress('print_statement');
}

if (language === 'kotlin' && framework === 'android') {
  // UI padding numbers are NORMAL
  suppress('magic_number', { context: 'ui_values' });
}
```

### 3. Smart False Positive Filtering
```typescript
// Before reporting issue, validate:
1. Is this actually problematic in THIS language?
2. Is this idiomatic code for THIS framework?
3. Does the project type justify this pattern?
4. Is there ACTUAL harm or just stylistic preference?

Example:
Detected: password = getpass.getpass("Password: ")
  ↓
Check: Is this reading input? YES
Check: Is "password" just a variable name? YES
Check: Is there an actual hardcoded credential? NO
  ↓
Result: SUPPRESS - This is user input, not a security issue
```

### 4. Severity Calibration
```typescript
// Current: Everything is Medium/High
// Target: Proper severity based on actual impact

CRITICAL: SQL injection, XSS, credential leaks (REAL ones)
HIGH: Security issues, major bugs, memory leaks
MEDIUM: Performance issues, minor security concerns
LOW: Style preferences, type hints
INFO: Suggestions, alternatives, best practices

// Stop treating style preferences as security issues!
```

---

## 🏗️ TRANSFORMATION ARCHITECTURE

### Overview: Multi-Layer Analysis System

```
┌─────────────────────────────────────────────────────────┐
│                    USER INPUT CODE                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: LANGUAGE DETECTION & CONTEXT                  │
│  - Detect language + version + framework                │
│  - Load language-specific rule sets                     │
│  - Build analysis context                               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: LANGUAGE-SPECIFIC AST PARSING                 │
│  - Kotlin: Tree-sitter / PSI                            │
│  - Swift: SwiftSyntax                                   │
│  - C#: Roslyn API                                       │
│  - Python: Enhanced AST                                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: AI-POWERED PATTERN RECOGNITION                │
│  - Groq API: Intent analysis                            │
│  - Gemini: Architecture patterns                        │
│  - Context-aware issue detection                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: LANGUAGE-SPECIFIC ANALYZERS                   │
│  - Kotlin: Coroutine + Compose + MVVM analysis          │
│  - Swift: SwiftUI + Concurrency + Memory analysis       │
│  - C#: Async/await + DI + ASP.NET analysis              │
│  - Python: Type hints + Framework analysis              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 5: ARCHITECTURE VALIDATION                       │
│  - Pattern recognition (MVVM, Clean, etc.)              │
│  - Layer boundary validation                            │
│  - Dependency direction checking                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 6: AI-ENHANCED REPORTING                         │
│  - Context-rich explanations                            │
│  - Language-idiomatic solutions                         │
│  - Architecture recommendations                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ FINAL RESULTS │
              └───────────────┘
```

---

## 🔧 DETAILED IMPLEMENTATION PLAN

### PHASE 1: Language-Aware Detection Foundation (Weeks 1-2)

#### 1.1 Robust Language Detection System

**Objective:** Know exactly what we're analyzing

**Current Problem:**
```typescript
// Current: Just looks at file extension
const language = filename.endsWith('.kt') ? 'kotlin' : 'unknown';
```

**Target Solution:**
```typescript
interface LanguageContext {
  language: 'kotlin' | 'swift' | 'csharp' | 'python';
  version: string;              // "1.9.0", "5.9", "12.0", "3.11"
  frameworks: string[];         // ["Jetpack Compose", "Coroutines"]
  architectureHints: string[];  // ["MVVM", "Clean Architecture"]
  projectType: string;          // "Android App", "iOS App", "Web API"
  dependencies: Dependency[];   // Detected libraries
}

async function detectLanguageContext(code: string, filename: string): Promise<LanguageContext> {
  // 1. Syntax analysis (not just extension)
  // 2. Import statement parsing
  // 3. Framework detection
  // 4. Version inference from syntax features
  // 5. AI-assisted context building
}
```

**Implementation Steps:**

1. **Syntax-Based Detection**
   ```typescript
   // Detect by analyzing actual syntax patterns
   const kotlinPatterns = [
     /fun\s+\w+\s*\(/,           // function declaration
     /val\s+\w+\s*=/,             // val keyword
     /suspend\s+fun/,             // suspend functions
     /@Composable/                // Compose annotation
   ];
   
   const swiftPatterns = [
     /@State\s+var/,              // SwiftUI state
     /func\s+\w+\s*\(/,           // function declaration
     /struct\s+\w+\s*:\s*View/,   // SwiftUI view
     /async\s+throws/             // async/await
   ];
   ```

2. **Framework Detection**
   ```typescript
   // Analyze imports to detect frameworks
   const frameworkPatterns = {
     kotlin: {
       'kotlinx.coroutines': 'Coroutines',
       'androidx.compose': 'Jetpack Compose',
       'androidx.lifecycle': 'Android Architecture Components'
     },
     swift: {
       'import SwiftUI': 'SwiftUI',
       'import Combine': 'Combine',
       'import UIKit': 'UIKit'
     }
   };
   ```

3. **Version Detection**
   ```typescript
   // Infer version from syntax features
   // Example: Kotlin 1.9+ has data objects
   if (code.includes('data object')) {
     version = '1.9+';
   }
   ```

4. **AI-Assisted Context Building**
   ```typescript
   const prompt = `
   Analyze this code and provide context:
   
   Code snippet:
   ${code.substring(0, 500)}
   
   Identify:
   1. Programming language and version
   2. Frameworks used
   3. Architecture pattern (MVVM, MVC, etc.)
   4. Project type (mobile app, web API, etc.)
   5. Key libraries
   
   Respond in JSON format.
   `;
   ```

#### 1.2 Language-Specific Parser Integration

**Objective:** True AST understanding for each language

**Kotlin Parser Setup:**

```typescript
// Use Tree-sitter for Kotlin
import Parser from 'tree-sitter';
import Kotlin from 'tree-sitter-kotlin';

class KotlinParser {
  private parser: Parser;
  
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Kotlin);
  }
  
  async parse(code: string): Promise<KotlinAST> {
    const tree = this.parser.parse(code);
    
    return {
      functions: this.extractFunctions(tree),
      classes: this.extractClasses(tree),
      coroutines: this.extractCoroutines(tree),
      flows: this.extractFlows(tree),
      composables: this.extractComposables(tree)
    };
  }
  
  private extractCoroutines(tree: Tree): CoroutineUsage[] {
    // Find all suspend functions
    // Analyze coroutine scope usage
    // Detect Flow operators
    // Check structured concurrency
  }
  
  private extractComposables(tree: Tree): ComposableInfo[] {
    // Find @Composable functions
    // Analyze state management (@remember, @State)
    // Check recomposition triggers
  }
}
```

**Swift Parser Setup:**

```typescript
// Use SwiftSyntax
import { SwiftParser } from 'swift-syntax-js'; // Hypothetical binding

class SwiftParser {
  async parse(code: string): Promise<SwiftAST> {
    const ast = await SwiftParser.parse(code);
    
    return {
      structs: this.extractStructs(ast),
      classes: this.extractClasses(ast),
      swiftUIViews: this.extractSwiftUIViews(ast),
      propertyWrappers: this.extractPropertyWrappers(ast),
      asyncFunctions: this.extractAsyncFunctions(ast)
    };
  }
  
  private extractPropertyWrappers(ast: AST): PropertyWrapperUsage[] {
    // Find @State, @Binding, @StateObject, etc.
    // Analyze usage patterns
    // Check for memory leaks (retain cycles)
  }
  
  private extractSwiftUIViews(ast: AST): ViewInfo[] {
    // Find View conformances
    // Analyze body property
    // Check view lifecycle
  }
}
```

**C# Parser Setup:**

```typescript
// Use Roslyn API (via child process or WebAssembly)
class CSharpParser {
  async parse(code: string): Promise<CSharpAST> {
    // Call Roslyn compiler API
    const ast = await this.invokeRoslyn(code);
    
    return {
      methods: this.extractMethods(ast),
      classes: this.extractClasses(ast),
      asyncMethods: this.extractAsyncMethods(ast),
      dependencies: this.extractDependencies(ast)
    };
  }
  
  private extractAsyncMethods(ast: AST): AsyncMethodInfo[] {
    // Find async methods
    // Check for async void
    // Analyze Task usage
    // Detect deadlock patterns
  }
}
```

**Python Parser Enhancement:**

```typescript
// Enhance existing AST parser
class PythonParser {
  async parse(code: string): Promise<PythonAST> {
    const ast = pythonParser.parse(code);
    
    return {
      functions: this.extractFunctions(ast),
      classes: this.extractClasses(ast),
      typeHints: this.extractTypeHints(ast),
      asyncFunctions: this.extractAsyncFunctions(ast),
      decorators: this.extractDecorators(ast)
    };
  }
  
  private extractTypeHints(ast: AST): TypeHintInfo[] {
    // Find type annotations
    // Check for missing hints
    // Validate generic usage
  }
}
```

---

### PHASE 2: AI-Powered Deep Analysis Engine (Weeks 3-4)

#### 2.1 Multi-Layer AI Analysis Strategy

**Layer 1: Intelligent Pre-Processing**

```typescript
async function analyzeCodeIntent(code: string, context: LanguageContext): Promise<CodeIntent> {
  const prompt = `
You are a senior ${context.language} architect.

Analyze this code to understand its purpose and structure:

\`\`\`${context.language}
${code}
\`\`\`

Context:
- Language: ${context.language} ${context.version}
- Frameworks: ${context.frameworks.join(', ')}
- Project Type: ${context.projectType}

Provide:
1. Primary purpose of this code
2. Architecture pattern used
3. Complexity level (Simple/Medium/Complex/Very Complex)
4. Domain/feature area
5. Key dependencies
6. Potential concerns (high-level only)

Respond in JSON format.
  `;
  
  const response = await groqAPI.chat(prompt);
  return JSON.parse(response);
}
```

**Layer 2: AI-Assisted Pattern Detection**

```typescript
async function detectPatternsWithAI(
  ast: AST,
  context: LanguageContext,
  intent: CodeIntent
): Promise<DetectedPattern[]> {
  
  const prompt = `
You are an expert ${context.language} code reviewer specializing in ${context.frameworks.join(', ')}.

Code structure:
${JSON.stringify(ast, null, 2)}

Code purpose: ${intent.purpose}
Architecture: ${intent.architecture}

Identify anti-patterns and issues specific to ${context.language}:

For Kotlin, check:
- Coroutine scope misuse (GlobalScope, inappropriate lifecycles)
- Flow cold/hot misuse
- Incorrect state management in Compose
- MVVM violations (business logic in ViewModel)
- Non-null assertion (!!) abuse

For Swift, check:
- Property wrapper misuse (@State vs @StateObject)
- Memory retention cycles in closures
- Incorrect async/await usage
- Actor isolation violations

For C#, check:
- Async void methods
- Deadlock risks (blocking on async)
- DI lifetime issues (Singleton vs Scoped)
- Missing ConfigureAwait

For Python, check:
- Missing type hints
- Mutable default arguments
- Incorrect async/await usage
- Framework-specific anti-patterns

Return JSON array of issues with:
- pattern: string (pattern name)
- severity: 'critical' | 'high' | 'medium' | 'low'
- locations: number[] (line numbers)
- reason: string (why it's problematic)
- languageSpecific: boolean
  `;
  
  const response = await groqAPI.chat(prompt, { model: 'llama3-70b' });
  return JSON.parse(response);
}
```

**Layer 3: Architecture-Aware Analysis**

```typescript
async function analyzeArchitecture(
  codebase: CodebaseStructure,
  context: LanguageContext
): Promise<ArchitectureAnalysis> {
  
  const prompt = `
You are a software architect specializing in ${context.language} applications.

Codebase structure:
Files: ${codebase.files.map(f => `${f.path} (${f.type})`).join(', ')}

Dependency graph:
${JSON.stringify(codebase.dependencies, null, 2)}

Identified architecture: ${codebase.detectedArchitecture || 'Unknown'}

Analyze:
1. Is the architecture pattern correctly implemented?
2. Are layer boundaries respected?
3. Is dependency direction correct? (Should be: UI → Domain → Data)
4. Are there missing layers or components?
5. Are there circular dependencies?
6. Is separation of concerns maintained?

For ${context.language} specifically:
- Kotlin: Check MVVM with Clean Architecture, Hilt/Koin DI
- Swift: Check MVVM/VIPER, Coordinator pattern
- C#: Check Clean Architecture, Mediator pattern, DI configuration
- Python: Check layered architecture, FastAPI/Django structure

Return detailed JSON analysis.
  `;
  
  const response = await geminiAPI.chat(prompt); // Use Gemini for architecture
  return JSON.parse(response);
}
```

**Layer 4: Contextual Solution Generation**

```typescript
async function generateSolutions(
  issues: DetectedIssue[],
  context: LanguageContext,
  codeSnippet: string
): Promise<Solution[]> {
  
  const prompt = `
You are a senior ${context.language} developer.

Found issues in this code:
\`\`\`${context.language}
${codeSnippet}
\`\`\`

Issues detected:
${issues.map(i => `- ${i.pattern} (Line ${i.line}): ${i.description}`).join('\n')}

For EACH issue, provide:
1. Why it's problematic in ${context.language} specifically
2. Language-idiomatic solution (must follow ${context.language} best practices)
3. Complete code example showing the fix
4. Impact if not fixed
5. Effort to fix (Low/Medium/High)

Requirements:
- Solutions MUST be idiomatic ${context.language}
- Code examples MUST compile
- Consider ${context.frameworks.join(', ')} patterns
- Reference official ${context.language} style guide

Return JSON array of solutions.
  `;
  
  const response = await groqAPI.chat(prompt, { model: 'llama3-70b' });
  return JSON.parse(response);
}
```

#### 2.2 Free AI API Integration Strategy

**Multi-Provider Setup:**

```typescript
class AIAnalysisEngine {
  private providers: AIProvider[];
  private cache: ResultCache;
  
  constructor() {
    this.providers = [
      new GroqProvider({
        apiKeys: process.env.GROQ_API_KEYS.split(','), // Multiple keys for rotation
        models: {
          fast: 'llama-3.2-90b-text-preview',
          standard: 'llama-3.1-70b-versatile',
          deep: 'llama-3.1-70b-versatile'
        }
      }),
      new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.0-flash-exp',
        freeLimit: 1500 // requests per day
      }),
      new HuggingFaceProvider({
        apiKey: process.env.HF_API_KEY,
        models: {
          code: 'codellama/CodeLlama-34b-Instruct-hf',
          analysis: 'mistralai/Mixtral-8x7B-Instruct-v0.1'
        }
      })
    ];
    
    this.cache = new ResultCache({
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      storage: 'redis' // or localStorage for client-side
    });
  }
  
  async analyze(
    code: string,
    context: LanguageContext,
    depth: 'quick' | 'standard' | 'deep'
  ): Promise<AnalysisResult> {
    
    // Check cache first
    const cacheKey = this.generateCacheKey(code, context, depth);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Select provider based on availability and depth
    const provider = await this.selectProvider(depth);
    
    try {
      const result = await provider.analyze(code, context, depth);
      await this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      // Fallback to next provider
      return this.analyzeWithFallback(code, context, depth);
    }
  }
  
  private async selectProvider(depth: string): Promise<AIProvider> {
    // Try Groq first (fastest, good free tier)
    if (await this.providers[0].isAvailable()) {
      return this.providers[0];
    }
    
    // Try Gemini (good for architecture analysis)
    if (await this.providers[1].isAvailable()) {
      return this.providers[1];
    }
    
    // Try HuggingFace
    if (await this.providers[2].isAvailable()) {
      return this.providers[2];
    }
    
    throw new Error('No AI provider available - falling back to local analysis');
  }
  
  private generateCacheKey(code: string, context: LanguageContext, depth: string): string {
    const codeHash = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex')
      .substring(0, 16);
    
    return `analysis:${context.language}:${depth}:${codeHash}`;
  }
}
```

**Smart API Usage Optimization:**

```typescript
class APIUsageOptimizer {
  // Batch multiple analyses in single API call
  async batchAnalyze(analyses: AnalysisRequest[]): Promise<AnalysisResult[]> {
    const batchPrompt = `
Analyze these ${analyses.length} code snippets:

${analyses.map((a, i) => `
--- Snippet ${i + 1} (${a.context.language}) ---
${a.code}
---
`).join('\n')}

For each snippet, return:
[analysis structure]

Return JSON array with results in same order.
    `;
    
    const response = await this.aiProvider.chat(batchPrompt);
    return JSON.parse(response);
  }
  
  // Incremental analysis for code changes
  async analyzeIncremental(
    previousCode: string,
    newCode: string,
    previousAnalysis: AnalysisResult
  ): Promise<AnalysisResult> {
    
    const diff = this.computeDiff(previousCode, newCode);
    
    if (diff.changedLines.length < 10) {
      // Only analyze changed sections
      const prompt = `
Previous analysis found these issues:
${JSON.stringify(previousAnalysis.issues)}

Code changes:
${diff.changes}

Update the analysis:
1. Which previous issues are still valid?
2. Are there new issues in the changed code?
3. Were any issues fixed?

Return updated analysis.
      `;
      
      const response = await this.aiProvider.chat(prompt);
      return this.mergeAnalyses(previousAnalysis, JSON.parse(response));
    }
    
    // Large changes - full re-analysis
    return this.fullAnalyze(newCode);
  }
}
```

**Rate Limiting and Fallback:**

```typescript
class RateLimitHandler {
  private requestCounts: Map<string, number> = new Map();
  private resetTimes: Map<string, number> = new Map();
  
  async executeWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    try {
      if (this.canMakeRequest('groq')) {
        const result = await primary();
        this.recordRequest('groq');
        return result;
      } else {
        console.log('Rate limit reached for Groq, using fallback');
        return await fallback();
      }
    } catch (error) {
      if (error.message.includes('rate limit')) {
        this.blockProvider('groq', 60 * 60 * 1000); // Block for 1 hour
        return await fallback();
      }
      throw error;
    }
  }
  
  private canMakeRequest(provider: string): boolean {
    const count = this.requestCounts.get(provider) || 0;
    const limits = {
      groq: 30, // per minute
      gemini: 60, // per minute
      huggingface: 10 // per minute
    };
    
    return count < limits[provider];
  }
}
```

---

### PHASE 3: Language-Specific Intelligence Modules (Weeks 5-10)

#### 3.1 Kotlin Advanced Analysis Module (Weeks 5-6)

**Coroutine Expertise:**

```typescript
class KotlinCoroutineAnalyzer {
  async analyzeCoroutines(ast: KotlinAST): Promise<CoroutineIssue[]> {
    const issues: CoroutineIssue[] = [];
    
    // Check 1: GlobalScope usage (anti-pattern)
    const globalScopes = ast.coroutines.filter(c => c.scope === 'GlobalScope');
    for (const scope of globalScopes) {
      issues.push({
        type: 'GlobalScope Usage',
        severity: 'high',
        line: scope.line,
        message: 'GlobalScope creates unstructured concurrency',
        solution: await this.generateScopeSolution(scope)
      });
    }
    
    // Check 2: Missing structured concurrency
    const unstructuredLaunches = ast.coroutines.filter(c => 
      c.builder === 'launch' && !c.hasParentScope
    );
    
    // Check 3: Exception handling in coroutines
    const coroutinesWithoutExceptionHandling = ast.coroutines.filter(c =>
      !c.hasTryCatch && !c.hasSupervisorScope
    );
    
    // Check 4: Flow usage patterns
    const flowIssues = await this.analyzeFlows(ast.flows);
    issues.push(...flowIssues);
    
    // Check 5: Resource leaks
    const leaks = await this.detectResourceLeaks(ast.coroutines);
    issues.push(...leaks);
    
    return issues;
  }
  
  private async generateScopeSolution(scope: CoroutineScope): Promise<string> {
    // AI-generated Kotlin-idiomatic solution
    const prompt = `
Given this Kotlin coroutine usage:

\`\`\`kotlin
${scope.code}
\`\`\`

This uses GlobalScope which is an anti-pattern.

Provide the correct solution using:
1. viewModelScope (if in ViewModel)
2. lifecycleScope (if in Activity/Fragment)
3. CoroutineScope tied to component lifecycle

Return complete Kotlin code example.
    `;
    
    return await this.aiProvider.generate(prompt);
  }
  
  private async analyzeFlows(flows: FlowUsage[]): Promise<CoroutineIssue[]> {
    // Check for cold vs hot flow misuse
    // Validate flow operators (collect, collectLatest, etc.)
    // Check for proper flow cancellation
    // Verify stateIn/shareIn usage
  }
}
```

**Compose Analysis:**

```typescript
class JetpackComposeAnalyzer {
  async analyzeCompose(ast: KotlinAST): Promise<ComposeIssue[]> {
    const issues: ComposeIssue[] = [];
    
    // Check 1: State management
    const stateIssues = await this.analyzeStateManagement(ast.composables);
    issues.push(...stateIssues);
    
    // Check 2: Recomposition triggers
    const recompositionIssues = await this.analyzeRecomposition(ast.composables);
    issues.push(...recompositionIssues);
    
    // Check 3: Side effects
    const sideEffectIssues = await this.analyzeSideEffects(ast.composables);
    issues.push(...sideEffectIssues);
    
    return issues;
  }
  
  private async analyzeStateManagement(composables: ComposableFunction[]): Promise<ComposeIssue[]> {
    const issues: ComposeIssue[] = [];
    
    for (const composable of composables) {
      // Check for unstable references
      const unstableRefs = composable.parameters.filter(p => 
        !p.isStable && p.causesRecomposition
      );
      
      if (unstableRefs.length > 0) {
        issues.push({
          type: 'Unstable Composable Parameter',
          severity: 'medium',
          line: composable.line,
          message: `Parameters ${unstableRefs.map(r => r.name).join(', ')} will cause recomposition`,
          solution: 'Wrap in remember() or use @Stable/@Immutable'
        });
      }
      
      // Check for missing remember()
      const needsRemember = composable.localVars.filter(v =>
        v.isComputed && !v.isRemembered
      );
      
      // Check LaunchedEffect vs DisposableEffect usage
      const effectsIssues = this.validateEffects(composable.effects);
      issues.push(...effectsIssues);
    }
    
    return issues;
  }
}
```

**MVVM Pattern Validation:**

```typescript
class KotlinMVVMAnalyzer {
  async analyzeViewModel(viewModel: ClassInfo): Promise<MVVMIssue[]> {
    const issues: MVVMIssue[] = [];
    
    // Check 1: ViewModel should not access UI/Context
    if (viewModel.dependencies.some(d => d.includes('android.view') || d.includes('Context'))) {
      issues.push({
        type: 'UI Dependency in ViewModel',
        severity: 'high',
        message: 'ViewModel should not depend on Android UI classes',
        solution: 'Move UI logic to View layer, use callback interfaces'
      });
    }
    
    // Check 2: Business logic should be in UseCase/Interactor
    const businessLogicMethods = viewModel.methods.filter(m => 
      m.complexity > 10 || m.lines > 50
    );
    
    if (businessLogicMethods.length > 0) {
      issues.push({
        type: 'Business Logic in ViewModel',
        severity: 'medium',
        message: 'Complex business logic should be in UseCase layer',
        solution: 'Extract to UseCase classes, inject via Hilt'
      });
    }
    
    // Check 3: State exposure (LiveData vs StateFlow)
    const publicMutableState = viewModel.properties.filter(p =>
      p.isMutable && p.isPublic && (p.type.includes('MutableLiveData') || p.type.includes('MutableStateFlow'))
    );
    
    if (publicMutableState.length > 0) {
      issues.push({
        type: 'Exposed Mutable State',
        severity: 'medium',
        message: 'Expose immutable state, keep mutable private',
        solution: 'Use LiveData/StateFlow (immutable) publicly, MutableLiveData/MutableStateFlow privately'
      });
    }
    
    // Check 4: Direct Repository access
    if (viewModel.dependencies.some(d => d.includes('Repository'))) {
      issues.push({
        type: 'Direct Repository Access',
        severity: 'low',
        message: 'ViewModel should access Repository through UseCase',
        solution: 'Create UseCase layer for business logic'
      });
    }
    
    return issues;
  }
}
```

#### 3.2 Swift/SwiftUI Advanced Analysis Module (Weeks 7-8)

**SwiftUI Property Wrapper Analysis:**

```typescript
class SwiftUIPropertyWrapperAnalyzer {
  async analyzePropertyWrappers(view: SwiftUIView): Promise<SwiftUIIssue[]> {
    const issues: SwiftUIIssue[] = [];
    
    // Check 1: @State vs @StateObject confusion
    for (const property of view.properties) {
      if (property.wrapper === '@State' && property.type.includes('ObservableObject')) {
        issues.push({
          type: 'Incorrect Property Wrapper',
          severity: 'high',
          line: property.line,
          message: '@State should not be used with ObservableObject classes',
          solution: 'Use @StateObject for owned objects, @ObservedObject for injected objects',
          example: await this.generateStateObjectExample(property)
        });
      }
      
      // Check 2: @Binding misuse
      if (property.wrapper === '@Binding' && property.isPrivate) {
        issues.push({
          type: 'Private @Binding',
          severity: 'low',
          message: '@Binding properties should be public to accept parent state',
          solution: 'Make property public or use @State instead'
        });
      }
    }
    
    // Check 3: Missing @Published in ObservableObject
    const observableObjects = view.dependencies.filter(d => d.conformsTo.includes('ObservableObject'));
    for (const obj of observableObjects) {
      const unpublishedProperties = obj.properties.filter(p => 
        p.isMutable && !p.hasPublished
      );
      
      if (unpublishedProperties.length > 0) {
        issues.push({
          type: 'Missing @Published',
          severity: 'medium',
          message: 'Mutable properties in ObservableObject should be @Published',
          properties: unpublishedProperties.map(p => p.name)
        });
      }
    }
    
    return issues;
  }
}
```

**Memory Management Analysis:**

```typescript
class SwiftMemoryAnalyzer {
  async analyzeMemoryIssues(code: SwiftAST): Promise<MemoryIssue[]> {
    const issues: MemoryIssue[] = [];
    
    // Check 1: Retain cycles in closures
    const closures = code.closures;
    for (const closure of closures) {
      if (closure.capturesSelf && !closure.hasWeakSelf) {
        issues.push({
          type: 'Potential Retain Cycle',
          severity: 'high',
          line: closure.line,
          message: 'Closure captures self strongly, may cause memory leak',
          solution: 'Use [weak self] or [unowned self] in capture list',
          example: `
// Before
someMethod { 
  self.doSomething() 
}

// After
someMethod { [weak self] in
  self?.doSomething()
}
          `
        });
      }
    }
    
    // Check 2: Delegate strong references
    const delegates = code.properties.filter(p => 
      p.name.toLowerCase().includes('delegate') && !p.isWeak
    );
    
    for (const delegate of delegates) {
      issues.push({
        type: 'Strong Delegate Reference',
        severity: 'medium',
        line: delegate.line,
        message: 'Delegate should be weak to prevent retain cycles',
        solution: 'Declare delegate as weak var'
      });
    }
    
    return issues;
  }
}
```

**Concurrency Analysis:**

```typescript
class SwiftConcurrencyAnalyzer {
  async analyzeConcurrency(code: SwiftAST): Promise<ConcurrencyIssue[]> {
    const issues: ConcurrencyIssue[] = [];
    
    // Check 1: Actor isolation violations
    const actorAccesses = code.actorAccesses;
    for (const access of actorAccesses) {
      if (!access.isAsync && access.crossesActorBoundary) {
        issues.push({
          type: 'Actor Isolation Violation',
          severity: 'high',
          line: access.line,
          message: 'Accessing actor-isolated property from non-async context',
          solution: 'Make calling function async or use Task'
        });
      }
    }
    
    // Check 2: Data races with @Sendable
    const nonSendableInAsync = code.asyncFunctions.filter(f =>
      f.parameters.some(p => !p.isSendable && p.crossesIsolation)
    );
    
    // Check 3: MainActor misuse
    const mainActorViolations = code.functions.filter(f =>
      f.hasMainActor && !f.isUIRelated
    );
    
    return issues;
  }
}
```

#### 3.3 .NET/C# Advanced Analysis Module (Weeks 9-10)

**Async/Await Analysis:**

```typescript
class CSharpAsyncAnalyzer {
  async analyzeAsync(code: CSharpAST): Promise<AsyncIssue[]> {
    const issues: AsyncIssue[] = [];
    
    // Check 1: async void (should be async Task)
    const asyncVoidMethods = code.methods.filter(m =>
      m.isAsync && m.returnType === 'void'
    );
    
    for (const method of asyncVoidMethods) {
      issues.push({
        type: 'Async Void',
        severity: 'critical',
        line: method.line,
        message: 'async void methods cannot be awaited and swallow exceptions',
        solution: 'Change to async Task (or async Task<T> if returning value)',
        example: `
// Bad
private async void LoadDataAsync() { ... }

// Good
private async Task LoadDataAsync() { ... }
        `
      });
    }
    
    // Check 2: Blocking on async code (deadlock risk)
    const blockingCalls = code.statements.filter(s =>
      s.isBlocking && s.operand.isAsync
    );
    
    for (const call of blockingCalls) {
      issues.push({
        type: 'Async Blocking',
        severity: 'high',
        line: call.line,
        message: `.Result or .Wait() on async code can cause deadlock`,
        solution: 'Use await instead',
        example: `
// Bad
var result = SomeMethodAsync().Result;

// Good
var result = await SomeMethodAsync();
        `
      });
    }
    
    // Check 3: ConfigureAwait misuse
    const awaitCalls = code.awaitExpressions;
    for (const call of awaitCalls) {
      if (call.inLibraryCode && !call.hasConfigureAwait) {
        issues.push({
          type: 'Missing ConfigureAwait',
          severity: 'low',
          line: call.line,
          message: 'Library code should use ConfigureAwait(false)',
          solution: 'Add .ConfigureAwait(false) to avoid capturing context'
        });
      }
    }
    
    return issues;
  }
}
```

**Dependency Injection Analysis:**

```typescript
class CSharpDIAnalyzer {
  async analyzeDI(code: CSharpAST): Promise<DIIssue[]> {
    const issues: DIIssue[] = [];
    
    // Check service lifetimes
    const serviceRegistrations = code.serviceRegistrations;
    
    for (const reg of serviceRegistrations) {
      // Check 1: Singleton depending on Scoped (will cause issues)
      if (reg.lifetime === 'Singleton') {
        const dependencies = reg.dependencies;
        const scopedDeps = dependencies.filter(d => d.lifetime === 'Scoped');
        
        if (scopedDeps.length > 0) {
          issues.push({
            type: 'Captive Dependency',
            severity: 'critical',
            message: `Singleton ${reg.service} depends on Scoped services: ${scopedDeps.map(d => d.name).join(', ')}`,
            solution: 'Change Singleton to Scoped, or inject IServiceProvider and resolve Scoped services per request'
          });
        }
      }
      
      // Check 2: DbContext as Singleton (common mistake)
      if (reg.lifetime === 'Singleton' && reg.service.includes('DbContext')) {
        issues.push({
          type: 'DbContext Lifetime Error',
          severity: 'critical',
          message: 'DbContext should be Scoped, not Singleton',
          solution: 'Use AddDbContext with default Scoped lifetime'
        });
      }
    }
    
    // Check 3: Service Locator anti-pattern
    const serviceLocatorUsages = code.statements.filter(s =>
      s.calls.some(c => c.method === 'GetService' || c.method === 'GetRequiredService')
    );
    
    if (serviceLocatorUsages.length > 0) {
      issues.push({
        type: 'Service Locator Pattern',
        severity: 'medium',
        message: 'Avoid Service Locator pattern, use constructor injection',
        solution: 'Inject dependencies via constructor'
      });
    }
    
    return issues;
  }
}
```

#### 3.4 Python Advanced Analysis Module (Week 11-12)

**Type Hint Analysis:**

```typescript
class PythonTypeAnalyzer {
  async analyzeTypes(code: PythonAST): Promise<TypeIssue[]> {
    const issues: TypeIssue[] = [];
    
    // Check 1: Missing type hints on public functions
    const publicFunctions = code.functions.filter(f => !f.name.startsWith('_'));
    
    for (const func of publicFunctions) {
      const missingHints = [];
      
      if (!func.returnTypeHint) missingHints.push('return type');
      
      const paramsWithoutHints = func.parameters.filter(p => 
        !p.typeHint && p.name !== 'self'
      );
      
      if (paramsWithoutHints.length > 0) {
        missingHints.push(`parameters: ${paramsWithoutHints.map(p => p.name).join(', ')}`);
      }
      
      if (missingHints.length > 0) {
        issues.push({
          type: 'Missing Type Hints',
          severity: 'low',
          line: func.line,
          message: `Function ${func.name} missing type hints for ${missingHints.join('; ')}`,
          solution: 'Add type hints for better type checking and IDE support',
          example: await this.generateTypeHintExample(func)
        });
      }
    }
    
    // Check 2: Incorrect generic usage
    // Check 3: Type narrowing opportunities
    
    return issues;
  }
}
```

**Framework-Specific Analysis:**

```typescript
class PythonFrameworkAnalyzer {
  async analyzeFastAPI(code: PythonAST): Promise<FrameworkIssue[]> {
    const issues: FastAPIIssue[] = [];
    
    // Check 1: Missing dependency injection
    const endpoints = code.functions.filter(f => f.hasDecorator('app.get', 'app.post', etc.));
    
    for (const endpoint of endpoints) {
      // Check for database session management
      if (endpoint.usesDatabaseSession && !endpoint.usesDependsInjection) {
        issues.push({
          type: 'Missing Dependency Injection',
          severity: 'medium',
          line: endpoint.line,
          message: 'Database session should be injected via Depends()',
          solution: 'Use FastAPI dependency injection for database sessions'
        });
      }
      
      // Check for missing validation models
      if (endpoint.acceptsRequestBody && !endpoint.usesPydanticModel) {
        issues.push({
          type: 'Missing Request Validation',
          severity: 'medium',
          message: 'Request body should use Pydantic model for validation',
          solution: 'Create Pydantic model for request validation'
        });
      }
    }
    
    return issues;
  }
  
  async analyzeDjango(code: PythonAST): Promise<FrameworkIssue[]> {
    const issues: DjangoIssue[] = [];
    
    // Check for N+1 query problems
    const views = code.classes.filter(c => c.inheritsFrom('View', 'APIView'));
    
    for (const view of views) {
      const queries = view.methods.flatMap(m => m.ormQueries);
      const nPlusOneQueries = this.detectNPlusOne(queries);
      
      if (nPlusOneQueries.length > 0) {
        issues.push({
          type: 'N+1 Query Problem',
          severity: 'high',
          message: 'Detected N+1 query pattern',
          solution: 'Use select_related() or prefetch_related()',
          example: await this.generateQueryOptimizationExample(nPlusOneQueries)
        });
      }
    }
    
    return issues;
  }
}
```

---

### PHASE 4: Advanced Features (Weeks 13-14)

#### 4.1 Architecture Pattern Recognition

```typescript
class ArchitecturePatternRecognizer {
  async recognizePattern(codebase: Codebase): Promise<ArchitecturePattern> {
    // Analyze project structure
    const structure = this.analyzeStructure(codebase);
    
    // Use AI to identify pattern
    const prompt = `
Analyze this project structure and identify the architecture pattern:

Directory structure:
${structure.directories.map(d => `${d.path}: ${d.fileTypes.join(', ')}`).join('\n')}

Key classes and their relationships:
${structure.classes.map(c => `${c.name}: ${c.type} (dependencies: ${c.dependencies.join(', ')})`).join('\n')}

Identify:
1. Primary architecture pattern (MVVM, MVP, MVC, Clean Architecture, Hexagonal, etc.)
2. Layer structure
3. Dependency flow direction
4. Design patterns used

Return JSON.
    `;
    
    const result = await this.aiProvider.chat(prompt);
    return JSON.parse(result);
  }
  
  async validateArchitecture(
    codebase: Codebase,
    pattern: ArchitecturePattern
  ): Promise<ArchitectureViolation[]> {
    const violations: ArchitectureViolation[] = [];
    
    // Check layer boundaries
    for (const file of codebase.files) {
      const layer = this.identifyLayer(file, pattern);
      const dependencies = file.imports;
      
      for (const dep of dependencies) {
        const depLayer = this.identifyLayer(dep, pattern);
        
        if (!this.isValidDependency(layer, depLayer, pattern)) {
          violations.push({
            type: 'Layer Boundary Violation',
            severity: 'high',
            file: file.path,
            message: `${layer} should not depend on ${depLayer}`,
            expectedFlow: this.getExpectedFlow(pattern)
          });
        }
      }
    }
    
    // Check for missing layers
    const expectedLayers = this.getExpectedLayers(pattern);
    const actualLayers = new Set(codebase.files.map(f => this.identifyLayer(f, pattern)));
    
    const missingLayers = expectedLayers.filter(l => !actualLayers.has(l));
    if (missingLayers.length > 0) {
      violations.push({
        type: 'Missing Architecture Layer',
        severity: 'medium',
        message: `Missing layers: ${missingLayers.join(', ')}`,
        recommendation: 'Consider adding these layers for proper separation of concerns'
      });
    }
    
    return violations;
  }
}
```

#### 4.2 Intelligent Code Health Scoring

```typescript
class IntelligentCodeHealthScorer {
  async calculateScore(
    code: string,
    context: LanguageContext,
    analysisResults: AnalysisResult[]
  ): Promise<CodeHealthScore> {
    
    // Traditional metrics
    const traditionalMetrics = {
      complexity: this.calculateComplexity(code),
      maintainability: this.calculateMaintainability(code),
      testability: this.calculateTestability(code)
    };
    
    // Language-specific metrics
    const languageMetrics = await this.calculateLanguageSpecificMetrics(code, context);
    
    // AI-enhanced contextual scoring
    const aiScore = await this.getAIEnhancedScore(
      code,
      context,
      traditionalMetrics,
      languageMetrics,
      analysisResults
    );
    
    return {
      overall: aiScore.overall,
      breakdown: {
        maintainability: aiScore.maintainability,
        reliability: aiScore.reliability,
        security: aiScore.security,
        performance: aiScore.performance,
        languageIdiomatic: aiScore.languageIdiomatic
      },
      reasoning: aiScore.reasoning
    };
  }
  
  private async calculateLanguageSpecificMetrics(
    code: string,
    context: LanguageContext
  ): Promise<LanguageMetrics> {
    
    switch (context.language) {
      case 'kotlin':
        return {
          coroutineSafety: this.analyzeCoroutineSafety(code),
          nullSafety: this.analyzeNullSafety(code),
          immutability: this.analyzeImmutability(code),
          composePerformance: this.analyzeComposePerformance(code)
        };
        
      case 'swift':
        return {
          memorySafety: this.analyzeMemorySafety(code),
          concurrencySafety: this.analyzeConcurrencySafety(code),
          swiftUIPerformance: this.analyzeSwiftUIPerformance(code),
          apiDesign: this.analyzeAPIDesign(code)
        };
        
      case 'csharp':
        return {
          asyncPatterns: this.analyzeAsyncPatterns(code),
          diQuality: this.analyzeDIQuality(code),
          nullableReference: this.analyzeNullableReferences(code),
          linqUsage: this.analyzeLINQUsage(code)
        };
        
      case 'python':
        return {
          typeHintCoverage: this.analyzeTypeHintCoverage(code),
          idiomaticPython: this.analyzeIdiomaticPython(code),
          asyncUsage: this.analyzeAsyncUsage(code)
        };
    }
  }
  
  private async getAIEnhancedScore(
    code: string,
    context: LanguageContext,
    traditional: any,
    language: any,
    issues: AnalysisResult[]
  ): Promise<AIEnhancedScore> {
    
    const prompt = `
You are an expert ${context.language} code reviewer.

Analyze this code quality holistically:

Traditional metrics:
- Cyclomatic Complexity: ${traditional.complexity}
- Maintainability Index: ${traditional.maintainability}

Language-specific metrics:
${JSON.stringify(language, null, 2)}

Detected issues:
${issues.map(i => `- ${i.severity}: ${i.message}`).join('\n')}

Code context:
- Purpose: ${context.projectType}
- Framework: ${context.frameworks.join(', ')}

Provide:
1. Overall score (0-100)
2. Breakdown scores for: maintainability, reliability, security, performance, language-idiomatic
3. Reasoning for each score
4. Is this code acceptable for production given its context?

Consider:
- A complexity of 15 might be fine for a UI coordinator handling multiple user actions
- Verbose code can be more maintainable than clever code
- ${context.language}-specific idioms and best practices

Return JSON.
    `;
    
    const result = await this.aiProvider.chat(prompt);
    return JSON.parse(result);
  }
}
```

#### 4.3 Smart False Positive Reduction

```typescript
class FalsePositiveReducer {
  async validateIssue(
    issue: DetectedIssue,
    context: LanguageContext,
    codeSnippet: string
  ): Promise<ValidatedIssue> {
    
    // Check if this is a known false positive pattern
    if (this.isKnownFalsePositive(issue, context)) {
      return {
        ...issue,
        confidence: 'low',
        suppressed: true,
        reason: 'Known false positive pattern'
      };
    }
    
    // Use AI to validate
    const aiValidation = await this.validateWithAI(issue, context, codeSnippet);
    
    return {
      ...issue,
      confidence: aiValidation.confidence,
      suppressed: aiValidation.confidence < 50,
      aiReasoning: aiValidation.reasoning
    };
  }
  
  private isKnownFalsePositive(issue: DetectedIssue, context: LanguageContext): boolean {
    const falsePositivePatterns = {
      kotlin: [
        { pattern: 'lazy initialization', code: /by lazy/, reason: 'Idiomatic Kotlin delegation' },
        { pattern: 'magic number', code: /404|200|201|401|403|500/, reason: 'HTTP status codes' },
      ],
      swift: [
        { pattern: 'optional chaining', code: /\?\.|\.?\./, reason: 'Idiomatic Swift safety' },
        { pattern: 'force unwrap', code: /!\s*$/, reason: 'May be intentional after validation' }
      ],
      csharp: [
        { pattern: 'null-forgiving', code: /!;/, reason: 'Developer confirmed non-null' }
      ]
    };
    
    const patterns = falsePositivePatterns[context.language] || [];
    return patterns.some(p => 
      issue.type.includes(p.pattern) && p.code.test(issue.code)
    );
  }
  
  private async validateWithAI(
    issue: DetectedIssue,
    context: LanguageContext,
    code: string
  ): Promise<AIValidation> {
    
    const prompt = `
You are an expert ${context.language} code reviewer.

A static analyzer detected this issue:
Type: ${issue.type}
Severity: ${issue.severity}
Message: ${issue.message}

Code context:
\`\`\`${context.language}
${code}
\`\`\`

Language: ${context.language} ${context.version}
Framework: ${context.frameworks.join(', ')}

Is this a real issue or a false positive?

Consider:
1. Is this code idiomatic ${context.language}?
2. Does the framework encourage this pattern?
3. Is this a common pattern in ${context.frameworks[0]} development?
4. Could this be intentional given the context?

Respond with:
- confidence: 0-100 (0 = definitely false positive, 100 = definitely real issue)
- reasoning: Why this is or isn't a real issue
- isRealIssue: boolean

Return JSON.
    `;
    
    const result = await this.aiProvider.chat(prompt);
    return JSON.parse(result);
  }
}
```

---

### PHASE 5: Advanced Response Generation (Weeks 15-16)

#### 5.1 Multi-Tier Analysis System

```typescript
class MultiTierAnalyzer {
  async analyze(
    code: string,
    context: LanguageContext,
    tier: 'quick' | 'standard' | 'deep'
  ): Promise<AnalysisResult> {
    
    switch (tier) {
      case 'quick':
        return this.quickAnalysis(code, context);
        
      case 'standard':
        return this.standardAnalysis(code, context);
        
      case 'deep':
        return this.deepAnalysis(code, context);
    }
  }
  
  private async quickAnalysis(code: string, context: LanguageContext): Promise<AnalysisResult> {
    // Use: Fast local patterns + Groq Llama 3.2 (if available)
    // Time: <3 seconds
    // Output: 2-3 critical issues only
    
    const criticalPatterns = await this.localAnalyzer.findCriticalIssues(code, context);
    
    if (this.aiProvider.isAvailable('groq-fast')) {
      const aiEnhancement = await this.aiProvider.quickAnalyze(code, context, criticalPatterns);
      return this.combineResults(criticalPatterns, aiEnhancement);
    }
    
    return { issues: criticalPatterns, tier: 'quick' };
  }
  
  private async standardAnalysis(code: string, context: LanguageContext): Promise<AnalysisResult> {
    // Use: Full local analysis + Groq Llama 3.1 70B
    // Time: 5-10 seconds
    // Output: All issues + code examples + architecture notes
    
    const allIssues = await this.localAnalyzer.fullAnalysis(code, context);
    const architectureInsights = await this.architectureAnalyzer.analyze(code, context);
    
    const aiEnhancement = await this.aiProvider.standardAnalyze({
      code,
      context,
      issues: allIssues,
      architecture: architectureInsights
    });
    
    return {
      issues: allIssues,
      solutions: aiEnhancement.solutions,
      architecture: architectureInsights,
      codeExamples: aiEnhancement.examples,
      tier: 'standard'
    };
  }
  
  private async deepAnalysis(code: string, context: LanguageContext): Promise<AnalysisResult> {
    // Use: Full analysis + Multiple AI providers + Architecture review
    // Time: 10-20 seconds
    // Output: Complete review with refactoring plan
    
    const localResults = await this.localAnalyzer.fullAnalysis(code, context);
    const architectureReview = await this.architectureAnalyzer.deepAnalysis(code, context);
    
    // Use multiple AI providers for different aspects
    const [
      groqAnalysis,
      geminiArchitecture,
      securityReview
    ] = await Promise.all([
      this.groqProvider.deepAnalyze(code, context, localResults),
      this.geminiProvider.analyzeArchitecture(code, context),
      this.securityAnalyzer.comprehensiveReview(code, context)
    ]);
    
    const refactoringPlan = await this.generateRefactoringPlan({
      code,
      context,
      issues: localResults,
      architecture: geminiArchitecture,
      security: securityReview
    });
    
    return {
      issues: localResults,
      solutions: groqAnalysis.solutions,
      architecture: geminiArchitecture,
      security: securityReview,
      refactoringPlan,
      designPatternRecommendations: geminiArchitecture.recommendations,
      tier: 'deep'
    };
  }
}
```

#### 5.2 Context-Rich Explanation Generation

```typescript
class ExplanationGenerator {
  async generateExplanation(
    issue: DetectedIssue,
    context: LanguageContext,
    codeSnippet: string
  ): Promise<RichExplanation> {
    
    const prompt = `
You are a senior ${context.language} developer explaining code issues to a colleague.

Issue detected:
Type: ${issue.type}
Severity: ${issue.severity}
Line: ${issue.line}

Code:
\`\`\`${context.language}
${codeSnippet}
\`\`\`

Context:
- Language: ${context.language} ${context.version}
- Framework: ${context.frameworks.join(', ')}
- Project: ${context.projectType}

Provide a comprehensive explanation:

1. **Problem Statement** (2-3 sentences)
   - What exactly is wrong?
   - Why is this problematic in ${context.language}?

2. **Technical Impact** (3-4 points)
   - Performance implications
   - Maintainability concerns
   - Security risks (if any)
   - Framework-specific issues

3. **Solution** (step-by-step)
   - Exact code changes needed
   - Why this solution is better
   - ${context.language}-idiomatic approach

4. **Complete Code Example**
   - Show before/after
   - Must compile and run
   - Include relevant imports
   - Add brief comments

5. **Additional Context**
   - Related best practices
   - Framework documentation links
   - Common pitfalls to avoid

Format: Use markdown with code blocks. Be specific to ${context.language}.
    `;
    
    const response = await this.aiProvider.chat(prompt, { model: 'llama3-70b' });
    
    return {
      markdown: response,
      severity: issue.severity,
      estimatedFixTime: this.estimateFixTime(issue),
      relatedIssues: await this.findRelatedIssues(issue),
      learningResources: await this.findLearningResources(issue, context)
    };
  }
}
```

---

## 📊 IMPLEMENTATION ROADMAP

### Week-by-Week Breakdown

#### Weeks 1-2: Foundation (KOTLIN FOCUS)
**Goal:** Build robust language detection and Kotlin parser

**Tasks:**
1. **Day 1-3:** Language detection system
   - Implement syntax-based detection
   - Create framework detector
   - Build version inference
   - Test with 50+ sample files

2. **Day 4-7:** Tree-sitter Kotlin integration
   - Set up Tree-sitter
   - Create Kotlin AST parser
   - Extract functions, classes, coroutines
   - Test parsing accuracy

3. **Day 8-10:** Kotlin context builder
   - Load Kotlin-specific rules
   - Detect Compose/Coroutines usage
   - Identify MVVM patterns
   - Build context object

**Deliverable:** System that accurately identifies Kotlin code and parses it correctly

#### Weeks 3-4: AI Integration
**Goal:** Integrate AI at every analysis layer

**Tasks:**
1. **Day 11-13:** Groq API optimization
   - Implement caching system
   - Create prompt templates
   - Build rate limiting
   - Test API reliability

2. **Day 14-16:** Gemini integration
   - Set up Gemini API
   - Create fallback logic
   - Test rate limits
   - Benchmark performance

3. **Day 17-20:** Response generation
   - Build multi-tier system
   - Create explanation templates
   - Implement example generation
   - Test output quality

**Deliverable:** AI-powered analysis engine with smart caching

#### Weeks 5-6: Kotlin Analysis Module
**Goal:** Expert-level Kotlin analysis

**Tasks:**
1. **Day 21-25:** Coroutine analyzer
   - Detect scope misuse
   - Find Flow issues
   - Check exception handling
   - Validate structured concurrency

2. **Day 26-30:** Compose analyzer
   - State management checks
   - Recomposition detection
   - Performance analysis
   - Side effect validation

3. **Day 31-35:** MVVM validator
   - Architecture validation
   - Layer boundary checks
   - Dependency analysis
   - DI pattern validation

**Deliverable:** Production-ready Kotlin analyzer (target 9/10 accuracy)

#### Weeks 7-8: Swift Module
**Goal:** SwiftUI and concurrency expertise

**Tasks:**
1. **Day 36-40:** SwiftSyntax integration
2. **Day 41-45:** Property wrapper analysis
3. **Day 46-50:** Memory and concurrency analysis

**Deliverable:** Swift analyzer with SwiftUI support

#### Weeks 9-10: .NET Module
**Goal:** Async/await and DI mastery

**Tasks:**
1. **Day 51-55:** Roslyn integration
2. **Day 56-60:** Async/await analyzer
3. **Day 61-65:** DI and ASP.NET analysis

**Deliverable:** C# analyzer for modern .NET

#### Weeks 11-12: Python Module
**Goal:** Type hints and framework analysis

**Tasks:**
1. **Day 66-70:** Enhanced AST parser
2. **Day 71-75:** Type hint analyzer
3. **Day 76-80:** Framework-specific analysis (FastAPI/Django)

**Deliverable:** Python analyzer with framework support

#### Weeks 13-14: Advanced Features
**Goal:** Architecture recognition and scoring

**Tasks:**
1. **Day 81-85:** Architecture pattern recognizer
2. **Day 86-90:** Intelligent scoring system
3. **Day 91-95:** False positive reduction

**Deliverable:** Complete advanced feature set

#### Weeks 15-16: Polish and Testing
**Goal:** Production-ready system

**Tasks:**
1. **Day 96-100:** Accuracy testing
   - Create test suites
   - Measure false positives
   - Validate with real code

2. **Day 101-105:** Performance optimization
   - Speed improvements
   - Cache optimization
   - API call reduction

3. **Day 106-110:** Documentation and deployment

**Deliverable:** Production-ready system with 9+/10 accuracy

---

## 🎯 SUCCESS METRICS

### Accuracy Targets

**Overall Accuracy:**
- **Current (Measured):** 3.5-4/10
  - Kotlin Android: 3.5/10 (1 correct out of 5-6 findings)
  - Python CLI: 4/10 (4 correct out of 8 findings)
- **Target:** 9+/10
- **Measure:** Independent evaluation + test suite validation + user feedback

**False Positive Rate:**
- **Current (Measured):** 50-53% (more than half of findings are wrong)
  - JavaScript rules applied to Kotlin/Python
  - Normal code patterns flagged as issues
  - Context-blind detection
- **Target:** <5% on production code
- **Critical Fix:** Stop flagging idiomatic code as problematic

**False Negative Rate:**
- **Current:** Unknown (need to test with known-bad code)
- **Target:** <10% on known issues
- **Measure:** Missing real security issues, bugs, anti-patterns

**Language-Specific Accuracy:**
- **Current:** 0% (applies wrong language rules)
  - Suggests `===` in Kotlin (wrong)
  - Suggests `===` in Python (doesn't exist)
  - Flags `by lazy` as bad (idiomatic Kotlin)
  - Flags `print()` as debug code (normal CLI output)
- **Target:** 95%+ on idiomatic code
- **Measure:** Correctly identify language-appropriate patterns

### Specific Improvements (Based on Real Failures)

**Must Fix Immediately (Critical):**
1. ❌ **Stop JavaScript Rule Mixing**
   - Don't suggest `===` in non-JavaScript languages
   - Each language has different equality semantics
   
2. ❌ **Stop False Security Alerts**
   - `password = getpass.getpass()` is NOT a hardcoded password
   - Distinguish variable names from actual credentials
   
3. ❌ **Stop Flagging Normal Patterns**
   - UI padding numbers are NOT magic numbers
   - CLI `print()` statements are NOT debug code
   - `by lazy` in Kotlin is NOT an anti-pattern
   
4. ❌ **Stop Blind Cleanup Requirements**
   - Don't require onDestroy cleanup when no resources allocated
   - Understand Android lifecycle management
   
5. ❌ **Fix Large Class Detection**
   - Don't flag "large class" at line 9 before reading the class

**Must Add (Missing Capabilities):**
1. ✅ Language-specific rule sets (no cross-contamination)
2. ✅ Project type awareness (CLI vs Android vs Web API)
3. ✅ Framework understanding (Compose, SwiftUI, FastAPI)
4. ✅ Context-aware severity (not everything is Critical)
5. ✅ False positive validation before reporting

### Performance Targets

**Analysis Speed:**
- Quick: <3 seconds
- Standard: <10 seconds
- Deep: <20 seconds

**API Cost:**
- Target: <$5/month
- Strategy: Leverage free tiers, aggressive caching

### Quality Targets

**Recommendations:**
- Language-appropriate: 100%
- Code examples compile: 100%
- Architecture advice sound: 95%+
- Security findings actionable: 100%

---

## 🚨 CRITICAL SUCCESS FACTORS

### 1. Start Small - Master Kotlin First
**Why:** Trying to build all 4 languages at once = failure
**Action:** Achieve 9/10 accuracy on Kotlin before touching Swift

### 2. Test Against Real Code
**Why:** Toy examples don't reveal real issues
**Action:** Use GitHub projects, user-submitted code

### 3. Measure Everything
**Why:** Can't improve what you don't measure
**Action:** Log accuracy, false positives, user corrections

### 4. Iterate on Prompts
**Why:** AI quality depends on prompt quality
**Action:** Save every prompt, A/B test, refine

### 5. User Feedback Loop
**Why:** Users know when results are wrong
**Action:** Easy feedback mechanism, track corrections

---

## 💡 GETTING STARTED - CURSOR PROMPT

```markdown
I'm transforming my code analysis tool from basic pattern matching to advanced language-aware analysis.

**Current State (Measured via ChatGPT Evaluation):**
- Uses 477+ hardcoded regex patterns
- Generic across all languages
- **3.5/10 accuracy on Kotlin** (1 correct out of 5-6 findings)
- **4/10 accuracy on Python** (4 correct out of 8 findings)
- **50%+ false positive rate** (most findings are wrong)
- AI only used for explanations (not actual analysis)

**Specific Failures Identified:**
1. ❌ Applies JavaScript `===` rule to Kotlin/Python (completely wrong)
2. ❌ Flags `getpass.getpass()` as "hardcoded password" (it's user input)
3. ❌ Flags `print()` as "debug statement" in CLI apps (it's the output)
4. ❌ Flags UI padding `setPadding(16)` as "magic number" (normal Android)
5. ❌ Requires cleanup in onDestroy when no resources allocated (false positive)
6. ❌ Flags `by lazy` as anti-pattern (idiomatic Kotlin delegation)

**Goal:**
Build advanced analysis for **Kotlin first** achieving 9/10 accuracy by:
- Using language-specific rules (no JavaScript rules on Kotlin)
- Understanding project context (CLI vs Android vs API)
- Validating issues before reporting (reduce false positives to <5%)

**Phase 1 Tasks - Kotlin Foundation:**

1. **Robust Language Detection:**
   - Detect Kotlin + version from syntax (not just .kt extension)
   - Identify frameworks (Jetpack Compose, Coroutines, Hilt)
   - Infer project type (Android app, library, etc.)
   - Build LanguageContext object with all metadata

2. **Language-Specific Rule Isolation:**
   - **CRITICAL:** Kotlin rules ONLY for Kotlin code
   - No JavaScript patterns (===, truthy checks)
   - No Python patterns (type hints, mutable defaults)
   - Kotlin-specific: coroutines, null safety, data classes

3. **Tree-sitter Kotlin Integration:**
   - Set up Tree-sitter parser for Kotlin
   - Extract: functions, classes, coroutines, flows, composables
   - Parse suspend functions and coroutine scopes
   - Identify @Composable functions

4. **Context-Aware Detection:**
   - Android UI context: setPadding(16) is NORMAL, not magic number
   - Android lifecycle: understand when cleanup is needed vs not needed
   - MVVM patterns: know what belongs in ViewModel vs View
   - Idiomatic Kotlin: `by lazy`, sealed classes, data classes are GOOD

5. **AI-Powered Kotlin Analyzer:**
   - Use Groq API for analysis (not just explanation)
   - Prompt: "You are a Kotlin expert. Do NOT apply JavaScript rules."
   - Validate findings: "Is this really an issue in Kotlin?"
   - Generate Kotlin-idiomatic solutions (not JavaScript/Python solutions)

**What I Have:**
- Groq API access (free tier)
- Current codebase with basic analysis
- Language selection UI
- Sample Kotlin code for testing
- **Real evaluation data showing specific failures**

**What I Need Help With:**
1. Design language-specific rule isolation (prevent JS rules on Kotlin)
2. Build context validator to reduce false positives
3. Create Kotlin-specific analyzer module
4. Design AI prompts that understand language differences
5. Build false-positive suppression system

**Critical Success Factor:**
The #1 problem is applying wrong language rules. Must fix this FIRST before adding features.

**Measurement:**
- Baseline: 3.5/10 on Kotlin, 4/10 on Python
- Target: 9/10 on Kotlin within 6 weeks
- Test with same code ChatGPT evaluated

Please help me design the architecture to achieve this.
```

---

## 📚 TECHNICAL RESOURCES NEEDED

### Parsers and Tools
- **Kotlin:** Tree-sitter-kotlin, Kotlin PSI (compiler)
- **Swift:** SwiftSyntax library
- **C#:** Roslyn Compiler API
- **Python:** Enhanced ast module

### Documentation
- Language specifications and style guides
- Framework best practices (Compose, SwiftUI, etc.)
- OWASP security guidelines
- Architecture pattern documentation

### AI APIs
- Groq API documentation
- Google Gemini 2.0 documentation
- Hugging Face Inference API

### Testing Resources
- GitHub repositories with quality code
- Known anti-pattern examples
- Security vulnerability databases (CVE)

---

## ⚠️ POTENTIAL BLOCKERS & SOLUTIONS

### Blocker 1: Tree-sitter Integration Complexity
**Risk:** Tree-sitter might be difficult to integrate
**Solution:** Start with simpler AST approach, upgrade later
**Mitigation:** Budget extra time for parser setup

### Blocker 2: AI API Rate Limits
**Risk:** Free tiers might be insufficient
**Solution:** Aggressive caching, multiple API keys, fallback to local
**Mitigation:** Build cache-first architecture

### Blocker 3: Accuracy Validation
**Risk:** Hard to measure if results are actually better
**Solution:** Create test suite with known-good and known-bad code
**Mitigation:** A/B test with users

### Blocker 4: Language-Specific Expertise
**Risk:** May not know all language nuances
**Solution:** Use AI to fill gaps, consult documentation
**Mitigation:** Start with one language, learn deeply

### Blocker 5: Scope Creep
**Risk:** Trying to do everything at once
**Solution:** Strict prioritization - Kotlin coroutines ONLY first
**Mitigation:** Weekly milestones with clear deliverables

---

## 🎓 LEARNING PATH

### Week 1-2: Parsers and AST
- Study Tree-sitter documentation
- Learn Kotlin PSI structure
- Understand AST traversal

### Week 3-4: AI Prompt Engineering
- Study effective prompting techniques
- Learn context-rich prompt design
- Practice with code analysis prompts

### Week 5-6: Kotlin Deep Dive
- Master Kotlin coroutines
- Learn Jetpack Compose internals
- Study MVVM patterns

### Week 7-8: Swift Expertise
- Learn SwiftUI property wrappers
- Understand Swift concurrency model
- Study memory management

### Week 9-10: .NET Mastery
- Master async/await patterns
- Learn DI in .NET
- Understand ASP.NET Core

### Week 11-12: Python Proficiency
- Study type hints and generics
- Learn FastAPI/Django patterns
- Understand async Python

---

## 📝 FINAL NOTES

**This is a transformation, not a rewrite.**
- Keep existing infrastructure that works
- Replace pattern matching with intelligent analysis
- Enhance, don't destroy

**Quality over speed.**
- Better to have one excellent language than four mediocre ones
- 9/10 accuracy on Kotlin > 5/10 on all four

**Measure and iterate.**
- Every feature should have metrics
- Track accuracy, speed, user satisfaction
- Adjust based on data

**User trust is everything.**
- One wrong suggestion = loss of trust
- Better to say "I don't know" than give wrong answers
- Confidence scores matter

---

## 🚀 NEXT STEPS

1. **Review this plan** - Identify gaps or concerns
2. **Set up development environment** - Install parsers, APIs
3. **Create test suite** - Gather sample code (good and bad)
4. **Start with Kotlin detection** - Build language context system
5. **Integrate Tree-sitter** - Parse Kotlin correctly
6. **First AI analysis** - Coroutine scope detection
7. **Measure accuracy** - Compare against test suite
8. **Iterate and improve** - Refine prompts, add rules
9. **Expand features** - Add more Kotlin analyzers
10. **Move to next language** - Only when Kotlin is 9/10

---

**Remember:** The goal is not to build the most features, but to provide the most accurate, helpful, language-aware code analysis possible. Start small, prove it works, then scale.

Good luck! 🎉

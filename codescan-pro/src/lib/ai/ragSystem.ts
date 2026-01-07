/**
 * Enhanced RAG (Retrieval-Augmented Generation) System for Advanced Code Analysis
 * Provides context-aware AI analysis with optimized knowledge base and structured outputs
 */

import type { AnalysisResult, CodeIssue, SecurityFinding } from '../../types/analysis';

// Knowledge Base for Best Practices and Standards
export interface KnowledgeChunk {
  id: string;
  category: 'security' | 'performance' | 'style' | 'best-practice' | 'pattern' | 'anti-pattern';
  language: string;
  title: string;
  content: string;
  references: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  tags: string[];
}

// Comprehensive Knowledge Base - Latest Standards 2024
export const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  // JavaScript/TypeScript Best Practices
  {
    id: 'js-strict-equality',
    category: 'best-practice',
    language: 'javascript',
    title: 'Use Strict Equality (===)',
    content: `Always use strict equality (===) instead of loose equality (==). Loose equality performs type coercion which can lead to unexpected behavior.
    
Bad: if (x == null)
Good: if (x === null || x === undefined)
Better: if (x == null) // Only exception - checking for null/undefined

ESLint Rule: eqeqeq
TypeScript: strict mode enables this check`,
    references: ['ESLint eqeqeq', 'TypeScript Strict Mode', 'Clean Code JS'],
    severity: 'medium',
    tags: ['equality', 'type-coercion', 'comparison']
  },
  {
    id: 'js-const-let',
    category: 'best-practice',
    language: 'javascript',
    title: 'Prefer const over let, avoid var',
    content: `Use const by default, let when reassignment is needed, never use var.
    
var has function scope and hoisting issues.
let and const have block scope and temporal dead zone.
const prevents reassignment (not mutation).

ESLint Rules: prefer-const, no-var`,
    references: ['ES6 Specification', 'Airbnb Style Guide'],
    severity: 'low',
    tags: ['variables', 'scope', 'hoisting']
  },
  {
    id: 'js-async-await',
    category: 'best-practice',
    language: 'javascript',
    title: 'Prefer async/await over Promise chains',
    content: `async/await provides cleaner, more readable asynchronous code.

Bad:
fetchData().then(data => process(data)).then(result => save(result)).catch(handleError);

Good:
try {
  const data = await fetchData();
  const result = await process(data);
  await save(result);
} catch (error) {
  handleError(error);
}

Always handle errors with try/catch blocks.`,
    references: ['MDN async/await', 'Node.js Best Practices'],
    severity: 'info',
    tags: ['async', 'promises', 'error-handling']
  },
  
  // Security Best Practices
  {
    id: 'sec-sql-injection',
    category: 'security',
    language: 'javascript',
    title: 'Prevent SQL Injection',
    content: `Never concatenate user input into SQL queries.

VULNERABLE:
const query = "SELECT * FROM users WHERE id = " + userId;

SECURE:
// Using parameterized queries
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);

// Using ORM (Prisma, TypeORM, Sequelize)
const user = await prisma.user.findUnique({ where: { id: userId } });

OWASP Category: A03:2021 - Injection
CWE: CWE-89`,
    references: ['OWASP SQL Injection', 'CWE-89', 'Node.js Security Checklist'],
    severity: 'critical',
    tags: ['sql-injection', 'database', 'owasp-a03']
  },
  {
    id: 'sec-xss',
    category: 'security',
    language: 'javascript',
    title: 'Prevent Cross-Site Scripting (XSS)',
    content: `Never insert untrusted data into HTML without proper encoding.

VULNERABLE:
element.innerHTML = userInput;
document.write(userInput);

SECURE:
element.textContent = userInput;
// Or use DOMPurify for HTML
element.innerHTML = DOMPurify.sanitize(userInput);

In React: dangerouslySetInnerHTML should be avoided or sanitized.

OWASP Category: A03:2021 - Injection
CWE: CWE-79`,
    references: ['OWASP XSS Prevention', 'CWE-79', 'DOMPurify'],
    severity: 'critical',
    tags: ['xss', 'html-injection', 'owasp-a03']
  },
  {
    id: 'sec-hardcoded-secrets',
    category: 'security',
    language: 'javascript',
    title: 'Never Hardcode Secrets',
    content: `Secrets must never be committed to source code.

VULNERABLE:
const apiKey = "sk-1234567890abcdef";
const password = "admin123";
const dbConnection = "mongodb://user:pass@host/db";

SECURE:
const apiKey = process.env.API_KEY;
const password = process.env.DB_PASSWORD;

Use:
- Environment variables
- Secret management services (AWS Secrets Manager, HashiCorp Vault)
- .env files (gitignored)

OWASP Category: A02:2021 - Cryptographic Failures
CWE: CWE-798`,
    references: ['OWASP Secrets Management', 'CWE-798', '12-Factor App'],
    severity: 'critical',
    tags: ['secrets', 'credentials', 'api-keys', 'owasp-a02']
  },
  
  // Performance Best Practices
  {
    id: 'perf-memoization',
    category: 'performance',
    language: 'javascript',
    title: 'Use Memoization for Expensive Computations',
    content: `Cache results of expensive function calls.

React:
- useMemo for expensive calculations
- useCallback for function references
- React.memo for component memoization

Example:
const expensiveResult = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);`,
    references: ['React useMemo', 'Lodash memoize'],
    severity: 'medium',
    tags: ['memoization', 'caching', 'react-hooks']
  },
  {
    id: 'perf-avoid-nested-loops',
    category: 'performance',
    language: 'javascript',
    title: 'Avoid Nested Loops - Use Maps/Sets',
    content: `Nested loops have O(n²) complexity. Use Maps/Sets for O(n).

BAD - O(n²):
const findDuplicates = (arr1, arr2) => {
  return arr1.filter(item => arr2.includes(item));
};

GOOD - O(n):
const findDuplicates = (arr1, arr2) => {
  const set = new Set(arr2);
  return arr1.filter(item => set.has(item));
};`,
    references: ['Big O Notation', 'JavaScript Performance'],
    severity: 'medium',
    tags: ['complexity', 'loops', 'data-structures']
  },
  
  // TypeScript Best Practices
  {
    id: 'ts-strict-mode',
    category: 'best-practice',
    language: 'typescript',
    title: 'Enable TypeScript Strict Mode',
    content: `Always enable strict mode in tsconfig.json.

{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}`,
    references: ['TypeScript Strict Mode', 'TSConfig Reference'],
    severity: 'high',
    tags: ['typescript', 'strict-mode', 'type-safety']
  },
  {
    id: 'ts-no-any',
    category: 'best-practice',
    language: 'typescript',
    title: 'Avoid using any type',
    content: `The 'any' type defeats the purpose of TypeScript.

BAD:
function processData(data: any) { ... }

GOOD:
function processData(data: unknown) { ... }
interface ApiResponse { ... }
const result: ApiResponse = await fetchData();

Use 'unknown' instead of 'any' when type is truly unknown.`,
    references: ['TypeScript unknown vs any', 'Type Guards'],
    severity: 'medium',
    tags: ['typescript', 'any', 'type-safety']
  },
  
  // React Best Practices
  {
    id: 'react-keys',
    category: 'best-practice',
    language: 'javascript',
    title: 'Use Stable Keys in Lists',
    content: `Always use stable, unique keys in React lists.

BAD:
{items.map((item, index) => (
  <Item key={index} {...item} />
))}

GOOD:
{items.map(item => (
  <Item key={item.id} {...item} />
))}

Index as key causes issues with reordering and filtering.`,
    references: ['React Keys', 'React Reconciliation'],
    severity: 'medium',
    tags: ['react', 'keys', 'lists']
  },
  {
    id: 'react-useeffect-deps',
    category: 'best-practice',
    language: 'javascript',
    title: 'Correct useEffect Dependencies',
    content: `Always include all dependencies in useEffect.

BAD:
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId dependency

GOOD:
useEffect(() => {
  fetchData(userId);
}, [userId]);

ESLint Plugin: eslint-plugin-react-hooks`,
    references: ['React useEffect', 'Rules of Hooks'],
    severity: 'high',
    tags: ['react', 'hooks', 'useEffect']
  },
  
  // Error Handling
  {
    id: 'error-handling',
    category: 'best-practice',
    language: 'javascript',
    title: 'Proper Error Handling',
    content: `Never swallow errors silently.

BAD:
try {
  await riskyOperation();
} catch (e) {
  console.log(e); // Silent failure
}

GOOD:
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  throw new ApplicationError('Operation failed', { cause: error });
}`,
    references: ['Node.js Error Handling', 'Error Boundaries React'],
    severity: 'high',
    tags: ['error-handling', 'logging', 'exceptions']
  },
  
  // Kotlin Best Practices
  {
    id: 'kotlin-null-safety',
    category: 'best-practice',
    language: 'kotlin',
    title: 'Kotlin Null Safety',
    content: `Avoid using !! operator - it can cause NullPointerException.

BAD:
val name = user!!.name

GOOD:
val name = user?.name ?: "default"
// or
user?.let { println(it.name) }

Use safe calls (?.) and elvis operator (?:) instead.`,
    references: ['Kotlin Null Safety', 'Kotlin Style Guide'],
    severity: 'high',
    tags: ['kotlin', 'null-safety', 'android']
  },
  {
    id: 'kotlin-coroutines',
    category: 'best-practice',
    language: 'kotlin',
    title: 'Kotlin Coroutines Best Practices',
    content: `Use structured concurrency with appropriate scopes.

BAD:
GlobalScope.launch { ... }

GOOD:
viewModelScope.launch { ... }
lifecycleScope.launch { ... }

Never use GlobalScope - it can cause memory leaks.`,
    references: ['Kotlin Coroutines', 'Android Coroutines'],
    severity: 'high',
    tags: ['kotlin', 'coroutines', 'android', 'async']
  },
  
  // Swift/iOS Best Practices
  {
    id: 'swift-force-unwrap',
    category: 'best-practice',
    language: 'swift',
    title: 'Avoid Force Unwrapping in Swift',
    content: `Force unwrapping (!) can cause crashes.

BAD:
let name = optionalName!

GOOD:
guard let name = optionalName else { return }
// or
let name = optionalName ?? "default"
// or
if let name = optionalName { ... }`,
    references: ['Swift Optionals', 'Swift Style Guide'],
    severity: 'high',
    tags: ['swift', 'optionals', 'ios', 'crash']
  },
  {
    id: 'swiftui-state',
    category: 'best-practice',
    language: 'swift',
    title: 'SwiftUI State Management',
    content: `Use correct property wrappers for state.

@State - for simple value types owned by the view
@StateObject - for ObservableObject owned by the view
@ObservedObject - for ObservableObject passed to the view
@EnvironmentObject - for shared data across views

BAD:
@ObservedObject var viewModel = ViewModel() // Creates new instance on every render

GOOD:
@StateObject var viewModel = ViewModel()`,
    references: ['SwiftUI State', 'Apple Documentation'],
    severity: 'high',
    tags: ['swift', 'swiftui', 'state', 'ios']
  },
  
  // Anti-patterns
  {
    id: 'anti-callback-hell',
    category: 'anti-pattern',
    language: 'javascript',
    title: 'Avoid Callback Hell',
    content: `Deeply nested callbacks are hard to read and maintain.

BAD (Callback Hell):
getData(function(a) {
  getMoreData(a, function(b) {
    getMoreData(b, function(c) { ... });
  });
});

GOOD (async/await):
const a = await getData();
const b = await getMoreData(a);
const c = await getMoreData(b);`,
    references: ['Callback Hell', 'Promise Patterns'],
    severity: 'medium',
    tags: ['callbacks', 'async', 'code-quality']
  },
  {
    id: 'anti-god-function',
    category: 'anti-pattern',
    language: 'javascript',
    title: 'Avoid God Functions',
    content: `Functions should do one thing well (Single Responsibility).

BAD:
function processOrder(order) {
  // 200+ lines doing everything
}

GOOD:
function processOrder(order) {
  validateOrder(order);
  const totals = calculateTotals(order);
  updateInventory(order.items);
  return generateInvoice(order, totals);
}

Each function should be < 20 lines ideally.`,
    references: ['Clean Code', 'SOLID Principles'],
    severity: 'medium',
    tags: ['functions', 'srp', 'refactoring']
  }
];

// RAG Context Builder
export interface RAGContext {
  relevantKnowledge: KnowledgeChunk[];
  codeContext: {
    language: string;
    framework?: string;
    patterns: string[];
    issues: CodeIssue[];
    securityFindings: SecurityFinding[];
  };
  analysisDepth: 'quick' | 'standard' | 'deep';
}

/**
 * Retrieves relevant knowledge chunks based on the analysis results
 */
export function retrieveRelevantKnowledge(
  analysisResult: AnalysisResult,
  language: string
): KnowledgeChunk[] {
  const relevantChunks: KnowledgeChunk[] = [];
  const addedIds = new Set<string>();

  // Get language-specific knowledge
  const languageChunks = KNOWLEDGE_BASE.filter(
    chunk => chunk.language === language || 
             chunk.language === 'javascript' ||
             (language === 'kotlin' && chunk.language === 'kotlin') ||
             (language === 'swift' && chunk.language === 'swift')
  );

  // Match based on issues
  for (const issue of analysisResult.issues) {
    for (const chunk of languageChunks) {
      if (addedIds.has(chunk.id)) continue;

      const issueText = `${issue.title || ''} ${issue.description || ''} ${issue.ruleId || ''} ${issue.category || ''}`.toLowerCase();

      // Check for tag matches
      const hasTagMatch = chunk.tags.some(tag => issueText.includes(tag));
      
      // Check for content relevance
      const hasContentMatch = chunk.tags.some(tag => 
        (issue.title && issue.title.toLowerCase().includes(tag)) ||
        (issue.description && issue.description.toLowerCase().includes(tag)) ||
        (issue.ruleId && issue.ruleId.toLowerCase().includes(tag))
      );

      if (hasTagMatch || hasContentMatch) {
        relevantChunks.push(chunk);
        addedIds.add(chunk.id);
      }
    }
  }

  // Match based on security findings
  const securityFindings = analysisResult.securityFindings || [];
  for (const finding of securityFindings) {
    for (const chunk of languageChunks) {
      if (addedIds.has(chunk.id)) continue;
      if (chunk.category !== 'security') continue;

      const findingText = `${finding.type || ''} ${finding.vulnerability || ''} ${finding.owaspCategory || ''}`.toLowerCase();
      
      const isRelevant = chunk.tags.some(tag => findingText.includes(tag)) ||
        (finding.cwe && chunk.content.includes(finding.cwe));

      if (isRelevant) {
        relevantChunks.push(chunk);
        addedIds.add(chunk.id);
      }
    }
  }

  // Add general best practices for the language
  const generalPractices = languageChunks.filter(
    chunk => chunk.category === 'best-practice' && !addedIds.has(chunk.id)
  ).slice(0, 3);
  
  relevantChunks.push(...generalPractices);

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  relevantChunks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return relevantChunks.slice(0, 10); // Limit to top 10 most relevant
}

/**
 * Builds the RAG context for AI analysis
 */
export function buildRAGContext(
  code: string,
  language: string,
  analysisResult: AnalysisResult,
  depth: 'quick' | 'standard' | 'deep' = 'standard'
): RAGContext {
  const relevantKnowledge = retrieveRelevantKnowledge(analysisResult, language);

  // Detect patterns in code
  const patterns: string[] = [];
  
  if (code.includes('async') || code.includes('await')) patterns.push('async/await');
  if (code.includes('Promise')) patterns.push('promises');
  if (code.includes('class ')) patterns.push('classes');
  if (code.includes('useState') || code.includes('useEffect')) patterns.push('react-hooks');
  if (code.includes('fetch(') || code.includes('axios')) patterns.push('http-requests');
  if (code.includes('try') && code.includes('catch')) patterns.push('error-handling');
  if (code.includes('interface ') || code.includes(': ')) patterns.push('typescript');
  if (code.includes('suspend fun') || code.includes('viewModelScope')) patterns.push('kotlin-coroutines');
  if (code.includes('@State') || code.includes('@ObservedObject')) patterns.push('swiftui');

  // Detect framework
  let framework: string | undefined;
  if (code.includes('React') || code.includes('useState')) framework = 'React';
  else if (code.includes('Vue') || code.includes('defineComponent')) framework = 'Vue';
  else if (code.includes('@angular')) framework = 'Angular';
  else if (code.includes('express')) framework = 'Express';
  else if (code.includes('@Composable')) framework = 'Jetpack Compose';
  else if (code.includes('SwiftUI') || code.includes('struct') && code.includes('View')) framework = 'SwiftUI';

  return {
    relevantKnowledge,
    codeContext: {
      language,
      framework,
      patterns,
      issues: analysisResult.issues,
      securityFindings: analysisResult.securityFindings || [],
    },
    analysisDepth: depth,
  };
}

/**
 * Generates an enhanced prompt with RAG context - STRUCTURED OUTPUT
 */
export function generateRAGPrompt(
  code: string,
  ragContext: RAGContext,
  task: 'analyze' | 'improve' | 'optimize' | 'explain'
): string {
  const knowledgeSection = ragContext.relevantKnowledge
    .slice(0, 5) // Limit to top 5 for focused context
    .map(chunk => `- **${chunk.title}**: ${chunk.content.split('\n')[0]}`)
    .join('\n');

  const issuesSummary = ragContext.codeContext.issues
    .slice(0, 10)
    .map(i => `- [${i.severity.toUpperCase()}] Line ${i.location?.line || 'N/A'}: ${i.title}`)
    .join('\n');

  const taskInstructions: Record<string, string> = {
    analyze: `## Your Task: Code Analysis

Provide a **structured analysis** of the code. Use the following format:

### 📊 Overview
Brief summary of what this code does and its overall quality (2-3 sentences).

### 🔴 Critical Issues (Fix Immediately)
List any critical security or crash-causing issues. For each:
- **Issue**: Description
- **Line**: Line number
- **Fix**: How to fix it

### 🟠 Important Issues (Should Fix)
List important issues that affect quality/performance. For each:
- **Issue**: Description  
- **Line**: Line number
- **Fix**: How to fix it

### 🟡 Suggestions (Nice to Have)
List minor improvements. For each:
- **Suggestion**: Description
- **Why**: Benefit of making this change

### ✅ What's Good
List 2-3 things the code does well.

### 📈 Quality Score
Rate the code: **X/10** with brief justification.`,
    
    improve: `## Your Task: Improvement Suggestions

Provide **actionable improvement suggestions** in this format:

### 🎯 Top Priority Improvements

For each improvement (list up to 5):

#### 1. [Improvement Title]
- **Problem**: What's wrong
- **Impact**: Why it matters (security/performance/maintainability)
- **Solution**: How to fix it
- **Code Example**:
\`\`\`${ragContext.codeContext.language}
// Before
[problematic code]

// After  
[improved code]
\`\`\`

### 💡 Quick Wins
List 3-5 simple changes that can be made quickly.

### 🏗️ Architectural Suggestions
Any larger refactoring suggestions (if applicable).`,
    
    optimize: `## Your Task: Code Optimization

Generate a **production-ready optimized version** of the code.

### Requirements:
1. Fix ALL security vulnerabilities
2. Apply ALL best practices
3. Add proper error handling
4. Use modern syntax
5. Add helpful comments

### Output Format:

First, provide the optimized code:

\`\`\`${ragContext.codeContext.language}
// Your optimized code here
\`\`\`

Then, list the changes:

### 📝 Changes Made

| Line | Change | Reason |
|------|--------|--------|
| X | What changed | Why |

### ✅ Issues Fixed
- List each issue that was fixed

### ⚠️ Notes
Any important notes about the changes.`,
    
    explain: `## Your Task: Code Explanation

Explain this code clearly for someone learning. Use this format:

### 📖 What This Code Does
Simple explanation of the code's purpose (2-3 sentences).

### 🔍 Step-by-Step Breakdown

For each major section:

#### [Section Name] (Lines X-Y)
- **Purpose**: What this section does
- **How it works**: Brief explanation
- **Key concepts**: Any important programming concepts used

### 📊 Data Flow
Explain how data moves through the code:
1. Input → 
2. Processing →
3. Output

### ⚠️ Potential Issues
List any problems or areas for improvement.

### 💡 Key Takeaways
3-5 main things to learn from this code.`
  };

  return `You are CodeSentinel AI, an expert code analysis assistant. You provide **clear, structured, actionable** feedback.

## Code Context
- **Language**: ${ragContext.codeContext.language}
${ragContext.codeContext.framework ? `- **Framework**: ${ragContext.codeContext.framework}` : ''}
- **Patterns Detected**: ${ragContext.codeContext.patterns.join(', ') || 'None'}
- **Issues Found**: ${ragContext.codeContext.issues.length}
- **Security Findings**: ${ragContext.codeContext.securityFindings.length}

## Relevant Best Practices
${knowledgeSection || 'No specific best practices matched.'}

## Current Issues Detected
${issuesSummary || 'No issues detected.'}

${taskInstructions[task]}

## Code to Analyze
\`\`\`${ragContext.codeContext.language}
${code}
\`\`\`

**IMPORTANT**: 
- Use markdown formatting with headers, bullet points, and code blocks
- Be specific - reference line numbers when possible
- Provide code examples for fixes
- Keep explanations concise but complete
- Focus on the most impactful issues first`;
}

/**
 * Generates optimized code with all fixes applied - STRUCTURED OUTPUT
 */
export function generateOptimizationPrompt(
  code: string,
  ragContext: RAGContext
): string {
  const issuesList = ragContext.codeContext.issues
    .slice(0, 15)
    .map((issue, i) => `${i + 1}. [${issue.severity}] Line ${issue.location?.line || 'N/A'}: ${issue.title}`)
    .join('\n');

  const securityList = ragContext.codeContext.securityFindings
    .slice(0, 10)
    .map((f, i) => `${i + 1}. [${f.severity}] ${f.vulnerability || 'Security Issue'}: ${f.description || 'No description'}`)
    .join('\n');

  return `You are CodeSentinel AI, an expert code refactoring assistant.

## Your Task
Generate a **COMPLETELY OPTIMIZED** version of the provided code that:
1. Fixes ALL listed issues
2. Applies ALL security best practices
3. Uses modern ${ragContext.codeContext.language} syntax
4. Has proper error handling
5. Is production-ready

## Issues to Fix
${issuesList || 'No issues detected'}

## Security Vulnerabilities
${securityList || 'No security issues detected'}

## Best Practices to Apply
${ragContext.relevantKnowledge.slice(0, 5).map(k => `- ${k.title}`).join('\n')}

## Original Code
\`\`\`${ragContext.codeContext.language}
${code}
\`\`\`

## Required Output Format

\`\`\`${ragContext.codeContext.language}
// Optimized code with comments explaining changes
\`\`\`

### 📝 Summary of Changes

| # | Change | Reason | Lines |
|---|--------|--------|-------|
| 1 | ... | ... | ... |

### ✅ Issues Resolved
- [x] Issue 1
- [x] Issue 2
...

### ⚠️ Notes
Any important notes or manual steps needed.`;
}

/**
 * Generate a chat-optimized prompt with context
 */
export function generateChatPrompt(
  code: string,
  ragContext: RAGContext,
  userQuestion: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[]
): string {
  const recentHistory = chatHistory.slice(-4).map(m => 
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`
  ).join('\n');

  return `You are CodeSentinel AI Assistant, helping with code analysis questions.

## Code Context
- **Language**: ${ragContext.codeContext.language}
- **Framework**: ${ragContext.codeContext.framework || 'Not detected'}
- **Issues Found**: ${ragContext.codeContext.issues.length}

## Code Being Discussed
\`\`\`${ragContext.codeContext.language}
${code.slice(0, 2000)}${code.length > 2000 ? '\n// ... (truncated)' : ''}
\`\`\`

## Top Issues
${ragContext.codeContext.issues.slice(0, 5).map(i => `- [${i.severity}] ${i.title}`).join('\n')}

${recentHistory ? `## Recent Conversation\n${recentHistory}\n` : ''}

## User's Question
${userQuestion}

## Guidelines
- Be concise but helpful
- Reference specific line numbers when discussing code
- Provide code examples when useful
- If asked about a specific issue, explain why it's a problem and how to fix it
- Use markdown formatting for clarity`;
}

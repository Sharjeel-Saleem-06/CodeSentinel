/**
 * Semantic Analyzer
 * AI-powered semantic analysis for SwiftUI, Kotlin, and other platforms
 * Performs deep contextual analysis beyond simple pattern matching
 */

import type { Language, CodeIssue, Severity, SecurityFinding } from '../../types/analysis';
import { queryAI } from '../ai/groqService';

export interface SemanticIssue {
  id: string;
  type: 'lint' | 'architectural';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  line?: number;
  whyProblem: string;
  bestPractice: string;
  category: string;
  framework?: string;
}

export interface SemanticAnalysisResult {
  issues: SemanticIssue[];
  summary: string;
  architectureScore: number;
  recommendations: string[];
}

/**
 * SwiftUI-specific semantic rules
 */
const SWIFTUI_SEMANTIC_RULES = [
  // State Management Issues
  {
    id: 'SWIFTUI-STATE-001',
    type: 'architectural' as const,
    pattern: /@State\s+(?:private\s+)?var\s+\w+\s*:\s*(?:class|AnyObject|\w+Class)/i,
    title: '@State with Reference Type',
    description: '@State is designed for value types. Using it with reference types can cause unexpected behavior.',
    severity: 'high' as const,
    whyProblem: 'SwiftUI\'s @State tracks value changes, not object mutations. Reference types won\'t trigger re-renders correctly.',
    bestPractice: 'Use @StateObject for reference types that you create, or @ObservedObject for injected reference types.',
    category: 'state-management',
    framework: 'SwiftUI',
  },
  {
    id: 'SWIFTUI-STATE-002',
    type: 'architectural' as const,
    pattern: /@ObservedObject\s+(?:private\s+)?var\s+\w+\s*=\s*\w+\(/,
    title: '@ObservedObject with Inline Initialization',
    description: 'Creating an ObservableObject inline causes it to be recreated on every view render.',
    severity: 'critical' as const,
    whyProblem: 'The object is recreated each time the view\'s body is evaluated, losing all state.',
    bestPractice: 'Use @StateObject when creating the object in the view, or inject it from a parent view.',
    category: 'state-management',
    framework: 'SwiftUI',
  },
  {
    id: 'SWIFTUI-STATE-003',
    type: 'lint' as const,
    pattern: /@StateObject\s+var\s+\w+(?!\s*:\s*\w+\s*=)/,
    title: '@StateObject without Initialization',
    description: '@StateObject should be initialized in the view where it\'s declared.',
    severity: 'medium' as const,
    whyProblem: 'StateObject without initialization will cause runtime crashes.',
    bestPractice: 'Initialize @StateObject properties with a default value or in the initializer.',
    category: 'state-management',
    framework: 'SwiftUI',
  },
  // MVVM Violations
  {
    id: 'SWIFTUI-MVVM-001',
    type: 'architectural' as const,
    pattern: /struct\s+\w+View\s*:\s*View\s*\{[\s\S]*?(?:URLSession|FileManager|UserDefaults|CoreData|NSManagedObject)/,
    title: 'Data Access in View',
    description: 'Direct data access (network, file, database) should not be in the View layer.',
    severity: 'high' as const,
    whyProblem: 'Violates MVVM separation of concerns, makes views untestable and tightly coupled.',
    bestPractice: 'Move data operations to a ViewModel or Service layer. Views should only display data.',
    category: 'mvvm-violation',
    framework: 'SwiftUI',
  },
  {
    id: 'SWIFTUI-MVVM-002',
    type: 'architectural' as const,
    pattern: /var\s+body\s*:\s*some\s+View\s*\{[\s\S]{1500,}?\}/,
    title: 'Over-complex View Body',
    description: 'View body is too complex and should be decomposed into smaller views.',
    severity: 'medium' as const,
    whyProblem: 'Large view bodies are hard to maintain, test, and can cause performance issues.',
    bestPractice: 'Extract complex sections into separate views or computed properties.',
    category: 'complexity',
    framework: 'SwiftUI',
  },
  // Lifecycle Issues
  {
    id: 'SWIFTUI-LIFECYCLE-001',
    type: 'lint' as const,
    pattern: /\.onAppear\s*\{[\s\S]*?@State/,
    title: 'State Modification in onAppear',
    description: 'Modifying @State directly in onAppear can cause infinite loops.',
    severity: 'high' as const,
    whyProblem: 'Setting state in onAppear can trigger re-renders, causing onAppear to be called again.',
    bestPractice: 'Use task modifier for async work, or ensure state changes don\'t cause re-appearance.',
    category: 'lifecycle',
    framework: 'SwiftUI',
  },
  // Anti-patterns
  {
    id: 'SWIFTUI-ANTI-001',
    type: 'architectural' as const,
    pattern: /UIKit|UIView|UIViewController|UIApplication\.shared/,
    title: 'UIKit Usage in SwiftUI',
    description: 'Direct UIKit usage detected. Consider using SwiftUI equivalents when possible.',
    severity: 'low' as const,
    whyProblem: 'Mixing UIKit and SwiftUI can complicate the codebase and break SwiftUI features.',
    bestPractice: 'Use UIViewRepresentable/UIViewControllerRepresentable when UIKit is necessary.',
    category: 'anti-pattern',
    framework: 'SwiftUI',
  },
  {
    id: 'SWIFTUI-ANTI-002',
    type: 'architectural' as const,
    pattern: /NotificationCenter\.default\.addObserver|NotificationCenter\.default\.post/,
    title: 'NotificationCenter in SwiftUI',
    description: 'NotificationCenter usage detected. Consider using SwiftUI data flow.',
    severity: 'medium' as const,
    whyProblem: 'NotificationCenter bypasses SwiftUI\'s reactive data flow, making state hard to track.',
    bestPractice: 'Use @Published, Combine, or @EnvironmentObject for cross-component communication.',
    category: 'anti-pattern',
    framework: 'SwiftUI',
  },
  {
    id: 'SWIFTUI-ANTI-003',
    type: 'architectural' as const,
    pattern: /static\s+let\s+shared\s*=|\.shared\./,
    title: 'Singleton Pattern',
    description: 'Singleton usage can make SwiftUI views harder to test and preview.',
    severity: 'low' as const,
    whyProblem: 'Singletons create hidden dependencies and make unit testing difficult.',
    bestPractice: 'Use dependency injection via @EnvironmentObject or initializer parameters.',
    category: 'anti-pattern',
    framework: 'SwiftUI',
  },
  // Memory Issues
  {
    id: 'SWIFTUI-MEMORY-001',
    type: 'lint' as const,
    pattern: /\{\s*\[self\]/,
    title: 'Strong Self Capture',
    description: 'Capturing self strongly in closures can cause retain cycles.',
    severity: 'high' as const,
    whyProblem: 'Strong capture creates retain cycles when the closure is stored by the captured object.',
    bestPractice: 'Use [weak self] or [unowned self] in escaping closures.',
    category: 'memory',
    framework: 'SwiftUI',
  },
];

/**
 * Kotlin-specific semantic rules
 */
const KOTLIN_SEMANTIC_RULES = [
  // Coroutine Issues
  {
    id: 'KOTLIN-COROUTINE-001',
    type: 'architectural' as const,
    pattern: /GlobalScope\.launch|GlobalScope\.async/,
    title: 'GlobalScope Usage',
    description: 'GlobalScope launches coroutines that live for the entire app lifecycle.',
    severity: 'high' as const,
    whyProblem: 'GlobalScope coroutines aren\'t cancelled when the component is destroyed, causing leaks.',
    bestPractice: 'Use viewModelScope, lifecycleScope, or a custom CoroutineScope.',
    category: 'coroutines',
    framework: 'Kotlin Coroutines',
  },
  {
    id: 'KOTLIN-COROUTINE-002',
    type: 'lint' as const,
    pattern: /runBlocking\s*\{/,
    title: 'runBlocking on Main Thread',
    description: 'runBlocking can block the UI thread if not used carefully.',
    severity: 'critical' as const,
    whyProblem: 'Blocking the main thread causes ANRs (Application Not Responding) on Android.',
    bestPractice: 'Use launch or async with appropriate dispatchers. Reserve runBlocking for tests.',
    category: 'coroutines',
    framework: 'Kotlin Coroutines',
  },
  // MVVM/Architecture Issues
  {
    id: 'KOTLIN-MVVM-001',
    type: 'architectural' as const,
    pattern: /class\s+\w+(?:Activity|Fragment)\s*[\s\S]*?(?:Retrofit|Room|HttpClient|OkHttp)/,
    title: 'Data Access in Activity/Fragment',
    description: 'Direct data access should not be in UI components.',
    severity: 'high' as const,
    whyProblem: 'Violates separation of concerns, makes UI components untestable.',
    bestPractice: 'Use Repository pattern with ViewModel. Activities/Fragments should only observe data.',
    category: 'mvvm-violation',
    framework: 'Android',
  },
  {
    id: 'KOTLIN-MVVM-002',
    type: 'architectural' as const,
    pattern: /class\s+\w+ViewModel[\s\S]*?(?:Context|Activity|Fragment|View(?!Model))/,
    title: 'Context/View Reference in ViewModel',
    description: 'ViewModel should not hold references to Context, Activity, or Views.',
    severity: 'critical' as const,
    whyProblem: 'ViewModels outlive Activities/Fragments, causing memory leaks.',
    bestPractice: 'Use Application context if needed. Pass data, not UI components, to ViewModel.',
    category: 'mvvm-violation',
    framework: 'Android',
  },
  // Null Safety
  {
    id: 'KOTLIN-NULL-001',
    type: 'lint' as const,
    pattern: /as\?\s*\w+\s*\?\./,
    title: 'Unnecessary Safe Cast with Safe Call',
    description: 'Safe cast (as?) already returns null on failure, double-safety is redundant.',
    severity: 'low' as const,
    whyProblem: 'Redundant null safety operations clutter the code.',
    bestPractice: 'Use either safe cast or safe call, not both in sequence.',
    category: 'null-safety',
    framework: 'Kotlin',
  },
  // Performance
  {
    id: 'KOTLIN-PERF-001',
    type: 'lint' as const,
    pattern: /\.forEach\s*\{\s*\w+\s*->\s*[\s\S]*?\.add\(/,
    title: 'forEach with Mutation',
    description: 'Using forEach to add to a collection is less efficient than map/filter.',
    severity: 'low' as const,
    whyProblem: 'Manual iteration with mutation is verbose and can be error-prone.',
    bestPractice: 'Use functional operators like map, filter, flatMap for transformations.',
    category: 'performance',
    framework: 'Kotlin',
  },
  // Compose Issues
  {
    id: 'KOTLIN-COMPOSE-001',
    type: 'architectural' as const,
    pattern: /@Composable[\s\S]*?remember\s*\{[\s\S]*?mutableStateOf/,
    title: 'remember with mutableStateOf',
    description: 'Use rememberSaveable for state that should survive configuration changes.',
    severity: 'medium' as const,
    whyProblem: 'State in remember is lost on configuration changes (rotation, etc.).',
    bestPractice: 'Use rememberSaveable for important UI state, or hoist state to ViewModel.',
    category: 'state-management',
    framework: 'Jetpack Compose',
  },
  {
    id: 'KOTLIN-COMPOSE-002',
    type: 'lint' as const,
    pattern: /@Composable[\s\S]*?LaunchedEffect\s*\(\s*(?:Unit|true)\s*\)/,
    title: 'LaunchedEffect with Constant Key',
    description: 'LaunchedEffect with constant key runs only once and may not be the intent.',
    severity: 'low' as const,
    whyProblem: 'May miss re-execution when dependent data changes.',
    bestPractice: 'Pass relevant dependencies as keys to LaunchedEffect.',
    category: 'lifecycle',
    framework: 'Jetpack Compose',
  },
];

/**
 * JavaScript/TypeScript semantic rules
 */
const JAVASCRIPT_SEMANTIC_RULES = [
  // Async/Promise Issues
  {
    id: 'JS-ASYNC-001',
    type: 'architectural' as const,
    pattern: /new\s+Promise\s*\(\s*(?:async|function\s*\*)/,
    title: 'Async Executor in Promise Constructor',
    description: 'Using async function as Promise executor is an anti-pattern.',
    severity: 'high' as const,
    whyProblem: 'Errors thrown in async executors are not caught by the Promise, leading to unhandled rejections.',
    bestPractice: 'Return async function directly or use Promise.resolve() with async function.',
    category: 'async-pattern',
    framework: 'JavaScript',
  },
  {
    id: 'JS-ASYNC-002',
    type: 'lint' as const,
    pattern: /\.then\s*\([^)]*\)\s*\.then\s*\([^)]*\)\s*\.then\s*\([^)]*\)/,
    title: 'Promise Chain Hell',
    description: 'Excessive promise chaining reduces readability.',
    severity: 'medium' as const,
    whyProblem: 'Deep promise chains are hard to read and maintain, similar to callback hell.',
    bestPractice: 'Use async/await for cleaner asynchronous code.',
    category: 'async-pattern',
    framework: 'JavaScript',
  },
  {
    id: 'JS-ASYNC-003',
    type: 'lint' as const,
    pattern: /await\s+(?!Promise\.all|Promise\.allSettled)[\w.]+\s*\(\s*\)[\s\S]*?await\s+[\w.]+\s*\(\s*\)/,
    title: 'Sequential Awaits',
    description: 'Multiple independent awaits could be parallelized.',
    severity: 'low' as const,
    whyProblem: 'Sequential awaits for independent operations waste time.',
    bestPractice: 'Use Promise.all() for independent async operations.',
    category: 'performance',
    framework: 'JavaScript',
  },
  // React-specific Issues
  {
    id: 'JS-REACT-001',
    type: 'architectural' as const,
    pattern: /useState\s*\(\s*\)\s*[\s\S]*?useEffect\s*\([^)]*\[\s*\]\s*\)/,
    title: 'State Update in Empty Dependency useEffect',
    description: 'Setting state in useEffect with empty deps can cause stale closures.',
    severity: 'medium' as const,
    whyProblem: 'Empty dependency array means the effect captures initial values forever.',
    bestPractice: 'Include all dependencies or use useCallback/useMemo appropriately.',
    category: 'react-hooks',
    framework: 'React',
  },
  {
    id: 'JS-REACT-002',
    type: 'architectural' as const,
    pattern: /useEffect\s*\([^)]*fetch\s*\([^)]*\)[^)]*\)/,
    title: 'Fetch in useEffect without Cleanup',
    description: 'API calls in useEffect should handle component unmount.',
    severity: 'high' as const,
    whyProblem: 'Setting state after unmount causes memory leaks and React warnings.',
    bestPractice: 'Use AbortController or a mounted flag to cancel requests on cleanup.',
    category: 'react-hooks',
    framework: 'React',
  },
  {
    id: 'JS-REACT-003',
    type: 'lint' as const,
    pattern: /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\w+\s*\(/,
    title: 'Inline Arrow Function in JSX',
    description: 'Inline functions in JSX create new references on every render.',
    severity: 'low' as const,
    whyProblem: 'Can cause unnecessary re-renders in child components.',
    bestPractice: 'Use useCallback for event handlers or define functions outside render.',
    category: 'performance',
    framework: 'React',
  },
  // Security Issues
  {
    id: 'JS-SEC-001',
    type: 'lint' as const,
    pattern: /innerHTML\s*=|dangerouslySetInnerHTML/,
    title: 'Direct HTML Injection',
    description: 'Setting innerHTML directly can lead to XSS vulnerabilities.',
    severity: 'critical' as const,
    whyProblem: 'User input in innerHTML can execute malicious scripts.',
    bestPractice: 'Use textContent or sanitize HTML with DOMPurify.',
    category: 'security',
    framework: 'JavaScript',
  },
  {
    id: 'JS-SEC-002',
    type: 'lint' as const,
    pattern: /eval\s*\(|new\s+Function\s*\(/,
    title: 'Dynamic Code Execution',
    description: 'eval() and new Function() can execute arbitrary code.',
    severity: 'critical' as const,
    whyProblem: 'Dynamic code execution is a major security vulnerability.',
    bestPractice: 'Use JSON.parse for data, or safer alternatives like template literals.',
    category: 'security',
    framework: 'JavaScript',
  },
  // Error Handling
  {
    id: 'JS-ERR-001',
    type: 'lint' as const,
    pattern: /catch\s*\(\s*\w+\s*\)\s*\{\s*\}/,
    title: 'Empty Catch Block',
    description: 'Empty catch block silently swallows errors.',
    severity: 'high' as const,
    whyProblem: 'Silent failures make debugging extremely difficult.',
    bestPractice: 'Log errors, rethrow, or handle them appropriately.',
    category: 'error-handling',
    framework: 'JavaScript',
  },
  {
    id: 'JS-ERR-002',
    type: 'lint' as const,
    pattern: /catch\s*\(\s*\w+\s*\)\s*\{[\s\S]*?console\.log/,
    title: 'Console.log in Catch Block',
    description: 'Using console.log for error handling is insufficient.',
    severity: 'medium' as const,
    whyProblem: 'Console.log is not proper error handling and may be stripped in production.',
    bestPractice: 'Use proper error logging service and user-facing error handling.',
    category: 'error-handling',
    framework: 'JavaScript',
  },
];

/**
 * Python semantic rules
 */
const PYTHON_SEMANTIC_RULES = [
  // Type Safety
  {
    id: 'PY-TYPE-001',
    type: 'lint' as const,
    pattern: /def\s+\w+\s*\([^)]*\)\s*(?!->)/,
    title: 'Missing Return Type Hint',
    description: 'Function lacks return type annotation.',
    severity: 'low' as const,
    whyProblem: 'Type hints improve code documentation and enable static analysis.',
    bestPractice: 'Add return type hints: def func() -> ReturnType:',
    category: 'type-safety',
    framework: 'Python',
  },
  // Resource Management
  {
    id: 'PY-RES-001',
    type: 'lint' as const,
    pattern: /open\s*\([^)]+\)(?!\s*as\s+\w+)/,
    title: 'File Not Using Context Manager',
    description: 'File opened without context manager may not be properly closed.',
    severity: 'high' as const,
    whyProblem: 'Files not properly closed can cause resource leaks.',
    bestPractice: 'Use with open(...) as f: for automatic resource management.',
    category: 'resource-management',
    framework: 'Python',
  },
  // Security
  {
    id: 'PY-SEC-001',
    type: 'lint' as const,
    pattern: /pickle\.load|pickle\.loads/,
    title: 'Unsafe Pickle Deserialization',
    description: 'Pickle can execute arbitrary code during deserialization.',
    severity: 'critical' as const,
    whyProblem: 'Pickle is not secure against malicious data.',
    bestPractice: 'Use JSON or other safe serialization formats for untrusted data.',
    category: 'security',
    framework: 'Python',
  },
  {
    id: 'PY-SEC-002',
    type: 'lint' as const,
    pattern: /exec\s*\(|eval\s*\(/,
    title: 'Dynamic Code Execution',
    description: 'exec() and eval() can execute arbitrary code.',
    severity: 'critical' as const,
    whyProblem: 'Dynamic execution is a major security vulnerability.',
    bestPractice: 'Use ast.literal_eval for safe evaluation of literals.',
    category: 'security',
    framework: 'Python',
  },
  {
    id: 'PY-SEC-003',
    type: 'lint' as const,
    pattern: /subprocess\.(?:call|run|Popen)\s*\([^)]*shell\s*=\s*True/,
    title: 'Shell Injection Risk',
    description: 'shell=True with user input can lead to command injection.',
    severity: 'critical' as const,
    whyProblem: 'Shell commands with user input can execute arbitrary commands.',
    bestPractice: 'Use shell=False and pass arguments as a list.',
    category: 'security',
    framework: 'Python',
  },
  // Django/Flask specific
  {
    id: 'PY-DJANGO-001',
    type: 'lint' as const,
    pattern: /\.raw\s*\(|RawSQL\s*\(/,
    title: 'Raw SQL Query',
    description: 'Raw SQL queries may be vulnerable to SQL injection.',
    severity: 'high' as const,
    whyProblem: 'Raw SQL bypasses ORM protections against SQL injection.',
    bestPractice: 'Use ORM queries or parameterized queries.',
    category: 'security',
    framework: 'Django',
  },
  // Performance
  {
    id: 'PY-PERF-001',
    type: 'lint' as const,
    pattern: /for\s+\w+\s+in\s+range\s*\(\s*len\s*\(/,
    title: 'Iterating with range(len())',
    description: 'Using range(len()) is not Pythonic.',
    severity: 'low' as const,
    whyProblem: 'Less readable and potentially slower than direct iteration.',
    bestPractice: 'Use enumerate() or iterate directly over the collection.',
    category: 'best-practice',
    framework: 'Python',
  },
];

/**
 * Java semantic rules
 */
const JAVA_SEMANTIC_RULES = [
  // Resource Management
  {
    id: 'JAVA-RES-001',
    type: 'lint' as const,
    pattern: /new\s+(?:FileInputStream|FileOutputStream|BufferedReader|Connection)\s*\([^)]*\)(?![\s\S]*?\.close\(\))/,
    title: 'Resource Not Properly Closed',
    description: 'Resource may not be properly closed.',
    severity: 'high' as const,
    whyProblem: 'Unclosed resources cause memory leaks and file handle exhaustion.',
    bestPractice: 'Use try-with-resources: try (Resource r = new Resource()) {}',
    category: 'resource-management',
    framework: 'Java',
  },
  // Concurrency
  {
    id: 'JAVA-CONC-001',
    type: 'architectural' as const,
    pattern: /synchronized\s*\(\s*this\s*\)/,
    title: 'Synchronizing on this',
    description: 'Synchronizing on this exposes lock to external code.',
    severity: 'medium' as const,
    whyProblem: 'External code can also synchronize on your object, causing deadlocks.',
    bestPractice: 'Use a private final lock object.',
    category: 'concurrency',
    framework: 'Java',
  },
  {
    id: 'JAVA-CONC-002',
    type: 'lint' as const,
    pattern: /new\s+Thread\s*\(/,
    title: 'Manual Thread Creation',
    description: 'Creating threads directly is less efficient than using executors.',
    severity: 'medium' as const,
    whyProblem: 'Manual thread management is error-prone and inefficient.',
    bestPractice: 'Use ExecutorService for thread management.',
    category: 'concurrency',
    framework: 'Java',
  },
  // Null Safety
  {
    id: 'JAVA-NULL-001',
    type: 'lint' as const,
    pattern: /\.equals\s*\(\s*null\s*\)/,
    title: 'Comparing with null using equals',
    description: 'Use == for null comparison, not equals().',
    severity: 'low' as const,
    whyProblem: 'equals() can throw NullPointerException if called on null.',
    bestPractice: 'Use == null or Objects.isNull() for null checks.',
    category: 'null-safety',
    framework: 'Java',
  },
  // Spring specific
  {
    id: 'JAVA-SPRING-001',
    type: 'architectural' as const,
    pattern: /@Autowired\s+(?:private|protected)?\s+\w+\s+\w+;/,
    title: 'Field Injection',
    description: 'Field injection makes testing difficult.',
    severity: 'medium' as const,
    whyProblem: 'Field injection hides dependencies and makes unit testing harder.',
    bestPractice: 'Use constructor injection for required dependencies.',
    category: 'dependency-injection',
    framework: 'Spring',
  },
  // Security
  {
    id: 'JAVA-SEC-001',
    type: 'lint' as const,
    pattern: /Statement\s*\w*\s*=[\s\S]*?\.createStatement\s*\(\)/,
    title: 'Using Statement instead of PreparedStatement',
    description: 'Statement is vulnerable to SQL injection.',
    severity: 'critical' as const,
    whyProblem: 'String concatenation in SQL queries enables SQL injection.',
    bestPractice: 'Use PreparedStatement with parameterized queries.',
    category: 'security',
    framework: 'Java',
  },
];

/**
 * Go semantic rules
 */
const GO_SEMANTIC_RULES = [
  // Error Handling
  {
    id: 'GO-ERR-001',
    type: 'lint' as const,
    pattern: /,\s*_\s*:?=\s*\w+\s*\([^)]*\)/,
    title: 'Ignored Error',
    description: 'Error return value is being ignored.',
    severity: 'high' as const,
    whyProblem: 'Ignoring errors can lead to unexpected behavior and hard-to-debug issues.',
    bestPractice: 'Always handle errors: if err != nil { return err }',
    category: 'error-handling',
    framework: 'Go',
  },
  {
    id: 'GO-ERR-002',
    type: 'lint' as const,
    pattern: /if\s+err\s*!=\s*nil\s*\{[\s\S]*?panic\s*\(/,
    title: 'Panic on Error',
    description: 'Using panic for error handling is not idiomatic.',
    severity: 'medium' as const,
    whyProblem: 'Panic should be reserved for truly unrecoverable situations.',
    bestPractice: 'Return errors and let the caller decide how to handle them.',
    category: 'error-handling',
    framework: 'Go',
  },
  // Concurrency
  {
    id: 'GO-CONC-001',
    type: 'architectural' as const,
    pattern: /go\s+func\s*\(\s*\)\s*\{[\s\S]*?\}\s*\(\s*\)/,
    title: 'Goroutine without Synchronization',
    description: 'Goroutine may not have proper synchronization.',
    severity: 'medium' as const,
    whyProblem: 'Goroutines without synchronization can cause race conditions.',
    bestPractice: 'Use channels or sync primitives for goroutine coordination.',
    category: 'concurrency',
    framework: 'Go',
  },
  {
    id: 'GO-CONC-002',
    type: 'lint' as const,
    pattern: /for\s+\w+\s*:?=\s*range[\s\S]*?go\s+func/,
    title: 'Loop Variable Capture in Goroutine',
    description: 'Loop variable may be captured by reference in goroutine.',
    severity: 'high' as const,
    whyProblem: 'All goroutines may end up using the same (final) value.',
    bestPractice: 'Pass loop variable as parameter to the goroutine function.',
    category: 'concurrency',
    framework: 'Go',
  },
  // Resource Management
  {
    id: 'GO-RES-001',
    type: 'lint' as const,
    pattern: /http\.Get\s*\([^)]*\)(?![\s\S]*?\.Body\.Close\(\))/,
    title: 'HTTP Response Body Not Closed',
    description: 'HTTP response body should be closed to prevent resource leaks.',
    severity: 'high' as const,
    whyProblem: 'Unclosed response bodies cause connection leaks.',
    bestPractice: 'Use defer resp.Body.Close() after checking for errors.',
    category: 'resource-management',
    framework: 'Go',
  },
];

/**
 * Rust semantic rules
 */
const RUST_SEMANTIC_RULES = [
  // Unsafe Code
  {
    id: 'RUST-UNSAFE-001',
    type: 'architectural' as const,
    pattern: /unsafe\s*\{/,
    title: 'Unsafe Block',
    description: 'Unsafe code requires careful review.',
    severity: 'high' as const,
    whyProblem: 'Unsafe blocks bypass Rust\'s safety guarantees.',
    bestPractice: 'Minimize unsafe code and document safety invariants.',
    category: 'safety',
    framework: 'Rust',
  },
  // Error Handling
  {
    id: 'RUST-ERR-001',
    type: 'lint' as const,
    pattern: /\.unwrap\s*\(\s*\)/,
    title: 'Using unwrap()',
    description: 'unwrap() will panic on None/Err.',
    severity: 'medium' as const,
    whyProblem: 'Panics in production code cause crashes.',
    bestPractice: 'Use expect() with message, or handle with match/if let.',
    category: 'error-handling',
    framework: 'Rust',
  },
  {
    id: 'RUST-ERR-002',
    type: 'lint' as const,
    pattern: /\.expect\s*\(\s*["'][^"']*["']\s*\)/,
    title: 'Using expect() in Library Code',
    description: 'expect() panics, which may not be appropriate for libraries.',
    severity: 'low' as const,
    whyProblem: 'Libraries should return errors, not panic.',
    bestPractice: 'Return Result type and let caller handle errors.',
    category: 'error-handling',
    framework: 'Rust',
  },
  // Performance
  {
    id: 'RUST-PERF-001',
    type: 'lint' as const,
    pattern: /\.clone\s*\(\s*\)[\s\S]*?\.clone\s*\(\s*\)/,
    title: 'Multiple Clones',
    description: 'Multiple clones may indicate unnecessary copying.',
    severity: 'low' as const,
    whyProblem: 'Excessive cloning impacts performance.',
    bestPractice: 'Use references or Rc/Arc for shared ownership.',
    category: 'performance',
    framework: 'Rust',
  },
];

/**
 * C++ semantic rules
 */
const CPP_SEMANTIC_RULES = [
  // Memory Management
  {
    id: 'CPP-MEM-001',
    type: 'lint' as const,
    pattern: /new\s+\w+(?:\s*\[[^\]]*\])?\s*(?!\()/,
    title: 'Raw new without Smart Pointer',
    description: 'Raw new can lead to memory leaks.',
    severity: 'high' as const,
    whyProblem: 'Manual memory management is error-prone.',
    bestPractice: 'Use std::make_unique or std::make_shared.',
    category: 'memory-management',
    framework: 'C++',
  },
  {
    id: 'CPP-MEM-002',
    type: 'lint' as const,
    pattern: /delete\s+\w+\s*;/,
    title: 'Manual Delete',
    description: 'Manual delete suggests missing RAII.',
    severity: 'medium' as const,
    whyProblem: 'Manual delete can cause double-free or use-after-free.',
    bestPractice: 'Use smart pointers for automatic memory management.',
    category: 'memory-management',
    framework: 'C++',
  },
  // Safety
  {
    id: 'CPP-SAFE-001',
    type: 'lint' as const,
    pattern: /reinterpret_cast\s*</,
    title: 'reinterpret_cast Usage',
    description: 'reinterpret_cast bypasses type safety.',
    severity: 'high' as const,
    whyProblem: 'Can lead to undefined behavior and type confusion.',
    bestPractice: 'Use static_cast or dynamic_cast when possible.',
    category: 'type-safety',
    framework: 'C++',
  },
  {
    id: 'CPP-SAFE-002',
    type: 'lint' as const,
    pattern: /sprintf\s*\(|strcpy\s*\(|strcat\s*\(/,
    title: 'Unsafe String Function',
    description: 'Using unsafe C string functions.',
    severity: 'critical' as const,
    whyProblem: 'Buffer overflows can cause crashes and security vulnerabilities.',
    bestPractice: 'Use std::string or snprintf/strncpy with bounds checking.',
    category: 'security',
    framework: 'C++',
  },
];

/**
 * PHP semantic rules
 */
const PHP_SEMANTIC_RULES = [
  // Security
  {
    id: 'PHP-SEC-001',
    type: 'lint' as const,
    pattern: /\$_(?:GET|POST|REQUEST)\s*\[/,
    title: 'Direct Superglobal Access',
    description: 'Direct access to superglobals without validation.',
    severity: 'high' as const,
    whyProblem: 'Unvalidated user input can lead to injection attacks.',
    bestPractice: 'Use filter_input() or framework input validation.',
    category: 'security',
    framework: 'PHP',
  },
  {
    id: 'PHP-SEC-002',
    type: 'lint' as const,
    pattern: /mysql_query\s*\(/,
    title: 'Deprecated mysql_* Functions',
    description: 'mysql_* functions are deprecated and insecure.',
    severity: 'critical' as const,
    whyProblem: 'Deprecated functions lack security features and are removed in PHP 7+.',
    bestPractice: 'Use PDO or mysqli with prepared statements.',
    category: 'security',
    framework: 'PHP',
  },
  {
    id: 'PHP-SEC-003',
    type: 'lint' as const,
    pattern: /echo\s+\$_|print\s+\$_/,
    title: 'Unescaped Output',
    description: 'Outputting user input without escaping.',
    severity: 'critical' as const,
    whyProblem: 'XSS vulnerability from unescaped user input.',
    bestPractice: 'Use htmlspecialchars() or framework escaping functions.',
    category: 'security',
    framework: 'PHP',
  },
  // Error Handling
  {
    id: 'PHP-ERR-001',
    type: 'lint' as const,
    pattern: /@\s*\w+\s*\(/,
    title: 'Error Suppression Operator',
    description: 'Using @ to suppress errors hides problems.',
    severity: 'medium' as const,
    whyProblem: 'Suppressed errors make debugging difficult.',
    bestPractice: 'Handle errors properly with try-catch or error checking.',
    category: 'error-handling',
    framework: 'PHP',
  },
];

/**
 * Ruby semantic rules
 */
const RUBY_SEMANTIC_RULES = [
  // Security
  {
    id: 'RUBY-SEC-001',
    type: 'lint' as const,
    pattern: /system\s*\(|exec\s*\(|`[^`]*\$\{/,
    title: 'Command Injection Risk',
    description: 'Shell command with potential user input.',
    severity: 'critical' as const,
    whyProblem: 'User input in shell commands enables command injection.',
    bestPractice: 'Use array form of system() or escape inputs.',
    category: 'security',
    framework: 'Ruby',
  },
  {
    id: 'RUBY-SEC-002',
    type: 'lint' as const,
    pattern: /\.html_safe|raw\s*\(/,
    title: 'Marking Content as Safe',
    description: 'Marking content as HTML safe bypasses escaping.',
    severity: 'high' as const,
    whyProblem: 'Can lead to XSS if content is not properly sanitized.',
    bestPractice: 'Only use html_safe on content you control and have sanitized.',
    category: 'security',
    framework: 'Rails',
  },
  // Rails specific
  {
    id: 'RUBY-RAILS-001',
    type: 'architectural' as const,
    pattern: /class\s+\w+Controller[\s\S]*?(?:Model\.|\.find\(|\.where\()/,
    title: 'Business Logic in Controller',
    description: 'Controllers should be thin, logic belongs in models/services.',
    severity: 'medium' as const,
    whyProblem: 'Fat controllers are hard to test and maintain.',
    bestPractice: 'Move business logic to models, services, or concerns.',
    category: 'architecture',
    framework: 'Rails',
  },
];

/**
 * Hardcoded secrets/strings detection (critical severity)
 */
const HARDCODED_SECRETS_RULES = [
  {
    id: 'HARDCODED-001',
    type: 'lint' as const,
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*["'][^"']{10,}["']/i,
    title: 'Hardcoded API Key',
    description: 'API key appears to be hardcoded in the source code.',
    severity: 'critical' as const,
    whyProblem: 'Hardcoded secrets can be extracted from compiled binaries and version control.',
    bestPractice: 'Use environment variables, secure storage, or build configuration.',
    category: 'security',
    framework: 'All',
  },
  {
    id: 'HARDCODED-002',
    type: 'lint' as const,
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']{3,}["']/i,
    title: 'Hardcoded Password',
    description: 'Password appears to be hardcoded in the source code.',
    severity: 'critical' as const,
    whyProblem: 'Hardcoded passwords are a severe security vulnerability.',
    bestPractice: 'Use secure credential storage or user-provided authentication.',
    category: 'security',
    framework: 'All',
  },
  {
    id: 'HARDCODED-003',
    type: 'lint' as const,
    pattern: /(?:secret|token|bearer)\s*[:=]\s*["'][^"']{10,}["']/i,
    title: 'Hardcoded Secret/Token',
    description: 'Secret or token appears to be hardcoded.',
    severity: 'critical' as const,
    whyProblem: 'Tokens can be used to gain unauthorized access to services.',
    bestPractice: 'Store tokens securely and refresh them regularly.',
    category: 'security',
    framework: 'All',
  },
  {
    id: 'HARDCODED-004',
    type: 'lint' as const,
    pattern: /["'](?:https?:\/\/)?(?:[\w-]+\.)+[\w-]+\/api\/v\d+\/[\w-]+["']/,
    title: 'Hardcoded API URL',
    description: 'API endpoint URL is hardcoded.',
    severity: 'high' as const,
    whyProblem: 'Hardcoded URLs make environment switching difficult and can expose staging/dev endpoints.',
    bestPractice: 'Use configuration files or environment-specific build variants.',
    category: 'best-practice',
    framework: 'All',
  },
  {
    id: 'HARDCODED-005',
    type: 'lint' as const,
    pattern: /["']\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?["']/,
    title: 'Hardcoded IP Address',
    description: 'IP address is hardcoded in the code.',
    severity: 'high' as const,
    whyProblem: 'Hardcoded IPs break when infrastructure changes and may expose internal addresses.',
    bestPractice: 'Use DNS hostnames and environment configuration.',
    category: 'best-practice',
    framework: 'All',
  },
];

/**
 * Run semantic analysis on code
 */
export function runSemanticAnalysis(
  code: string,
  language: Language
): { issues: SemanticIssue[]; codeIssues: CodeIssue[] } {
  const issues: SemanticIssue[] = [];
  const codeIssues: CodeIssue[] = [];

  // Select rules based on language - Senior Architect approach for ALL languages
  let rules: typeof SWIFTUI_SEMANTIC_RULES = [];
  
  switch (language) {
    case 'swift':
      rules = [...SWIFTUI_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    case 'kotlin':
      rules = [...KOTLIN_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    case 'javascript':
    case 'typescript':
      rules = [...JAVASCRIPT_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    case 'python':
      rules = [...PYTHON_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    case 'java':
      rules = [...JAVA_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    case 'go':
      rules = [...GO_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    case 'rust':
      rules = [...RUST_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    case 'cpp':
      rules = [...CPP_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    case 'php':
      rules = [...PHP_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    case 'ruby':
      rules = [...RUBY_SEMANTIC_RULES, ...HARDCODED_SECRETS_RULES];
      break;
    default:
      // For unsupported languages, still check hardcoded secrets
      rules = [...HARDCODED_SECRETS_RULES];
  }

  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.pattern, 'g');
      let match;

      while ((match = regex.exec(code)) !== null) {
        const beforeMatch = code.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;

        const semanticIssue: SemanticIssue = {
          id: `${rule.id}-${lineNumber}`,
          type: rule.type,
          title: rule.title,
          description: rule.description,
          severity: rule.severity,
          line: lineNumber,
          whyProblem: rule.whyProblem,
          bestPractice: rule.bestPractice,
          category: rule.category,
          framework: rule.framework,
        };
        issues.push(semanticIssue);

        // Also create a CodeIssue for integration with main analysis
        const codeIssue: CodeIssue = {
          id: semanticIssue.id,
          ruleId: rule.id,
          title: rule.title,
          description: `${rule.description}\n\n**Why it's a problem:** ${rule.whyProblem}\n\n**Best Practice:** ${rule.bestPractice}`,
          severity: rule.severity === 'critical' ? 'error' : 
                   rule.severity === 'high' ? 'error' :
                   rule.severity === 'medium' ? 'warning' : 'info',
          location: {
            line: lineNumber,
            column: match.index - beforeMatch.lastIndexOf('\n'),
            endLine: lineNumber,
            endColumn: (match.index - beforeMatch.lastIndexOf('\n')) + match[0].length,
            file: 'input',
          },
          category: rule.category as any,
          suggestion: rule.bestPractice,
          autoFixable: false,
          references: [`${rule.framework} Best Practices`, `${rule.type === 'architectural' ? 'Architecture' : 'Lint'} Issue`],
        };
        codeIssues.push(codeIssue);
      }
    } catch (e) {
      console.error(`Error running semantic rule ${rule.id}:`, e);
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  codeIssues.sort((a, b) => {
    const sevA = a.severity === 'error' ? 0 : a.severity === 'warning' ? 1 : 2;
    const sevB = b.severity === 'error' ? 0 : b.severity === 'warning' ? 1 : 2;
    return sevA - sevB;
  });

  return { issues, codeIssues };
}

/**
 * Language-specific prompt configurations for Senior Architect analysis
 */
const LANGUAGE_PROMPTS: Record<string, { role: string; focus: string[] }> = {
  swift: {
    role: 'Senior SwiftUI Architect and Apple-platform code reviewer',
    focus: [
      'Apple SwiftUI documentation and lifecycle rules',
      '@State, @StateObject, @ObservedObject, @EnvironmentObject correctness',
      'MVVM violations (logic inside Views)',
      'Memory and lifecycle risks',
      'Anti-patterns (UIKit usage, NotificationCenter misuse, singletons)',
      'Over-complex Views needing decomposition',
    ],
  },
  kotlin: {
    role: 'Senior Android/Kotlin Architect',
    focus: [
      'Kotlin best practices and idioms',
      'Coroutine usage and structured concurrency',
      'Android lifecycle awareness',
      'Null safety proper usage',
      'MVVM/Clean Architecture violations',
      'Memory leaks and Compose issues',
    ],
  },
  javascript: {
    role: 'Senior JavaScript/Frontend Architect',
    focus: [
      'Modern ES6+ best practices',
      'Async/await and Promise patterns',
      'React hooks and lifecycle (if applicable)',
      'Memory leaks and event listener cleanup',
      'Security vulnerabilities (XSS, injection)',
      'Performance anti-patterns',
    ],
  },
  typescript: {
    role: 'Senior TypeScript/Full-Stack Architect',
    focus: [
      'Type safety and proper typing',
      'Generic usage and type inference',
      'Async/await patterns',
      'React/Angular/Vue best practices (if applicable)',
      'Security vulnerabilities',
      'Architecture and SOLID principles',
    ],
  },
  python: {
    role: 'Senior Python/Backend Architect',
    focus: [
      'Pythonic idioms and PEP 8',
      'Type hints and static analysis',
      'Async/await with asyncio',
      'Django/Flask/FastAPI best practices (if applicable)',
      'Security vulnerabilities (injection, pickle)',
      'Resource management and context managers',
    ],
  },
  java: {
    role: 'Senior Java/Enterprise Architect',
    focus: [
      'Java best practices and design patterns',
      'Concurrency and thread safety',
      'Resource management and try-with-resources',
      'Spring/Jakarta EE best practices (if applicable)',
      'Security vulnerabilities (SQL injection, deserialization)',
      'Memory management and garbage collection',
    ],
  },
  go: {
    role: 'Senior Go/Backend Architect',
    focus: [
      'Go idioms and effective Go',
      'Error handling patterns',
      'Goroutine and channel usage',
      'Race conditions and synchronization',
      'Resource cleanup and defer',
      'API design and package structure',
    ],
  },
  rust: {
    role: 'Senior Rust/Systems Architect',
    focus: [
      'Ownership and borrowing correctness',
      'Unsafe code review and minimization',
      'Error handling with Result/Option',
      'Concurrency safety',
      'Performance and zero-cost abstractions',
      'API design and trait usage',
    ],
  },
  cpp: {
    role: 'Senior C++/Systems Architect',
    focus: [
      'Modern C++ (11/14/17/20) best practices',
      'Memory management and RAII',
      'Smart pointer usage',
      'Concurrency and thread safety',
      'Security vulnerabilities (buffer overflow)',
      'Template and generic programming',
    ],
  },
  php: {
    role: 'Senior PHP/Web Architect',
    focus: [
      'Modern PHP (7+/8+) best practices',
      'Security vulnerabilities (XSS, SQL injection, CSRF)',
      'Laravel/Symfony best practices (if applicable)',
      'Error handling and exceptions',
      'Database access patterns',
      'Dependency injection',
    ],
  },
  ruby: {
    role: 'Senior Ruby/Rails Architect',
    focus: [
      'Ruby idioms and best practices',
      'Rails conventions and patterns (if applicable)',
      'Security vulnerabilities (injection, XSS)',
      'ActiveRecord usage and N+1 queries',
      'Service objects and concerns',
      'Testing and code organization',
    ],
  },
};

/**
 * Generate AI-powered semantic analysis prompt
 */
export function generateSemanticAnalysisPrompt(code: string, language: Language): string {
  const config = LANGUAGE_PROMPTS[language] || {
    role: `Senior ${language.charAt(0).toUpperCase() + language.slice(1)} Developer`,
    focus: [
      'Best practices and coding standards',
      'Security vulnerabilities',
      'Performance issues',
      'Error handling',
      'Code organization',
      'Memory management',
    ],
  };

  const focusPoints = config.focus.map((f, i) => `   ${i + 1}. ${f}`).join('\n');

  return `You are a ${config.role} with 10+ years of production experience. Your role is to review code semantically and architecturally, focusing on issues that would block a PR or cause production failures.

🔍 **Core Evaluation Principles (MANDATORY)**

1️⃣ **Context-Aware Analysis**
   - Infer developer intent from surrounding code
   - Understand state ownership and data flow
   - Detect implicit contracts that can fail at runtime
   - Do NOT flag something unless it is contextually unsafe

2️⃣ **Lifecycle & Runtime Safety (BLOCKER LEVEL)**
${focusPoints}

3️⃣ **Architecture & Ownership**
   - Business logic in wrong layers
   - Hidden dependencies (singletons, globals)
   - Tight coupling between components
   - Missing abstractions or over-abstraction

4️⃣ **Memory & Side-Effect Control**
   - Resource leaks (connections, files, listeners)
   - Improper cleanup
   - Side effects in wrong places

🚫 **What NOT to Report**
❌ Magic numbers, formatting, naming (unless severe)
❌ Purely stylistic issues
❌ Framework-approved patterns used correctly
❌ Issues that don't impact runtime, security, or maintainability

📌 **Severity Rules**
- **Critical**: Crash risk, security vulnerability, data loss
- **High**: Memory leak, lifecycle violation, broken architecture
- **Medium**: Scaling/testing/maintenance problems
- **Low**: Minor improvements, not blocking

📤 **Output Format (MANDATORY)**
Respond with a JSON array:
[
  {
    "severity": "High",
    "type": "architectural",
    "title": "Issue Title",
    "description": "Brief description",
    "line": 10,
    "whyProblem": "Senior-level reasoning why this fails in production",
    "bestPractice": "Official/recommended approach",
    "category": "category-name",
    "framework": "${language}"
  }
]

🧠 **Final Rule**: Only report issues a Staff/Principal Engineer would block or demand refactoring for.

**Code to analyze:**
\`\`\`${language}
${code}
\`\`\``;
}

/**
 * Parse AI semantic analysis response
 * Supports both JSON format and structured text format from Senior Mobile Architect prompt
 */
export function parseSemanticAIResponse(response: string): SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  
  // Try JSON format first
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any, index: number) => ({
          id: `AI-SEMANTIC-${index + 1}`,
          type: item.type === 'architectural' ? 'architectural' : 'lint',
          title: item.title || item.issue_summary || 'Issue',
          description: item.description || '',
          severity: mapSeverity(item.severity),
          line: item.line,
          whyProblem: item.whyProblem || item.why_problem || item.why_risky || '',
          bestPractice: item.bestPractice || item.best_practice || item.correct_best_practice || '',
          category: mapCategory(item.category),
          framework: item.framework || item.platform,
        }));
      }
    }
  } catch {
    // Continue to text parsing
  }

  // Parse structured text format (Senior Mobile Architect output)
  const lines = response.split('\n');
  let currentIssue: Partial<SemanticIssue> = {};
  let issueIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Platform detection
    if (line.match(/^Platform\s*:/i)) {
      // If we have a previous issue, save it
      if (currentIssue.title) {
        issues.push(finalizeIssue(currentIssue, issueIndex++));
      }
      currentIssue = {
        framework: line.replace(/^Platform\s*:\s*/i, '').trim(),
      };
    }
    // Severity
    else if (line.match(/^Severity\s*:/i)) {
      const severityStr = line.replace(/^Severity\s*:\s*/i, '').trim();
      currentIssue.severity = mapSeverity(severityStr);
    }
    // Issue Summary
    else if (line.match(/^Issue\s*Summary\s*:/i) || line.match(/^Issue\s*:/i)) {
      currentIssue.title = line.replace(/^Issue\s*(Summary)?\s*:\s*/i, '').trim();
    }
    // Why risky / Why this is risky
    else if (line.match(/^Why\s*(this\s+is\s+)?risky\s*:/i) || line.match(/^Why\s*it\s*is\s*a\s*problem\s*:/i)) {
      let whyText = line.replace(/^Why\s*(this\s+is\s+)?risky\s*:\s*/i, '').trim();
      whyText = whyText.replace(/^Why\s*it\s*is\s*a\s*problem\s*:\s*/i, '').trim();
      // Check for continuation on next lines
      while (i + 1 < lines.length && 
             !lines[i + 1].trim().match(/^(Platform|Severity|Issue|Why|Correct|Category|Best\s*Practice)\s*:/i) &&
             lines[i + 1].trim() && !lines[i + 1].trim().startsWith('---')) {
        i++;
        whyText += ' ' + lines[i].trim();
      }
      currentIssue.whyProblem = whyText;
    }
    // Correct best practice / Best practice
    else if (line.match(/^(Correct\s+)?Best\s*Practice\s*:/i)) {
      let practiceText = line.replace(/^(Correct\s+)?Best\s*Practice\s*:\s*/i, '').trim();
      // Check for continuation
      while (i + 1 < lines.length && 
             !lines[i + 1].trim().match(/^(Platform|Severity|Issue|Why|Correct|Category|Best\s*Practice)\s*:/i) &&
             lines[i + 1].trim() && !lines[i + 1].trim().startsWith('---')) {
        i++;
        practiceText += ' ' + lines[i].trim();
      }
      currentIssue.bestPractice = practiceText;
    }
    // Category
    else if (line.match(/^Category\s*:/i)) {
      const categoryStr = line.replace(/^Category\s*:\s*/i, '').trim();
      currentIssue.category = mapCategory(categoryStr);
      // Determine issue type based on category
      if (categoryStr.toLowerCase().includes('architectural') || 
          categoryStr.toLowerCase().includes('memory') ||
          categoryStr.toLowerCase().includes('lifecycle')) {
        currentIssue.type = 'architectural';
      } else {
        currentIssue.type = 'lint';
      }
    }
  }

  // Don't forget the last issue
  if (currentIssue.title) {
    issues.push(finalizeIssue(currentIssue, issueIndex));
  }

  return issues;
}

/**
 * Map severity string to SemanticIssue severity
 */
function mapSeverity(severity: string | undefined): SemanticIssue['severity'] {
  if (!severity) return 'medium';
  const lower = severity.toLowerCase().trim();
  if (lower === 'critical' || lower === 'error') return 'critical';
  if (lower === 'high') return 'high';
  if (lower === 'medium' || lower === 'warning') return 'medium';
  if (lower === 'low' || lower === 'info') return 'low';
  return 'medium';
}

/**
 * Map category string to standardized category
 */
function mapCategory(category: string | undefined): string {
  if (!category) return 'general';
  const lower = category.toLowerCase().trim();
  
  // Map Senior Mobile Architect categories
  if (lower.includes('runtime') || lower.includes('crash')) return 'runtime-crash';
  if (lower.includes('memory') || lower.includes('lifecycle')) return 'memory-lifecycle';
  if (lower.includes('architectural') || lower.includes('violation')) return 'architectural-violation';
  if (lower.includes('anti-pattern') || lower.includes('antipattern')) return 'anti-pattern';
  if (lower.includes('state')) return 'state-management';
  if (lower.includes('mvvm')) return 'mvvm-violation';
  if (lower.includes('security')) return 'security';
  if (lower.includes('performance')) return 'performance';
  if (lower.includes('null')) return 'null-safety';
  if (lower.includes('coroutine')) return 'coroutines';
  
  return category;
}

/**
 * Finalize a semantic issue with default values
 */
function finalizeIssue(partial: Partial<SemanticIssue>, index: number): SemanticIssue {
  return {
    id: `AI-SEMANTIC-${index + 1}`,
    type: partial.type || 'lint',
    title: partial.title || 'Issue',
    description: partial.whyProblem || '',
    severity: partial.severity || 'medium',
    line: partial.line,
    whyProblem: partial.whyProblem || '',
    bestPractice: partial.bestPractice || '',
    category: partial.category || 'general',
    framework: partial.framework,
  };
}

/**
 * Run full AI-powered semantic analysis
 */
export async function runAISemanticAnalysis(
  code: string,
  language: Language
): Promise<SemanticAnalysisResult> {
  // First, run rule-based analysis
  const { issues: ruleIssues } = runSemanticAnalysis(code, language);

  // Then, get AI analysis
  const prompt = generateSemanticAnalysisPrompt(code, language);
  
  try {
    const aiResponse = await queryAI(prompt);
    
    const aiIssues = parseSemanticAIResponse(aiResponse);
    
    // Merge and deduplicate
    const allIssues = [...ruleIssues];
    for (const aiIssue of aiIssues) {
      // Check if similar issue already exists
      const isDuplicate = ruleIssues.some(ri => 
        ri.title.toLowerCase() === aiIssue.title.toLowerCase() ||
        (ri.line === aiIssue.line && ri.category === aiIssue.category)
      );
      if (!isDuplicate) {
        allIssues.push(aiIssue);
      }
    }

    // Calculate architecture score
    const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
    const highCount = allIssues.filter(i => i.severity === 'high').length;
    const mediumCount = allIssues.filter(i => i.severity === 'medium').length;
    const architectureScore = Math.max(0, 100 - (criticalCount * 25) - (highCount * 15) - (mediumCount * 5));

    // Generate recommendations
    const recommendations: string[] = [];
    const categories = [...new Set(allIssues.map(i => i.category))];
    for (const cat of categories) {
      const catIssues = allIssues.filter(i => i.category === cat);
      if (catIssues.length > 0) {
        recommendations.push(`Address ${catIssues.length} ${cat} issue(s)`);
      }
    }

    return {
      issues: allIssues,
      summary: `Found ${allIssues.length} issues: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium`,
      architectureScore,
      recommendations,
    };
  } catch (e) {
    console.error('Error in AI semantic analysis:', e);
    
    // Return rule-based results only
    const criticalCount = ruleIssues.filter(i => i.severity === 'critical').length;
    const highCount = ruleIssues.filter(i => i.severity === 'high').length;
    const architectureScore = Math.max(0, 100 - (criticalCount * 25) - (highCount * 15));

    return {
      issues: ruleIssues,
      summary: `Found ${ruleIssues.length} issues (rule-based)`,
      architectureScore,
      recommendations: ['Enable AI for deeper analysis'],
    };
  }
}

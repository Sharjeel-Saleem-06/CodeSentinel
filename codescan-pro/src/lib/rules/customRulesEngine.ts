/**
 * Custom Rules Engine
 * Allows users to define custom code analysis rules
 * Supports AI-powered rule suggestions and validation
 * 
 * Features:
 * - Language-specific rule categorization
 * - Deep code checking against user rules
 * - RAG-optimized rule matching
 */

import type { Language, Severity } from '../../types/analysis';

// Rule platform/language category
export type RulePlatform = 'general' | 'kotlin' | 'swift' | 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust';

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  languages: Language[];
  platform: RulePlatform; // Primary platform this rule belongs to
  category: 'security' | 'performance' | 'style' | 'best-practice' | 'custom' | 'architecture' | 'memory' | 'concurrency';
  severity: Severity;
  enabled: boolean;
  pattern: string; // RegExp pattern as string
  patternFlags?: string;
  message: string;
  suggestion: string;
  whyBad: string;
  createdAt: Date;
  aiGenerated?: boolean;
  tags?: string[];
  // Deep checking options
  contextLines?: number; // Number of lines to check around match for context
  requiresContext?: string[]; // Additional patterns that must be present in context
  excludeInContext?: string[]; // Patterns that if present, exclude the match
}

export interface CustomRuleMatch {
  ruleId: string;
  ruleName: string;
  line: number;
  column: number;
  match: string;
  message: string;
  suggestion: string;
  severity: Severity;
}

// Storage key for localStorage
const CUSTOM_RULES_KEY = 'codescan-custom-rules';

// Default example rules with strong Kotlin and iOS/SwiftUI focus
// Organized by platform for better categorization
const DEFAULT_RULES: CustomRule[] = [
  // ==================== GENERAL RULES (Apply to all languages) ====================
  {
    id: 'general-001',
    name: 'TODO Comment',
    description: 'Detects TODO comments that should be addressed',
    languages: ['javascript', 'typescript', 'kotlin', 'swift', 'python', 'java', 'go', 'rust'],
    platform: 'general',
    category: 'best-practice',
    severity: 'info',
    enabled: true,
    pattern: '\\/\\/\\s*TODO[:\\s].*',
    patternFlags: 'gi',
    message: 'TODO comment found - should be addressed before production',
    suggestion: 'Complete the TODO item or create a ticket to track it',
    whyBad: 'TODO comments indicate incomplete work that may affect functionality',
    createdAt: new Date(),
    tags: ['documentation', 'cleanup'],
  },
  {
    id: 'general-002',
    name: 'Console/Print Statement',
    description: 'Detects debug print statements',
    languages: ['javascript', 'typescript', 'kotlin', 'swift', 'python', 'java'],
    platform: 'general',
    category: 'best-practice',
    severity: 'medium',
    enabled: true,
    pattern: '(?:console\\.log|print\\(|println\\(|Log\\.d|NSLog|debugPrint)',
    patternFlags: 'g',
    message: 'Debug statement should be removed before production',
    suggestion: 'Use a proper logging framework or remove the statement',
    whyBad: 'Debug statements can leak sensitive information and impact performance',
    createdAt: new Date(),
    tags: ['debug', 'logging'],
  },
  {
    id: 'general-003',
    name: 'Hardcoded API Key/Secret',
    description: 'Detects hardcoded secrets in code - CRITICAL SECURITY ISSUE',
    languages: ['javascript', 'typescript', 'kotlin', 'swift', 'python', 'java', 'go', 'rust'],
    platform: 'general',
    category: 'security',
    severity: 'critical',
    enabled: true,
    pattern: '(?:api[_-]?key|api[_-]?secret|secret[_-]?key|access[_-]?token|auth[_-]?token)\\s*[:=]\\s*["\'][^"\']{8,}["\']',
    patternFlags: 'gi',
    message: 'CRITICAL: Hardcoded secret detected. Secrets can be extracted from source code and binaries.',
    suggestion: 'Use environment variables, secure storage (Keychain/KeyStore), or secrets management service.',
    whyBad: 'Hardcoded secrets are exposed in version control and can be reverse-engineered from app binaries. This is a critical security vulnerability.',
    createdAt: new Date(),
    tags: ['security', 'secrets', 'critical'],
    contextLines: 3,
  },
  {
    id: 'general-004',
    name: 'Hardcoded Password',
    description: 'Detects hardcoded passwords - CRITICAL SECURITY ISSUE',
    languages: ['javascript', 'typescript', 'kotlin', 'swift', 'python', 'java', 'go', 'rust'],
    platform: 'general',
    category: 'security',
    severity: 'critical',
    enabled: true,
    pattern: '(?:password|passwd|pwd)\\s*[:=]\\s*["\'][^"\']{3,}["\']',
    patternFlags: 'gi',
    message: 'CRITICAL: Hardcoded password detected. Never store passwords in source code.',
    suggestion: 'Use secure credential storage, environment variables, or OAuth/token-based authentication.',
    whyBad: 'Hardcoded passwords are a severe security vulnerability. They can be extracted from source and expose user/system credentials.',
    createdAt: new Date(),
    tags: ['security', 'password', 'critical'],
    contextLines: 3,
  },

  // ==================== SWIFT/iOS RULES ====================
  {
    id: 'swift-001',
    name: 'SwiftUI Force Unwrap',
    description: 'Detects force unwrap (!) in Swift which can cause runtime crashes',
    languages: ['swift'],
    platform: 'swift',
    category: 'security',
    severity: 'high',
    enabled: true,
    pattern: '\\w+!(?:\\.|\\s|$|\\))',
    patternFlags: 'g',
    message: 'Force unwrap (!) can cause runtime crashes if the value is nil',
    suggestion: 'Use optional binding (if let/guard let), optional chaining (?.), or nil coalescing (??).',
    whyBad: 'Force unwrapping bypasses Swift\'s type safety. If the optional is nil, the app crashes immediately.',
    createdAt: new Date(),
    tags: ['swift', 'null-safety', 'crash'],
    excludeInContext: ['IBOutlet', '@IBOutlet'], // Exclude IBOutlets which commonly use !
  },
  {
    id: 'swift-002',
    name: '@State with Reference Type',
    description: 'Detects @State used with class/reference types in SwiftUI',
    languages: ['swift'],
    platform: 'swift',
    category: 'architecture',
    severity: 'high',
    enabled: true,
    pattern: '@State\\s+(?:private\\s+)?var\\s+\\w+\\s*:\\s*\\w*(?:ViewModel|Manager|Service|Controller|Class)',
    patternFlags: 'g',
    message: '@State is designed for value types. Use @StateObject for reference types.',
    suggestion: 'Use @StateObject for ObservableObject classes you create, @ObservedObject for injected ones.',
    whyBad: '@State tracks value changes, not object mutations. Reference types won\'t trigger view updates correctly.',
    createdAt: new Date(),
    tags: ['swiftui', 'state-management', 'architecture'],
    contextLines: 5,
    requiresContext: ['struct', 'View'], // Must be in a SwiftUI View
  },
  {
    id: 'swift-003',
    name: '@ObservedObject Inline Init',
    description: 'Detects @ObservedObject with inline initialization - causes object recreation',
    languages: ['swift'],
    platform: 'swift',
    category: 'memory',
    severity: 'critical',
    enabled: true,
    pattern: '@ObservedObject\\s+(?:private\\s+)?var\\s+\\w+\\s*(?::\\s*\\w+)?\\s*=\\s*\\w+\\(',
    patternFlags: 'g',
    message: 'CRITICAL: @ObservedObject with inline init recreates object on every render!',
    suggestion: 'Use @StateObject when creating the object, or inject from parent view.',
    whyBad: 'The object is recreated each time the view renders, losing all state and potentially causing infinite loops.',
    createdAt: new Date(),
    tags: ['swiftui', 'state-management', 'crash', 'critical'],
    contextLines: 3,
  },
  {
    id: 'swift-004',
    name: 'UIKit in SwiftUI View',
    description: 'Detects direct UIKit usage inside SwiftUI views',
    languages: ['swift'],
    platform: 'swift',
    category: 'architecture',
    severity: 'medium',
    enabled: true,
    pattern: '(?:UIView|UIViewController|UIApplication\\.shared|UIScreen)',
    patternFlags: 'g',
    message: 'Direct UIKit usage in SwiftUI View detected. Use proper bridging.',
    suggestion: 'Use UIViewRepresentable or UIViewControllerRepresentable for UIKit integration.',
    whyBad: 'Direct UIKit usage can break SwiftUI\'s declarative model and cause lifecycle issues.',
    createdAt: new Date(),
    tags: ['swiftui', 'anti-pattern', 'architecture'],
    contextLines: 10,
    requiresContext: ['struct', ': View'], // Must be in a SwiftUI View
    excludeInContext: ['UIViewRepresentable', 'UIViewControllerRepresentable'], // Exclude proper bridging
  },
  {
    id: 'swift-005',
    name: 'NotificationCenter in SwiftUI',
    description: 'Detects NotificationCenter usage in SwiftUI - prefer data flow',
    languages: ['swift'],
    platform: 'swift',
    category: 'architecture',
    severity: 'medium',
    enabled: true,
    pattern: 'NotificationCenter\\.default\\.(?:addObserver|post)',
    patternFlags: 'g',
    message: 'NotificationCenter bypasses SwiftUI data flow. Consider alternatives.',
    suggestion: 'Use @Published, Combine publishers, @EnvironmentObject, or onReceive modifier.',
    whyBad: 'NotificationCenter creates implicit dependencies that bypass SwiftUI\'s reactive data flow.',
    createdAt: new Date(),
    tags: ['swiftui', 'anti-pattern', 'data-flow'],
  },
  {
    id: 'swift-006',
    name: 'Missing @MainActor',
    description: 'Detects ViewModel without @MainActor annotation',
    languages: ['swift'],
    platform: 'swift',
    category: 'concurrency',
    severity: 'high',
    enabled: true,
    pattern: 'class\\s+\\w+ViewModel\\s*:\\s*ObservableObject',
    patternFlags: 'g',
    message: 'ViewModel should be marked with @MainActor for thread-safe UI updates.',
    suggestion: 'Add @MainActor to the ViewModel class or use @MainActor on individual methods.',
    whyBad: 'Without @MainActor, UI updates from async code may occur on background threads, causing crashes.',
    createdAt: new Date(),
    tags: ['swiftui', 'concurrency', 'crash'],
    contextLines: 5,
    excludeInContext: ['@MainActor'], // Exclude if already has @MainActor
  },
  {
    id: 'swift-007',
    name: 'Strong Self in Closure',
    description: 'Detects strong self capture in escaping closures',
    languages: ['swift'],
    platform: 'swift',
    category: 'memory',
    severity: 'high',
    enabled: true,
    pattern: '\\{[^}]*\\bself\\.',
    patternFlags: 'g',
    message: 'Strong self capture in closure may cause retain cycles.',
    suggestion: 'Use [weak self] or [unowned self] in escaping closures.',
    whyBad: 'Strong capture creates retain cycles when closures are stored by the captured object.',
    createdAt: new Date(),
    tags: ['swift', 'memory', 'leak'],
    contextLines: 3,
    excludeInContext: ['[weak self]', '[unowned self]'], // Exclude if already using weak/unowned
  },
  {
    id: 'swift-008',
    name: 'App Transport Security Disabled',
    description: 'Detects ATS being disabled in Info.plist patterns',
    languages: ['swift'],
    platform: 'swift',
    category: 'security',
    severity: 'critical',
    enabled: true,
    pattern: 'NSAllowsArbitraryLoads.*true|NSExceptionAllowsInsecureHTTPLoads.*true',
    patternFlags: 'gi',
    message: 'CRITICAL: App Transport Security is disabled. Network traffic may be insecure.',
    suggestion: 'Enable ATS. Only add specific domain exceptions if absolutely necessary.',
    whyBad: 'Disabling ATS allows insecure HTTP connections, exposing data to interception.',
    createdAt: new Date(),
    tags: ['ios', 'security', 'network', 'critical'],
  },
  {
    id: 'swift-009',
    name: 'UserDefaults for Sensitive Data',
    description: 'Detects sensitive data stored in UserDefaults instead of Keychain',
    languages: ['swift'],
    platform: 'swift',
    category: 'security',
    severity: 'critical',
    enabled: true,
    pattern: 'UserDefaults[\\s\\S]*?(?:password|token|secret|key|credential|apiKey)',
    patternFlags: 'gi',
    message: 'CRITICAL: Sensitive data should not be stored in UserDefaults.',
    suggestion: 'Use Keychain Services for storing sensitive data securely.',
    whyBad: 'UserDefaults is not encrypted and can be easily accessed. Use Keychain for sensitive data.',
    createdAt: new Date(),
    tags: ['ios', 'security', 'storage', 'critical'],
    contextLines: 3,
  },

  // ==================== KOTLIN/ANDROID RULES ====================
  {
    id: 'kotlin-001',
    name: 'Kotlin Force Unwrap (!!)',
    description: 'Detects force unwrap (!!) operator which throws NPE on null',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'security',
    severity: 'high',
    enabled: true,
    pattern: '\\w+!!',
    patternFlags: 'g',
    message: 'Force unwrap (!!) throws NullPointerException if value is null',
    suggestion: 'Use safe call (?.), elvis operator (?:), or null checks instead.',
    whyBad: '!! operator bypasses Kotlin\'s null safety. If the value is null, app crashes.',
    createdAt: new Date(),
    tags: ['kotlin', 'null-safety', 'crash'],
  },
  {
    id: 'kotlin-002',
    name: 'GlobalScope Usage',
    description: 'Detects GlobalScope coroutine launches - causes lifecycle leaks',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'memory',
    severity: 'critical',
    enabled: true,
    pattern: 'GlobalScope\\.(?:launch|async)',
    patternFlags: 'g',
    message: 'CRITICAL: GlobalScope coroutines live for entire app lifecycle, causing leaks.',
    suggestion: 'Use viewModelScope, lifecycleScope, or create a proper CoroutineScope.',
    whyBad: 'GlobalScope coroutines aren\'t cancelled when the component is destroyed, causing memory leaks and crashes.',
    createdAt: new Date(),
    tags: ['kotlin', 'coroutines', 'memory', 'critical'],
  },
  {
    id: 'kotlin-003',
    name: 'runBlocking on Main Thread',
    description: 'Detects runBlocking which can block the UI thread',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'concurrency',
    severity: 'critical',
    enabled: true,
    pattern: 'runBlocking\\s*\\{',
    patternFlags: 'g',
    message: 'runBlocking can cause ANR if used on main thread.',
    suggestion: 'Use launch/async with Dispatchers.IO for blocking operations.',
    whyBad: 'runBlocking blocks the current thread. On main thread, this causes ANR (App Not Responding).',
    createdAt: new Date(),
    tags: ['kotlin', 'coroutines', 'crash', 'anr'],
    contextLines: 5,
    excludeInContext: ['Dispatchers.IO', 'Dispatchers.Default', 'withContext'], // May be okay if using proper dispatcher
  },
  {
    id: 'kotlin-004',
    name: 'Context/View in ViewModel',
    description: 'Detects Activity/Context/View references in ViewModel',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'memory',
    severity: 'critical',
    enabled: true,
    pattern: 'class\\s+\\w+ViewModel[\\s\\S]*?(?:Context|Activity|Fragment|View(?!Model))',
    patternFlags: 'g',
    message: 'CRITICAL: ViewModel should not hold Context/Activity/View references.',
    suggestion: 'Use Application context via AndroidViewModel, or pass data not components.',
    whyBad: 'ViewModels outlive Activities. Holding references causes memory leaks.',
    createdAt: new Date(),
    tags: ['android', 'mvvm', 'memory', 'critical'],
    contextLines: 10,
    excludeInContext: ['AndroidViewModel', 'Application'], // AndroidViewModel is okay
  },
  {
    id: 'kotlin-005',
    name: 'Data Access in Activity/Fragment',
    description: 'Detects direct API/DB calls in UI components',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'architecture',
    severity: 'high',
    enabled: true,
    pattern: 'class\\s+\\w+(?:Activity|Fragment)[\\s\\S]*?(?:Retrofit|Room|HttpClient|OkHttp)',
    patternFlags: 'g',
    message: 'Data access should not be in Activity/Fragment. Use ViewModel + Repository.',
    suggestion: 'Move data operations to Repository layer, access via ViewModel.',
    whyBad: 'Violates separation of concerns, makes UI untestable, causes lifecycle issues.',
    createdAt: new Date(),
    tags: ['android', 'mvvm', 'architecture'],
    contextLines: 20,
  },
  {
    id: 'kotlin-006',
    name: 'Unencrypted SharedPreferences',
    description: 'Detects sensitive data in unencrypted SharedPreferences',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'security',
    severity: 'critical',
    enabled: true,
    pattern: 'getSharedPreferences[\\s\\S]*?(?:token|password|key|secret|credential)',
    patternFlags: 'gi',
    message: 'CRITICAL: Storing sensitive data in unencrypted SharedPreferences.',
    suggestion: 'Use EncryptedSharedPreferences from AndroidX Security library.',
    whyBad: 'Unencrypted SharedPreferences can be read on rooted devices.',
    createdAt: new Date(),
    tags: ['android', 'security', 'storage', 'critical'],
    contextLines: 5,
    excludeInContext: ['EncryptedSharedPreferences'], // Exclude if using encrypted version
  },
  {
    id: 'kotlin-007',
    name: 'Compose remember without key',
    description: 'Detects remember{} with mutableStateOf that may lose state',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'best-practice',
    severity: 'medium',
    enabled: true,
    pattern: 'remember\\s*\\{\\s*mutableStateOf',
    patternFlags: 'g',
    message: 'State in remember is lost on configuration changes.',
    suggestion: 'Use rememberSaveable for state that should survive rotation, or hoist to ViewModel.',
    whyBad: 'remember state is cleared on configuration changes like rotation.',
    createdAt: new Date(),
    tags: ['compose', 'state-management'],
  },
  {
    id: 'kotlin-008',
    name: 'LaunchedEffect with Constant Key',
    description: 'Detects LaunchedEffect(Unit/true) which only runs once',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'best-practice',
    severity: 'low',
    enabled: true,
    pattern: 'LaunchedEffect\\s*\\(\\s*(?:Unit|true)\\s*\\)',
    patternFlags: 'g',
    message: 'LaunchedEffect with constant key runs only once.',
    suggestion: 'Pass relevant dependencies as keys to trigger re-execution when needed.',
    whyBad: 'May miss re-execution when dependent data changes.',
    createdAt: new Date(),
    tags: ['compose', 'lifecycle'],
  },
  {
    id: 'kotlin-009',
    name: 'SQL Injection Risk',
    description: 'Detects potential SQL injection in raw queries',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'security',
    severity: 'critical',
    enabled: true,
    pattern: '(?:rawQuery|execSQL)\\s*\\([^)]*(?:\\$|\\+)',
    patternFlags: 'g',
    message: 'CRITICAL: Potential SQL injection. User input concatenated into query.',
    suggestion: 'Use parameterized queries or Room @Query with bound parameters.',
    whyBad: 'SQL injection allows attackers to read/modify/delete database data.',
    createdAt: new Date(),
    tags: ['android', 'security', 'sql', 'critical'],
  },
  {
    id: 'kotlin-010',
    name: 'Logging Sensitive Data',
    description: 'Detects logging of sensitive information',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'security',
    severity: 'high',
    enabled: true,
    pattern: 'Log\\.(?:d|e|i|v|w)\\s*\\([^)]*(?:password|token|secret|key|credential|ssn|credit)',
    patternFlags: 'gi',
    message: 'Sensitive data may be logged. Logs can be accessed on rooted devices.',
    suggestion: 'Remove sensitive data from logs. Use ProGuard to strip logs in release.',
    whyBad: 'Logs with sensitive data can be read by other apps on rooted devices.',
    createdAt: new Date(),
    tags: ['android', 'security', 'logging'],
  },
  {
    id: 'kotlin-011',
    name: 'Missing @Inject Annotation',
    description: 'Detects ViewModels without proper Hilt injection',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'architecture',
    severity: 'medium',
    enabled: true,
    pattern: 'class\\s+\\w+ViewModel\\s*\\(',
    patternFlags: 'g',
    message: 'ViewModel should use @HiltViewModel and @Inject constructor for dependency injection.',
    suggestion: 'Add @HiltViewModel annotation and @Inject constructor.',
    whyBad: 'Manual instantiation makes testing difficult and violates DI principles.',
    createdAt: new Date(),
    tags: ['android', 'hilt', 'di', 'architecture'],
    contextLines: 3,
    excludeInContext: ['@HiltViewModel', '@Inject'], // Exclude if already using Hilt
  },
  {
    id: 'kotlin-012',
    name: 'LiveData in Repository',
    description: 'Detects LiveData usage in Repository layer',
    languages: ['kotlin'],
    platform: 'kotlin',
    category: 'architecture',
    severity: 'medium',
    enabled: true,
    pattern: 'class\\s+\\w+Repository[\\s\\S]*?LiveData',
    patternFlags: 'g',
    message: 'Repository should use Flow instead of LiveData for reactive streams.',
    suggestion: 'Use Flow in Repository, convert to LiveData in ViewModel if needed.',
    whyBad: 'LiveData is lifecycle-aware and should only be used in UI layer.',
    createdAt: new Date(),
    tags: ['android', 'architecture', 'flow'],
    contextLines: 10,
  },

  // ==================== DEPRECATED/MAINTENANCE ====================
  {
    id: 'general-005',
    name: 'Deprecated API Usage',
    description: 'Detects usage of deprecated APIs',
    languages: ['swift', 'kotlin', 'java'],
    platform: 'general',
    category: 'best-practice',
    severity: 'medium',
    enabled: true,
    pattern: '@available\\s*\\([^)]*deprecated|@Deprecated',
    patternFlags: 'gi',
    message: 'Deprecated API usage detected',
    suggestion: 'Replace with the recommended alternative API',
    whyBad: 'Deprecated APIs may be removed in future versions',
    createdAt: new Date(),
    tags: ['compatibility', 'maintenance'],
  },
  {
    id: 'general-006',
    name: 'Magic Number',
    description: 'Detects hardcoded magic numbers',
    languages: ['javascript', 'typescript', 'kotlin', 'swift', 'python', 'java'],
    platform: 'general',
    category: 'style',
    severity: 'low',
    enabled: true,
    pattern: '(?<![\\w.])\\d{3,}(?![\\w.])',
    patternFlags: 'g',
    message: 'Magic number detected - use named constant',
    suggestion: 'Extract to a named constant with descriptive name',
    whyBad: 'Magic numbers reduce code readability and maintainability',
    createdAt: new Date(),
    tags: ['readability', 'constants'],
    excludeInContext: ['const', 'let', 'val', 'var', '='], // Exclude if already assigned to variable
  },

  // ==================== JAVASCRIPT/TYPESCRIPT RULES ====================
  {
    id: 'js-001',
    name: 'Async/Await Error Handling',
    description: 'Detects async functions without try-catch',
    languages: ['javascript', 'typescript'],
    platform: 'javascript',
    category: 'best-practice',
    severity: 'medium',
    enabled: true,
    pattern: 'async\\s+(?:function\\s+)?\\w*\\s*\\([^)]*\\)\\s*(?::\\s*\\w+)?\\s*\\{(?![\\s\\S]*?try)',
    patternFlags: 'g',
    message: 'Async function without error handling',
    suggestion: 'Wrap async operations in try-catch or use .catch() for promises.',
    whyBad: 'Unhandled promise rejections can crash the application or leave it in an inconsistent state.',
    createdAt: new Date(),
    tags: ['javascript', 'error-handling', 'async'],
    contextLines: 10,
  },
  {
    id: 'js-002',
    name: 'eval() Usage',
    description: 'Detects dangerous eval() usage',
    languages: ['javascript', 'typescript'],
    platform: 'javascript',
    category: 'security',
    severity: 'critical',
    enabled: true,
    pattern: '\\beval\\s*\\(',
    patternFlags: 'g',
    message: 'CRITICAL: eval() is a security risk and should never be used.',
    suggestion: 'Use JSON.parse() for JSON data, or find alternative approaches.',
    whyBad: 'eval() can execute arbitrary code, leading to XSS and code injection vulnerabilities.',
    createdAt: new Date(),
    tags: ['javascript', 'security', 'critical'],
  },
  {
    id: 'js-003',
    name: 'innerHTML Usage',
    description: 'Detects potentially unsafe innerHTML usage',
    languages: ['javascript', 'typescript'],
    platform: 'javascript',
    category: 'security',
    severity: 'high',
    enabled: true,
    pattern: '\\.innerHTML\\s*=',
    patternFlags: 'g',
    message: 'innerHTML can lead to XSS vulnerabilities.',
    suggestion: 'Use textContent for plain text, or sanitize HTML with DOMPurify.',
    whyBad: 'Setting innerHTML with user input can execute malicious scripts.',
    createdAt: new Date(),
    tags: ['javascript', 'security', 'xss'],
  },
  {
    id: 'js-004',
    name: 'React useEffect Missing Deps',
    description: 'Detects useEffect with empty or missing dependency array',
    languages: ['javascript', 'typescript'],
    platform: 'javascript',
    category: 'best-practice',
    severity: 'medium',
    enabled: true,
    pattern: 'useEffect\\s*\\(\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?\\}\\s*,\\s*\\[\\s*\\]\\s*\\)',
    patternFlags: 'g',
    message: 'useEffect with empty dependency array runs only once.',
    suggestion: 'Add relevant dependencies or use useCallback/useMemo for stable references.',
    whyBad: 'May miss updates when dependent values change.',
    createdAt: new Date(),
    tags: ['react', 'hooks', 'lifecycle'],
  },
  {
    id: 'js-005',
    name: 'Loose Equality',
    description: 'Detects loose equality (==) instead of strict (===)',
    languages: ['javascript', 'typescript'],
    platform: 'javascript',
    category: 'best-practice',
    severity: 'low',
    enabled: true,
    pattern: '[^!=]==[^=]',
    patternFlags: 'g',
    message: 'Use strict equality (===) instead of loose equality (==).',
    suggestion: 'Replace == with === for type-safe comparisons.',
    whyBad: 'Loose equality can lead to unexpected type coercion bugs.',
    createdAt: new Date(),
    tags: ['javascript', 'quality'],
  },
];

/**
 * Load custom rules from localStorage
 */
export function loadCustomRules(): CustomRule[] {
  try {
    const stored = localStorage.getItem(CUSTOM_RULES_KEY);
    if (stored) {
      const rules = JSON.parse(stored);
      return rules.map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
      }));
    }
  } catch (e) {
    console.error('Error loading custom rules:', e);
  }
  return [...DEFAULT_RULES];
}

/**
 * Save custom rules to localStorage
 */
export function saveCustomRules(rules: CustomRule[]): void {
  try {
    localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error('Error saving custom rules:', e);
  }
}

/**
 * Add a new custom rule
 */
export function addCustomRule(rule: Omit<CustomRule, 'id' | 'createdAt'>): CustomRule {
  const rules = loadCustomRules();
  const newRule: CustomRule = {
    ...rule,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  };
  rules.push(newRule);
  saveCustomRules(rules);
  return newRule;
}

/**
 * Update an existing custom rule
 */
export function updateCustomRule(id: string, updates: Partial<CustomRule>): CustomRule | null {
  const rules = loadCustomRules();
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  rules[index] = { ...rules[index], ...updates };
  saveCustomRules(rules);
  return rules[index];
}

/**
 * Delete a custom rule
 */
export function deleteCustomRule(id: string): boolean {
  const rules = loadCustomRules();
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  rules.splice(index, 1);
  saveCustomRules(rules);
  return true;
}

/**
 * Toggle rule enabled state
 */
export function toggleRule(id: string): CustomRule | null {
  const rules = loadCustomRules();
  const rule = rules.find(r => r.id === id);
  if (!rule) return null;
  
  rule.enabled = !rule.enabled;
  saveCustomRules(rules);
  return rule;
}

/**
 * Get context lines around a specific line
 */
function getContextLines(lines: string[], lineIdx: number, contextSize: number): string {
  const start = Math.max(0, lineIdx - contextSize);
  const end = Math.min(lines.length, lineIdx + contextSize + 1);
  return lines.slice(start, end).join('\n');
}

/**
 * Check if context contains required patterns
 */
function checkContextRequirements(context: string, rule: CustomRule): boolean {
  // Check if required context patterns are present
  if (rule.requiresContext && rule.requiresContext.length > 0) {
    const hasRequired = rule.requiresContext.some(pattern => context.includes(pattern));
    if (!hasRequired) return false;
  }
  
  // Check if exclusion patterns are present (should NOT match if found)
  if (rule.excludeInContext && rule.excludeInContext.length > 0) {
    const hasExclusion = rule.excludeInContext.some(pattern => context.includes(pattern));
    if (hasExclusion) return false;
  }
  
  return true;
}

/**
 * Run custom rules against code with deep checking
 * Supports context-aware rule matching for better accuracy
 */
export function runCustomRules(code: string, language: Language): CustomRuleMatch[] {
  const allRules = loadCustomRules();
  
  // Filter rules: include rules that match the language OR are general rules
  const rules = allRules.filter(r => 
    r.enabled && 
    (r.languages.includes(language) || r.platform === 'general')
  );
  
  const matches: CustomRuleMatch[] = [];
  const lines = code.split('\n');
  const seenMatches = new Set<string>(); // Prevent duplicate matches
  
  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.pattern, rule.patternFlags || 'g');
      const contextSize = rule.contextLines || 0;
      
      lines.forEach((line, lineIdx) => {
        // Skip comments for most rules (except TODO detection)
        const trimmedLine = line.trim();
        const isComment = trimmedLine.startsWith('//') || 
                         trimmedLine.startsWith('/*') || 
                         trimmedLine.startsWith('*') || 
                         trimmedLine.startsWith('#');
        
        if (isComment && !rule.id.includes('todo') && !rule.name.toLowerCase().includes('todo')) {
          return;
        }
        
        let match;
        while ((match = regex.exec(line)) !== null) {
          // Get context for deep checking
          const context = contextSize > 0 
            ? getContextLines(lines, lineIdx, contextSize) 
            : line;
          
          // Check context requirements
          if (!checkContextRequirements(context, rule)) {
            if (!rule.patternFlags?.includes('g')) break;
            continue;
          }
          
          // Create unique key to prevent duplicates
          const matchKey = `${rule.id}:${lineIdx}:${match.index}:${match[0]}`;
          if (seenMatches.has(matchKey)) {
            if (!rule.patternFlags?.includes('g')) break;
            continue;
          }
          seenMatches.add(matchKey);
          
          matches.push({
            ruleId: rule.id,
            ruleName: rule.name,
            line: lineIdx + 1,
            column: match.index,
            match: match[0],
            message: rule.message,
            suggestion: rule.suggestion,
            severity: rule.severity,
          });
          
          // Prevent infinite loop for patterns without global flag
          if (!rule.patternFlags?.includes('g')) break;
        }
        
        // Reset regex lastIndex for next line
        regex.lastIndex = 0;
      });
    } catch (e) {
      console.error(`Error running rule ${rule.id}:`, e);
    }
  }
  
  return matches;
}

/**
 * Get rules grouped by platform
 */
export function getRulesByPlatform(): Record<RulePlatform, CustomRule[]> {
  const rules = loadCustomRules();
  const grouped: Record<RulePlatform, CustomRule[]> = {
    general: [],
    kotlin: [],
    swift: [],
    javascript: [],
    typescript: [],
    python: [],
    java: [],
    go: [],
    rust: [],
  };
  
  for (const rule of rules) {
    const platform = rule.platform || 'general';
    if (grouped[platform]) {
      grouped[platform].push(rule);
    } else {
      grouped.general.push(rule);
    }
  }
  
  return grouped;
}

/**
 * Get rules for a specific language (includes general rules)
 */
export function getRulesForLanguage(language: Language): CustomRule[] {
  const rules = loadCustomRules();
  return rules.filter(r => 
    r.languages.includes(language) || r.platform === 'general'
  );
}

/**
 * Validate a regex pattern
 */
export function validatePattern(pattern: string): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * Generate AI prompt for creating a custom rule
 */
export function generateRuleCreationPrompt(description: string, language: Language): string {
  return `You are a code analysis expert. Create a custom detection rule based on this description:

"${description}"

Target language: ${language}

Provide a JSON response with:
{
  "name": "Short rule name",
  "description": "Detailed description",
  "pattern": "RegExp pattern (escaped for JSON)",
  "patternFlags": "g, i, m, etc.",
  "message": "What to show when detected",
  "suggestion": "How to fix it",
  "whyBad": "Why this is problematic",
  "severity": "critical|high|medium|low|info",
  "category": "security|performance|style|best-practice|custom",
  "tags": ["tag1", "tag2"]
}

Important:
- Pattern must be a valid JavaScript RegExp
- Escape special characters properly for JSON
- Make the pattern specific to avoid false positives
- Consider edge cases and code context`;
}

/**
 * Parse AI-generated rule response
 */
export function parseAIRuleResponse(response: string, language: Language): Partial<CustomRule> | null {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.name || !parsed.pattern || !parsed.message) {
      return null;
    }
    
    // Validate pattern
    const validation = validatePattern(parsed.pattern);
    if (!validation.valid) {
      console.error('Invalid pattern:', validation.error);
      return null;
    }
    
    return {
      name: parsed.name,
      description: parsed.description || '',
      languages: [language],
      category: parsed.category || 'custom',
      severity: parsed.severity || 'medium',
      enabled: true,
      pattern: parsed.pattern,
      patternFlags: parsed.patternFlags || 'g',
      message: parsed.message,
      suggestion: parsed.suggestion || '',
      whyBad: parsed.whyBad || '',
      aiGenerated: true,
      tags: parsed.tags || [],
    };
  } catch (e) {
    console.error('Error parsing AI rule response:', e);
    return null;
  }
}

/**
 * Get rule statistics
 */
export function getRuleStats(): { total: number; enabled: number; byCategory: Record<string, number> } {
  const rules = loadCustomRules();
  const byCategory: Record<string, number> = {};
  
  for (const rule of rules) {
    byCategory[rule.category] = (byCategory[rule.category] || 0) + 1;
  }
  
  return {
    total: rules.length,
    enabled: rules.filter(r => r.enabled).length,
    byCategory,
  };
}

/**
 * Export rules to JSON
 */
export function exportRules(): string {
  const rules = loadCustomRules();
  return JSON.stringify(rules, null, 2);
}

/**
 * Import rules from JSON
 */
export function importRules(json: string): { success: boolean; imported: number; error?: string } {
  try {
    const imported = JSON.parse(json);
    if (!Array.isArray(imported)) {
      return { success: false, imported: 0, error: 'Invalid format: expected array' };
    }
    
    const existingRules = loadCustomRules();
    const existingIds = new Set(existingRules.map(r => r.id));
    
    let importedCount = 0;
    for (const rule of imported) {
      if (rule.name && rule.pattern) {
        // Generate new ID if exists
        if (existingIds.has(rule.id)) {
          rule.id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        existingRules.push({
          ...rule,
          createdAt: new Date(rule.createdAt || Date.now()),
        });
        importedCount++;
      }
    }
    
    saveCustomRules(existingRules);
    return { success: true, imported: importedCount };
  } catch (e) {
    return { success: false, imported: 0, error: (e as Error).message };
  }
}

/**
 * Reset to default rules
 */
export function resetToDefaultRules(): void {
  saveCustomRules([...DEFAULT_RULES]);
}


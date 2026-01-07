/**
 * Kotlin Best Practices Detection System
 * Based on: Kotlin Official Style Guide, Android Best Practices, Jetpack Guidelines
 * Updated: 2024 Standards
 */

import type { CodeIssue, SecurityFinding } from '../../types/analysis';

export interface KotlinDetectionRule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'performance' | 'best-practice' | 'style' | 'android' | 'coroutines' | 'null-safety';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  pattern: RegExp;
  message: string;
  suggestion: string;
  references: string[];
  autoFixable: boolean;
  fix?: (code: string, match: RegExpMatchArray) => string;
}

// Comprehensive Kotlin Detection Rules - Official Best Practices 2024
export const KOTLIN_RULES: KotlinDetectionRule[] = [
  // ============ NULL SAFETY RULES ============
  {
    id: 'KT-NULL001',
    name: 'Force Unwrap (!!) Usage',
    description: 'Detects force unwrap operator usage',
    category: 'null-safety',
    severity: 'high',
    pattern: /\w+!!\./g,
    message: 'Avoid using force unwrap (!!) operator. It can cause NullPointerException at runtime.',
    suggestion: 'Use safe call (?.) with let, elvis operator (?:), or proper null checks instead.',
    references: ['Kotlin Null Safety', 'Android Null Safety Guidelines'],
    autoFixable: false,
  },
  {
    id: 'KT-NULL002',
    name: 'Platform Type Without Null Check',
    description: 'Detects potential platform type issues',
    category: 'null-safety',
    severity: 'medium',
    pattern: /val\s+\w+\s*=\s*(?:intent\.get|bundle\.get|getIntent\(\)\.get)/g,
    message: 'Platform types from Java APIs should be explicitly typed as nullable.',
    suggestion: 'Add explicit nullable type: val data: String? = intent.getStringExtra("key")',
    references: ['Kotlin Platform Types', 'Android Intent Best Practices'],
    autoFixable: false,
  },
  {
    id: 'KT-NULL003',
    name: 'lateinit Without isInitialized Check',
    description: 'Detects lateinit usage without proper initialization check',
    category: 'null-safety',
    severity: 'medium',
    pattern: /lateinit\s+var\s+(\w+)\s*:/g,
    message: 'lateinit properties should be checked with ::property.isInitialized before access.',
    suggestion: 'Use lazy initialization or check isInitialized: if (::property.isInitialized) { ... }',
    references: ['Kotlin lateinit', 'Android ViewModel Best Practices'],
    autoFixable: false,
  },

  // ============ COROUTINES RULES ============
  {
    id: 'KT-COR001',
    name: 'GlobalScope Usage',
    description: 'Detects GlobalScope usage',
    category: 'coroutines',
    severity: 'high',
    pattern: /GlobalScope\.(?:launch|async)/g,
    message: 'Avoid GlobalScope. It creates unmanaged coroutines that can leak resources.',
    suggestion: 'Use structured concurrency: viewModelScope, lifecycleScope, or custom CoroutineScope.',
    references: ['Kotlin Coroutines Best Practices', 'Android Coroutines'],
    autoFixable: false,
  },
  {
    id: 'KT-COR002',
    name: 'Dispatchers.Main Without Context',
    description: 'Detects potential main thread issues',
    category: 'coroutines',
    severity: 'medium',
    pattern: /withContext\s*\(\s*Dispatchers\.Main\s*\)\s*\{[^}]*(?:database|network|file|http)/gi,
    message: 'Avoid running I/O operations on Dispatchers.Main.',
    suggestion: 'Use Dispatchers.IO for I/O operations, Dispatchers.Default for CPU-intensive work.',
    references: ['Kotlin Dispatchers', 'Android Threading'],
    autoFixable: false,
  },
  {
    id: 'KT-COR003',
    name: 'Missing Exception Handling in Coroutine',
    description: 'Detects coroutines without exception handling',
    category: 'coroutines',
    severity: 'high',
    pattern: /(?:launch|async)\s*\{(?![^}]*(?:try|catch|CoroutineExceptionHandler))[^}]*\}/g,
    message: 'Coroutine lacks exception handling. Uncaught exceptions crash the app.',
    suggestion: 'Add try-catch block or use CoroutineExceptionHandler.',
    references: ['Kotlin Exception Handling', 'Android Coroutines Safety'],
    autoFixable: false,
  },
  {
    id: 'KT-COR004',
    name: 'runBlocking on Main Thread',
    description: 'Detects runBlocking which can cause ANR',
    category: 'coroutines',
    severity: 'critical',
    pattern: /runBlocking\s*\{/g,
    message: 'runBlocking on main thread blocks UI and causes ANR.',
    suggestion: 'Use suspend functions with proper coroutine scope instead of runBlocking.',
    references: ['Kotlin runBlocking', 'Android ANR Prevention'],
    autoFixable: false,
  },
  {
    id: 'KT-COR005',
    name: 'Flow Without Lifecycle',
    description: 'Detects Flow collection without lifecycle awareness',
    category: 'coroutines',
    severity: 'medium',
    pattern: /\.collect\s*\{(?![^}]*(?:repeatOnLifecycle|flowWithLifecycle))/g,
    message: 'Flow collection should be lifecycle-aware to prevent leaks.',
    suggestion: 'Use repeatOnLifecycle or flowWithLifecycle for UI layer Flow collection.',
    references: ['Android Flow Best Practices', 'Lifecycle-Aware Components'],
    autoFixable: false,
  },

  // ============ ANDROID SPECIFIC RULES ============
  {
    id: 'KT-AND001',
    name: 'findViewById Usage',
    description: 'Detects deprecated findViewById usage',
    category: 'android',
    severity: 'low',
    pattern: /findViewById\s*<\s*\w+\s*>\s*\(/g,
    message: 'findViewById is deprecated. Use View Binding or Jetpack Compose.',
    suggestion: 'Migrate to View Binding: binding.viewId or use Jetpack Compose.',
    references: ['Android View Binding', 'Jetpack Compose'],
    autoFixable: false,
  },
  {
    id: 'KT-AND002',
    name: 'Hardcoded Dimension',
    description: 'Detects hardcoded dp/sp values',
    category: 'android',
    severity: 'low',
    pattern: /(?:\d+)\.dp|\(\s*\d+\s*\)\.dp/g,
    message: 'Avoid hardcoded dimensions. Use dimension resources for consistency.',
    suggestion: 'Define dimensions in res/values/dimens.xml and reference them.',
    references: ['Android Resource Guidelines'],
    autoFixable: false,
  },
  {
    id: 'KT-AND003',
    name: 'Activity/Fragment Memory Leak',
    description: 'Detects potential memory leaks',
    category: 'android',
    severity: 'critical',
    pattern: /(?:companion\s+object|object\s+\w+)\s*\{[^}]*(?:context|activity|fragment|view)\s*[=:]/gi,
    message: 'Storing Context/Activity/Fragment/View in object/companion object causes memory leaks.',
    suggestion: 'Use WeakReference or pass context as method parameter.',
    references: ['Android Memory Leaks', 'Context Best Practices'],
    autoFixable: false,
  },
  {
    id: 'KT-AND004',
    name: 'Handler Memory Leak',
    description: 'Detects Handler without WeakReference',
    category: 'android',
    severity: 'high',
    pattern: /(?:Handler|Runnable)\s*\{/g,
    message: 'Handler with inner class can cause memory leaks.',
    suggestion: 'Use lifecycleScope.launch with delay() or WeakReference pattern.',
    references: ['Android Handler Leaks', 'Coroutines for Delayed Tasks'],
    autoFixable: false,
  },
  {
    id: 'KT-AND005',
    name: 'onDestroy Cleanup Missing',
    description: 'Detects missing cleanup in lifecycle methods',
    category: 'android',
    severity: 'medium',
    pattern: /override\s+fun\s+onCreate[^}]*(?:observer|listener|callback|disposable)[^}]*\}/gi,
    message: 'Resources registered in onCreate should be cleaned up in onDestroy.',
    suggestion: 'Remove observers/listeners in onDestroy or use lifecycle-aware components.',
    references: ['Android Lifecycle', 'Memory Management'],
    autoFixable: false,
  },

  // ============ JETPACK COMPOSE RULES ============
  {
    id: 'KT-COMP001',
    name: 'State in Composable Parameter',
    description: 'Detects state hoisting issues',
    category: 'android',
    severity: 'medium',
    pattern: /@Composable\s+fun\s+\w+\s*\([^)]*MutableState/g,
    message: 'Pass state value and callback instead of MutableState.',
    suggestion: 'Hoist state: fun MyComposable(value: T, onValueChange: (T) -> Unit)',
    references: ['Jetpack Compose State', 'State Hoisting'],
    autoFixable: false,
  },
  {
    id: 'KT-COMP002',
    name: 'remember Without Key',
    description: 'Detects remember without proper keys',
    category: 'android',
    severity: 'low',
    pattern: /remember\s*\{[^}]*\}(?!\s*,)/g,
    message: 'Consider adding keys to remember for proper recomposition.',
    suggestion: 'Use remember(key1, key2) { } when the computation depends on values.',
    references: ['Compose remember', 'Recomposition'],
    autoFixable: false,
  },
  {
    id: 'KT-COMP003',
    name: 'Side Effect Without Key',
    description: 'Detects LaunchedEffect/DisposableEffect without keys',
    category: 'android',
    severity: 'high',
    pattern: /(?:LaunchedEffect|DisposableEffect)\s*\(\s*(?:Unit|true)\s*\)/g,
    message: 'LaunchedEffect/DisposableEffect with Unit runs only once. Ensure this is intended.',
    suggestion: 'Use appropriate keys if the effect should re-run on data changes.',
    references: ['Compose Side Effects', 'LaunchedEffect Best Practices'],
    autoFixable: false,
  },
  {
    id: 'KT-COMP004',
    name: 'Heavy Computation in Composition',
    description: 'Detects expensive operations in composables',
    category: 'performance',
    severity: 'high',
    pattern: /@Composable\s+fun[^{]*\{[^}]*(?:\.map\s*\{|\.filter\s*\{|\.sortedBy|\.groupBy)/g,
    message: 'Collection operations in composables run on every recomposition.',
    suggestion: 'Use remember { list.map { ... } } or derivedStateOf for computed values.',
    references: ['Compose Performance', 'derivedStateOf'],
    autoFixable: false,
  },
  {
    id: 'KT-COMP005',
    name: 'Unstable Parameters',
    description: 'Detects parameters that prevent recomposition skipping',
    category: 'performance',
    severity: 'medium',
    pattern: /@Composable\s+fun\s+\w+\s*\([^)]*(?:List<|Map<|Set<|Array<)(?!@Stable|@Immutable)/g,
    message: 'Collection parameters are unstable and prevent recomposition skipping.',
    suggestion: 'Use @Stable/@Immutable annotations or kotlinx.collections.immutable.',
    references: ['Compose Stability', 'Performance Optimization'],
    autoFixable: false,
  },

  // ============ BEST PRACTICE RULES ============
  {
    id: 'KT-BP001',
    name: 'Mutable Collection Exposure',
    description: 'Detects public mutable collection exposure',
    category: 'best-practice',
    severity: 'medium',
    pattern: /(?:val|var)\s+\w+\s*:\s*Mutable(?:List|Map|Set)</g,
    message: 'Avoid exposing mutable collections publicly.',
    suggestion: 'Expose as immutable (List, Map, Set) and use private mutable backing field.',
    references: ['Kotlin Collections', 'Encapsulation'],
    autoFixable: false,
  },
  {
    id: 'KT-BP002',
    name: 'Data Class with var Properties',
    description: 'Detects data classes with mutable properties',
    category: 'best-practice',
    severity: 'low',
    pattern: /data\s+class\s+\w+\s*\([^)]*\bvar\b/g,
    message: 'Data classes should use val (immutable) properties.',
    suggestion: 'Use val instead of var. Create new instances using copy() for modifications.',
    references: ['Kotlin Data Classes', 'Immutability'],
    autoFixable: true,
    fix: (code, _match) => code.replace(/data\s+class\s+(\w+)\s*\(([^)]*)\bvar\b/, 'data class $1($2val'),
  },
  {
    id: 'KT-BP003',
    name: 'Large Class',
    description: 'Detects classes that are too large',
    category: 'best-practice',
    severity: 'low',
    pattern: /class\s+\w+[^{]*\{(?:[^{}]*|\{[^{}]*\}){100,}/g,
    message: 'Class is very large. Consider splitting into smaller, focused classes.',
    suggestion: 'Apply Single Responsibility Principle. Extract related functionality.',
    references: ['SOLID Principles', 'Clean Architecture'],
    autoFixable: false,
  },
  {
    id: 'KT-BP004',
    name: 'apply/also Misuse',
    description: 'Detects incorrect scope function usage',
    category: 'style',
    severity: 'info',
    pattern: /\.apply\s*\{[^}]*return@apply/g,
    message: 'apply should configure object, not return values. Use let or run instead.',
    suggestion: 'Use apply for object configuration, let for transformations, also for side effects.',
    references: ['Kotlin Scope Functions'],
    autoFixable: false,
  },
  {
    id: 'KT-BP005',
    name: 'Redundant Null Check',
    description: 'Detects redundant null checks',
    category: 'style',
    severity: 'info',
    pattern: /(\w+)\s*!=\s*null\s*&&\s*\1\./g,
    message: 'Redundant null check. Use safe call operator instead.',
    suggestion: 'Replace: if (x != null && x.y) with x?.y',
    references: ['Kotlin Null Safety'],
    autoFixable: true,
    fix: (code, match) => {
      const varName = match[1];
      return code.replace(new RegExp(`${varName}\\s*!=\\s*null\\s*&&\\s*${varName}\\.`, 'g'), `${varName}?.`);
    },
  },

  // ============ SECURITY RULES ============
  {
    id: 'KT-SEC001',
    name: 'Hardcoded Secret',
    description: 'Detects hardcoded secrets in Kotlin code',
    category: 'security',
    severity: 'critical',
    pattern: /(?:apiKey|secretKey|password|token|credential)\s*=\s*"[^"]{8,}"/gi,
    message: 'Hardcoded secret detected. Store secrets securely.',
    suggestion: 'Use Android Keystore, encrypted SharedPreferences, or environment variables.',
    references: ['Android Security Best Practices', 'OWASP Mobile'],
    autoFixable: false,
  },
  {
    id: 'KT-SEC002',
    name: 'Insecure SharedPreferences',
    description: 'Detects unencrypted SharedPreferences for sensitive data',
    category: 'security',
    severity: 'high',
    pattern: /getSharedPreferences\s*\([^)]*\)(?:[^}]*(?:token|password|key|secret|credential))/gi,
    message: 'Storing sensitive data in unencrypted SharedPreferences.',
    suggestion: 'Use EncryptedSharedPreferences from AndroidX Security library.',
    references: ['Android Security', 'EncryptedSharedPreferences'],
    autoFixable: false,
  },
  {
    id: 'KT-SEC003',
    name: 'WebView JavaScript Enabled',
    description: 'Detects potentially insecure WebView configuration',
    category: 'security',
    severity: 'medium',
    pattern: /settings\.javaScriptEnabled\s*=\s*true/g,
    message: 'WebView with JavaScript enabled can be vulnerable to XSS.',
    suggestion: 'Only enable JavaScript if necessary. Implement proper input validation.',
    references: ['Android WebView Security', 'OWASP Mobile'],
    autoFixable: false,
  },
  {
    id: 'KT-SEC004',
    name: 'Logging Sensitive Data',
    description: 'Detects logging of potentially sensitive data',
    category: 'security',
    severity: 'high',
    pattern: /Log\.(?:d|e|i|v|w)\s*\([^)]*(?:password|token|secret|key|credential|ssn|credit)/gi,
    message: 'Sensitive data may be logged. Logs can be accessed on rooted devices.',
    suggestion: 'Remove sensitive data from logs. Use ProGuard/R8 to strip logs in release builds.',
    references: ['Android Logging Best Practices', 'Security Logging'],
    autoFixable: false,
  },
  {
    id: 'KT-SEC005',
    name: 'SQL Injection Risk',
    description: 'Detects potential SQL injection in Room/SQLite',
    category: 'security',
    severity: 'critical',
    pattern: /(?:rawQuery|execSQL)\s*\(\s*(?:"[^"]*\$|"[^"]*\+)/g,
    message: 'Potential SQL injection. User input is concatenated into SQL query.',
    suggestion: 'Use parameterized queries or Room @Query with parameters.',
    references: ['Android SQL Injection', 'Room Database'],
    autoFixable: false,
  },
  {
    id: 'KT-SEC006',
    name: 'Hardcoded String - Password',
    description: 'Detects hardcoded passwords',
    category: 'security',
    severity: 'critical',
    pattern: /(?:password|passwd|pwd)\s*=\s*"[^"]+"/gi,
    message: 'CRITICAL: Hardcoded password detected. This is a severe security vulnerability.',
    suggestion: 'Never hardcode passwords. Use EncryptedSharedPreferences or Android Keystore.',
    references: ['OWASP Mobile Top 10', 'CWE-259', 'Android Security'],
    autoFixable: false,
  },
  {
    id: 'KT-SEC007',
    name: 'Hardcoded String - Firebase/Database URL',
    description: 'Detects hardcoded database URLs',
    category: 'security',
    severity: 'critical',
    pattern: /(?:firebase|database|mongo|mysql|postgres)[A-Za-z]*(?:Url|URI)\s*=\s*"[^"]+"/gi,
    message: 'CRITICAL: Hardcoded database URL detected. Database credentials exposed.',
    suggestion: 'Use BuildConfig fields or secure remote configuration.',
    references: ['OWASP Mobile Top 10', 'CWE-798', 'Android BuildConfig'],
    autoFixable: false,
  },
  {
    id: 'KT-SEC008',
    name: 'Hardcoded String - Bearer Token',
    description: 'Detects hardcoded bearer tokens',
    category: 'security',
    severity: 'critical',
    pattern: /(?:bearer|authorization)\s*=\s*"[^"]{10,}"/gi,
    message: 'CRITICAL: Hardcoded authorization token detected. Token can be extracted from APK.',
    suggestion: 'Fetch tokens dynamically from secure backend. Never store in code.',
    references: ['OWASP Mobile Top 10', 'CWE-798'],
    autoFixable: false,
  },
  {
    id: 'KT-SEC009',
    name: 'Hardcoded String - Private Key',
    description: 'Detects hardcoded private keys',
    category: 'security',
    severity: 'critical',
    pattern: /(?:privateKey|private_key|-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----)/gi,
    message: 'CRITICAL: Private key detected in code. Immediate security risk.',
    suggestion: 'Store private keys in Android Keystore. Never commit to source control.',
    references: ['OWASP Mobile Top 10', 'CWE-321', 'Android Keystore'],
    autoFixable: false,
  },
  {
    id: 'KT-SEC010',
    name: 'Hardcoded String - AWS/Cloud Credentials',
    description: 'Detects hardcoded cloud credentials',
    category: 'security',
    severity: 'critical',
    pattern: /(?:aws_access_key|aws_secret|AKIA[A-Z0-9]{16})/gi,
    message: 'CRITICAL: Cloud credentials detected in code. These can be used to compromise cloud resources.',
    suggestion: 'Use AWS Cognito or similar service for secure credential management.',
    references: ['OWASP Mobile Top 10', 'CWE-798', 'AWS Security'],
    autoFixable: false,
  },

  // ============ PERFORMANCE RULES ============
  {
    id: 'KT-PERF001',
    name: 'String Concatenation in Loop',
    description: 'Detects string concatenation in loops',
    category: 'performance',
    severity: 'medium',
    pattern: /(?:for|while)\s*\([^)]+\)\s*\{[^}]*\+=\s*"[^"]*"/g,
    message: 'String concatenation in loop is inefficient.',
    suggestion: 'Use StringBuilder or buildString { } for string construction in loops.',
    references: ['Kotlin StringBuilder', 'Performance'],
    autoFixable: false,
  },
  {
    id: 'KT-PERF002',
    name: 'Sequence vs Collection',
    description: 'Detects chained collection operations that should use Sequence',
    category: 'performance',
    severity: 'low',
    pattern: /\.\w+\s*\{[^}]*\}\s*\.\w+\s*\{[^}]*\}\s*\.\w+\s*\{/g,
    message: 'Multiple chained collection operations. Consider using Sequence for large collections.',
    suggestion: 'Use .asSequence() for 3+ chained operations on large collections.',
    references: ['Kotlin Sequences', 'Collection Performance'],
    autoFixable: false,
  },
  {
    id: 'KT-PERF003',
    name: 'Bitmap Without Recycling',
    description: 'Detects bitmap usage without proper memory management',
    category: 'performance',
    severity: 'high',
    pattern: /BitmapFactory\.decode(?!.*recycle)/g,
    message: 'Bitmap loaded without explicit memory management.',
    suggestion: 'Use Coil, Glide, or Picasso for image loading. They handle memory efficiently.',
    references: ['Android Image Loading', 'Memory Management'],
    autoFixable: false,
  },
];

/**
 * Run Kotlin-specific detection
 */
export function runKotlinDetection(code: string): { issues: CodeIssue[]; securityFindings: SecurityFinding[] } {
  const issues: CodeIssue[] = [];
  const securityFindings: SecurityFinding[] = [];

  for (const rule of KOTLIN_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(code)) !== null) {
      const beforeMatch = code.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const column = match.index - beforeMatch.lastIndexOf('\n');

      const issue: CodeIssue = {
        id: `${rule.id}-${lineNumber}-${column}`,
        ruleId: rule.id,
        title: rule.name,
        description: rule.message,
        severity: rule.severity === 'critical' ? 'error' : 
                 rule.severity === 'high' ? 'error' :
                 rule.severity === 'medium' ? 'warning' : 'info',
        location: {
          line: lineNumber,
          column,
          endLine: lineNumber,
          endColumn: column + match[0].length,
          file: 'input',
        },
        category: rule.category as any,
        suggestion: rule.suggestion,
        autoFixable: rule.autoFixable,
        references: rule.references,
        codeSnippet: match[0],
      };

      issues.push(issue);

      if (rule.category === 'security') {
        securityFindings.push({
          id: issue.id,
          type: rule.name,
          severity: rule.severity,
          vulnerability: rule.name,
          description: rule.message,
          location: { line: lineNumber, column, file: 'input' },
          cwe: rule.references.find(r => r.startsWith('CWE-')),
          owaspCategory: rule.references.find(r => r.includes('OWASP')),
          recommendation: rule.suggestion,
          references: rule.references,
        });
      }
    }
  }

  return { issues, securityFindings };
}


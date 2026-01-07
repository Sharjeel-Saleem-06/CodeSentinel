/**
 * Advanced Language Detection System
 * Auto-detects programming language with high accuracy
 * Supports: JavaScript, TypeScript, Python, Java, Kotlin, Swift, Go, Rust, C++, C#, PHP, Ruby, Dart, Scala
 */

import type { Language } from '../../types/analysis';

// Language detection patterns with confidence scoring
interface LanguagePattern {
  language: Language;
  patterns: RegExp[];
  weight: number;
  antiPatterns?: RegExp[]; // Patterns that indicate this is NOT the language
}

const LANGUAGE_PATTERNS: LanguagePattern[] = [
  // ============ KOTLIN ============
  {
    language: 'kotlin',
    weight: 10,
    patterns: [
      /\bfun\s+\w+\s*\([^)]*\)\s*(?::\s*\w+)?\s*[{=]/,  // fun myFunction(): Type { or =
      /\bval\s+\w+\s*(?::\s*[\w<>?,\s]+)?\s*=/,           // val name: Type =
      /\bvar\s+\w+\s*(?::\s*[\w<>?,\s]+)?\s*=/,           // var name: Type =
      /\bdata\s+class\s+\w+/,                              // data class
      /\bsealed\s+class\s+\w+/,                            // sealed class
      /\bobject\s+\w+\s*(?::\s*\w+)?\s*\{/,               // object singleton
      /\bcompanion\s+object\b/,                            // companion object
      /\bwhen\s*\([^)]*\)\s*\{/,                           // when expression
      /\?.:|!!\.|\?\./,                                    // Elvis operator, safe call
      /\bby\s+lazy\s*\{/,                                  // lazy delegation
      /\blateinit\s+var\b/,                                // lateinit
      /\binline\s+fun\b/,                                  // inline function
      /\bsuspend\s+fun\b/,                                 // suspend function (coroutines)
      /\bcoroutineScope\b|\blaunched\b|\bwithContext\b/,   // coroutines
      /\b@\w+\s*(?:\([^)]*\))?\s*(?:fun|class|val|var)/,  // annotations
      /\bit\s*\./,                                          // implicit lambda parameter
      /\b\w+\s*\?\.\w+/,                                   // null-safe calls
      /\bpackage\s+[\w.]+\s*$/m,                           // package declaration
      /\bimport\s+[\w.]+(?:\.\*)?\s*$/m,                   // Kotlin imports
    ],
    antiPatterns: [
      /\bfunction\s+\w+\s*\(/,  // JavaScript function
      /\bconst\s+\w+\s*=/,      // JavaScript const
      /\blet\s+\w+\s*=/,        // JavaScript let (when not after 'val' context)
    ],
  },

  // ============ SWIFT ============
  {
    language: 'swift',
    weight: 10,
    patterns: [
      /\bfunc\s+\w+\s*\([^)]*\)\s*(?:->\s*[\w<>?,\s\[\]?!]+)?\s*\{/, // func myFunc() -> Type {
      /\bvar\s+\w+\s*:\s*[\w<>?,\s\[\]?!]+\s*[={]/,       // var name: Type =
      /\blet\s+\w+\s*:\s*[\w<>?,\s\[\]?!]+\s*=/,          // let name: Type =
      /\bstruct\s+\w+\s*(?::\s*[\w,\s]+)?\s*\{/,           // struct
      /\benum\s+\w+\s*(?::\s*[\w,\s]+)?\s*\{/,             // enum
      /\bprotocol\s+\w+\s*(?::\s*[\w,\s]+)?\s*\{/,         // protocol
      /\bextension\s+\w+\s*(?::\s*[\w,\s]+)?\s*\{/,        // extension
      /\bclass\s+\w+\s*:\s*[\w,\s]+\s*\{/,                 // class inheritance
      /\bguard\s+let\s+\w+\s*=\s*\w+\s+else\s*\{/,         // guard let
      /\bif\s+let\s+\w+\s*=\s*\w+\s*\{/,                   // if let
      /\b@\w+\s+(?:func|var|let|class|struct)/,            // Swift attributes
      /\bweak\s+var\b/,                                    // weak reference
      /\bunowned\b/,                                       // unowned reference
      /\b\w+\s*\?\?\s*\w+/,                                // nil coalescing
      /\btry\s*\?\s*\w+/,                                  // optional try
      /\bimport\s+(?:UIKit|SwiftUI|Foundation|Combine)\b/, // iOS imports
      /\b@State\s+private\s+var\b/,                        // SwiftUI @State
      /\b@Published\s+var\b/,                              // Combine @Published
      /\b@ObservedObject\s+var\b/,                         // SwiftUI @ObservedObject
      /\b@EnvironmentObject\s+var\b/,                      // SwiftUI @EnvironmentObject
      /\b@Binding\s+var\b/,                                // SwiftUI @Binding
      /\bsome\s+View\b/,                                   // SwiftUI some View
      /\bbody\s*:\s*some\s+View\b/,                        // SwiftUI body
      /\bNavigationView\s*\{/,                             // SwiftUI
      /\b\.frame\s*\(/,                                    // SwiftUI modifiers
      /\b\.padding\s*\(/,                                  // SwiftUI modifiers
    ],
    antiPatterns: [
      /\bfunction\s+\w+\s*\(/,  // JavaScript
      /\bconst\s+\w+\s*=/,      // JavaScript
    ],
  },

  // ============ TYPESCRIPT ============
  {
    language: 'typescript',
    weight: 9,
    patterns: [
      /:\s*(?:string|number|boolean|any|void|never|unknown|object)\b/,  // Type annotations
      /:\s*\w+\[\]\s*[;=,)]/,                              // Array type
      /:\s*\w+<[^>]+>/,                                   // Generic type
      /\binterface\s+\w+\s*(?:extends\s+\w+)?\s*\{/,       // interface
      /\btype\s+\w+\s*=\s*[\w{|&<]/,                      // type alias
      /\bas\s+(?:const|string|number|boolean|any|\w+)/,    // type assertion
      /\benum\s+\w+\s*\{/,                                // enum
      /\bReadonly<|Partial<|Required<|Pick<|Omit</,       // Utility types
      /\bkeyof\s+\w+/,                                    // keyof operator
      /\btypeof\s+\w+\s+===?\s*['"](?:string|number|boolean)['"]/, // typeof guard
      /\bimport\s+type\s*\{/,                             // import type
      /\bexport\s+type\s*\{/,                             // export type
      /:\s*\(\s*\w+\s*:\s*\w+/,                           // Function parameter types
      /\bprivate\s+\w+\s*:/,                              // private property
      /\bpublic\s+\w+\s*:/,                               // public property
      /\breadonly\s+\w+\s*:/,                             // readonly property
      /\bimport\s*\{[^}]+\}\s*from\s*['"][^'"]+['"]/,     // ES6 import
      /\bexport\s+(?:default\s+)?(?:class|function|const|interface|type)/, // exports
    ],
    antiPatterns: [
      /\bfun\s+\w+\s*\(/,    // Kotlin
      /\bfunc\s+\w+\s*\(/,   // Swift
    ],
  },

  // ============ JAVASCRIPT ============
  {
    language: 'javascript',
    weight: 7,
    patterns: [
      /\bfunction\s+\w+\s*\([^)]*\)\s*\{/,                 // function declaration
      /\bconst\s+\w+\s*=\s*(?:function|\([^)]*\)\s*=>|async)/,  // const func
      /\blet\s+\w+\s*=\s*(?:function|\([^)]*\)\s*=>)/,     // let func
      /=>\s*\{/,                                           // arrow function
      /\brequire\s*\(\s*['"][^'"]+['"]\s*\)/,             // require
      /\bmodule\.exports\s*=/,                            // CommonJS export
      /\bexport\s+default\b/,                             // ES6 default export
      /\bimport\s+\w+\s+from\s*['"][^'"]+['"]/,           // ES6 import
      /\bclass\s+\w+\s*(?:extends\s+\w+)?\s*\{/,          // class
      /\bnew\s+Promise\s*\(/,                             // Promise
      /\.then\s*\(\s*(?:\([^)]*\)|[^)]+)\s*=>/,           // Promise then
      /\basync\s+function\b/,                              // async function
      /\bawait\s+\w+/,                                     // await
      /\bconsole\.\w+\s*\(/,                               // console
      /\bdocument\.\w+/,                                   // DOM
      /\bwindow\.\w+/,                                     // window object
    ],
    antiPatterns: [
      /:\s*(?:string|number|boolean|any|void)\b/,  // TypeScript types
      /\binterface\s+\w+\s*\{/,                    // TypeScript interface
      /\bfun\s+\w+\s*\(/,                          // Kotlin
      /\bfunc\s+\w+\s*\(/,                         // Swift
    ],
  },

  // ============ PYTHON ============
  {
    language: 'python',
    weight: 8,
    patterns: [
      /^def\s+\w+\s*\([^)]*\)\s*(?:->\s*[\w\[\],\s]+)?\s*:/m,  // def function
      /^class\s+\w+\s*(?:\([^)]*\))?\s*:/m,                    // class
      /^from\s+[\w.]+\s+import\s+/m,                           // from import
      /^import\s+\w+(?:\s+as\s+\w+)?$/m,                       // import
      /\bif\s+__name__\s*==\s*['"]__main__['"]\s*:/,           // main check
      /\bself\.\w+/,                                           // self reference
      /\bprint\s*\(/,                                          // print function
      /\bdef\s+__\w+__\s*\(/,                                  // dunder methods
      /\b@\w+(?:\s*\([^)]*\))?\s*$/m,                          // decorators
      /\blambda\s+\w+\s*:/,                                    // lambda
      /\bfor\s+\w+\s+in\s+\w+\s*:/,                            // for in loop
      /\bwith\s+\w+\s+as\s+\w+\s*:/,                           // with statement
      /\basync\s+def\s+\w+/,                                   // async def
      /\bawait\s+\w+/,                                         // await
      /\b(?:True|False|None)\b/,                               // Python literals
      /\[\s*\w+\s+for\s+\w+\s+in\s+\w+/,                       // list comprehension
      /:\s*(?:int|str|float|bool|List|Dict|Optional|Union)\[?/, // type hints
    ],
    antiPatterns: [
      /\bfunction\s+\w+\s*\(/,  // JavaScript
      /\bfun\s+\w+\s*\(/,       // Kotlin
      /;\s*$/m,                 // Semicolons (JS, Java, etc.)
    ],
  },

  // ============ JAVA ============
  {
    language: 'java',
    weight: 8,
    patterns: [
      /\bpublic\s+class\s+\w+\s*(?:extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/,
      /\bprivate\s+(?:static\s+)?(?:final\s+)?[\w<>[\],\s]+\s+\w+\s*[;=]/,
      /\bpublic\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w*\s*\)/,
      /\bSystem\.out\.print(?:ln)?\s*\(/,
      /\bimport\s+java\.\w+/,
      /\bimport\s+javax\.\w+/,
      /\bimport\s+org\.springframework\./,
      /\b@Override\b/,
      /\b@Autowired\b/,
      /\b@Service\b/,
      /\b@Controller\b/,
      /\b@Repository\b/,
      /\bextends\s+\w+(?:<[^>]+>)?\s*(?:implements|{)/,
      /\bimplements\s+[\w,\s<>]+\s*\{/,
      /\bthrows\s+\w+Exception/,
      /\btry\s*\{[^}]*\}\s*catch\s*\(\s*\w+Exception\s+\w+\s*\)/,
      /\bpackage\s+[\w.]+\s*;/,
      /\bnew\s+\w+<>\s*\(/,  // Diamond operator
    ],
    antiPatterns: [
      /\bfun\s+\w+\s*\(/,    // Kotlin
      /\bval\s+\w+\s*[=:]/,  // Kotlin/Scala
      /\bdef\s+\w+/,         // Python/Scala
    ],
  },

  // ============ GO ============
  {
    language: 'go',
    weight: 9,
    patterns: [
      /^package\s+\w+\s*$/m,                               // package declaration
      /\bfunc\s+(?:\(\s*\w+\s+\*?\w+\s*\)\s+)?\w+\s*\(/,   // func declaration
      /\bfunc\s+\w+\s*\([^)]*\)\s*(?:\([^)]*\)|[\w*]+)?\s*\{/, // func with return
      /\bimport\s*\(\s*$/m,                                // multi-import
      /\bimport\s+"[\w/.-]+"/,                             // single import
      /\btype\s+\w+\s+(?:struct|interface)\s*\{/,          // type declaration
      /\bgo\s+\w+\s*\(/,                                   // goroutine
      /\bchan\s+[\w*]+/,                                   // channel
      /\b<-\s*\w+|w+\s*<-/,                                // channel operations
      /\bdefer\s+\w+/,                                     // defer
      /\bmake\s*\(\s*(?:map|chan|\[\])/,                   // make
      /\bfmt\.Print/,                                      // fmt package
      /\berr\s*!=\s*nil/,                                  // error checking
      /\bif\s+err\s*:=\s*\w+/,                             // error assignment
      /\b:=\s*(?!function)/,                               // short variable declaration
      /\bvar\s+\w+\s+[\w*\[\]]+$/m,                        // var declaration
    ],
    antiPatterns: [
      /\bfunction\s+\w+\s*\(/,  // JavaScript
      /\bdef\s+\w+\s*\(/,       // Python
    ],
  },

  // ============ RUST ============
  {
    language: 'rust',
    weight: 9,
    patterns: [
      /\bfn\s+\w+\s*(?:<[^>]+>)?\s*\([^)]*\)\s*(?:->\s*[\w&<>']+)?\s*\{/,  // fn declaration
      /\blet\s+(?:mut\s+)?\w+\s*(?::\s*[\w&<>']+)?\s*=/,   // let binding
      /\bstruct\s+\w+\s*(?:<[^>]+>)?\s*\{/,                // struct
      /\benum\s+\w+\s*(?:<[^>]+>)?\s*\{/,                  // enum
      /\bimpl\s+(?:<[^>]+>\s+)?(?:\w+\s+for\s+)?\w+/,      // impl block
      /\btrait\s+\w+\s*(?::\s*[\w+]+)?\s*\{/,              // trait
      /\buse\s+(?:std|crate|super|self)::/,                // use statement
      /\bpub\s+(?:fn|struct|enum|trait|mod)/,              // public items
      /\bmod\s+\w+\s*;/,                                   // mod declaration
      /\bmatch\s+\w+\s*\{/,                                // match expression
      /\bSome\s*\(|\bNone\b/,                              // Option
      /\bOk\s*\(|\bErr\s*\(/,                              // Result
      /\b&(?:mut\s+)?\w+/,                                 // references
      /\bVec<|HashMap<|String::from/,                      // common types
      /\bunwrap\s*\(\)|expect\s*\(/,                       // Option/Result methods
      /\bprintln!\s*\(/,                                   // println macro
      /\bvec!\s*\[/,                                       // vec macro
      /\b#\[derive\([^\]]+\)\]/,                           // derive attribute
      /\b'\w+/,                                            // lifetimes
    ],
    antiPatterns: [
      /\bfunction\s+\w+\s*\(/,  // JavaScript
      /\bdef\s+\w+\s*\(/,       // Python
    ],
  },

  // ============ C++ ============
  {
    language: 'cpp',
    weight: 7,
    patterns: [
      /^#include\s*<[\w./]+>/m,                            // include
      /^#include\s*"[\w./]+"/m,                            // local include
      /\bstd::\w+/,                                        // std namespace
      /\busing\s+namespace\s+std\s*;/,                     // using namespace
      /\bint\s+main\s*\(\s*(?:int\s+argc|void)?\s*[,)]?/,  // main function
      /\bcout\s*<</,                                       // cout
      /\bcin\s*>>/,                                        // cin
      /\btemplate\s*<[^>]+>/,                              // template
      /\bclass\s+\w+\s*(?::\s*(?:public|private|protected)\s+\w+)?\s*\{/, // class
      /\bvirtual\s+\w+/,                                   // virtual
      /\boverride\b/,                                      // override
      /\bconst\s+\w+\s*&/,                                 // const reference
      /\bstd::vector<|std::map<|std::string/,              // STL containers
      /\bstd::unique_ptr<|std::shared_ptr</,               // smart pointers
      /\bnullptr\b/,                                       // nullptr
      /\bauto\s+\w+\s*=/,                                  // auto type
      /\bconst\s+char\s*\*/,                               // C string
      /\bsizeof\s*\(/,                                     // sizeof
      /\b\w+\s*::\s*\w+/,                                  // scope resolution
    ],
    antiPatterns: [
      /\bfun\s+\w+\s*\(/,    // Kotlin
      /\bfunc\s+\w+\s*\(/,   // Swift/Go
      /\bdef\s+\w+\s*\(/,    // Python
    ],
  },

  // ============ C# ============
  {
    language: 'csharp',
    weight: 8,
    patterns: [
      /\busing\s+System(?:\.\w+)*\s*;/,                    // using System
      /\bnamespace\s+[\w.]+\s*\{/,                         // namespace
      /\bpublic\s+class\s+\w+\s*(?::\s*[\w<>,\s]+)?\s*\{/, // public class
      /\bprivate\s+(?:readonly\s+)?[\w<>[\],?\s]+\s+\w+\s*[;{=]/, // private field
      /\bpublic\s+(?:async\s+)?(?:Task|void|[\w<>[\]?]+)\s+\w+\s*\(/, // public method
      /\bvar\s+\w+\s*=\s*new\s+\w+/,                       // var declaration
      /\b\[Serializable\]/,                                // attribute
      /\b\[HttpGet\]|\[HttpPost\]/,                        // ASP.NET attributes
      /\bConsole\.Write(?:Line)?\s*\(/,                    // Console
      /\basync\s+Task\s*[<{]/,                             // async Task
      /\bawait\s+\w+/,                                     // await
      /\bLINQ\s*\(|\b\.Select\s*\(|\b\.Where\s*\(/,        // LINQ
      /\bget\s*\{|set\s*\{/,                               // properties
      /\b=>\s*\w+\s*;/,                                    // expression body
      /\bstring\s+\w+\s*=\s*\$/,                           // string interpolation
      /\bDebug\.Log\s*\(/,                                 // Unity Debug
      /\bMonoBehaviour\b/,                                 // Unity
    ],
    antiPatterns: [
      /\bfun\s+\w+\s*\(/,    // Kotlin
      /\bdef\s+\w+\s*\(/,    // Python
      /^#include/m,         // C++
    ],
  },

  // ============ PHP ============
  {
    language: 'php',
    weight: 8,
    patterns: [
      /^<\?php/m,                                          // PHP opening tag
      /\$\w+\s*=/,                                         // variable assignment
      /\bfunction\s+\w+\s*\([^)]*\)\s*(?::\s*\??\w+)?\s*\{/, // function
      /\bclass\s+\w+\s*(?:extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/, // class
      /\becho\s+/,                                         // echo
      /\bpublic\s+function\s+\w+/,                         // public function
      /\bprivate\s+\$\w+/,                                 // private property
      /\buse\s+[\w\\]+\s*;/,                               // use statement
      /\bnamespace\s+[\w\\]+\s*;/,                         // namespace
      /\b\$this->\w+/,                                     // $this
      /\b->\w+\s*\(/,                                      // method call
      /\barray\s*\(/,                                      // array()
      /\b\[\s*['"]?\w+['"]?\s*=>/,                         // associative array
      /\brequire(?:_once)?\s*\(/,                          // require
      /\binclude(?:_once)?\s*\(/,                          // include
    ],
    antiPatterns: [
      /\bconst\s+\w+\s*=/,   // JavaScript
      /\blet\s+\w+\s*=/,     // JavaScript
      /\bdef\s+\w+\s*\(/,    // Python
    ],
  },

  // ============ RUBY ============
  {
    language: 'ruby',
    weight: 8,
    patterns: [
      /^def\s+\w+(?:\([^)]*\))?\s*$/m,                     // def method
      /^class\s+\w+(?:\s*<\s*\w+)?\s*$/m,                  // class
      /^module\s+\w+\s*$/m,                                // module
      /\bputs\s+/,                                         // puts
      /\bend$/m,                                           // end keyword
      /\battr_(?:reader|writer|accessor)\s+:/,             // attr_*
      /\brequire\s+['"][^'"]+['"]/,                        // require
      /\brequire_relative\s+['"][^'"]+['"]/,               // require_relative
      /\bdo\s*\|[^|]+\|/,                                  // block with params
      /\b\w+\.each\s+do/,                                  // each block
      /\b@\w+\s*=/,                                        // instance variable
      /\b@@\w+/,                                           // class variable
      /\bnil\b/,                                           // nil
      /\b:\w+/,                                            // symbol
      /\b\w+\s*=>\s*\w+/,                                  // hash rocket
      /\bunless\s+\w+/,                                    // unless
      /\.\w+\?\s*$/m,                                      // predicate method
    ],
    antiPatterns: [
      /\bfunction\s+\w+\s*\(/,  // JavaScript
      /\bfun\s+\w+\s*\(/,       // Kotlin
      /;\s*$/m,                 // semicolons
    ],
  },

  // ============ DART ============
  {
    language: 'dart',
    weight: 9,
    patterns: [
      /\bvoid\s+main\s*\(\s*(?:List<String>\s+args)?\s*\)\s*\{/,  // main function
      /\bclass\s+\w+\s*(?:extends\s+\w+)?(?:\s+with\s+[\w,\s]+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/, // class
      /\bimport\s+['"]package:flutter/,                    // Flutter import
      /\bimport\s+['"]dart:/,                              // Dart import
      /\bWidget\s+build\s*\(/,                             // Flutter build
      /\bStatelessWidget\b|\bStatefulWidget\b/,            // Flutter widgets
      /\bfinal\s+\w+\s*=\s*\w+/,                           // final declaration
      /\bconst\s+\w+\s*=/,                                 // const declaration
      /\b@override\b/,                                     // override annotation
      /\bFuture<[\w<>?]+>\s+\w+/,                          // Future type
      /\basync\s*\{/,                                      // async block
      /\bawait\s+\w+/,                                     // await
      /\bsetState\s*\(\s*\(\s*\)\s*\{/,                    // setState
      /\b\w+\s*\?\?\s*\w+/,                                // null coalescing
      /\b\w+\s*\?\.\w+/,                                   // null-safe access
      /\blate\s+final\s+\w+/,                              // late final
      /\brequired\s+\w+/,                                  // required parameter
    ],
    antiPatterns: [
      /\bfun\s+\w+\s*\(/,       // Kotlin
      /\bfunc\s+\w+\s*\(/,      // Swift
      /\bdef\s+\w+\s*\(/,       // Python
    ],
  },

  // ============ SCALA ============
  {
    language: 'scala',
    weight: 8,
    patterns: [
      /\bdef\s+\w+\s*(?:\[[^\]]+\])?\s*\([^)]*\)\s*(?::\s*[\w\[\],\s]+)?\s*=/,  // def method
      /\bval\s+\w+\s*(?::\s*[\w\[\],\s]+)?\s*=/,           // val declaration
      /\bvar\s+\w+\s*(?::\s*[\w\[\],\s]+)?\s*=/,           // var declaration
      /\bobject\s+\w+\s*(?:extends\s+[\w\[\],\s]+)?\s*\{/, // object
      /\bcase\s+class\s+\w+/,                              // case class
      /\bsealed\s+trait\s+\w+/,                            // sealed trait
      /\btrait\s+\w+\s*(?:extends\s+[\w\[\],\s]+)?\s*\{/,  // trait
      /\bimport\s+scala\./,                                // scala import
      /\bimport\s+akka\./,                                 // akka import
      /\bprintln\s*\(/,                                    // println
      /\bmatch\s*\{/,                                      // pattern matching
      /\bcase\s+\w+\s*=>/,                                 // case pattern
      /\b=>\s*\{/,                                         // function body
      /\bfor\s*\{\s*\w+\s*<-/,                             // for comprehension
      /\bimplicit\s+(?:val|def|class)/,                    // implicit
      /\b_\.\w+/,                                          // placeholder syntax
    ],
    antiPatterns: [
      /\bfunction\s+\w+\s*\(/,  // JavaScript
      /\bfun\s+\w+\s*\(/,       // Kotlin
    ],
  },
];

// File extension to language mapping
const EXTENSION_MAP: Record<string, Language> = {
  // JavaScript/TypeScript
  'js': 'javascript',
  'jsx': 'javascript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'mts': 'typescript',
  'cts': 'typescript',
  
  // Mobile
  'kt': 'kotlin',
  'kts': 'kotlin',
  'swift': 'swift',
  'dart': 'dart',
  
  // Backend
  'py': 'python',
  'pyw': 'python',
  'java': 'java',
  'go': 'go',
  'rs': 'rust',
  'rb': 'ruby',
  'php': 'php',
  'scala': 'scala',
  'sc': 'scala',
  
  // C Family
  'c': 'cpp',
  'cpp': 'cpp',
  'cc': 'cpp',
  'cxx': 'cpp',
  'h': 'cpp',
  'hpp': 'cpp',
  'cs': 'csharp',
};

/**
 * Calculate confidence score for a language
 */
function calculateConfidence(code: string, pattern: LanguagePattern): number {
  let score = 0;
  const normalizedCode = code.trim();
  
  // Check positive patterns
  for (const regex of pattern.patterns) {
    const matches = normalizedCode.match(new RegExp(regex.source, regex.flags + (regex.flags.includes('g') ? '' : 'g')));
    if (matches) {
      score += matches.length * pattern.weight;
    }
  }
  
  // Check anti-patterns (reduce score)
  if (pattern.antiPatterns) {
    for (const regex of pattern.antiPatterns) {
      const matches = normalizedCode.match(new RegExp(regex.source, regex.flags + (regex.flags.includes('g') ? '' : 'g')));
      if (matches) {
        score -= matches.length * (pattern.weight / 2);
      }
    }
  }
  
  return Math.max(0, score);
}

/**
 * Detect programming language with confidence scores
 */
export function detectLanguageAdvanced(code: string, fileName?: string): {
  language: Language;
  confidence: number;
  alternatives: Array<{ language: Language; confidence: number }>;
} {
  // Try file extension first
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && EXTENSION_MAP[ext]) {
      return {
        language: EXTENSION_MAP[ext],
        confidence: 100,
        alternatives: [],
      };
    }
  }
  
  // Calculate confidence for each language
  const scores: Array<{ language: Language; confidence: number }> = [];
  
  for (const pattern of LANGUAGE_PATTERNS) {
    const confidence = calculateConfidence(code, pattern);
    if (confidence > 0) {
      scores.push({ language: pattern.language, confidence });
    }
  }
  
  // Sort by confidence
  scores.sort((a, b) => b.confidence - a.confidence);
  
  if (scores.length === 0) {
    return {
      language: 'javascript', // Default
      confidence: 50,
      alternatives: [],
    };
  }
  
  const maxScore = scores[0].confidence;
  
  // Normalize scores to percentage
  const normalizedScores = scores.map(s => ({
    language: s.language,
    confidence: Math.round((s.confidence / maxScore) * 100),
  }));
  
  return {
    language: normalizedScores[0].language,
    confidence: normalizedScores[0].confidence,
    alternatives: normalizedScores.slice(1, 4), // Top 3 alternatives
  };
}

/**
 * Simple language detection (for backward compatibility)
 */
export function detectLanguage(code: string, fileName?: string): Language {
  return detectLanguageAdvanced(code, fileName).language;
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(language: Language): string {
  const names: Record<Language, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    kotlin: 'Kotlin',
    swift: 'Swift',
    cpp: 'C/C++',
    csharp: 'C#',
    go: 'Go',
    rust: 'Rust',
    php: 'PHP',
    ruby: 'Ruby',
    dart: 'Dart',
    scala: 'Scala',
  };
  return names[language] || language;
}

/**
 * Get file extensions for a language
 */
export function getLanguageExtensions(language: Language): string[] {
  const extensions: Record<Language, string[]> = {
    javascript: ['js', 'jsx', 'mjs', 'cjs'],
    typescript: ['ts', 'tsx', 'mts', 'cts'],
    python: ['py', 'pyw'],
    java: ['java'],
    kotlin: ['kt', 'kts'],
    swift: ['swift'],
    cpp: ['c', 'cpp', 'cc', 'cxx', 'h', 'hpp'],
    csharp: ['cs'],
    go: ['go'],
    rust: ['rs'],
    php: ['php'],
    ruby: ['rb'],
    dart: ['dart'],
    scala: ['scala', 'sc'],
  };
  return extensions[language] || [];
}


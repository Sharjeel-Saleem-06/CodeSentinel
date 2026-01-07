import React from 'react';
import { FileText, CheckCircle, Shield, Zap, Database, Code, Brain, Settings } from 'lucide-react';

export default function TechnicalSpec() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-12">
        {/* Header */}
        <div className="text-center mb-12 border-b border-purple-500/30 pb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Code className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              CodeScan Pro
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-2">Professional Static Code Analysis Platform</p>
          <p className="text-sm text-gray-400">Technical Specification & Implementation Guide</p>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            <span className="bg-purple-500/20 px-4 py-1 rounded-full">v1.0</span>
            <span className="bg-blue-500/20 px-4 py-1 rounded-full">January 2026</span>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Executive Summary
          </h2>
          <div className="bg-slate-700/30 rounded-xl p-6 space-y-3 text-gray-300">
            <p className="leading-relaxed">
              <strong className="text-white">CodeScan Pro</strong> is an enterprise-grade static code analysis platform that combines real compiler-level parsing with AI-enhanced explanations to deliver professional security auditing, performance optimization, and code quality insights.
            </p>
            <p className="leading-relaxed">
              Unlike basic AI-only tools, this system implements genuine Abstract Syntax Tree (AST) parsing, control flow analysis, and OWASP Top 10 security scanning to provide accurate, actionable results for production codebases.
            </p>
          </div>
        </section>

        {/* System Architecture */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            System Architecture
          </h2>
          
          <div className="space-y-6">
            {/* Tech Stack */}
            <div className="bg-slate-700/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-4">Technology Stack</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Frontend</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• React 18 + TypeScript</li>
                    <li>• Monaco Editor (VS Code engine)</li>
                    <li>• Tailwind CSS + Framer Motion</li>
                    <li>• React Flow (graph visualization)</li>
                    <li>• Recharts (metrics charts)</li>
                    <li>• Clerk Authentication</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Backend</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• PostgreSQL (local database)</li>
                    <li>• Node.js Express API server</li>
                    <li>• Web Workers (parallel processing)</li>
                    <li>• Redis (caching layer)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Analysis Engine */}
            <div className="bg-slate-700/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-4">Core Analysis Libraries</h3>
              <ul className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                <li>• <strong>@babel/parser</strong> - JavaScript/TypeScript AST</li>
                <li>• <strong>acorn</strong> - Fast JS parsing</li>
                <li>• <strong>esprima</strong> - ECMAScript analysis</li>
                <li>• <strong>tree-sitter</strong> - Multi-language parsing</li>
                <li>• <strong>eslint</strong> - Linting rules engine</li>
                <li>• <strong>@typescript-eslint</strong> - TypeScript rules</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Analysis Pipeline */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <Zap className="w-8 h-8" />
            Analysis Pipeline Architecture
          </h2>
          
          <div className="space-y-4">
            {[
              {
                phase: "Phase 1: Lexical Analysis",
                desc: "Tokenize source code into keywords, operators, identifiers, and literals. Detect formatting issues and naming convention violations.",
                tech: "Custom tokenizer + language-specific lexers"
              },
              {
                phase: "Phase 2: Syntax Analysis (AST Generation)",
                desc: "Parse tokens into Abstract Syntax Tree based on formal grammar rules. Extract functions, classes, variables, imports, and exports.",
                tech: "@babel/parser for JS/TS, tree-sitter for other languages"
              },
              {
                phase: "Phase 3: Semantic Analysis",
                desc: "Validate logical correctness: undefined variables, type mismatches, unreachable code, scope violations, and variable shadowing.",
                tech: "Custom semantic analyzer with symbol table"
              },
              {
                phase: "Phase 4: Control Flow Analysis",
                desc: "Build Control Flow Graph (CFG) showing all execution paths. Calculate cyclomatic complexity. Detect infinite loops and dead code.",
                tech: "Graph traversal algorithms + React Flow visualization"
              },
              {
                phase: "Phase 5: Data Flow Analysis",
                desc: "Track variable lifecycle (define-use-kill chains). Identify uninitialized reads, unused assignments, and memory leak potential.",
                tech: "Reaching definitions + live variable analysis"
              },
              {
                phase: "Phase 6: Security Analysis (SAST)",
                desc: "Pattern matching for OWASP Top 10 vulnerabilities. Map findings to CWE IDs. Detect SQL injection, XSS, hardcoded secrets, etc.",
                tech: "Regex patterns + AST traversal + taint analysis"
              },
              {
                phase: "Phase 7: Code Metrics Calculation",
                desc: "Compute Cyclomatic Complexity (McCabe), Halstead Metrics, Maintainability Index, Cognitive Complexity, and code duplication percentage.",
                tech: "Mathematical models + AST node counting"
              },
              {
                phase: "Phase 8: AI Enhancement (Groq)",
                desc: "Generate natural language explanations using AST analysis results as context. AI explains what real analyzers found, never replaces them.",
                tech: "Groq Llama 3.3 70B with load balancing"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-r from-slate-700/40 to-slate-700/20 rounded-lg p-5 border-l-4 border-purple-500">
                <h3 className="font-bold text-lg text-purple-300 mb-2">{item.phase}</h3>
                <p className="text-gray-300 text-sm mb-2 leading-relaxed">{item.desc}</p>
                <p className="text-xs text-gray-400"><strong>Technology:</strong> {item.tech}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security Features */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Security & Quality Standards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30">
              <h3 className="text-xl font-semibold text-red-400 mb-4">Security Scanning</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ OWASP Top 10 vulnerability detection</li>
                <li>✓ CWE (Common Weakness Enumeration) mapping</li>
                <li>✓ SQL Injection pattern matching</li>
                <li>✓ XSS (Cross-Site Scripting) detection</li>
                <li>✓ Hardcoded secrets & credentials</li>
                <li>✓ Insecure deserialization</li>
                <li>✓ Path traversal vulnerabilities</li>
                <li>✓ Command injection risks</li>
                <li>✓ Weak cryptography usage</li>
                <li>✓ SSRF & XXE detection</li>
              </ul>
            </div>

            <div className="bg-green-900/20 rounded-xl p-6 border border-green-500/30">
              <h3 className="text-xl font-semibold text-green-400 mb-4">Code Quality Checks</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Cyclomatic Complexity (McCabe)</li>
                <li>✓ Halstead Complexity Metrics</li>
                <li>✓ Maintainability Index (0-100)</li>
                <li>✓ Cognitive Complexity scoring</li>
                <li>✓ Code duplication detection</li>
                <li>✓ Function length analysis</li>
                <li>✓ Nesting depth tracking</li>
                <li>✓ Magic number detection</li>
                <li>✓ Dead code identification</li>
                <li>✓ Naming convention validation</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Database Schema */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <Database className="w-8 h-8" />
            Database Architecture (PostgreSQL)
          </h2>
          
          <div className="bg-slate-700/30 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">Core Tables</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-slate-600/30 rounded p-3">
                  <strong className="text-purple-300">users</strong>
                  <p className="text-gray-400 text-xs mt-1">id, clerk_user_id, email, full_name, created_at, plan_type, is_active</p>
                </div>
                <div className="bg-slate-600/30 rounded p-3">
                  <strong className="text-purple-300">analyses</strong>
                  <p className="text-gray-400 text-xs mt-1">id, user_id, code_snippet, language, ast_results (JSONB), security_findings (JSONB), metrics (JSONB), created_at, execution_time_ms</p>
                </div>
                <div className="bg-slate-600/30 rounded p-3">
                  <strong className="text-purple-300">saved_snippets</strong>
                  <p className="text-gray-400 text-xs mt-1">id, user_id, title, code, language, tags (array), analysis_id, saved_at</p>
                </div>
                <div className="bg-slate-600/30 rounded p-3">
                  <strong className="text-purple-300">projects</strong>
                  <p className="text-gray-400 text-xs mt-1">id, user_id, name, file_count, total_lines, languages (JSONB), quality_score, last_analyzed</p>
                </div>
                <div className="bg-slate-600/30 rounded p-3">
                  <strong className="text-purple-300">user_stats</strong>
                  <p className="text-gray-400 text-xs mt-1">user_id, total_analyses, bugs_found, lines_analyzed, time_saved_hours, api_calls_made</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">Performance Optimization</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Indexes on user_id, created_at, language columns</li>
                <li>• JSONB GIN indexes for fast querying nested data</li>
                <li>• Partitioning on analyses table by created_at (monthly)</li>
                <li>• Redis caching for frequently accessed analyses</li>
                <li>• Connection pooling (pg-pool) for scalability</li>
              </ul>
            </div>
          </div>
        </section>

        {/* AI Integration */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <Brain className="w-8 h-8" />
            AI Integration Strategy (Groq)
          </h2>
          
          <div className="space-y-4">
            <div className="bg-slate-700/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-4">Multi-API Load Balancing</h3>
              <p className="text-gray-300 mb-4 text-sm">
                Use multiple Groq API keys in rotation to handle rate limits and ensure high availability. Implement intelligent failover and load distribution.
              </p>
              
              <div className="bg-slate-600/30 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <strong className="text-purple-300">Implementation Pattern:</strong>
                  <ul className="mt-2 space-y-1 text-gray-300">
                    <li>• Store 3-5 Groq API keys in environment variables</li>
                    <li>• Round-robin distribution across keys</li>
                    <li>• Track rate limit status per key (60 requests/minute)</li>
                    <li>• Automatic failover if key hits rate limit</li>
                    <li>• Health check endpoint for API key status</li>
                    <li>• Exponential backoff on failures</li>
                  </ul>
                </div>
                
                <div className="mt-4">
                  <strong className="text-purple-300">Model Configuration:</strong>
                  <ul className="mt-2 space-y-1 text-gray-300">
                    <li>• Primary: llama-3.3-70b-versatile (fast, free)</li>
                    <li>• Temperature: 0.3 (consistent, factual responses)</li>
                    <li>• Max tokens: 2000 (detailed explanations)</li>
                    <li>• Streaming: Enabled for better UX</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900/20 rounded-xl p-6 border border-yellow-500/30">
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">⚠️ AI Role Limitation</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                <strong>CRITICAL:</strong> AI is used ONLY for natural language explanations, NOT for primary analysis. All bug detection, security scanning, and metrics calculation are performed by deterministic static analysis engines. AI receives structured AST results as input and translates them into human-readable insights.
              </p>
            </div>
          </div>
        </section>

        {/* User Input Handling */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <CheckCircle className="w-8 h-8" />
            Input Validation & Security
          </h2>
          
          <div className="space-y-4">
            <div className="bg-slate-700/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-4">Code Input Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-600/30 rounded p-4">
                  <strong className="text-purple-300">Manual Input</strong>
                  <ul className="mt-2 space-y-1 text-gray-300">
                    <li>• Monaco Editor paste</li>
                    <li>• Max 50,000 characters</li>
                    <li>• Real-time syntax validation</li>
                  </ul>
                </div>
                <div className="bg-slate-600/30 rounded p-4">
                  <strong className="text-purple-300">File Upload</strong>
                  <ul className="mt-2 space-y-1 text-gray-300">
                    <li>• Single file: .js, .ts, .py, etc.</li>
                    <li>• Max size: 5MB per file</li>
                    <li>• MIME type validation</li>
                  </ul>
                </div>
                <div className="bg-slate-600/30 rounded p-4">
                  <strong className="text-purple-300">GitHub Import</strong>
                  <ul className="mt-2 space-y-1 text-gray-300">
                    <li>• Public repository URLs</li>
                    <li>• OAuth token authentication</li>
                    <li>• File tree navigation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30">
              <h3 className="text-xl font-semibold text-red-400 mb-4">Security Measures</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <strong className="text-red-300">Never Execute User Code</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Static analysis only</li>
                    <li>• Sandboxed parsing environment</li>
                    <li>• No eval() or Function()</li>
                    <li>• Isolated Web Workers</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-red-300">Input Sanitization</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Strip dangerous patterns</li>
                    <li>• Escape HTML entities</li>
                    <li>• Validate file extensions</li>
                    <li>• Size limit enforcement</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-red-300">Rate Limiting</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• 50 analyses/hour (free tier)</li>
                    <li>• IP-based throttling</li>
                    <li>• Redis-backed counters</li>
                    <li>• Graceful degradation</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-red-300">Data Privacy</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• User-isolated database queries</li>
                    <li>• Encrypted API keys storage</li>
                    <li>• No code retention option</li>
                    <li>• GDPR compliance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4">Development Best Practices</h2>
          
          <div className="space-y-3">
            {[
              {
                title: "Code Quality",
                items: ["TypeScript strict mode enabled", "ESLint + Prettier configuration", "Husky pre-commit hooks", "100% type coverage target"]
              },
              {
                title: "Testing Strategy",
                items: ["Unit tests for analysis engines (Jest)", "Integration tests for API endpoints", "E2E tests for critical flows (Playwright)", "80% code coverage minimum"]
              },
              {
                title: "Performance",
                items: ["Web Workers for heavy parsing (non-blocking UI)", "Memoization of AST results", "Lazy loading of analysis modules", "Virtualized lists for large datasets"]
              },
              {
                title: "Error Handling",
                items: ["Try-catch around all async operations", "User-friendly error messages", "Sentry for error tracking", "Graceful degradation on failures"]
              },
              {
                title: "Documentation",
                items: ["TSDoc comments for all functions", "Architecture decision records (ADRs)", "API documentation (OpenAPI spec)", "User guides and tutorials"]
              }
            ].map((section, idx) => (
              <div key={idx} className="bg-slate-700/30 rounded-lg p-5">
                <h3 className="font-semibold text-blue-400 mb-2">{section.title}</h3>
                <ul className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                  {section.items.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Implementation Phases */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4">Implementation Roadmap</h2>
          
          <div className="space-y-3">
            {[
              {
                phase: "Phase 1: Foundation (Week 1-2)",
                tasks: ["Set up React + TypeScript project", "Integrate Monaco Editor", "Implement Clerk authentication", "Create PostgreSQL schema", "Basic UI layout and routing"]
              },
              {
                phase: "Phase 2: Core Analysis (Week 3-4)",
                tasks: ["Implement Babel AST parsing for JavaScript", "Build lexical and syntax analyzers", "Create basic bug detection patterns", "Set up Web Workers for parallel processing"]
              },
              {
                phase: "Phase 3: Security & Metrics (Week 5-6)",
                tasks: ["Implement OWASP Top 10 security scanning", "Add CWE mapping and severity classification", "Build metrics calculation engine (McCabe, Halstead)", "Create security report generation"]
              },
              {
                phase: "Phase 4: Visualization (Week 7)",
                tasks: ["Integrate React Flow for control flow graphs", "Add Recharts for metrics visualization", "Build interactive dependency graphs", "Create complexity heatmaps"]
              },
              {
                phase: "Phase 5: AI Integration (Week 8)",
                tasks: ["Set up Groq API load balancer", "Implement explanation generation", "Add streaming responses", "Create chat interface for code Q&A"]
              },
              {
                phase: "Phase 6: Multi-Language (Week 9-10)",
                tasks: ["Add TypeScript support", "Integrate Python parser", "Add Java and C++ support", "Language auto-detection system"]
              },
              {
                phase: "Phase 7: Polish & Testing (Week 11-12)",
                tasks: ["Write comprehensive test suite", "Performance optimization", "UI/UX refinements", "Documentation and deployment"]
              }
            ].map((phase, idx) => (
              <div key={idx} className="bg-gradient-to-r from-purple-900/30 to-slate-700/30 rounded-lg p-5 border-l-4 border-purple-500">
                <h3 className="font-bold text-lg text-purple-300 mb-3">{phase.phase}</h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  {phase.tasks.map((task, i) => (
                    <li key={i}>✓ {task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Cursor Instructions */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-purple-400 mb-4">Instructions for Cursor AI</h2>
          
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30">
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <strong className="text-blue-400 text-base">Project Initialization:</strong>
                <p className="mt-2">Create a new React + TypeScript project with Vite. Install dependencies: @babel/parser, @babel/traverse, monaco-editor, clerk, recharts, react-flow-renderer, tailwindcss, framer-motion. Set up PostgreSQL with pg library and connection pooling.</p>
              </div>
              
              <div>
                <strong className="text-blue-400 text-base">Code Style Guidelines:</strong>
                <p className="mt-2">Use TypeScript strict mode. Follow functional React patterns with hooks. Implement proper error boundaries. Use async/await with try-catch. Add TSDoc comments for all public functions. Keep functions under 50 lines.</p>
              </div>
              
              <div>
                <strong className="text-blue-400 text-base">Architecture Patterns:</strong>
                <p className="mt-2">Separate concerns: UI components in /components, analysis logic in /lib/analyzers, API routes in /api, database queries in /lib/db. Use Web Workers for CPU-intensive parsing. Implement repository pattern for database access.</p>
              </div>
              
              <div>
                <strong className="text-blue-400 text-base">Security Implementation:</strong>
                <p className="mt-2">Never execute user code. Sanitize all inputs before processing. Use prepared statements for SQL queries. Implement rate limiting middleware. Store API keys in .env file, never in code. Add CORS protection and CSRF tokens.</p>
              </div>
              
              <div>
                <strong className="text-blue-400 text-base">Testing Requirements:</strong>
                <p className="mt-2">Write unit tests for each analyzer module. Test edge cases: empty code, invalid syntax, malicious input. Add integration tests for API endpoints. Use mock data for Groq API in tests. Achieve 80%+ code coverage.</p>
              </div>
              
              <div>
                <strong className="text-blue-400 text-base">Performance Optimization:</strong>
                <p className="mt-2">Implement memoization for AST results. Use React.memo for heavy components. Add loading skeletons and progressive rendering. Optimize database queries with proper indexes. Cache frequently accessed analyses in Redis.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-purple-500/30 text-center text-sm text-gray-400">
          <p>This specification document is designed for AI-assisted development with Cursor IDE</p>
          <p className="mt-2">Focus on production-ready code with enterprise-grade security and performance</p>
          <p className="mt-4 text-purple-400 font-semibold">Ready to build a professional static analysis platform</p>
        </footer>
      </div>
    </div>
  );
}
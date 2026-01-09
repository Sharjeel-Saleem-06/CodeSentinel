/**
 * CodeSentinel - Main Application
 * Enterprise-Grade AI-Powered Code Analysis Platform
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Code2,
  Shield,
  BarChart3,
  GitBranch,
  Sparkles,
  FileCode,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Upload,
  Trash2,
  Download,
  Copy,
  Check,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { CodeEditor } from './components/editor/CodeEditor';
import { IssuesList } from './components/analysis/IssuesList';
import { MetricsPanel } from './components/analysis/MetricsPanel';
import { SecurityPanel } from './components/analysis/SecurityPanel';
import { AIPanel } from './components/analysis/AIPanel';
import { ControlFlowGraphView } from './components/visualization/ControlFlowGraph';
import { CustomRulesPanel } from './components/analysis/CustomRulesPanel';

import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';
import { Tabs } from './components/ui/Tabs';
import { Select } from './components/ui/Select';
import { useAnalysisStore } from './store/analysisStore';
import { analyzeCode, getAnalysisSummary } from './lib/analyzers/codeAnalyzer';
import type { Language } from './types/analysis';

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'swift', label: 'Swift' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'dart', label: 'Dart' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'scala', label: 'Scala' },
];



function App() {
  const {
    sourceCode,
    setSourceCode,
    language,
    setLanguage,
    status,
    setStatus,
    result,
    setResult,
    activeTab,
    setActiveTab,
    options,
  } = useAnalysisStore();

  const { toggleTheme, isDark } = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Run analysis
  const handleAnalyze = useCallback(async () => {
    if (!sourceCode.trim()) return;

    setIsAnalyzing(true);
    setStatus('analyzing');

    try {
      const analysisResult = await analyzeCode(sourceCode, {
        ...options,
        language,
      });
      setResult(analysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
      setStatus('error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [sourceCode, language, options, setStatus, setResult]);

  // Auto-analyze on mount with default code
  useEffect(() => {
    if (sourceCode && !result) {
      handleAnalyze();
    }
  }, []);

  // Handle file upload - supports all common coding file extensions
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSourceCode(content);

      // Auto-detect language from file extension - comprehensive mapping
      const ext = file.name.split('.').pop()?.toLowerCase();
      const langMap: Record<string, Language> = {
        // JavaScript/TypeScript
        'js': 'javascript',
        'jsx': 'javascript',
        'mjs': 'javascript',
        'cjs': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'mts': 'typescript',
        'cts': 'typescript',
        // Python
        'py': 'python',
        'pyw': 'python',
        'pyx': 'python',
        'pyi': 'python',
        // Java
        'java': 'java',
        // C/C++
        'c': 'cpp',
        'cpp': 'cpp',
        'cc': 'cpp',
        'cxx': 'cpp',
        'h': 'cpp',
        'hpp': 'cpp',
        'hxx': 'cpp',
        // Go
        'go': 'go',
        // Rust
        'rs': 'rust',
        // Kotlin
        'kt': 'kotlin',
        'kts': 'kotlin',
        // Swift
        'swift': 'swift',
        // Dart
        'dart': 'dart',
        // C#
        'cs': 'csharp',
        // PHP
        'php': 'php',
        'phtml': 'php',
        // Ruby
        'rb': 'ruby',
        'rake': 'ruby',
        'gemspec': 'ruby',
        // Scala
        'scala': 'scala',
        'sc': 'scala',
        // Shell
        'sh': 'javascript', // Fallback for shell scripts
        'bash': 'javascript',
        'zsh': 'javascript',
        // Config files (treat as JavaScript for basic analysis)
        'json': 'javascript',
        'yaml': 'javascript',
        'yml': 'javascript',
        'xml': 'javascript',
        // Web
        'vue': 'javascript',
        'svelte': 'javascript',
        'html': 'javascript',
        'css': 'javascript',
        'scss': 'javascript',
        'sass': 'javascript',
        'less': 'javascript',
        // SQL (treat as JavaScript for basic analysis)
        'sql': 'javascript',
        // Markdown (for documentation analysis)
        'md': 'javascript',
        'mdx': 'javascript',
      };
      if (ext && langMap[ext]) {
        setLanguage(langMap[ext]);
      }
    };
    reader.readAsText(file);
  }, [setSourceCode, setLanguage]);

  // Copy code
  const handleCopyCode = useCallback(async () => {
    await navigator.clipboard.writeText(sourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sourceCode]);

  // Clear code
  const handleClearCode = useCallback(() => {
    setSourceCode('');
    setResult(null);
  }, [setSourceCode, setResult]);

  // Export results
  const handleExportResults = useCallback(() => {
    if (!result) return;

    const exportData = {
      timestamp: result.timestamp,
      language: result.language,
      metrics: result.metrics,
      security: result.security,
      issues: result.issues,
      summary: getAnalysisSummary(result),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codescan-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  // Get summary stats
  const summary = result ? getAnalysisSummary(result) : null;

  // Tab configuration
  const tabs = [
    {
      id: 'issues',
      label: 'Issues',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: summary?.totalIssues || 0
    },
    {
      id: 'metrics',
      label: 'Metrics',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="w-4 h-4" />,
      badge: result?.security.issues.length || 0
    },
    {
      id: 'cfg',
      label: 'Flow',
      icon: <GitBranch className="w-4 h-4" />
    },
    {
      id: 'rules',
      label: 'Rules',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      id: 'ai',
      label: 'AI',
      icon: <Sparkles className="w-4 h-4" />
    },
  ];

  // Get severity color
  const getSeverityColor = (score: number, inverse = false) => {
    if (inverse) {
      if (score >= 80) return 'text-neon-green';
      if (score >= 60) return 'text-cyber-500';
      if (score >= 40) return 'text-neon-yellow';
      return 'text-neon-red';
    }
    if (score >= 75) return 'text-neon-red';
    if (score >= 50) return 'text-neon-orange';
    if (score >= 25) return 'text-neon-yellow';
    return 'text-neon-green';
  };

  return (
    <div className="min-h-screen bg-obsidian-950 grid-pattern noise-overlay">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-obsidian-800/50">
        <div className="max-w-[1920px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-neon-purple flex items-center justify-center shadow-lg shadow-cyber-500/25">
                  <Code2 className="w-6 h-6 text-obsidian-950" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold gradient-text">CodeSentinel</h1>
                <p className="text-xs text-obsidian-500">Professional Static Analysis</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-obsidian-800 border border-obsidian-700 text-obsidian-300 hover:text-obsidian-100 hover:border-obsidian-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* File Upload */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".js,.jsx,.mjs,.cjs,.ts,.tsx,.mts,.cts,.py,.pyw,.pyx,.pyi,.java,.c,.cpp,.cc,.cxx,.h,.hpp,.hxx,.go,.rs,.kt,.kts,.swift,.dart,.cs,.php,.phtml,.rb,.rake,.gemspec,.scala,.sc,.sh,.bash,.zsh,.json,.yaml,.yml,.xml,.vue,.svelte,.html,.css,.scss,.sass,.less,.sql,.md,.mdx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-obsidian-800 border border-obsidian-700 text-obsidian-300 hover:text-obsidian-100 hover:border-obsidian-600 transition-colors text-sm">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </div>
              </label>

              <Select
                options={languageOptions}
                value={language}
                onChange={(val) => setLanguage(val as Language)}
                className="w-36"
              />

              <Button
                onClick={handleAnalyze}
                isLoading={isAnalyzing}
                leftIcon={<Play className="w-4 h-4" />}
                className="min-w-[130px]"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>


            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Left Panel - Editor */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Editor Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyber-500" />
                <span className="font-medium text-obsidian-200">Code Editor</span>
                <span className="text-xs text-obsidian-500 bg-obsidian-800 px-2 py-0.5 rounded">
                  {language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-obsidian-500">
                  {sourceCode.split('\n').length} lines • {sourceCode.length} chars
                </span>
                <div className="h-4 w-px bg-obsidian-700" />
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-800/50 transition-colors"
                  title="Copy code"
                >
                  {copied ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleClearCode}
                  className="p-1.5 rounded-lg text-obsidian-400 hover:text-neon-red hover:bg-neon-red/10 transition-colors"
                  title="Clear code"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0">
              <CodeEditor
                issues={result?.issues || []}
                onAnalyze={handleAnalyze}
              />
            </div>

            {/* Quick Stats */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-4 gap-2"
              >
                <div className="bg-obsidian-900/60 rounded-lg p-2.5 border border-obsidian-800/50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-neon-orange" />
                    <span className="text-[10px] text-obsidian-400 uppercase tracking-wider">Issues</span>
                  </div>
                  <p className="text-xl font-bold text-obsidian-100">{summary?.totalIssues || 0}</p>
                </div>
                <div className="bg-obsidian-900/60 rounded-lg p-2.5 border border-obsidian-800/50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Shield className="w-3.5 h-3.5 text-neon-red" />
                    <span className="text-[10px] text-obsidian-400 uppercase tracking-wider">Risk</span>
                  </div>
                  <p className={`text-xl font-bold ${getSeverityColor(summary?.securityRisk || 0)}`}>
                    {summary?.securityRisk || 0}
                  </p>
                </div>
                <div className="bg-obsidian-900/60 rounded-lg p-2.5 border border-obsidian-800/50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Zap className="w-3.5 h-3.5 text-neon-yellow" />
                    <span className="text-[10px] text-obsidian-400 uppercase tracking-wider">Complex</span>
                  </div>
                  <p className="text-xl font-bold text-obsidian-100">{summary?.complexity || 0}</p>
                </div>
                <div className="bg-obsidian-900/60 rounded-lg p-2.5 border border-obsidian-800/50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-neon-green" />
                    <span className="text-[10px] text-obsidian-400 uppercase tracking-wider">Quality</span>
                  </div>
                  <p className={`text-xl font-bold ${getSeverityColor(summary?.maintainability || 0, true)}`}>
                    {summary?.maintainability.toFixed(0) || 0}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Tabs Header */}
            <div className="flex items-center justify-between">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
              />

              {result && (
                <button
                  onClick={handleExportResults}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-800/50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              )}
            </div>

            {/* Tab Content */}
            <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <CardContent className="flex-1 min-h-0 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                  {status === 'analyzing' ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full gap-4"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-obsidian-800 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-cyber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-obsidian-200 font-medium">Analyzing code...</p>
                        <p className="text-sm text-obsidian-500">Running 8-phase analysis pipeline</p>
                      </div>
                    </motion.div>
                  ) : !result && activeTab !== 'rules' ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full gap-4 text-obsidian-400"
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-500/10 to-neon-purple/10 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-cyber-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-obsidian-200 font-medium text-lg">Ready to analyze</p>
                        <p className="text-sm mt-1">Paste your code and click "Analyze"</p>
                        <p className="text-xs mt-2 text-obsidian-500">or press Ctrl+Enter in the editor</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="h-full overflow-y-auto"
                    >
                      {activeTab === 'issues' && result && (
                        <div className="h-full overflow-y-auto">
                          <IssuesList issues={result.issues} />
                        </div>
                      )}
                      {activeTab === 'metrics' && result?.metrics && (
                        <MetricsPanel metrics={result.metrics} />
                      )}
                      {activeTab === 'security' && result && (
                        <SecurityPanel security={result.security} />
                      )}
                      {activeTab === 'cfg' && result?.controlFlowGraph && (
                        <div className="h-[calc(100vh-380px)] min-h-[500px] w-full">
                          <ControlFlowGraphView cfg={result.controlFlowGraph} />
                        </div>
                      )}
                      {activeTab === 'rules' && (
                        <CustomRulesPanel
                          language={language}
                          onRulesChange={handleAnalyze}
                        />
                      )}
                      {activeTab === 'ai' && result && (
                        <AIPanel result={result} sourceCode={sourceCode} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Footer Stats */}
            {result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between text-xs text-obsidian-500 px-1"
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    {result.functions.length} functions
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {result.classes.length} classes
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCode className="w-3 h-3" />
                    {result.imports.length} imports
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {result.executionTimeMs}ms
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-2 px-6 glass border-t border-obsidian-800/50">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-xs text-obsidian-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            CodeSentinel v1.0 • AI-Powered Code Analysis
          </span>
          <span>
            Babel AST • OWASP Top 10 • Llama 3.3 70B AI
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;

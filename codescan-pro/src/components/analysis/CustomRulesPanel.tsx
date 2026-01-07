/**
 * Custom Rules Panel
 * UI for managing and creating custom code analysis rules
 * Supports AI-powered rule generation
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Code,
  Search,
  Tag,
  X,
  Save,
  Wand2,
} from 'lucide-react';
import { queryAI } from '../../lib/ai/groqService';
import {
  type CustomRule,
  type RulePlatform,
  loadCustomRules,
  saveCustomRules,
  addCustomRule,
  updateCustomRule,
  deleteCustomRule,
  toggleRule,
  validatePattern,
  generateRuleCreationPrompt,
  parseAIRuleResponse,
  exportRules,
  importRules,
  resetToDefaultRules,
  getRuleStats,
  getRulesByPlatform,
} from '../../lib/rules/customRulesEngine';
import type { Language, Severity } from '../../types/analysis';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

interface CustomRulesPanelProps {
  language: Language;
  onRulesChange?: () => void;
}

const SEVERITY_CONFIG: Record<Severity | 'critical' | 'high' | 'medium' | 'low', { color: string; bg: string; label: string }> = {
  error: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Critical' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Critical' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'High' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Warning' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Medium' },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Info' },
  low: { color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Low' },
};

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  security: Shield,
  performance: Zap,
  style: Code,
  'best-practice': CheckCircle,
  custom: Tag,
};

const ALL_LANGUAGES: Language[] = [
  'javascript', 'typescript', 'kotlin', 'swift', 'python', 
  'java', 'cpp', 'go', 'rust', 'dart', 'csharp', 'php', 'ruby', 'scala'
];

// Platform-specific rule templates for quick creation - Kotlin and iOS focused
const RULE_TEMPLATES = {
  kotlin: [
    {
      name: 'Force Unwrap (!!)',
      description: 'Detect dangerous !! operator',
      prompt: 'Create a rule to detect the !! (force unwrap) operator in Kotlin which throws NullPointerException if the value is null',
    },
    {
      name: 'GlobalScope Usage',
      description: 'Detect coroutine memory leaks',
      prompt: 'Create a rule to detect GlobalScope.launch or GlobalScope.async usage in Kotlin which can cause memory leaks',
    },
    {
      name: 'Context in ViewModel',
      description: 'Detect memory leaks in ViewModel',
      prompt: 'Create a rule to detect Android Context, Activity, or Fragment references stored in ViewModel which causes memory leaks',
    },
    {
      name: 'Hardcoded Strings',
      description: 'Detect hardcoded UI strings',
      prompt: 'Create a rule to detect hardcoded strings in Kotlin Android that should use string resources for localization',
    },
    {
      name: 'runBlocking Usage',
      description: 'Detect blocking coroutines',
      prompt: 'Create a rule to detect runBlocking usage on main thread in Android Kotlin which can cause ANR',
    },
    {
      name: 'Unencrypted Storage',
      description: 'Detect insecure SharedPreferences',
      prompt: 'Create a rule to detect sensitive data stored in unencrypted SharedPreferences instead of EncryptedSharedPreferences',
    },
    {
      name: 'Missing Lifecycle',
      description: 'Detect lifecycle-unaware observers',
      prompt: 'Create a rule to detect LiveData observers or Flow collectors not properly scoped to lifecycle in Android',
    },
    {
      name: 'Compose Remember',
      description: 'Detect missing remember in Compose',
      prompt: 'Create a rule to detect state variables in Jetpack Compose that should use remember or rememberSaveable',
    },
    {
      name: 'Network on Main',
      description: 'Detect network calls on main thread',
      prompt: 'Create a rule to detect network or database operations on main thread in Android Kotlin',
    },
    {
      name: 'Deprecated APIs',
      description: 'Detect deprecated Android APIs',
      prompt: 'Create a rule to detect usage of deprecated Android APIs that should be replaced with modern alternatives',
    },
  ],
  swift: [
    {
      name: 'Force Unwrap (!)',
      description: 'Detect dangerous force unwrap',
      prompt: 'Create a rule to detect force unwrap (!) usage in Swift which can cause runtime crashes when the optional is nil',
    },
    {
      name: 'Force Cast (as!)',
      description: 'Detect dangerous force cast',
      prompt: 'Create a rule to detect force cast (as!) usage in Swift which crashes if the cast fails',
    },
    {
      name: '@State with Class',
      description: 'Detect @State misuse',
      prompt: 'Create a rule to detect @State being used with reference types (classes) in SwiftUI which causes unexpected behavior',
    },
    {
      name: '@ObservedObject Init',
      description: 'Detect inline @ObservedObject',
      prompt: 'Create a rule to detect @ObservedObject initialized inline in SwiftUI View body which recreates the object on every render',
    },
    {
      name: 'Retain Cycle',
      description: 'Detect memory leaks in closures',
      prompt: 'Create a rule to detect strong self capture in escaping closures that may cause retain cycles and memory leaks',
    },
    {
      name: 'Missing @MainActor',
      description: 'Detect thread safety issues',
      prompt: 'Create a rule to detect ViewModels or UI-updating async code missing @MainActor annotation in Swift',
    },
    {
      name: 'UIKit in SwiftUI',
      description: 'Detect UIKit anti-pattern',
      prompt: 'Create a rule to detect direct UIKit components (UIView, UIViewController) used inside SwiftUI views without proper bridging',
    },
    {
      name: 'NotificationCenter',
      description: 'Detect NotificationCenter misuse',
      prompt: 'Create a rule to detect NotificationCenter observers in SwiftUI that should use Combine publishers or onReceive instead',
    },
    {
      name: 'Hardcoded URLs',
      description: 'Detect hardcoded API endpoints',
      prompt: 'Create a rule to detect hardcoded HTTP/HTTPS URLs in Swift that should be in configuration files',
    },
    {
      name: 'Missing ATS',
      description: 'Detect App Transport Security issues',
      prompt: 'Create a rule to detect NSAllowsArbitraryLoads or other ATS exceptions that weaken iOS app security',
    },
    {
      name: 'Keychain Access',
      description: 'Detect insecure storage',
      prompt: 'Create a rule to detect sensitive data stored in UserDefaults instead of Keychain in iOS',
    },
    {
      name: 'View Too Complex',
      description: 'Detect over-complex SwiftUI views',
      prompt: 'Create a rule to detect SwiftUI Views with too many state variables or nested views that should be broken into smaller components',
    },
  ],
};

// Platform configuration for display
const PLATFORM_CONFIG: Record<RulePlatform, { label: string; color: string; icon: string }> = {
  general: { label: 'General', color: 'text-slate-400 bg-slate-500/20', icon: '🌐' },
  kotlin: { label: 'Kotlin/Android', color: 'text-orange-400 bg-orange-500/20', icon: '🤖' },
  swift: { label: 'Swift/iOS', color: 'text-blue-400 bg-blue-500/20', icon: '🍎' },
  javascript: { label: 'JavaScript', color: 'text-yellow-400 bg-yellow-500/20', icon: '📜' },
  typescript: { label: 'TypeScript', color: 'text-blue-400 bg-blue-500/20', icon: '🔷' },
  python: { label: 'Python', color: 'text-green-400 bg-green-500/20', icon: '🐍' },
  java: { label: 'Java', color: 'text-red-400 bg-red-500/20', icon: '☕' },
  go: { label: 'Go', color: 'text-cyan-400 bg-cyan-500/20', icon: '🐹' },
  rust: { label: 'Rust', color: 'text-orange-400 bg-orange-500/20', icon: '🦀' },
};

export function CustomRulesPanel({ language, onRulesChange }: CustomRulesPanelProps) {
  const { isDark } = useTheme();
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<RulePlatform | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newRule, setNewRule] = useState<Partial<CustomRule>>({
    name: '',
    description: '',
    languages: [language],
    platform: 'general',
    category: 'custom',
    severity: 'warning',
    enabled: true,
    pattern: '',
    patternFlags: 'g',
    message: '',
    suggestion: '',
    whyBad: '',
    tags: [],
  });
  const [patternError, setPatternError] = useState<string | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importJson, setImportJson] = useState('');

  useEffect(() => {
    setRules(loadCustomRules());
  }, []);

  const handleRefresh = () => {
    setRules(loadCustomRules());
  };

  const handleToggleRule = (id: string) => {
    const updated = toggleRule(id);
    if (updated) {
      setRules(prev => prev.map(r => r.id === id ? updated : r));
      onRulesChange?.();
    }
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteCustomRule(id);
      setRules(prev => prev.filter(r => r.id !== id));
      onRulesChange?.();
    }
  };

  const handleSaveRule = () => {
    if (!newRule.name || !newRule.pattern || !newRule.message) {
      alert('Please fill in required fields: Name, Pattern, and Message');
      return;
    }

    const validation = validatePattern(newRule.pattern);
    if (!validation.valid) {
      setPatternError(validation.error || 'Invalid pattern');
      return;
    }

    if (editingRule) {
      const updated = updateCustomRule(editingRule.id, newRule);
      if (updated) {
        setRules(prev => prev.map(r => r.id === editingRule.id ? updated : r));
      }
    } else {
      const created = addCustomRule(newRule as Omit<CustomRule, 'id' | 'createdAt'>);
      setRules(prev => [...prev, created]);
    }

    setShowCreateModal(false);
    setEditingRule(null);
    resetNewRule();
    onRulesChange?.();
  };

  const resetNewRule = () => {
    setNewRule({
      name: '',
      description: '',
      languages: [language],
      category: 'custom',
      severity: 'warning',
      enabled: true,
      pattern: '',
      patternFlags: 'g',
      message: '',
      suggestion: '',
      whyBad: '',
      tags: [],
    });
    setPatternError(null);
    setAiPrompt('');
  };

  const handleEditRule = (rule: CustomRule) => {
    setEditingRule(rule);
    setNewRule({ ...rule });
    setShowCreateModal(true);
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const prompt = generateRuleCreationPrompt(aiPrompt, language);
      const response = await queryAI(prompt);

      const parsed = parseAIRuleResponse(response, language);
      if (parsed) {
        setNewRule(prev => ({ ...prev, ...parsed }));
        setAiPrompt('');
      } else {
        alert('Could not parse AI response. Please try again with a clearer description.');
      }
    } catch (e) {
      console.error('Error generating rule with AI:', e);
      alert('Error generating rule. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    const json = exportRules();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codescan-custom-rules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const result = importRules(importJson);
    if (result.success) {
      setRules(loadCustomRules());
      setImportJson('');
      setShowImportExport(false);
      alert(`Successfully imported ${result.imported} rules`);
      onRulesChange?.();
    } else {
      alert(`Import failed: ${result.error}`);
    }
  };

  const handleReset = () => {
    if (confirm('This will reset all rules to defaults. Continue?')) {
      resetToDefaultRules();
      setRules(loadCustomRules());
      onRulesChange?.();
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = !searchQuery || 
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || rule.category === selectedCategory;
    const matchesPlatform = !selectedPlatform || rule.platform === selectedPlatform;
    const matchesLanguage = rule.languages.includes(language) || rule.platform === 'general';
    return matchesSearch && matchesCategory && matchesPlatform && matchesLanguage;
  });

  // Group rules by platform for display
  const rulesByPlatform = getRulesByPlatform();

  const stats = getRuleStats();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={cn(
              "text-lg font-semibold",
              isDark ? "text-white" : "text-gray-900"
            )}>Custom Rules</h3>
            <p className={cn(
              "text-xs",
              isDark ? "text-slate-400" : "text-gray-500"
            )}>
              {stats.enabled}/{stats.total} rules active
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportExport(!showImportExport)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark 
                ? "bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900"
            )}
            title="Import/Export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark 
                ? "bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900"
            )}
            title="Reset to defaults"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              resetNewRule();
              setEditingRule(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-medium hover:from-purple-500 hover:to-fuchsia-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Import/Export Panel */}
      <AnimatePresence>
        {showImportExport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "rounded-xl p-4 border",
              isDark 
                ? "bg-slate-800/50 border-slate-700/50" 
                : "bg-gray-50 border-gray-200"
            )}
          >
            <div className="flex gap-4">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Rules
              </button>
              <div className="flex-1">
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="Paste JSON to import..."
                  className={cn(
                    "w-full h-20 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500/50 resize-none",
                    isDark 
                      ? "bg-slate-900/50 border-slate-600/50 text-white placeholder-slate-500" 
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  )}
                />
                <button
                  onClick={handleImport}
                  disabled={!importJson.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Import Rules
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
              isDark ? "text-slate-400" : "text-gray-400"
            )} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules..."
              className={cn(
                "w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-purple-500/50",
                isDark 
                  ? "bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-500" 
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              )}
            />
          </div>
          <div className="flex gap-1">
            {['security', 'performance', 'best-practice', 'custom'].map(cat => {
              const Icon = CATEGORY_ICONS[cat] || Tag;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    selectedCategory === cat
                      ? 'bg-purple-600/30 text-purple-500'
                      : isDark 
                        ? 'bg-slate-700/50 text-slate-400 hover:text-white'
                        : 'bg-gray-100 text-gray-500 hover:text-gray-900'
                  )}
                  title={cat}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedPlatform(null)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border",
              selectedPlatform === null
                ? 'bg-purple-600/30 text-purple-500 border-purple-500/50'
                : isDark 
                  ? 'bg-slate-700/50 text-slate-400 hover:text-white border-transparent'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent'
            )}
          >
            All Platforms
          </button>
          {(['general', 'kotlin', 'swift', 'javascript', 'typescript', 'python'] as RulePlatform[]).map(platform => {
            const config = PLATFORM_CONFIG[platform];
            const count = rulesByPlatform[platform]?.length || 0;
            return (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(selectedPlatform === platform ? null : platform)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border",
                  selectedPlatform === platform
                    ? `${config.color} border-current`
                    : isDark 
                      ? 'bg-slate-700/50 text-slate-400 hover:text-white border-transparent'
                      : 'bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent'
                )}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px]",
                  isDark ? "bg-slate-800/50" : "bg-white"
                )}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2 max-h-[calc(100vh-450px)] min-h-[400px] overflow-y-auto custom-scrollbar">
        {filteredRules.length === 0 ? (
          <div className={cn(
            "text-center py-8",
            isDark ? "text-slate-400" : "text-gray-500"
          )}>
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No rules found for {language}</p>
            <p className="text-xs mt-1">Create a new rule to get started</p>
          </div>
        ) : (
          filteredRules.map(rule => (
            <motion.div
              key={rule.id}
              layout
              className={cn(
                "rounded-xl border transition-colors",
                isDark ? "bg-slate-800/30" : "bg-white",
                rule.enabled 
                  ? isDark ? 'border-slate-700/50' : 'border-gray-200' 
                  : isDark ? 'border-slate-800/50 opacity-60' : 'border-gray-100 opacity-60'
              )}
            >
              <div className="flex items-center gap-3 p-3">
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className={cn(
                    "transition-colors",
                    isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-900"
                  )}
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "font-medium truncate",
                      isDark ? "text-white" : "text-gray-900"
                    )}>{rule.name}</span>
                    {rule.aiGenerated && (
                      <Sparkles className="w-3 h-3 text-purple-500" title="AI Generated" />
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${SEVERITY_CONFIG[rule.severity]?.bg} ${SEVERITY_CONFIG[rule.severity]?.color}`}>
                      {SEVERITY_CONFIG[rule.severity]?.label || rule.severity}
                    </span>
                    {rule.platform && rule.platform !== 'general' && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${PLATFORM_CONFIG[rule.platform]?.color || 'bg-slate-500/20 text-slate-400'}`}>
                        {PLATFORM_CONFIG[rule.platform]?.icon} {PLATFORM_CONFIG[rule.platform]?.label}
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs truncate",
                    isDark ? "text-slate-400" : "text-gray-500"
                  )}>{rule.description || rule.message}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditRule(rule)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isDark 
                        ? "hover:bg-slate-700/50 text-slate-400 hover:text-white" 
                        : "hover:bg-gray-100 text-gray-400 hover:text-gray-900"
                    )}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isDark 
                        ? "hover:bg-red-900/30 text-slate-400 hover:text-red-400" 
                        : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                    className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                  >
                    {expandedRule === rule.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedRule === rule.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-700/50 p-3 space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Pattern:</span>
                        <code className="ml-2 px-2 py-0.5 bg-slate-900/50 rounded text-amber-400">{rule.pattern}</code>
                      </div>
                      <div>
                        <span className="text-slate-500">Category:</span>
                        <span className="ml-2 text-white capitalize">{rule.category}</span>
                      </div>
                    </div>
                    {rule.whyBad && (
                      <div className="text-xs">
                        <span className="text-slate-500">Why it's bad:</span>
                        <p className="text-slate-300 mt-1">{rule.whyBad}</p>
                      </div>
                    )}
                    {rule.suggestion && (
                      <div className="text-xs">
                        <span className="text-slate-500">Suggestion:</span>
                        <p className="text-emerald-400 mt-1">{rule.suggestion}</p>
                      </div>
                    )}
                    {rule.tags && rule.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {rule.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-700/50 rounded-full text-xs text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Create/Edit Modal - Full screen overlay with proper z-index and centering */}
      <AnimatePresence>
      {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] overflow-y-auto"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
              right: 0,
              bottom: 0,
          }}
        >
            {/* Dark overlay background */}
          <div
            className={cn(
                "fixed inset-0",
                isDark ? "bg-slate-950/95" : "bg-gray-900/50"
            )}
            onClick={() => setShowCreateModal(false)}
          />
          
            {/* Modal container - centered properly */}
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                    "relative w-full max-w-2xl rounded-2xl border shadow-2xl max-h-[90vh] overflow-hidden",
                isDark 
                  ? "bg-slate-900 border-slate-700/50" 
                  : "bg-white border-gray-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn(
                "sticky top-0 border-b p-4 flex items-center justify-between z-10",
                isDark 
                  ? "bg-slate-900 border-slate-700/50" 
                  : "bg-white border-gray-200"
              )}>
                <h3 className={cn(
                  "text-lg font-semibold flex items-center gap-2",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {editingRule ? (
                    <>
                      <Edit3 className="w-5 h-5 text-purple-400" />
                      Edit Rule
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-purple-400" />
                      Create New Rule
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isDark 
                      ? "hover:bg-slate-700/50 text-slate-400 hover:text-white" 
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* AI Generator */}
                <div className={cn(
                  "rounded-xl p-4 border",
                  isDark 
                    ? "bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30 border-purple-500/30" 
                    : "bg-gradient-to-br from-purple-100/50 to-fuchsia-100/50 border-purple-300/50"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    <span className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>Generate with AI</span>
                    <span className="text-xs bg-purple-600/40 text-purple-300 px-2 py-0.5 rounded-full">RAG-Powered</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe the rule you want to create..."
                      className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <button
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-fuchsia-500 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Generate
                    </button>
                  </div>
                </div>

                {/* Quick Templates - Kotlin & iOS Focused */}
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="font-medium text-white text-sm">Mobile Development Templates</span>
                    </div>
                    <div className="flex gap-1 text-xs">
                      <span className="px-2 py-1 bg-gradient-to-r from-orange-500/30 to-orange-600/20 text-orange-400 rounded-lg border border-orange-500/30">🤖 Kotlin/Android</span>
                      <span className="px-2 py-1 bg-gradient-to-r from-blue-500/30 to-cyan-500/20 text-blue-400 rounded-lg border border-blue-500/30">🍎 Swift/iOS</span>
                    </div>
                  </div>
                  
                  {/* Kotlin / Android Templates */}
                  <div className="mb-4 p-3 bg-orange-950/20 rounded-lg border border-orange-800/30">
                    <p className="text-sm text-orange-400 font-semibold mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center">🤖</span>
                      Kotlin / Android
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {RULE_TEMPLATES.kotlin.map((template) => (
                        <button
                          key={template.name}
                          onClick={() => setAiPrompt(template.prompt)}
                          className="px-2.5 py-1.5 text-xs bg-orange-900/40 text-orange-200 rounded-lg hover:bg-orange-800/50 transition-all border border-orange-700/40 hover:border-orange-600/50 hover:shadow-lg hover:shadow-orange-900/20"
                          title={template.description}
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Swift / iOS Templates */}
                  <div className="p-3 bg-blue-950/20 rounded-lg border border-blue-800/30">
                    <p className="text-sm text-blue-400 font-semibold mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">🍎</span>
                      Swift / iOS
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {RULE_TEMPLATES.swift.map((template) => (
                        <button
                          key={template.name}
                          onClick={() => setAiPrompt(template.prompt)}
                          className="px-2.5 py-1.5 text-xs bg-blue-900/40 text-blue-200 rounded-lg hover:bg-blue-800/50 transition-all border border-blue-700/40 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/20"
                          title={template.description}
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-3 italic text-center">
                    💡 Click a template to populate the AI prompt, then click Generate to create the rule
                  </p>
                </div>

                {/* Manual Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRule.name || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Rule name"
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Severity
                    </label>
                    <select
                      value={newRule.severity || 'warning'}
                      onChange={(e) => setNewRule(prev => ({ ...prev, severity: e.target.value as Severity }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="error">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newRule.description || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what this rule detects"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Pattern (RegExp) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRule.pattern || ''}
                      onChange={(e) => {
                        setNewRule(prev => ({ ...prev, pattern: e.target.value }));
                        if (e.target.value) {
                          const validation = validatePattern(e.target.value);
                          setPatternError(validation.valid ? null : validation.error || 'Invalid pattern');
                        } else {
                          setPatternError(null);
                        }
                      }}
                      placeholder="Regular expression pattern"
                      className={`w-full px-3 py-2 bg-slate-800/50 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none font-mono ${
                        patternError ? 'border-red-500/50' : 'border-slate-600/50 focus:border-purple-500/50'
                      }`}
                    />
                    {patternError && (
                      <p className="text-xs text-red-400 mt-1">{patternError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Pattern Flags
                    </label>
                    <input
                      type="text"
                      value={newRule.patternFlags || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, patternFlags: e.target.value }))}
                      placeholder="g, i, m"
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRule.message || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Message shown when rule matches"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Why it's bad
                  </label>
                  <textarea
                    value={newRule.whyBad || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, whyBad: e.target.value }))}
                    placeholder="Explain why this pattern is problematic"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Suggestion
                  </label>
                  <textarea
                    value={newRule.suggestion || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, suggestion: e.target.value }))}
                    placeholder="How to fix this issue"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={newRule.category || 'custom'}
                      onChange={(e) => setNewRule(prev => ({ ...prev, category: e.target.value as CustomRule['category'] }))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="security">Security</option>
                      <option value="performance">Performance</option>
                      <option value="style">Style</option>
                      <option value="best-practice">Best Practice</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Languages
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                      {ALL_LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          onClick={() => {
                            const current = newRule.languages || [];
                            if (current.includes(lang)) {
                              setNewRule(prev => ({ ...prev, languages: current.filter(l => l !== lang) }));
                            } else {
                              setNewRule(prev => ({ ...prev, languages: [...current, lang] }));
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-xs transition-colors ${
                            (newRule.languages || []).includes(lang)
                              ? 'bg-purple-600/50 text-white'
                              : 'bg-slate-700/50 text-slate-400 hover:text-white'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={cn(
                "sticky bottom-0 border-t p-4 flex justify-end gap-2",
                isDark 
                  ? "bg-slate-900 border-slate-700/50" 
                  : "bg-white border-gray-200"
              )}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={cn(
                    "px-4 py-2 rounded-lg transition-colors",
                    isDark 
                      ? "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRule}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium hover:from-purple-500 hover:to-fuchsia-500 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}


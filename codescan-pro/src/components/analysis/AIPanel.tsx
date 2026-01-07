/**
 * Advanced AI Panel with Deep Code Comprehension
 * Features: Analysis, Improve, Optimize, Chat with RAG + Code Understanding
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileCode,
  Lightbulb,
  Wand2,
  MessageSquare,
  Send,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Code2,
  Download,
  Brain,
  Target,
  Shield,
  Gauge,
  Eye,
  ClipboardCopy,
  ArrowRight,
  FileText,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { streamAIResponse } from '../../lib/ai/groqService';
import { buildRAGContext, generateRAGPrompt, generateChatPrompt } from '../../lib/ai/ragSystem';
import { comprehendCode, generateAdvancedOptimizationPrompt } from '../../lib/ai/codeComprehension';
import { runAdvancedDetection, applyAutoFixes, passesSecurityAudit } from '../../lib/analyzers/advancedDetector';
import { getAvailableKeysCount } from '../../lib/ai/groqConfig';
import type { AnalysisResult } from '../../types/analysis';

type AIMode = 'analysis' | 'improve' | 'optimize' | 'architect' | 'chat';

interface AIPanelProps {
  result: AnalysisResult;
  sourceCode: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Interface for parsed changes
interface ParsedChange {
  title: string;
  description: string;
  type: 'added' | 'removed' | 'modified' | 'improvement';
}

export function AIPanel({ result, sourceCode }: AIPanelProps) {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<AIMode>('analysis');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [optimizedCode, setOptimizedCode] = useState('');
  const [parsedChanges, setParsedChanges] = useState<ParsedChange[]>([]);
  const [qualityImprovements, setQualityImprovements] = useState<string[]>([]);
  const [verificationResult, setVerificationResult] = useState<{
    passed: boolean;
    score: number;
    issues: number;
    improvements: { security: number; performance: number; readability: number };
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showOptimizedCode, setShowOptimizedCode] = useState(true);
  const [analysisDepth, setAnalysisDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [showComprehension, setShowComprehension] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const availableKeys = getAvailableKeysCount();

  // Parse AI response to extract changes
  const parseChangesFromResponse = useCallback((text: string): { changes: ParsedChange[], improvements: string[] } => {
    const changes: ParsedChange[] = [];
    const improvements: string[] = [];
    
    // Pattern to match change descriptions
    const patterns = [
      { regex: /(?:replaced|changed|modified|updated)\s+([^.]+)/gi, type: 'modified' as const },
      { regex: /(?:removed|deleted|eliminated)\s+([^.]+)/gi, type: 'removed' as const },
      { regex: /(?:added|introduced|included|implemented)\s+([^.]+)/gi, type: 'added' as const },
      { regex: /(?:improved|enhanced|optimized)\s+([^.]+)/gi, type: 'improvement' as const },
    ];

    // Extract bullet points and numbered items
    const bulletPoints = text.match(/[-•*]\s*\*?\*?([^*\n]+)\*?\*?/g) || [];
    const numberedItems = text.match(/\d+\.\s*\*?\*?([^*\n]+)\*?\*?/g) || [];
    
    [...bulletPoints, ...numberedItems].forEach(item => {
      const cleanItem = item.replace(/^[-•*\d.]+\s*/, '').replace(/\*+/g, '').trim();
      if (cleanItem.length > 10 && cleanItem.length < 200) {
        let type: ParsedChange['type'] = 'improvement';
        const lowerItem = cleanItem.toLowerCase();
        
        if (lowerItem.includes('removed') || lowerItem.includes('deleted') || lowerItem.includes('eliminated')) {
          type = 'removed';
        } else if (lowerItem.includes('added') || lowerItem.includes('introduced') || lowerItem.includes('implemented')) {
          type = 'added';
        } else if (lowerItem.includes('replaced') || lowerItem.includes('changed') || lowerItem.includes('modified') || lowerItem.includes('updated')) {
          type = 'modified';
        }
        
        changes.push({
          title: cleanItem.split(':')[0] || cleanItem.substring(0, 50),
          description: cleanItem,
          type,
        });
      }
    });

    // Extract quality improvements section
    const qualitySection = text.match(/quality\s*improvements?[\s\S]*?(?=\n\n|\n#|$)/i);
    if (qualitySection) {
      const qualityItems = qualitySection[0].match(/[-•*]\s*([^-•*\n]+)/g) || [];
      qualityItems.forEach(item => {
        const clean = item.replace(/^[-•*]\s*/, '').trim();
        if (clean.length > 5) {
          improvements.push(clean);
        }
      });
    }

    return { changes: changes.slice(0, 10), improvements: improvements.slice(0, 5) };
  }, []);

  // Copy optimized code to clipboard
  const handleCopyCode = useCallback(async () => {
    if (!optimizedCode) return;
    await navigator.clipboard.writeText(optimizedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [optimizedCode]);

  // Get code comprehension
  const comprehension = comprehendCode(sourceCode, result);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, response]);

  // Generate AI Analysis with RAG + Comprehension
  const handleAnalysis = useCallback(async () => {
    setIsLoading(true);
    setResponse('');

    try {
      const ragContext = buildRAGContext(sourceCode, result.language, result, analysisDepth);
      
      // Enhanced prompt with comprehension
      const comprehensionContext = `
## Deep Code Understanding

**Summary**: ${comprehension.summary}

**Purpose**: ${comprehension.purpose} (${Math.round(comprehension.purposeConfidence * 100)}% confidence)

**Architecture**:
- Layer: ${comprehension.layer}
- Patterns: ${comprehension.patterns.join(', ')}
- Business Domain: ${comprehension.semanticAnalysis.businessDomain}

**Quality Scores**:
- Readability: ${comprehension.qualityIndicators.readability}/100
- Maintainability: ${comprehension.qualityIndicators.maintainability}/100
- Security: ${comprehension.qualityIndicators.securityScore}/100
- Performance: ${comprehension.qualityIndicators.performanceScore}/100

**Data Flow**:
- Inputs: ${comprehension.dataFlow.inputs.map(i => i.name).join(', ') || 'None'}
- Outputs: ${comprehension.dataFlow.outputs.map(o => o.name).join(', ') || 'None'}
- Side Effects: ${comprehension.dataFlow.sideEffects.join(', ') || 'None'}

**Key Operations**: ${comprehension.semanticAnalysis.keyOperations.join(', ') || 'None'}

**Error Scenarios to Handle**: ${comprehension.semanticAnalysis.errorScenarios.join(', ') || 'Standard'}

**Edge Cases**: ${comprehension.semanticAnalysis.edgeCases.join(', ') || 'Standard'}
`;

      const basePrompt = generateRAGPrompt(sourceCode, ragContext, 'analyze');
      const enhancedPrompt = comprehensionContext + '\n\n' + basePrompt;

      await streamAIResponse(
        [{ role: 'user', content: enhancedPrompt }],
        (chunk) => setResponse(prev => prev + chunk),
        () => setIsLoading(false),
        (error) => {
          setResponse(`Error: ${error}`);
          setIsLoading(false);
        }
      );
    } catch (error) {
      setResponse(`Error: ${error}`);
      setIsLoading(false);
    }
  }, [sourceCode, result, analysisDepth, comprehension]);

  // Generate Improvement Suggestions with deep context
  const handleImprove = useCallback(async () => {
    setIsLoading(true);
    setResponse('');

    try {
      const ragContext = buildRAGContext(sourceCode, result.language, result, analysisDepth);
      
      // Add optimization opportunities
      const opportunitiesContext = comprehension.optimizationOpportunities.length > 0
        ? `\n\n## Identified Optimization Opportunities\n${comprehension.optimizationOpportunities.map((op, i) => 
            `${i + 1}. **[${op.type.toUpperCase()}]** ${op.description}\n   - Impact: ${op.impact}\n   - Effort: ${op.effort}\n   - Suggestion: ${op.suggestion}${op.codeExample ? `\n   - Example:\n\`\`\`\n${op.codeExample}\n\`\`\`` : ''}`
          ).join('\n\n')}`
        : '';

      const basePrompt = generateRAGPrompt(sourceCode, ragContext, 'improve');
      const enhancedPrompt = basePrompt + opportunitiesContext;

      await streamAIResponse(
        [{ role: 'user', content: enhancedPrompt }],
        (chunk) => setResponse(prev => prev + chunk),
        () => setIsLoading(false),
        (error) => {
          setResponse(`Error: ${error}`);
          setIsLoading(false);
        }
      );
    } catch (error) {
      setResponse(`Error: ${error}`);
      setIsLoading(false);
    }
  }, [sourceCode, result, analysisDepth, comprehension]);

  // Generate Optimized Code with full comprehension
  const handleOptimize = useCallback(async () => {
    setIsLoading(true);
    setResponse('');
    setOptimizedCode('');
    setVerificationResult(null);
    setParsedChanges([]);
    setQualityImprovements([]);

    try {
      // Use advanced optimization prompt with full comprehension
      const prompt = generateAdvancedOptimizationPrompt(sourceCode, comprehension, result);

      let fullResponse = '';
      await streamAIResponse(
        [{ role: 'user', content: prompt }],
        (chunk) => {
          fullResponse += chunk;
          setResponse(fullResponse);
        },
        () => {
          // Extract code from response
          const codeMatch = fullResponse.match(/```(?:\w+)?\n([\s\S]*?)```/);
          if (codeMatch) {
            const extractedCode = codeMatch[1].trim();
            setOptimizedCode(extractedCode);
            
            // Parse changes from response
            const { changes, improvements } = parseChangesFromResponse(fullResponse);
            setParsedChanges(changes);
            setQualityImprovements(improvements);
            
            // Verify the optimized code
            const verification = passesSecurityAudit(extractedCode, result.language);
            const { issues } = runAdvancedDetection(extractedCode, result.language);
            const newComprehension = comprehendCode(extractedCode, { ...result, issues: [] });
            
            setVerificationResult({
              passed: verification.passed && issues.length < result.issues.length,
              score: verification.score,
              issues: issues.length,
              improvements: {
                security: newComprehension.qualityIndicators.securityScore - comprehension.qualityIndicators.securityScore,
                performance: newComprehension.qualityIndicators.performanceScore - comprehension.qualityIndicators.performanceScore,
                readability: newComprehension.qualityIndicators.readability - comprehension.qualityIndicators.readability,
              },
            });
          }
          setIsLoading(false);
        },
        (error) => {
          setResponse(`Error: ${error}`);
          setIsLoading(false);
        }
      );
    } catch (error) {
      setResponse(`Error: ${error}`);
      setIsLoading(false);
    }
  }, [sourceCode, result, comprehension, parseChangesFromResponse]);

  // Quick Auto-Fix
  const handleQuickFix = useCallback(() => {
    const { issues } = runAdvancedDetection(sourceCode, result.language);
    const fixedCode = applyAutoFixes(sourceCode, issues);
    setOptimizedCode(fixedCode);
    
    // Verify
    const verification = passesSecurityAudit(fixedCode, result.language);
    const newIssues = runAdvancedDetection(fixedCode, result.language);
    const newComprehension = comprehendCode(fixedCode, { ...result, issues: [] });
    
    setVerificationResult({
      passed: verification.passed,
      score: verification.score,
      issues: newIssues.issues.length,
      improvements: {
        security: newComprehension.qualityIndicators.securityScore - comprehension.qualityIndicators.securityScore,
        performance: newComprehension.qualityIndicators.performanceScore - comprehension.qualityIndicators.performanceScore,
        readability: newComprehension.qualityIndicators.readability - comprehension.qualityIndicators.readability,
      },
    });
  }, [sourceCode, result.language, comprehension]);

  // Senior Mobile Architect Review
  const handleArchitectReview = useCallback(async () => {
    setIsLoading(true);
    setResponse('');

    const isSwift = result.language === 'swift';
    const isKotlin = result.language === 'kotlin';
    const platform = isSwift ? 'iOS (SwiftUI)' : isKotlin ? 'Android (Kotlin)' : 'Cross-platform';

    const architectPrompt = `You are a Principal Mobile Architect (iOS SwiftUI + Android Kotlin) with 10–15 years of production experience, responsible for blocking PRs that can cause crashes, leaks, or long-term maintenance failure.

You must reason about intent, ownership, lifecycle, and architecture, not just syntax or rules.

🔍 Core Evaluation Principles (MANDATORY)

1️⃣ Context-Aware Analysis (Critical)
- Infer developer intent from surrounding code
- Understand state ownership (who creates it, who mutates it, who observes it)
- Detect implicit contracts (assumptions that can crash at runtime)
- Do NOT flag something as an issue unless it is contextually unsafe

2️⃣ Lifecycle & Runtime Safety (BLOCKER LEVEL)
${isSwift ? `
iOS (SwiftUI):
- Validate correct usage of: @State, @StateObject, @ObservedObject, @EnvironmentObject
- Detect: Conditional or unsafe @StateObject initialization
- @EnvironmentObject usage without guaranteed injection
- Views owning business logic or side effects
- UIKit / NotificationCenter breaking SwiftUI lifecycle
` : ''}
${isKotlin ? `
Android (Kotlin / Compose):
- Validate correct usage of: ViewModel, StateFlow, LiveData, remember, LaunchedEffect
- Detect: ViewModel recreation risks
- State held in Composables instead of ViewModel
- Lifecycle-unsafe side effects
` : ''}

3️⃣ Architecture & Ownership (Senior-Only)
Identify violations that scale badly, including:
- Business logic inside Views / Composables
- Analytics, navigation, or networking triggered directly from UI
- Overloaded UI components with excessive state
- Hidden dependencies (singletons, globals, static access)
- Tight coupling between UI and domain logic

4️⃣ Memory & Side-Effect Control
Flag only real risks, such as:
- Observers without removal
- NotificationCenter / BroadcastReceiver misuse
- Static references to UI or lifecycle-bound objects
- Side effects triggered on every recomposition / render

🚫 What NOT to Report (Strict)
❌ Do NOT report:
- Magic numbers
- var vs let
- Formatting / naming
- Purely stylistic lint issues
- Framework-approved patterns

Unless they directly contribute to: Crashes, Memory leaks, Architectural decay

📌 Severity Rules (Very Important)
- **High (Block PR)** → Crash risk, lifecycle violation, memory leak, broken architecture
- **Medium** → Will cause scaling, testing, or maintenance failure
- **Low** → Only if it meaningfully impacts long-term correctness

If an issue is not PR-blocking, do NOT mark it High.

📤 Output Format (MANDATORY)

For EACH issue found, use this EXACT format:

---
**Platform:** ${platform}
**Severity:** [High/Medium/Low]
**Category:** [Runtime Crash / Lifecycle Violation / Memory Leak / Architectural Violation / Side-Effect Mismanagement / Anti-pattern]
**Issue Summary:** [One line description]
**Why Risky:** [Senior reasoning - explain the production impact]
**Correct Best Practice:** [Official platform guidance]
**Would Block PR:** [Yes/No]
---

🧠 Final Rule (Non-Negotiable)
Only report issues that a Staff / Principal Engineer would block or demand refactoring for.
Ignore everything else.

## Code to Review:

\`\`\`${result.language}
${sourceCode}
\`\`\`

Now analyze this code as a Principal Mobile Architect. Be thorough but only flag real, impactful issues.`;

    try {
      await streamAIResponse(
        [{ role: 'user', content: architectPrompt }],
        (chunk) => setResponse(prev => prev + chunk),
        () => setIsLoading(false),
        (error) => {
          setResponse(`Error: ${error}`);
          setIsLoading(false);
        }
      );
    } catch (error) {
      setResponse(`Error: ${error}`);
      setIsLoading(false);
    }
  }, [sourceCode, result.language]);

  // Chat with AI (context-aware) - uses optimized RAG prompt
  const handleChat = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      // Build RAG context for chat
      const ragContext = buildRAGContext(sourceCode, result.language, result, 'standard');
      
      // Generate optimized chat prompt
      const chatPrompt = generateChatPrompt(
        sourceCode,
        ragContext,
        chatInput,
        chatMessages.map(m => ({ role: m.role, content: m.content }))
      );

      let assistantResponse = '';
      await streamAIResponse(
        [{ role: 'user', content: chatPrompt }],
        (chunk) => {
          assistantResponse += chunk;
          setResponse(assistantResponse);
        },
        () => {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: assistantResponse,
            timestamp: new Date(),
          }]);
          setResponse('');
          setIsLoading(false);
        },
        (err) => {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `❌ Error: ${err}\n\nPlease try again or rephrase your question.`,
            timestamp: new Date(),
          }]);
          setIsLoading(false);
        }
      );
    } catch (error) {
      setIsLoading(false);
    }
  }, [chatInput, chatMessages, sourceCode, result, isLoading]);

  // Copy code to clipboard
  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Download optimized code
  const handleDownload = useCallback(() => {
    if (!optimizedCode) return;
    const blob = new Blob([optimizedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-code.${result.language === 'typescript' ? 'ts' : 'js'}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [optimizedCode, result.language]);

  // Mode tabs
  const modes = [
    { id: 'analysis', label: 'Analysis', icon: FileCode, description: 'Deep code analysis' },
    { id: 'improve', label: 'Improve', icon: Lightbulb, description: 'Get suggestions' },
    { id: 'optimize', label: 'Optimize', icon: Wand2, description: 'Auto-fix code' },
    { id: 'architect', label: 'Architect', icon: Shield, description: 'Senior mobile review' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, description: 'Ask questions' },
  ] as const;

  // Quality score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-neon-green';
    if (score >= 60) return 'text-cyber-500';
    if (score >= 40) return 'text-neon-yellow';
    return 'text-neon-red';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-neon-green/20';
    if (score >= 60) return 'bg-cyber-500/20';
    if (score >= 40) return 'bg-neon-yellow/20';
    return 'bg-neon-red/20';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-cyber-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-obsidian-100">AI Assistant</h3>
            <p className="text-xs text-obsidian-500">Deep Code Comprehension</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComprehension(!showComprehension)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors',
              showComprehension 
                ? 'bg-cyber-500/20 text-cyber-500' 
                : 'bg-obsidian-800 text-obsidian-400 hover:text-obsidian-200'
            )}
          >
            <Eye className="w-3 h-3" />
            Context
          </button>
          <span className="text-xs text-obsidian-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            {availableKeys}/{availableKeys} keys
          </span>
        </div>
      </div>

      {/* Code Comprehension Panel */}
      <AnimatePresence>
        {showComprehension && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-obsidian-900/50 border border-obsidian-800 space-y-3">
              {/* Summary */}
              <div>
                <p className="text-xs text-obsidian-400 mb-1">Code Summary</p>
                <p className="text-sm text-obsidian-200">{comprehension.summary}</p>
              </div>

              {/* Purpose & Architecture */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-obsidian-400 mb-1">Purpose</p>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyber-500" />
                    <span className="text-sm text-obsidian-200 capitalize">{comprehension.purpose.replace(/-/g, ' ')}</span>
                    <span className="text-xs text-obsidian-500">({Math.round(comprehension.purposeConfidence * 100)}%)</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-obsidian-400 mb-1">Architecture</p>
                  <span className="text-sm text-obsidian-200 capitalize">{comprehension.layer} Layer</span>
                </div>
              </div>

              {/* Quality Scores */}
              <div>
                <p className="text-xs text-obsidian-400 mb-2">Quality Scores</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Security', value: comprehension.qualityIndicators.securityScore, icon: Shield },
                    { label: 'Performance', value: comprehension.qualityIndicators.performanceScore, icon: Zap },
                    { label: 'Readability', value: comprehension.qualityIndicators.readability, icon: Eye },
                    { label: 'Maintain', value: comprehension.qualityIndicators.maintainability, icon: Gauge },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className={cn('p-2 rounded-lg text-center', getScoreBg(value))}>
                      <Icon className={cn('w-4 h-4 mx-auto mb-1', getScoreColor(value))} />
                      <p className={cn('text-lg font-bold', getScoreColor(value))}>{value}</p>
                      <p className="text-[10px] text-obsidian-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patterns & Domain */}
              <div className="flex flex-wrap gap-2">
                {comprehension.patterns.filter(p => p !== 'none').map(pattern => (
                  <span key={pattern} className="px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple text-xs">
                    {pattern}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded-full bg-cyber-500/20 text-cyber-500 text-xs">
                  {comprehension.semanticAnalysis.businessDomain}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue text-xs">
                  {comprehension.semanticAnalysis.technicalDomain}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 bg-obsidian-900/50 rounded-xl mb-4">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setMode(id);
              setResponse('');
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              mode === id
                ? 'bg-obsidian-800 text-obsidian-100 shadow-lg'
                : 'text-obsidian-400 hover:text-obsidian-200'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Analysis Depth Selector */}
      {(mode === 'analysis' || mode === 'improve') && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-obsidian-400">Depth:</span>
          {(['quick', 'standard', 'deep'] as const).map(depth => (
            <button
              key={depth}
              onClick={() => setAnalysisDepth(depth)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                analysisDepth === depth
                  ? 'bg-cyber-500 text-obsidian-950'
                  : 'bg-obsidian-800 text-obsidian-400 hover:text-obsidian-200'
              )}
            >
              {depth.charAt(0).toUpperCase() + depth.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Analysis Mode */}
          {mode === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              {!response && !isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyber-500/20 to-neon-purple/20 flex items-center justify-center mb-4">
                    <Brain className="w-8 h-8 text-cyber-500" />
                  </div>
                  <h4 className="text-lg font-medium text-obsidian-200 mb-2">
                    Deep AI Analysis
                  </h4>
                  <p className="text-sm text-obsidian-400 mb-6 max-w-sm">
                    Get comprehensive analysis with code comprehension, security insights, and optimization recommendations.
                  </p>
                  <Button onClick={handleAnalysis} leftIcon={<Sparkles className="w-4 h-4" />}>
                    Generate Analysis
                  </Button>
                </div>
              ) : (
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  {isLoading && !response && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 text-cyber-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-cyber-500" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-obsidian-300 font-medium">Analyzing your code...</p>
                      <p className="mt-1 text-xs text-obsidian-500">This may take a few seconds</p>
                    </div>
                  )}
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    isDark ? "prose-invert" : "prose-slate",
                    // Enhanced styling for better readability
                    "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-cyber-500 [&_h1]:border-b [&_h1]:border-obsidian-700 [&_h1]:pb-2 [&_h1]:mb-4",
                    "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-neon-purple [&_h2]:mt-6 [&_h2]:mb-3",
                    "[&_h3]:text-base [&_h3]:font-medium [&_h3]:text-obsidian-200 [&_h3]:mt-4 [&_h3]:mb-2",
                    "[&_ul]:space-y-2 [&_ul]:my-3",
                    "[&_ol]:space-y-2 [&_ol]:my-3",
                    "[&_li]:text-obsidian-300 [&_li]:leading-relaxed",
                    "[&_p]:text-obsidian-300 [&_p]:leading-relaxed [&_p]:my-2",
                    "[&_strong]:text-obsidian-100 [&_strong]:font-semibold",
                    "[&_blockquote]:border-l-4 [&_blockquote]:border-cyber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-obsidian-400",
                    "[&_hr]:border-obsidian-700 [&_hr]:my-4"
                  )}>
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="relative group my-4">
                              <div className={cn(
                                "absolute top-2 right-2 px-2 py-1 rounded text-xs font-mono opacity-70",
                                isDark ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-600"
                              )}>
                                {match[1]}
                              </div>
                              <SyntaxHighlighter
                                style={isDark ? oneDark : oneLight}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  borderRadius: '12px',
                                  padding: '16px',
                                  fontSize: '13px',
                                }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={cn(
                              className,
                              "px-1.5 py-0.5 rounded text-sm font-mono",
                              isDark ? "bg-slate-800 text-cyan-400" : "bg-gray-100 text-blue-600"
                            )} {...props}>
                              {children}
                            </code>
                          );
                        },
                        // Custom heading styles
                        h1: ({ children }) => (
                          <h1 className="flex items-center gap-2 text-xl font-bold text-cyber-500 border-b border-obsidian-700 pb-2 mb-4">
                            <FileCode className="w-5 h-5" />
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="flex items-center gap-2 text-lg font-semibold text-neon-purple mt-6 mb-3">
                            <Target className="w-4 h-4" />
                            {children}
                          </h2>
                        ),
                        // Custom list rendering for better visual hierarchy
                        ul: ({ children }) => (
                          <ul className="space-y-2 my-3 ml-2">{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className="flex items-start gap-2 text-obsidian-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyber-500 mt-2 flex-shrink-0" />
                            <span className="flex-1">{children}</span>
                          </li>
                        ),
                        // Enhanced blockquote
                        blockquote: ({ children }) => (
                          <blockquote className={cn(
                            "border-l-4 border-cyber-500 pl-4 py-2 my-4 rounded-r-lg",
                            isDark ? "bg-slate-800/50" : "bg-gray-100"
                          )}>
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {response}
                    </ReactMarkdown>
                  </div>
                  {isLoading && response && (
                    <span className="inline-block w-2 h-4 bg-cyber-500 animate-pulse ml-1" />
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Improve Mode */}
          {mode === 'improve' && (
            <motion.div
              key="improve"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              {!response && !isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-yellow/20 to-neon-orange/20 flex items-center justify-center mb-4">
                    <Lightbulb className="w-8 h-8 text-neon-yellow" />
                  </div>
                  <h4 className="text-lg font-medium text-obsidian-200 mb-2">
                    Smart Improvements
                  </h4>
                  <p className="text-sm text-obsidian-400 mb-4 max-w-sm">
                    Get targeted suggestions based on {comprehension.optimizationOpportunities.length} identified opportunities.
                  </p>
                  {comprehension.optimizationOpportunities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6 justify-center">
                      {comprehension.optimizationOpportunities.slice(0, 3).map((op, i) => (
                        <span key={i} className={cn(
                          'px-2 py-1 rounded-lg text-xs',
                          op.type === 'security' ? 'bg-neon-red/20 text-neon-red' :
                          op.type === 'performance' ? 'bg-neon-yellow/20 text-neon-yellow' :
                          'bg-cyber-500/20 text-cyber-500'
                        )}>
                          {op.type}: {op.description.slice(0, 30)}...
                        </span>
                      ))}
                    </div>
                  )}
                  <Button onClick={handleImprove} leftIcon={<Lightbulb className="w-4 h-4" />}>
                    Get Suggestions
                  </Button>
                </div>
              ) : (
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  {isLoading && !response && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 text-neon-yellow animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lightbulb className="w-5 h-5 text-neon-yellow" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-obsidian-300 font-medium">Generating suggestions...</p>
                      <p className="mt-1 text-xs text-obsidian-500">Finding improvement opportunities</p>
                    </div>
                  )}
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    isDark ? "prose-invert" : "prose-slate",
                    "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-neon-yellow [&_h1]:border-b [&_h1]:border-obsidian-700 [&_h1]:pb-2 [&_h1]:mb-4",
                    "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-neon-orange [&_h2]:mt-6 [&_h2]:mb-3",
                    "[&_h3]:text-base [&_h3]:font-medium [&_h3]:text-obsidian-200 [&_h3]:mt-4 [&_h3]:mb-2"
                  )}>
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="relative group my-4">
                              <div className={cn(
                                "absolute top-2 right-2 px-2 py-1 rounded text-xs font-mono opacity-70",
                                isDark ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-600"
                              )}>
                                {match[1]}
                              </div>
                              <SyntaxHighlighter
                                style={isDark ? oneDark : oneLight}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  borderRadius: '12px',
                                  padding: '16px',
                                  fontSize: '13px',
                                }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={cn(
                              className,
                              "px-1.5 py-0.5 rounded text-sm font-mono",
                              isDark ? "bg-slate-800 text-yellow-400" : "bg-gray-100 text-orange-600"
                            )} {...props}>
                              {children}
                            </code>
                          );
                        },
                        h1: ({ children }) => (
                          <h1 className="flex items-center gap-2 text-xl font-bold text-neon-yellow border-b border-obsidian-700 pb-2 mb-4">
                            <Lightbulb className="w-5 h-5" />
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="flex items-center gap-2 text-lg font-semibold text-neon-orange mt-6 mb-3">
                            <Zap className="w-4 h-4" />
                            {children}
                          </h2>
                        ),
                        ul: ({ children }) => (
                          <ul className="space-y-2 my-3 ml-2">{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className="flex items-start gap-2 text-obsidian-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow mt-2 flex-shrink-0" />
                            <span className="flex-1">{children}</span>
                          </li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className={cn(
                            "border-l-4 border-neon-yellow pl-4 py-2 my-4 rounded-r-lg",
                            isDark ? "bg-yellow-900/20" : "bg-yellow-50"
                          )}>
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {response}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Optimize Mode */}
          {mode === 'optimize' && (
            <motion.div
              key="optimize"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              {!optimizedCode && !isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-green/20 to-cyber-500/20 flex items-center justify-center mb-4">
                    <Wand2 className="w-8 h-8 text-neon-green" />
                  </div>
                  <h4 className="text-lg font-medium text-obsidian-200 mb-2">
                    Generate Production-Ready Code
                  </h4>
                  <p className="text-sm text-obsidian-400 mb-2 max-w-sm">
                    AI will generate fully optimized code that fixes all {result.issues.length} issues and applies best practices.
                  </p>
                  <p className="text-xs text-obsidian-500 mb-6">
                    Understanding: {comprehension.purpose} | {comprehension.semanticAnalysis.businessDomain}
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleQuickFix} 
                      variant="secondary"
                      leftIcon={<Zap className="w-4 h-4" />}
                    >
                      Quick Fix
                    </Button>
                    <Button 
                      onClick={handleOptimize} 
                      leftIcon={<Wand2 className="w-4 h-4" />}
                    >
                      AI Optimize
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Verification Status */}
                  {verificationResult && (
                    <div className={cn(
                      'p-4 rounded-xl border',
                      verificationResult.passed
                        ? 'bg-neon-green/10 border-neon-green/30'
                        : 'bg-neon-yellow/10 border-neon-yellow/30'
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {verificationResult.passed ? (
                            <CheckCircle className="w-6 h-6 text-neon-green" />
                          ) : (
                            <AlertTriangle className="w-6 h-6 text-neon-yellow" />
                          )}
                          <div>
                            <p className="font-medium text-obsidian-100">
                              {verificationResult.passed ? 'Optimization Successful' : 'Partial Optimization'}
                            </p>
                            <p className="text-sm text-obsidian-400">
                              Security: {verificationResult.score}/100 • {verificationResult.issues} issues remaining
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleCopyCode}
                            leftIcon={codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          >
                            {codeCopied ? 'Copied!' : 'Copy'}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleDownload}
                            leftIcon={<Download className="w-3 h-3" />}
                          >
                            Download
                          </Button>
                        </div>
                      </div>

                      {/* Improvement Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Security', value: verificationResult.improvements.security, icon: Shield },
                          { label: 'Performance', value: verificationResult.improvements.performance, icon: Zap },
                          { label: 'Readability', value: verificationResult.improvements.readability, icon: Eye },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className="p-2 rounded-lg bg-obsidian-900/50 text-center">
                            <Icon className="w-4 h-4 mx-auto mb-1 text-obsidian-400" />
                            <p className={cn(
                              'text-sm font-bold',
                              value > 0 ? 'text-neon-green' : value < 0 ? 'text-neon-red' : 'text-obsidian-400'
                            )}>
                              {value > 0 ? '+' : ''}{value}
                            </p>
                            <p className="text-[10px] text-obsidian-500">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optimized Code Section */}
                  {optimizedCode && (
                    <div className="flex-1 min-h-0">
                      <div className="flex items-center justify-between p-3 bg-obsidian-800 rounded-t-xl border border-obsidian-700">
                        <button
                          onClick={() => setShowOptimizedCode(!showOptimizedCode)}
                          className="flex items-center gap-2"
                        >
                          <Code2 className="w-4 h-4 text-neon-green" />
                          <span className="font-medium text-obsidian-200">Optimized Code</span>
                          <span className="text-xs text-obsidian-500 bg-obsidian-700 px-2 py-0.5 rounded">
                            {optimizedCode.split('\n').length} lines
                          </span>
                          {showOptimizedCode ? (
                            <ChevronUp className="w-4 h-4 text-obsidian-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-obsidian-400" />
                          )}
                        </button>
                        <button
                          onClick={handleCopyCode}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            codeCopied 
                              ? "bg-neon-green/20 text-neon-green" 
                              : "bg-obsidian-700 text-obsidian-300 hover:bg-obsidian-600 hover:text-white"
                          )}
                        >
                          {codeCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardCopy className="w-3.5 h-3.5" />
                              Copy Code
                            </>
                          )}
                        </button>
                      </div>
                      {showOptimizedCode && (
                        <div className="border border-t-0 border-obsidian-700 rounded-b-xl overflow-hidden relative">
                          <SyntaxHighlighter
                            style={isDark ? oneDark : oneLight}
                            language={result.language}
                            customStyle={{
                              margin: 0,
                              borderRadius: 0,
                              maxHeight: '300px',
                              fontSize: '13px',
                            }}
                            showLineNumbers
                          >
                            {optimizedCode}
                          </SyntaxHighlighter>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <Loader2 className="w-8 h-8 text-neon-green animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Wand2 className="w-4 h-4 text-neon-green" />
                          </div>
                        </div>
                        <span className="text-obsidian-400 text-sm">Generating optimized code...</span>
                        <span className="text-obsidian-500 text-xs">Applying best practices and fixing issues</span>
                      </div>
                    </div>
                  )}

                  {/* Parsed Changes - Readable Format */}
                  {parsedChanges.length > 0 && !isLoading && (
                    <div className="bg-obsidian-900/50 rounded-xl border border-obsidian-700/50 overflow-hidden">
                      <div className="p-3 border-b border-obsidian-700/50 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyber-500" />
                        <span className="font-medium text-obsidian-200">Changes Made</span>
                        <span className="text-xs bg-cyber-500/20 text-cyber-500 px-2 py-0.5 rounded-full">
                          {parsedChanges.length} changes
                        </span>
                      </div>
                      <div className="p-3 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                        {parsedChanges.map((change, index) => (
                          <div 
                            key={index}
                            className={cn(
                              "flex items-start gap-3 p-2.5 rounded-lg border-l-2",
                              change.type === 'added' && "bg-neon-green/5 border-neon-green",
                              change.type === 'removed' && "bg-neon-red/5 border-neon-red",
                              change.type === 'modified' && "bg-neon-yellow/5 border-neon-yellow",
                              change.type === 'improvement' && "bg-cyber-500/5 border-cyber-500",
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
                              change.type === 'added' && "bg-neon-green/20",
                              change.type === 'removed' && "bg-neon-red/20",
                              change.type === 'modified' && "bg-neon-yellow/20",
                              change.type === 'improvement' && "bg-cyber-500/20",
                            )}>
                              {change.type === 'added' && <span className="text-neon-green text-xs">+</span>}
                              {change.type === 'removed' && <span className="text-neon-red text-xs">−</span>}
                              {change.type === 'modified' && <ArrowRight className="w-3 h-3 text-neon-yellow" />}
                              {change.type === 'improvement' && <Zap className="w-3 h-3 text-cyber-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-obsidian-200 leading-relaxed">
                                {change.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quality Improvements */}
                  {qualityImprovements.length > 0 && !isLoading && (
                    <div className="bg-obsidian-900/50 rounded-xl border border-obsidian-700/50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        <span className="font-medium text-obsidian-200 text-sm">Quality Improvements</span>
                      </div>
                      <div className="space-y-1">
                        {qualityImprovements.map((improvement, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-obsidian-400">
                            <span className="w-1 h-1 rounded-full bg-neon-green flex-shrink-0" />
                            {improvement}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Re-optimize Button */}
                  {optimizedCode && !isLoading && (
                    <Button
                      onClick={handleOptimize}
                      variant="secondary"
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                      className="self-center"
                    >
                      Re-optimize
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Architect Mode - Senior Mobile Review */}
          {mode === 'architect' && (
            <motion.div
              key="architect"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              {!response && !isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-red/20 to-neon-orange/20 flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-neon-red" />
                  </div>
                  <h4 className="text-lg font-medium text-obsidian-200 mb-2">
                    Senior Mobile Architect Review
                  </h4>
                  <p className="text-sm text-obsidian-400 mb-4 max-w-sm">
                    Principal Engineer-level code review for {result.language === 'swift' ? 'iOS SwiftUI' : result.language === 'kotlin' ? 'Android Kotlin' : 'mobile'} code. 
                    Focuses on lifecycle safety, memory leaks, and architectural violations.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-6 text-xs">
                    <span className="px-2 py-1 rounded-full bg-neon-red/10 text-neon-red border border-neon-red/30">
                      Runtime Crashes
                    </span>
                    <span className="px-2 py-1 rounded-full bg-neon-orange/10 text-neon-orange border border-neon-orange/30">
                      Memory Leaks
                    </span>
                    <span className="px-2 py-1 rounded-full bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30">
                      Lifecycle Violations
                    </span>
                    <span className="px-2 py-1 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/30">
                      Architecture Issues
                    </span>
                  </div>
                  <Button onClick={handleArchitectReview} leftIcon={<Shield className="w-4 h-4" />}>
                    Start Architect Review
                  </Button>
                </div>
              ) : (
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  {isLoading && !response && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 text-neon-red animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-neon-red" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-obsidian-300 font-medium">Running Principal Engineer Review...</p>
                      <p className="mt-1 text-xs text-obsidian-500">Analyzing lifecycle, memory, and architecture</p>
                    </div>
                  )}
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    isDark ? "prose-invert" : "prose-slate"
                  )}>
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="relative group my-4">
                              <SyntaxHighlighter
                                style={isDark ? oneDark : oneLight}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  borderRadius: '12px',
                                  padding: '16px',
                                  fontSize: '13px',
                                }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={cn(
                              className,
                              "px-1.5 py-0.5 rounded text-sm font-mono",
                              isDark ? "bg-slate-800 text-red-400" : "bg-gray-100 text-red-600"
                            )} {...props}>
                              {children}
                            </code>
                          );
                        },
                        // Enhanced horizontal rule as issue separator
                        hr() {
                          return (
                            <div className={cn(
                              "my-6 py-2 border-t-2 border-dashed",
                              isDark ? "border-obsidian-600" : "border-gray-300"
                            )}>
                              <div className="flex items-center justify-center -mt-4">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-medium",
                                  isDark ? "bg-obsidian-800 text-obsidian-400" : "bg-gray-100 text-gray-500"
                                )}>
                                  Issue Separator
                                </span>
                              </div>
                            </div>
                          );
                        },
                        // Enhanced strong text for labels with structured card-like display
                        strong({ children }) {
                          const text = String(children);
                          
                          // Platform label
                          if (text.startsWith('Platform:')) {
                            const value = text.replace('Platform:', '').trim();
                            return (
                              <div className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg mb-2",
                                isDark ? "bg-slate-800/50" : "bg-gray-100"
                              )}>
                                <span className="text-xs font-medium text-obsidian-400">Platform</span>
                                <span className="px-2 py-0.5 rounded bg-cyber-500/20 text-cyber-500 text-xs font-semibold">
                                  {value}
                                </span>
                              </div>
                            );
                          }
                          
                          // Severity label
                          if (text.startsWith('Severity:')) {
                            const value = text.replace('Severity:', '').trim().toLowerCase();
                            const severityColors = {
                              high: 'bg-red-500/20 text-red-400 border-red-500/30',
                              medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                              low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                            };
                            const colorClass = severityColors[value as keyof typeof severityColors] || severityColors.medium;
                            return (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-obsidian-400">Severity</span>
                                <span className={cn("px-2 py-0.5 rounded border text-xs font-bold uppercase", colorClass)}>
                                  {value}
                                </span>
                              </div>
                            );
                          }
                          
                          // Category label
                          if (text.startsWith('Category:')) {
                            const value = text.replace('Category:', '').trim();
                            return (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-obsidian-400">Category</span>
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">
                                  {value}
                                </span>
                              </div>
                            );
                          }
                          
                          // Issue Summary - Make it prominent
                          if (text.startsWith('Issue Summary:') || text.startsWith('Issue:')) {
                            const value = text.replace(/^(Issue Summary:|Issue:)/, '').trim();
                            return (
                              <div className={cn(
                                "p-3 rounded-lg border-l-4 border-red-500 mb-3",
                                isDark ? "bg-red-900/10" : "bg-red-50"
                              )}>
                                <span className="text-xs font-medium text-obsidian-400 block mb-1">Issue Summary</span>
                                <span className="text-sm font-semibold text-obsidian-100">{value}</span>
                              </div>
                            );
                          }
                          
                          // Why Risky
                          if (text.startsWith('Why Risky:') || text.startsWith('Why:')) {
                            const value = text.replace(/^(Why Risky:|Why:)/, '').trim();
                            return (
                              <div className={cn(
                                "p-3 rounded-lg mb-3",
                                isDark ? "bg-orange-900/10 border border-orange-500/20" : "bg-orange-50 border border-orange-200"
                              )}>
                                <span className="text-xs font-medium text-orange-400 block mb-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Why This is Risky
                                </span>
                                <span className="text-sm text-obsidian-300">{value}</span>
                              </div>
                            );
                          }
                          
                          // Correct Best Practice
                          if (text.startsWith('Correct Best Practice:') || text.startsWith('Best Practice:')) {
                            const value = text.replace(/^(Correct Best Practice:|Best Practice:)/, '').trim();
                            return (
                              <div className={cn(
                                "p-3 rounded-lg mb-3",
                                isDark ? "bg-green-900/10 border border-green-500/20" : "bg-green-50 border border-green-200"
                              )}>
                                <span className="text-xs font-medium text-green-400 block mb-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Correct Best Practice
                                </span>
                                <span className="text-sm text-obsidian-300">{value}</span>
                              </div>
                            );
                          }
                          
                          // Would Block PR
                          if (text.startsWith('Would Block PR:')) {
                            const value = text.replace('Would Block PR:', '').trim().toLowerCase();
                            const isYes = value.includes('yes');
                            return (
                              <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-medium text-obsidian-400">Would Block PR</span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-xs font-bold",
                                  isYes 
                                    ? "bg-red-500/20 text-red-400" 
                                    : "bg-green-500/20 text-green-400"
                                )}>
                                  {isYes ? '🚫 YES' : '✅ NO'}
                                </span>
                              </div>
                            );
                          }
                          
                          return <strong className="text-obsidian-100">{children}</strong>;
                        },
                      }}
                    >
                      {response}
                    </ReactMarkdown>
                  </div>
                  {isLoading && response && (
                    <span className="inline-block w-2 h-4 bg-neon-red animate-pulse ml-1" />
                  )}
                  
                  {/* Re-run button */}
                  {!isLoading && response && (
                    <div className="mt-4 pt-4 border-t border-obsidian-700/50 flex justify-center">
                      <Button
                        onClick={handleArchitectReview}
                        variant="secondary"
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                      >
                        Re-run Review
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Chat Mode */}
          {mode === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4"
              >
                {chatMessages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-purple/20 to-cyber-500/20 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-neon-purple" />
                    </div>
                    <h4 className="text-lg font-medium text-obsidian-200 mb-2">
                      Context-Aware Chat
                    </h4>
                    <p className="text-sm text-obsidian-400 mb-6 max-w-sm">
                      Ask about your {comprehension.purpose.replace(/-/g, ' ')} code. I understand its structure and purpose.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        `Why is line ${result.issues[0]?.location.line || 1} a problem?`,
                        'How can I improve security?',
                        `Explain the ${comprehension.semanticAnalysis.keyOperations[0]?.split(':')[1] || 'main'} function`,
                      ].map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => setChatInput(suggestion)}
                          className="px-3 py-1.5 rounded-lg bg-obsidian-800 text-xs text-obsidian-300 hover:text-obsidian-100 hover:bg-obsidian-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        message.role === 'user'
                          ? 'bg-cyber-500 text-white rounded-br-sm'
                          : 'bg-obsidian-800 text-obsidian-100 rounded-bl-sm'
                      )}
                    >
                      <div className={cn("prose prose-sm max-w-none", message.role === 'user' ? "prose-invert" : isDark ? "prose-invert" : "prose-slate")}>
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={isDark ? oneDark : oneLight}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ fontSize: '12px' }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={cn(className, message.role === 'user' && 'bg-cyber-600')} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Streaming Response */}
                {isLoading && response && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-obsidian-800 text-obsidian-100 px-4 py-3">
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{response}</ReactMarkdown>
                      </div>
                      <span className="inline-block w-2 h-4 bg-cyber-500 animate-pulse ml-1" />
                    </div>
                  </div>
                )}

                {/* Loading Indicator */}
                {isLoading && !response && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-obsidian-800 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-cyber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-cyber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChat();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your code..."
                  className="flex-1 px-4 py-2 rounded-xl bg-obsidian-800 border border-obsidian-700 text-obsidian-100 placeholder-obsidian-500 focus:outline-none focus:border-cyber-500 transition-colors"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!chatInput.trim() || isLoading}
                  className="px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

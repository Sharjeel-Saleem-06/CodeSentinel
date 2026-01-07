/**
 * Issues List Component
 * Displays code issues with severity badges
 * Groups duplicate issues with occurrence count
 * Features severity sub-tabs for easy filtering
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronRight,
  ChevronDown,
  Shield,
  Bug,
  Zap,
  Code,
  Paintbrush,
  Hash,
  Loader2,
  Filter,
  SortAsc,
  AlertOctagon,
  CircleDot,
  LayoutList,
  Building,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { CodeIssue } from '../../types/analysis';
import { useAnalysisStore } from '../../store/analysisStore';

interface IssuesListProps {
  issues: CodeIssue[];
  onIssueClick?: (issue: CodeIssue) => void;
  isLoading?: boolean;
}

// Grouped issue type
interface GroupedIssue {
  key: string;
  title: string;
  description: string;
  severity: CodeIssue['severity'];
  category: string;
  ruleId?: string;
  occurrences: {
    issue: CodeIssue;
    line: number;
  }[];
  suggestion?: string;
  cwe?: CodeIssue['cwe'];
  owasp?: CodeIssue['owasp'];
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-neon-red',
    bg: 'bg-neon-red/10',
    border: 'border-neon-red/30',
    label: 'Critical',
  },
  error: {
    icon: AlertCircle,
    color: 'text-neon-red',
    bg: 'bg-neon-red/10',
    border: 'border-neon-red/30',
    label: 'Error',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-neon-orange',
    bg: 'bg-neon-orange/10',
    border: 'border-neon-orange/30',
    label: 'High',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-neon-yellow',
    bg: 'bg-neon-yellow/10',
    border: 'border-neon-yellow/30',
    label: 'Warning',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-neon-yellow',
    bg: 'bg-neon-yellow/10',
    border: 'border-neon-yellow/30',
    label: 'Medium',
  },
  low: {
    icon: Info,
    color: 'text-neon-blue',
    bg: 'bg-neon-blue/10',
    border: 'border-neon-blue/30',
    label: 'Low',
  },
  info: {
    icon: Info,
    color: 'text-cyber-500',
    bg: 'bg-cyber-500/10',
    border: 'border-cyber-500/30',
    label: 'Info',
  },
};

const categoryConfig: Record<string, { icon: typeof Code; label: string }> = {
  security: { icon: Shield, label: 'Security' },
  bug: { icon: Bug, label: 'Bug' },
  performance: { icon: Zap, label: 'Performance' },
  quality: { icon: Code, label: 'Quality' },
  style: { icon: Paintbrush, label: 'Style' },
  complexity: { icon: Code, label: 'Complexity' },
  deprecated: { icon: AlertTriangle, label: 'Deprecated' },
  'best-practice': { icon: Code, label: 'Best Practice' },
  memory: { icon: Cpu, label: 'Memory' },
  concurrency: { icon: RefreshCw, label: 'Concurrency' },
  swiftui: { icon: Code, label: 'SwiftUI' },
  android: { icon: Code, label: 'Android' },
  coroutines: { icon: Zap, label: 'Coroutines' },
  'null-safety': { icon: Shield, label: 'Null Safety' },
  custom: { icon: Code, label: 'Custom' },
  'state-management': { icon: Code, label: 'State Management' },
  'mvvm-violation': { icon: Building, label: 'MVVM Violation' },
  lifecycle: { icon: RefreshCw, label: 'Lifecycle' },
  'anti-pattern': { icon: AlertTriangle, label: 'Anti-Pattern' },
  architecture: { icon: Building, label: 'Architecture' },
  'runtime-crash': { icon: AlertOctagon, label: 'Runtime Crash' },
  'memory-leak': { icon: Cpu, label: 'Memory Leak' },
  'side-effect': { icon: RefreshCw, label: 'Side Effect' },
  other: { icon: CircleDot, label: 'Other' },
};

// Severity tabs configuration
const severityTabs = [
  { id: 'all', label: 'All', icon: LayoutList, color: 'text-obsidian-400', bg: 'bg-obsidian-700/50' },
  { id: 'critical', label: 'Critical', icon: AlertOctagon, color: 'text-neon-red', bg: 'bg-neon-red/10' },
  { id: 'high', label: 'High', icon: AlertCircle, color: 'text-neon-orange', bg: 'bg-neon-orange/10' },
  { id: 'medium', label: 'Medium', icon: AlertTriangle, color: 'text-neon-yellow', bg: 'bg-neon-yellow/10' },
  { id: 'low', label: 'Low', icon: Info, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
  { id: 'info', label: 'Info', icon: Info, color: 'text-cyber-500', bg: 'bg-cyber-500/10' },
];

// Group duplicate issues together
function groupDuplicateIssues(issues: CodeIssue[]): GroupedIssue[] {
  const groups = new Map<string, GroupedIssue>();
  
  for (const issue of issues) {
    // Create a key based on title and ruleId to identify duplicates
    const key = `${issue.title}-${issue.ruleId || ''}-${issue.category}`;
    
    if (groups.has(key)) {
      const existing = groups.get(key)!;
      existing.occurrences.push({
        issue,
        line: issue.location?.line || 0
      });
    } else {
      groups.set(key, {
        key,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: issue.category,
        ruleId: issue.ruleId,
        occurrences: [{
          issue,
          line: issue.location?.line || 0
        }],
        suggestion: issue.suggestion,
        cwe: issue.cwe,
        owasp: issue.owasp
      });
    }
  }
  
  // Sort occurrences by line number
  for (const group of groups.values()) {
    group.occurrences.sort((a, b) => a.line - b.line);
  }
  
  return Array.from(groups.values());
}

export function IssuesList({ issues, onIssueClick, isLoading }: IssuesListProps) {
  const { selectedIssueId, setSelectedIssueId } = useAnalysisStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'severity' | 'occurrences' | 'category'>('severity');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [activeSeverityTab, setActiveSeverityTab] = useState<string>('all');

  // Normalize severity values (error -> critical, warning -> medium)
  const normalizeIssues = useMemo(() => {
    return issues.map(issue => ({
      ...issue,
      severity: issue.severity === 'error' ? 'critical' : 
                issue.severity === 'warning' ? 'medium' : 
                issue.severity
    }));
  }, [issues]);

  // Group and sort issues
  const groupedIssues = useMemo(() => {
    let filtered = normalizeIssues;
    
    // Filter by severity tab
    if (activeSeverityTab !== 'all') {
      filtered = filtered.filter(i => i.severity === activeSeverityTab);
    }
    
    let grouped = groupDuplicateIssues(filtered);
    
    // Filter by category if selected
    if (filterCategory) {
      grouped = grouped.filter(g => g.category === filterCategory);
    }
    
    // Sort based on selected criteria
    const severityOrder: Record<string, number> = { critical: 0, error: 1, high: 2, warning: 3, medium: 4, low: 5, info: 6 };
    
    if (sortBy === 'severity') {
      grouped.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    } else if (sortBy === 'occurrences') {
      grouped.sort((a, b) => b.occurrences.length - a.occurrences.length);
    } else if (sortBy === 'category') {
      grouped.sort((a, b) => a.category.localeCompare(b.category));
    }
    
    return grouped;
  }, [normalizeIssues, sortBy, filterCategory, activeSeverityTab]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    issues.forEach(i => cats.add(i.category));
    return Array.from(cats);
  }, [issues]);

  const handleIssueClick = (issue: CodeIssue) => {
    setSelectedIssueId(issue.id === selectedIssueId ? null : issue.id);
    onIssueClick?.(issue);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-obsidian-400"
      >
        <Loader2 className="w-12 h-12 text-cyber-500 animate-spin mb-4" />
        <p className="text-lg font-medium text-obsidian-200">Analyzing code...</p>
        <p className="text-sm mt-1">This may take a moment for thorough analysis</p>
      </motion.div>
    );
  }

  if (issues.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-obsidian-400"
      >
        <div className="w-16 h-16 rounded-full bg-neon-green/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-medium text-obsidian-200">No issues found!</p>
        <p className="text-sm mt-1">Your code looks clean. Great job! 🎉</p>
      </motion.div>
    );
  }

  // Count issues by severity for summary (normalized)
  const severityCounts = normalizeIssues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Severity Sub-Tabs */}
      <div className="flex flex-wrap gap-2 p-2 bg-obsidian-900/50 rounded-xl border border-obsidian-800/50">
        {severityTabs.map((tab) => {
          const count = tab.id === 'all' ? normalizeIssues.length : (severityCounts[tab.id] || 0);
          const isActive = activeSeverityTab === tab.id;
          const TabIcon = tab.icon;
          
          // Skip tabs with 0 count (except 'all')
          if (tab.id !== 'all' && count === 0) return null;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSeverityTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive 
                  ? cn(tab.bg, tab.color, 'ring-1 ring-current')
                  : 'text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-800/50'
              )}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs font-bold',
                  isActive ? 'bg-white/20' : 'bg-obsidian-700/50'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats and controls */}
      <div className="flex items-center justify-between pb-3 border-b border-obsidian-800/50">
        <div className="text-xs text-obsidian-400">
          <span className="text-obsidian-200 font-medium">{groupedIssues.length}</span> 
          {activeSeverityTab !== 'all' ? ` ${activeSeverityTab}` : ''} issues
          {normalizeIssues.length !== groupedIssues.length && activeSeverityTab === 'all' && (
            <span> ({normalizeIssues.length} total occurrences)</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="flex items-center gap-1">
            <SortAsc className="w-3 h-3 text-obsidian-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-obsidian-800 border border-obsidian-700 rounded-lg px-2 py-1 text-xs text-obsidian-200 focus:outline-none focus:border-cyber-500"
            >
              <option value="severity">Severity</option>
              <option value="occurrences">Occurrences</option>
              <option value="category">Category</option>
            </select>
          </div>
          
          {/* Category filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-obsidian-500" />
            <select
              value={filterCategory || ''}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="bg-obsidian-800 border border-obsidian-700 rounded-lg px-2 py-1 text-xs text-obsidian-200 focus:outline-none focus:border-cyber-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {categoryConfig[cat]?.label || cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grouped Issues list */}
      <div className="space-y-3">
        {groupedIssues.map((group) => {
          const severity = severityConfig[group.severity] || severityConfig.info;
          const category = categoryConfig[group.category];
          const SeverityIcon = severity?.icon || Info;
          const CategoryIcon = category?.icon || Code;
          const isExpanded = expandedGroups.has(group.key);
          const hasMultipleOccurrences = group.occurrences.length > 1;

          return (
            <div
              key={group.key}
              className={cn(
                'rounded-xl border transition-all duration-200',
                'border-obsidian-800/50 hover:border-obsidian-700',
                'bg-obsidian-900/30 hover:bg-obsidian-800/30'
              )}
            >
              {/* Main issue header */}
              <div 
                onClick={() => toggleGroup(group.key)}
                className="cursor-pointer p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Severity Icon */}
                  <div className={cn('mt-0.5 p-1.5 rounded-lg', severity.bg)}>
                    <SeverityIcon className={cn('w-4 h-4', severity.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-medium text-obsidian-100">
                        {group.title}
                      </h4>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        severity.bg,
                        severity.color
                      )}>
                        {severity.label}
                      </span>
                      {hasMultipleOccurrences && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyber-500/20 text-cyber-400 text-xs font-bold">
                          <Hash className="w-3 h-3" />
                          {group.occurrences.length}x
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-obsidian-400 line-clamp-2">
                      {group.description}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-obsidian-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CategoryIcon className="w-3 h-3" />
                        {category?.label || group.category}
                      </span>
                      {hasMultipleOccurrences ? (
                        <span className="text-cyber-400">
                          Lines: {group.occurrences.map(o => o.line).filter(l => l > 0).join(', ') || 'N/A'}
                        </span>
                      ) : (
                        <span>Line {group.occurrences[0]?.line || '-'}</span>
                      )}
                      {group.ruleId && (
                        <span className="font-mono">{group.ruleId}</span>
                      )}
                    </div>
                  </div>

                  {/* Expand indicator */}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-obsidian-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-obsidian-600" />
                  )}
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <div className="border-t border-obsidian-800/50 pt-4">
                        {/* Occurrences list */}
                        {hasMultipleOccurrences && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-obsidian-300 mb-2 flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {group.occurrences.length} Occurrences
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                              {group.occurrences.map((occurrence, idx) => (
                                <div 
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIssueClick(occurrence.issue);
                                  }}
                                  className={cn(
                                    'p-2 rounded-lg text-xs cursor-pointer transition-colors',
                                    selectedIssueId === occurrence.issue.id
                                      ? 'bg-cyber-500/20 border border-cyber-500/30'
                                      : 'bg-obsidian-800/50 hover:bg-obsidian-700/50'
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-obsidian-200 font-mono">
                                      Line {occurrence.line || 'N/A'}
                                    </span>
                                    {occurrence.issue.codeSnippet && (
                                      <span className="text-obsidian-500 truncate ml-2 max-w-[200px]">
                                        {occurrence.issue.codeSnippet.slice(0, 50)}...
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Single occurrence code snippet */}
                        {!hasMultipleOccurrences && group.occurrences[0]?.issue.codeSnippet && (
                          <div className="bg-obsidian-950 rounded-lg p-3 font-mono text-xs overflow-x-auto mb-3">
                            <code className="text-obsidian-300">{group.occurrences[0].issue.codeSnippet}</code>
                          </div>
                        )}

                        {/* Suggestion */}
                        {group.suggestion && (
                          <div className="flex items-start gap-2 text-sm bg-neon-green/5 rounded-lg p-3 border border-neon-green/20">
                            <span className="text-neon-green text-lg">💡</span>
                            <div>
                              <p className="text-xs font-medium text-neon-green mb-1">Suggestion</p>
                              <p className="text-obsidian-300">{group.suggestion}</p>
                            </div>
                          </div>
                        )}

                        {/* CWE/OWASP references */}
                        {(group.cwe || group.owasp) && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {group.cwe && (
                              <a
                                href={group.cwe.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded bg-obsidian-800 text-xs text-cyber-500 hover:bg-obsidian-700 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {group.cwe.id}
                              </a>
                            )}
                            {group.owasp && (
                              <span className="px-2 py-1 rounded bg-neon-red/10 text-xs text-neon-red">
                                OWASP {group.owasp.id}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}


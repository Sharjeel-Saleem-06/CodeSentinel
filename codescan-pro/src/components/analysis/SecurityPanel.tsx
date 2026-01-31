/**
 * Security Panel Component
 * Displays security scan results with OWASP coverage
 * Enhanced with detailed issue cards and developer-friendly presentation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Lock,
  Key,
  Database,
  Globe,
  Server,
  FileWarning,
  ChevronDown,
  ChevronUp,
  Code,
  FileCode,
  Lightbulb,
  Bug,
  Zap
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { SecurityScanResult, CodeIssue } from '../../types/analysis';

interface SecurityPanelProps {
  security: SecurityScanResult;
}

// OWASP Top 10 2021 configuration
const owaspConfig = [
  { 
    id: 'a01', 
    key: 'a01_broken_access_control',
    name: 'Broken Access Control', 
    icon: Lock,
    description: 'Failures in access control enforcement'
  },
  { 
    id: 'a02', 
    key: 'a02_cryptographic_failures',
    name: 'Cryptographic Failures', 
    icon: Key,
    description: 'Failures related to cryptography'
  },
  { 
    id: 'a03', 
    key: 'a03_injection',
    name: 'Injection', 
    icon: Database,
    description: 'SQL, NoSQL, OS, LDAP injection'
  },
  { 
    id: 'a04', 
    key: 'a04_insecure_design',
    name: 'Insecure Design', 
    icon: FileWarning,
    description: 'Missing or ineffective security controls'
  },
  { 
    id: 'a05', 
    key: 'a05_security_misconfiguration',
    name: 'Security Misconfiguration', 
    icon: Server,
    description: 'Improperly configured security settings'
  },
  { 
    id: 'a06', 
    key: 'a06_vulnerable_components',
    name: 'Vulnerable Components', 
    icon: AlertTriangle,
    description: 'Using components with known vulnerabilities'
  },
  { 
    id: 'a07', 
    key: 'a07_auth_failures',
    name: 'Auth Failures', 
    icon: Lock,
    description: 'Authentication and session management flaws'
  },
  { 
    id: 'a08', 
    key: 'a08_software_integrity',
    name: 'Software Integrity', 
    icon: Shield,
    description: 'Integrity failures in software and data'
  },
  { 
    id: 'a09', 
    key: 'a09_logging_failures',
    name: 'Logging Failures', 
    icon: FileWarning,
    description: 'Insufficient logging and monitoring'
  },
  { 
    id: 'a10', 
    key: 'a10_ssrf',
    name: 'SSRF', 
    icon: Globe,
    description: 'Server-Side Request Forgery'
  },
];

function getRiskColor(score: number): string {
  if (score >= 75) return '#ff453a';
  if (score >= 50) return '#ff9f0a';
  if (score >= 25) return '#ffd60a';
  if (score > 0) return '#0a84ff';
  return '#32d74b';
}

function getRiskLabel(score: number): string {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  if (score > 0) return 'Low';
  return 'Secure';
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'critical':
      return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: Bug };
    case 'high':
      return { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: AlertTriangle };
    case 'medium':
      return { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', icon: Zap };
    case 'low':
    case 'info':
    default:
      return { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: FileWarning };
  }
}

// Security Issue Card Component
function SecurityIssueCard({ issue, index }: { issue: CodeIssue; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const severityStr = issue.severity === 'high' ? 'high' : issue.severity === 'medium' ? 'medium' : 'low';
  const config = getSeverityConfig(severityStr);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "rounded-xl border overflow-hidden",
        config.border,
        "bg-obsidian-800/30"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-4 hover:bg-obsidian-700/30 transition-colors text-left"
      >
        <div className={cn("p-2 rounded-lg mt-0.5", config.bg)}>
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-obsidian-100">{issue.title || 'Security Issue'}</h4>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium uppercase", config.bg, config.color)}>
              {issue.severity}
            </span>
            {issue.category && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-obsidian-700/50 text-obsidian-300">
                {issue.category}
              </span>
            )}
          </div>
          <p className="text-sm text-obsidian-400 line-clamp-2">{issue.description}</p>
          {issue.location && (
            <div className="flex items-center gap-2 mt-2 text-xs text-obsidian-500">
              <FileCode className="w-3 h-3" />
              <span>Line {issue.location.line}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-obsidian-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-obsidian-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-obsidian-700/50"
          >
            <div className="p-4 space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Why It's a Problem
                </h5>
                <p className="text-sm text-obsidian-300 pl-6">
                  {issue.description || 'This issue can impact the security or quality of your application.'}
                </p>
              </div>

              {/* Category */}
              {issue.category && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Category
                  </h5>
                  <p className="text-sm text-obsidian-300 pl-6 capitalize">{issue.category}</p>
                </div>
              )}

              {/* Code Snippet */}
              {issue.codeSnippet && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-obsidian-300 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Code
                  </h5>
                  <pre className="bg-obsidian-900/50 rounded-lg p-3 text-xs font-mono text-red-300 overflow-x-auto pl-6">
                    {issue.codeSnippet}
                  </pre>
                </div>
              )}

              {/* Suggestion */}
              {issue.suggestion && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    How to Fix
                  </h5>
                  <p className="text-sm text-obsidian-300 pl-6">{issue.suggestion}</p>
                </div>
              )}

              {/* Rule ID */}
              {issue.ruleId && (
                <div className="pl-6">
                  <span className="text-xs text-obsidian-500">Rule: {issue.ruleId}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SecurityPanel({ security }: SecurityPanelProps) {
  const riskColor = getRiskColor(security.riskScore);
  const riskLabel = getRiskLabel(security.riskScore);

  void Object.values(security.owaspCoverage).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-obsidian-800/50 rounded-xl p-6 border border-obsidian-700/50"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-obsidian-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyber-500" />
              Security Risk Score
            </h3>
            <p className="text-sm text-obsidian-400 mt-1">
              Based on OWASP Top 10 2021 vulnerability patterns
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-2">
              <span 
                className="text-4xl font-bold"
                style={{ color: riskColor }}
              >
                {security.riskScore}
              </span>
              <span className="text-obsidian-400">/ 100</span>
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color: riskColor }}
            >
              {riskLabel} Risk
            </span>
          </div>
        </div>

        {/* Risk bar */}
        <div className="relative h-4 bg-obsidian-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${security.riskScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ 
              background: `linear-gradient(90deg, ${riskColor}80, ${riskColor})` 
            }}
          />
          {/* Threshold markers */}
          <div className="absolute inset-0 flex">
            <div className="w-1/4 border-r border-obsidian-700" />
            <div className="w-1/4 border-r border-obsidian-700" />
            <div className="w-1/4 border-r border-obsidian-700" />
            <div className="w-1/4" />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-obsidian-500">
          <span>Secure</span>
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Critical</span>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-obsidian-800/50 rounded-xl p-4 border border-obsidian-700/50 text-center"
        >
          <p className="text-3xl font-bold text-neon-red">{security.issues.filter(i => i.severity === 'critical').length}</p>
          <p className="text-sm text-obsidian-400">Critical</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-obsidian-800/50 rounded-xl p-4 border border-obsidian-700/50 text-center"
        >
          <p className="text-3xl font-bold text-neon-orange">{security.issues.filter(i => i.severity === 'high').length}</p>
          <p className="text-sm text-obsidian-400">High</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-obsidian-800/50 rounded-xl p-4 border border-obsidian-700/50 text-center"
        >
          <p className="text-3xl font-bold text-neon-yellow">{security.issues.filter(i => i.severity === 'medium').length}</p>
          <p className="text-sm text-obsidian-400">Medium</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-obsidian-800/50 rounded-xl p-4 border border-obsidian-700/50 text-center"
        >
          <p className="text-3xl font-bold text-neon-blue">{security.issues.filter(i => i.severity === 'low' || i.severity === 'info').length}</p>
          <p className="text-sm text-obsidian-400">Low/Info</p>
        </motion.div>
      </div>

      {/* OWASP Top 10 Coverage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-obsidian-800/50 rounded-xl p-6 border border-obsidian-700/50"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-obsidian-100">OWASP Top 10 Coverage</h3>
          <a 
            href="https://owasp.org/Top10/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-cyber-500 hover:text-cyber-400 flex items-center gap-1"
          >
            Learn more <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-3">
          {owaspConfig.map((item, index) => {
            const count = security.owaspCoverage[item.key as keyof typeof security.owaspCoverage] || 0;
            void item.icon;
            const hasIssues = count > 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg transition-colors',
                  hasIssues ? 'bg-neon-red/5 border border-neon-red/20' : 'bg-obsidian-900/30'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  hasIssues ? 'bg-neon-red/10' : 'bg-neon-green/10'
                )}>
                  {hasIssues ? (
                    <AlertTriangle className="w-4 h-4 text-neon-red" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-neon-green" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-obsidian-500 uppercase">{item.id}</span>
                    <span className="text-sm font-medium text-obsidian-200">{item.name}</span>
                  </div>
                  <p className="text-xs text-obsidian-500 truncate">{item.description}</p>
                </div>

                <div className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  hasIssues 
                    ? 'bg-neon-red/20 text-neon-red' 
                    : 'bg-neon-green/20 text-neon-green'
                )}>
                  {hasIssues ? `${count} found` : 'Clear'}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Detailed Security Issues */}
      {security.issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-obsidian-800/50 rounded-xl p-6 border border-obsidian-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-obsidian-100 flex items-center gap-2">
              <Bug className="w-5 h-5 text-neon-red" />
              Security Issues Found
            </h3>
            <span className="text-sm text-obsidian-400">
              {security.issues.length} issue{security.issues.length !== 1 ? 's' : ''} detected
            </span>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {security.issues.map((issue, index) => (
              <SecurityIssueCard key={issue.id || index} issue={issue} index={index} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {security.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-obsidian-800/50 rounded-xl p-6 border border-obsidian-700/50"
        >
          <h3 className="text-lg font-semibold text-obsidian-100 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Security Recommendations
          </h3>
          <ul className="space-y-3">
            {security.recommendations.map((rec, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-obsidian-900/30 text-sm text-obsidian-300"
              >
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-medium text-xs flex-shrink-0">
                  {index + 1}
                </span>
                <span>{rec}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* No Issues State */}
      {security.issues.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neon-green/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-neon-green" />
          </div>
          <h3 className="text-xl font-semibold text-obsidian-100 mb-2">
            No Security Issues Found!
          </h3>
          <p className="text-obsidian-400 max-w-md mx-auto">
            Your code passed all OWASP Top 10 security checks. Keep following security best practices!
          </p>
        </motion.div>
      )}
    </div>
  );
}


/**
 * Metrics Panel Component
 * User-friendly code metrics with clear explanations
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { 
  Activity, 
  Brain, 
  FileCode, 
  GitBranch, 
  Layers,
  Clock,
  Bug,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Gauge,
  Code,
  Eye,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { CodeMetrics } from '../../types/analysis';
import { getMetricGrade, getGradeColor } from '../../lib/metrics/codeMetrics';

interface MetricsPanelProps {
  metrics: CodeMetrics;
}

// User-friendly metric explanations
const METRIC_EXPLANATIONS = {
  linesOfCode: {
    title: 'Lines of Code',
    simple: 'How much code you have written',
    detailed: 'The total number of lines that contain actual code (excluding comments and blank lines). Smaller files are generally easier to understand and maintain.',
    good: 'Under 200 lines per file',
    warning: '200-500 lines per file',
    bad: 'Over 500 lines per file',
    tip: 'Consider breaking large files into smaller, focused modules.'
  },
  cyclomaticComplexity: {
    title: 'Cyclomatic Complexity',
    simple: 'How many different paths your code can take',
    detailed: 'Counts the number of decision points (if statements, loops, switch cases) in your code. More paths = harder to test and understand.',
    good: '1-10: Simple and easy to test',
    warning: '11-20: Moderate complexity',
    bad: '21+: Very complex, hard to maintain',
    tip: 'Break complex functions into smaller ones. Each function should do one thing well.'
  },
  cognitiveComplexity: {
    title: 'Cognitive Complexity',
    simple: 'How hard is your code to understand',
    detailed: 'Measures mental effort needed to understand the code. Considers nesting depth, breaks in linear flow, and logical operators.',
    good: '0-15: Easy to understand',
    warning: '16-30: Requires some effort',
    bad: '31+: Difficult to comprehend',
    tip: 'Reduce nesting by using early returns. Simplify complex conditions into named variables.'
  },
  maintainabilityIndex: {
    title: 'Maintainability Index',
    simple: 'How easy is your code to maintain and update',
    detailed: 'A composite score (0-100) based on code volume, complexity, and structure. Higher is better.',
    good: '80-100: Highly maintainable',
    warning: '50-79: Moderately maintainable',
    bad: '0-49: Difficult to maintain',
    tip: 'Add comments, reduce complexity, and keep functions small to improve maintainability.'
  },
  maxNestingDepth: {
    title: 'Maximum Nesting Depth',
    simple: 'How deeply nested your code is',
    detailed: 'The maximum level of indentation in your code. Deep nesting makes code harder to read and follow.',
    good: '1-3 levels: Clean and readable',
    warning: '4-5 levels: Getting complex',
    bad: '6+ levels: Too nested',
    tip: 'Use early returns, extract nested logic into functions, or use guard clauses.'
  },
  halsteadBugs: {
    title: 'Estimated Bugs',
    simple: 'Predicted number of bugs based on code complexity',
    detailed: 'Based on Halstead metrics, estimates how many bugs might exist. This is a statistical prediction, not an actual bug count.',
    good: 'Under 0.5: Low bug risk',
    warning: '0.5-2: Moderate risk',
    bad: 'Over 2: High bug risk',
    tip: 'Simplify complex expressions and reduce code volume to lower bug risk.'
  },
  halsteadTime: {
    title: 'Estimated Development Time',
    simple: 'How long this code might take to understand',
    detailed: 'Estimates the time needed for a developer to comprehend this code, based on its complexity and size.',
    good: 'Under 60 seconds',
    warning: '60-300 seconds',
    bad: 'Over 300 seconds',
    tip: 'Well-documented, simple code takes less time to understand.'
  },
  duplicateCode: {
    title: 'Code Duplication',
    simple: 'How much repeated code exists',
    detailed: 'Percentage of code that appears multiple times. Duplicated code is harder to maintain because changes must be made in multiple places.',
    good: '0-5%: Minimal duplication',
    warning: '5-15%: Some duplication',
    bad: '15%+: Significant duplication',
    tip: 'Extract duplicated code into reusable functions or modules.'
  }
};

// Health status component
function HealthStatus({ score, max = 100 }: { score: number; max?: number }) {
  const percentage = (score / max) * 100;
  let status: 'good' | 'warning' | 'bad';
  let Icon: typeof CheckCircle;
  let label: string;
  
  if (percentage >= 70) {
    status = 'good';
    Icon = CheckCircle;
    label = 'Healthy';
  } else if (percentage >= 40) {
    status = 'warning';
    Icon = AlertTriangle;
    label = 'Needs Attention';
  } else {
    status = 'bad';
    Icon = XCircle;
    label = 'Critical';
  }
  
  const colors = {
    good: 'text-neon-green bg-neon-green/10 border-neon-green/30',
    warning: 'text-neon-yellow bg-neon-yellow/10 border-neon-yellow/30',
    bad: 'text-neon-red bg-neon-red/10 border-neon-red/30'
  };
  
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', colors[status])}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// Metric card with tooltip explanation
function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  grade,
  description,
  explanation,
  color = 'cyber-500',
  trend
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  grade?: string;
  description?: string;
  explanation?: typeof METRIC_EXPLANATIONS.linesOfCode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const gradeColor = grade ? getGradeColor(grade) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-obsidian-800/50 rounded-xl p-4 border border-obsidian-700/50 hover:border-obsidian-600/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn('p-2 rounded-lg', `bg-${color}/10`)}>
          <Icon className={cn('w-5 h-5', `text-${color}`)} style={{ color: `var(--color-${color})` }} />
        </div>
        <div className="flex items-center gap-2">
          {grade && (
            <span 
              className="text-2xl font-bold"
              style={{ color: gradeColor }}
            >
              {grade}
            </span>
          )}
          {explanation && (
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="p-1 rounded-full hover:bg-obsidian-700/50 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-obsidian-400 hover:text-obsidian-200" />
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-2">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-obsidian-100">{value}</p>
          {trend && (
            <span className={cn(
              'flex items-center text-xs',
              trend === 'up' ? 'text-neon-green' : trend === 'down' ? 'text-neon-red' : 'text-obsidian-400'
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
               trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            </span>
          )}
        </div>
        <p className="text-sm text-obsidian-400">{label}</p>
        {description && (
          <p className="text-xs text-obsidian-500 mt-1">{description}</p>
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && explanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 left-0 right-0 top-full mt-2 p-4 bg-obsidian-900 rounded-xl border border-obsidian-700 shadow-xl"
          >
            <h4 className="font-semibold text-obsidian-100 mb-2">{explanation.title}</h4>
            <p className="text-sm text-obsidian-300 mb-3">{explanation.detailed}</p>
            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-neon-green" />
                <span className="text-neon-green">{explanation.good}</span>
              </p>
              <p className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-neon-yellow" />
                <span className="text-neon-yellow">{explanation.warning}</span>
              </p>
              <p className="flex items-center gap-2">
                <XCircle className="w-3 h-3 text-neon-red" />
                <span className="text-neon-red">{explanation.bad}</span>
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-obsidian-700">
              <p className="text-xs text-cyber-400 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {explanation.tip}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Score ring component
function ScoreRing({ score, label, color, size = 120 }: { score: number; label: string; color: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a1d27"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-obsidian-100">{score}</span>
        <span className="text-xs text-obsidian-400">{label}</span>
      </div>
    </div>
  );
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Calculate overall health score
  const healthScore = Math.round(
    (metrics.maintainabilityIndex * 0.4) +
    (Math.max(0, 100 - metrics.cyclomaticComplexity * 3) * 0.3) +
    (Math.max(0, 100 - metrics.cognitiveComplexity * 2) * 0.2) +
    (Math.max(0, 100 - metrics.duplicateCodePercentage * 2) * 0.1)
  );

  // Prepare data for charts
  const linesData = [
    { name: 'Code', value: metrics.codeLines, fill: '#00ffd5', description: 'Actual code' },
    { name: 'Comments', value: metrics.commentLines, fill: '#bf5af2', description: 'Documentation' },
    { name: 'Blank', value: metrics.blankLines, fill: '#3a4153', description: 'Empty lines' },
  ];

  const complexityData = [
    { 
      name: 'Cyclomatic', 
      value: metrics.cyclomaticComplexity,
      fill: getGradeColor(getMetricGrade(metrics.cyclomaticComplexity, 'cyclomaticComplexity')),
      max: 30,
      description: 'Decision paths'
    },
    { 
      name: 'Cognitive', 
      value: metrics.cognitiveComplexity,
      fill: getGradeColor(getMetricGrade(metrics.cognitiveComplexity, 'cognitiveComplexity')),
      max: 50,
      description: 'Mental effort'
    },
    {
      name: 'Nesting',
      value: metrics.maxNestingDepth,
      fill: getGradeColor(getMetricGrade(metrics.maxNestingDepth, 'maxNestingDepth')),
      max: 10,
      description: 'Depth levels'
    }
  ];

  // Quality breakdown data
  const qualityData = [
    { name: 'Maintainability', value: metrics.maintainabilityIndex, color: '#00ffd5' },
    { name: 'Readability', value: Math.max(0, 100 - metrics.cognitiveComplexity * 2), color: '#bf5af2' },
    { name: 'Testability', value: Math.max(0, 100 - metrics.cyclomaticComplexity * 3), color: '#00b4d8' },
    { name: 'Simplicity', value: Math.max(0, 100 - metrics.maxNestingDepth * 10), color: '#f59e0b' },
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-obsidian-800/80 to-obsidian-900/80 rounded-2xl p-6 border border-obsidian-700/50"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-obsidian-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-cyber-500" />
              Code Health Score
            </h3>
            <p className="text-sm text-obsidian-400 mt-1">
              Overall assessment of your code quality
            </p>
          </div>
          <HealthStatus score={healthScore} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Score */}
          <div className="flex flex-col items-center justify-center relative">
            <ScoreRing 
              score={healthScore} 
              label="Health" 
              color={healthScore >= 70 ? '#00ffd5' : healthScore >= 40 ? '#f59e0b' : '#f43f5e'} 
              size={140}
            />
          </div>

          {/* Quality Breakdown */}
          <div className="col-span-2">
            <p className="text-sm text-obsidian-400 mb-3">Quality Breakdown</p>
            <div className="space-y-3">
              {qualityData.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-obsidian-300">{item.name}</span>
                    <span className="font-medium" style={{ color: item.color }}>{Math.round(item.value)}%</span>
                  </div>
                  <div className="h-2 bg-obsidian-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, item.value)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-4 pt-4 border-t border-obsidian-700/50">
          <p className="text-xs text-obsidian-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyber-500 flex-shrink-0 mt-0.5" />
            <span>
              {healthScore >= 70 
                ? "Great job! Your code is well-structured and maintainable. Keep up the good practices!"
                : healthScore >= 40
                ? "Your code has room for improvement. Focus on reducing complexity and improving documentation."
                : "Consider refactoring your code to improve maintainability. Break down large functions and reduce nesting."}
            </span>
          </p>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={FileCode}
          label="Lines of Code"
          value={metrics.codeLines}
          description={`${metrics.totalLines} total lines`}
          explanation={METRIC_EXPLANATIONS.linesOfCode}
        />
        <MetricCard
          icon={Activity}
          label="Cyclomatic Complexity"
          value={metrics.cyclomaticComplexity}
          grade={getMetricGrade(metrics.cyclomaticComplexity, 'cyclomaticComplexity')}
          description="Decision paths in code"
          explanation={METRIC_EXPLANATIONS.cyclomaticComplexity}
        />
        <MetricCard
          icon={Brain}
          label="Cognitive Complexity"
          value={metrics.cognitiveComplexity}
          grade={getMetricGrade(metrics.cognitiveComplexity, 'cognitiveComplexity')}
          description="Mental effort to understand"
          explanation={METRIC_EXPLANATIONS.cognitiveComplexity}
        />
        <MetricCard
          icon={Layers}
          label="Max Nesting"
          value={metrics.maxNestingDepth}
          grade={getMetricGrade(metrics.maxNestingDepth, 'maxNestingDepth')}
          description="Deepest code level"
          explanation={METRIC_EXPLANATIONS.maxNestingDepth}
        />
      </div>

      {/* Maintainability Index - Expandable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-obsidian-800/50 rounded-xl border border-obsidian-700/50 overflow-hidden"
      >
        <button
          onClick={() => toggleSection('maintainability')}
          className="w-full p-4 flex items-center justify-between hover:bg-obsidian-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-500/10">
              <Gauge className="w-5 h-5 text-cyber-500" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-obsidian-100">Maintainability Index</h3>
              <p className="text-sm text-obsidian-400">How easy is your code to maintain?</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span 
              className="text-3xl font-bold"
              style={{ color: getGradeColor(getMetricGrade(metrics.maintainabilityIndex, 'maintainabilityIndex')) }}
            >
              {metrics.maintainabilityIndex.toFixed(0)}
            </span>
            {expandedSection === 'maintainability' ? (
              <ChevronUp className="w-5 h-5 text-obsidian-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-obsidian-400" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {expandedSection === 'maintainability' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-obsidian-700/50">
                <div className="flex items-center gap-8">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="100%"
                        barSize={20}
                        data={[{ name: 'Maintainability', value: metrics.maintainabilityIndex, fill: getGradeColor(getMetricGrade(metrics.maintainabilityIndex, 'maintainabilityIndex')) }]}
                        startAngle={180}
                        endAngle={0}
                      >
                        <RadialBar
                          background={{ fill: '#1a1d27' }}
                          dataKey="value"
                          cornerRadius={10}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1">
                    <p className="text-obsidian-300 text-sm mb-4">
                      {METRIC_EXPLANATIONS.maintainabilityIndex.detailed}
                    </p>
                    <div className="flex gap-4">
                      {[
                        { range: '80+', label: 'Excellent', color: getGradeColor('A') },
                        { range: '60-79', label: 'Good', color: getGradeColor('B') },
                        { range: '40-59', label: 'Moderate', color: getGradeColor('C') },
                        { range: '<40', label: 'Poor', color: getGradeColor('F') },
                      ].map(item => (
                        <div key={item.range} className="text-center">
                          <span className="text-xl font-bold" style={{ color: item.color }}>{item.range}</span>
                          <p className="text-xs text-obsidian-500">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lines Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-obsidian-800/50 rounded-xl p-6 border border-obsidian-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-obsidian-100">Lines Distribution</h3>
            <button className="p-1 rounded-full hover:bg-obsidian-700/50 transition-colors">
              <HelpCircle className="w-4 h-4 text-obsidian-400" />
            </button>
          </div>
          <p className="text-sm text-obsidian-400 mb-4">
            How your code is divided between actual code, comments, and blank lines
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={linesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {linesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1d27',
                    border: '1px solid #3a4153',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} lines (${Math.round((value / metrics.totalLines) * 100)}%)`,
                    props.payload.description
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {linesData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-sm text-obsidian-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Complexity Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-obsidian-800/50 rounded-xl p-6 border border-obsidian-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-obsidian-100">Complexity Metrics</h3>
            <button className="p-1 rounded-full hover:bg-obsidian-700/50 transition-colors">
              <HelpCircle className="w-4 h-4 text-obsidian-400" />
            </button>
          </div>
          <p className="text-sm text-obsidian-400 mb-4">
            Different ways to measure how complex your code is
          </p>
          <div className="space-y-4">
            {complexityData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-obsidian-300 flex items-center gap-2">
                    {item.name}
                    <span className="text-xs text-obsidian-500">({item.description})</span>
                  </span>
                  <span className="font-medium" style={{ color: item.fill }}>{item.value}</span>
                </div>
                <div className="h-3 bg-obsidian-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                </div>
                <div className="flex justify-between text-xs text-obsidian-500">
                  <span>0</span>
                  <span>{item.max}+</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Halstead Metrics - Simplified */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-obsidian-800/50 rounded-xl border border-obsidian-700/50 overflow-hidden"
      >
        <button
          onClick={() => toggleSection('halstead')}
          className="w-full p-4 flex items-center justify-between hover:bg-obsidian-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-purple/10">
              <Code className="w-5 h-5 text-neon-purple" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-obsidian-100">Advanced Metrics (Halstead)</h3>
              <p className="text-sm text-obsidian-400">Detailed code analysis based on operators and operands</p>
            </div>
          </div>
          {expandedSection === 'halstead' ? (
            <ChevronUp className="w-5 h-5 text-obsidian-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-obsidian-400" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'halstead' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-obsidian-700/50">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center p-3 bg-obsidian-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-cyber-500">{metrics.halstead.vocabulary}</p>
                    <p className="text-xs text-obsidian-400">Vocabulary</p>
                    <p className="text-[10px] text-obsidian-500 mt-1">Unique elements</p>
                  </div>
                  <div className="text-center p-3 bg-obsidian-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-neon-purple">{metrics.halstead.length}</p>
                    <p className="text-xs text-obsidian-400">Length</p>
                    <p className="text-[10px] text-obsidian-500 mt-1">Total elements</p>
                  </div>
                  <div className="text-center p-3 bg-obsidian-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-neon-blue">{metrics.halstead.volume.toFixed(0)}</p>
                    <p className="text-xs text-obsidian-400">Volume</p>
                    <p className="text-[10px] text-obsidian-500 mt-1">Code size</p>
                  </div>
                  <div className="text-center p-3 bg-obsidian-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-neon-orange">{metrics.halstead.difficulty.toFixed(1)}</p>
                    <p className="text-xs text-obsidian-400">Difficulty</p>
                    <p className="text-[10px] text-obsidian-500 mt-1">Error proneness</p>
                  </div>
                  <div className="text-center p-3 bg-obsidian-900/50 rounded-lg group relative">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-obsidian-500" />
                      <p className="text-2xl font-bold text-neon-yellow">{metrics.halstead.time.toFixed(0)}s</p>
                    </div>
                    <p className="text-xs text-obsidian-400">Est. Time</p>
                    <p className="text-[10px] text-obsidian-500 mt-1">To understand</p>
                  </div>
                  <div className="text-center p-3 bg-obsidian-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <Bug className="w-4 h-4 text-obsidian-500" />
                      <p className="text-2xl font-bold text-neon-red">{metrics.halstead.bugs.toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-obsidian-400">Est. Bugs</p>
                    <p className="text-[10px] text-obsidian-500 mt-1">Predicted</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-obsidian-900/30 rounded-lg">
                  <p className="text-xs text-obsidian-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyber-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-obsidian-300">What do these mean?</strong> Halstead metrics analyze your code's operators (+, -, *, function calls) and operands (variables, constants). 
                      Higher vocabulary and length indicate more complex code. The estimated bugs and time help predict maintenance effort.
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={GitBranch}
          label="Functions"
          value={metrics.functionCount}
          description={`Avg ${metrics.averageFunctionLength.toFixed(0)} lines each`}
        />
        <MetricCard
          icon={Layers}
          label="Classes"
          value={metrics.classCount}
          description="Object-oriented structures"
        />
        <MetricCard
          icon={FileCode}
          label="Imports"
          value={metrics.importCount}
          description="External dependencies"
        />
        <MetricCard
          icon={Activity}
          label="Duplication"
          value={`${metrics.duplicateCodePercentage}%`}
          grade={getMetricGrade(metrics.duplicateCodePercentage, 'duplicateCodePercentage')}
          description="Repeated code"
          explanation={METRIC_EXPLANATIONS.duplicateCode}
        />
      </div>
    </div>
  );
}

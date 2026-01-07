/**
 * Enhanced Control Flow Graph Visualization
 * Interactive node-based diagram using React Flow
 * Optimized for clarity, visual appeal, and user-friendliness
 * Uses Dagre for automatic hierarchical layout
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeProps,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  GitBranch, 
  RotateCcw, 
  ArrowRight,
  AlertTriangle,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Code,
  Eye,
  EyeOff,
  Layers,
  LayoutGrid,
  Focus,
  HelpCircle,
  X,
  TreeDeciduous,
  Zap,
  Box,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/ThemeContext';
import type { ControlFlowGraph as CFGType, CFGNode } from '../../types/analysis';

interface ControlFlowGraphProps {
  cfg: CFGType;
}

// Node style configurations with light/dark theme support
const NODE_STYLES: Record<string, { icon: typeof Play; color: string; bgDark: string; bgLight: string }> = {
  // Class/Container nodes
  class: {
    icon: Layers,
    color: '#8b5cf6',
    bgDark: 'linear-gradient(135deg, rgba(139,92,246,0.4) 0%, rgba(124,58,237,0.3) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(124,58,237,0.15) 100%)',
  },
  // Function/Method nodes
  function: {
    icon: Play,
    color: '#10b981',
    bgDark: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)',
  },
  method: {
    icon: Code,
    color: '#06b6d4',
    bgDark: 'linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(8,145,178,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(8,145,178,0.1) 100%)',
  },
  constructor: {
    icon: Zap,
    color: '#f59e0b',
    bgDark: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.1) 100%)',
  },
  property: {
    icon: Code,
    color: '#64748b',
    bgDark: 'linear-gradient(135deg, rgba(100,116,139,0.3) 0%, rgba(71,85,105,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(100,116,139,0.1) 0%, rgba(148,163,184,0.08) 100%)',
  },
  // Entry/Exit nodes
  entry: {
    icon: Play,
    color: '#10b981',
    bgDark: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)',
  },
  exit: {
    icon: Square,
    color: '#ef4444',
    bgDark: 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.1) 100%)',
  },
  // Control flow nodes
  condition: {
    icon: GitBranch,
    color: '#f59e0b',
    bgDark: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.1) 100%)',
  },
  loop: {
    icon: RotateCcw,
    color: '#8b5cf6',
    bgDark: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(124,58,237,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.1) 100%)',
  },
  return: {
    icon: ArrowRight,
    color: '#0ea5e9',
    bgDark: 'linear-gradient(135deg, rgba(14,165,233,0.3) 0%, rgba(2,132,199,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(2,132,199,0.1) 100%)',
  },
  throw: {
    icon: AlertTriangle,
    color: '#f97316',
    bgDark: 'linear-gradient(135deg, rgba(249,115,22,0.3) 0%, rgba(234,88,12,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.1) 100%)',
  },
  statement: {
    icon: Code,
    color: '#64748b',
    bgDark: 'linear-gradient(135deg, rgba(100,116,139,0.3) 0%, rgba(71,85,105,0.2) 100%)',
    bgLight: 'linear-gradient(135deg, rgba(100,116,139,0.1) 0%, rgba(148,163,184,0.08) 100%)',
  },
};

// Custom node component with enhanced styling and theme support
function CFGNodeComponent({ data, selected }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isDark } = useTheme();
  const nodeData = data as { 
    label: string; 
    type: CFGNode['type']; 
    line?: number; 
    code?: string;
    depth?: number;
    nodeGroup?: string;
    metadata?: CFGNode['metadata'];
  };
  
  const style = NODE_STYLES[nodeData.type] || NODE_STYLES.statement;
  const Icon = style.icon;

  // Node type classifications
  const isClassNode = nodeData.type === 'class';
  const isFunctionNode = nodeData.type === 'function' || nodeData.type === 'method' || nodeData.type === 'constructor';
  const isSpecialNode = nodeData.type === 'entry' || nodeData.type === 'exit';
  const isConditionNode = nodeData.type === 'condition' || nodeData.type === 'loop';

  // Get theme-aware colors
  const bgColor = isDark ? style.bgDark : style.bgLight;
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-gray-600';

  // Get display label based on node type
  const getDisplayLabel = () => {
    if (isClassNode) return `class ${nodeData.label}`;
    if (nodeData.metadata?.isConstructor) return `constructor ${nodeData.label}`;
    if (nodeData.metadata?.isAsync) return `async ${nodeData.label}`;
    return nodeData.label;
  };

  // Get type badge label
  const getTypeBadge = () => {
    if (isClassNode) return 'CLASS';
    if (nodeData.type === 'constructor') return 'CTOR';
    if (nodeData.type === 'method') return 'METHOD';
    if (nodeData.type === 'function') return 'FUNC';
    if (nodeData.type === 'condition') return 'IF';
    if (nodeData.type === 'loop') return 'LOOP';
    return nodeData.type.toUpperCase();
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative rounded-xl border-2 transition-all duration-200',
        isHovered && `scale-105`,
        selected && 'ring-2 ring-cyan-400 ring-offset-2',
        isDark ? 'ring-offset-slate-900' : 'ring-offset-white',
        // Different sizes for different node types
        isClassNode ? 'px-6 py-4 min-w-[220px]' : 
        isFunctionNode ? 'px-5 py-3 min-w-[200px]' :
        isSpecialNode ? 'px-4 py-2.5' : 'px-4 py-2.5',
        isConditionNode ? 'min-w-[180px]' : 'min-w-[160px]',
        'max-w-[350px]'
      )}
      style={{
        background: bgColor,
        borderColor: style.color,
        borderWidth: isClassNode || isFunctionNode ? 3 : 2,
        boxShadow: isHovered 
          ? `0 8px 25px ${style.color}40, 0 0 15px ${style.color}30`
          : `0 4px 12px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
      }}
    >
      {/* Target Handle (Top) - hide for class nodes */}
      {!isClassNode && (
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            '!w-3 !h-3 !border-2 transition-all duration-200',
            isDark ? '!bg-slate-700 !border-slate-500' : '!bg-gray-300 !border-gray-400',
            isHovered && '!bg-cyan-500 !border-cyan-400 !scale-125'
          )}
        />
      )}

      {/* Node Content */}
      <div className="flex items-start gap-3">
        <div 
          className={cn(
            'flex-shrink-0 rounded-lg',
            isClassNode ? 'p-3' : 'p-2',
            isDark ? 'bg-white/10' : 'bg-white/50'
          )}
          style={{ color: style.color }}
        >
          <Icon className={cn(isClassNode ? "w-6 h-6" : "w-5 h-5")} />
        </div>
        
        <div className="flex-1 min-w-0">
          <span className={cn(
            'font-semibold block truncate',
            isClassNode ? 'text-base' :
            isFunctionNode ? 'text-sm' :
            isSpecialNode ? 'text-sm' : 'text-xs',
            textColor
          )}>
            {getDisplayLabel()}
          </span>
          {nodeData.line && (
            <span className={cn("text-[10px] mt-0.5 block font-mono", subTextColor)}>
              Line {nodeData.line}
            </span>
          )}
          {/* Show metadata info for functions/methods */}
          {isFunctionNode && nodeData.metadata?.parameters && nodeData.metadata.parameters.length > 0 && (
            <span className={cn("text-[10px] mt-0.5 block", subTextColor)}>
              params: {nodeData.metadata.parameters.join(', ')}
            </span>
          )}
          {/* Show class name for methods */}
          {nodeData.metadata?.className && (
            <span className={cn("text-[10px] mt-0.5 block italic", subTextColor)}>
              in {nodeData.metadata.className}
            </span>
          )}
        </div>
      </div>

      {/* Code Preview on Hover */}
      <AnimatePresence>
        {isHovered && nodeData.code && !isClassNode && !isFunctionNode && nodeData.type !== 'exit' && (
          <motion.div
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className={cn(
              "mt-2 p-2 rounded-lg border overflow-hidden",
              isDark 
                ? "bg-slate-900/90 border-slate-700/50" 
                : "bg-white/90 border-gray-200"
            )}
          >
            <code className={cn(
              "text-[10px] font-mono block whitespace-pre-wrap break-all",
              isDark ? "text-cyan-300" : "text-blue-600"
            )}>
              {nodeData.code.length > 80 ? nodeData.code.slice(0, 80) + '...' : nodeData.code}
            </code>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          '!w-3 !h-3 !border-2 transition-all duration-200',
          isDark ? '!bg-slate-700 !border-slate-500' : '!bg-gray-300 !border-gray-400',
          isHovered && '!bg-cyan-500 !border-cyan-400 !scale-125'
        )}
      />

      {/* Type Badge */}
      <div
        className={cn(
          "absolute -top-2.5 -right-2 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-lg",
          isClassNode ? "text-[10px]" : "text-[9px]"
        )}
        style={{ 
          backgroundColor: style.color, 
          color: '#ffffff',
          boxShadow: `0 2px 8px ${style.color}50`
        }}
      >
        {getTypeBadge()}
      </div>

      {/* Async/Static indicators */}
      {(nodeData.metadata?.isAsync || nodeData.metadata?.isStatic) && (
        <div className="absolute -top-2.5 left-2 flex gap-1">
          {nodeData.metadata.isAsync && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-500 text-white">
              ASYNC
            </span>
          )}
          {nodeData.metadata.isStatic && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500 text-white">
              STATIC
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

const nodeTypes = {
  cfgNode: CFGNodeComponent,
};

// Dagre layout function for clean hierarchical graph with optimal spacing
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 220;
  const nodeHeight = 90;

  // Configure dagre for optimal layout with no overlapping
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 120,    // Increased horizontal spacing between nodes
    ranksep: 140,    // Increased vertical spacing between ranks/levels  
    edgesep: 80,     // Increased spacing between edges
    marginx: 80,
    marginy: 80,
    ranker: 'tight-tree', // Better for tree-like structures
    acyclicer: 'greedy',  // Handle cycles better
    align: 'DL',          // Align nodes for cleaner look
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    // Add weight to edges for better layout
    dagreGraph.setEdge(edge.source, edge.target, { 
      weight: 1,
      minlen: 1, // Minimum edge length
    });
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Inner component that uses ReactFlow hooks
function ControlFlowGraphInner({ cfg }: ControlFlowGraphProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const { isDark } = useTheme();

  // Convert CFG to React Flow format with Dagre layout
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!cfg || !cfg.nodes || cfg.nodes.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Create nodes first with enhanced data
    const rawNodes: Node[] = cfg.nodes.map(node => ({
      id: node.id,
      type: 'cfgNode',
      position: { x: 0, y: 0 }, // Will be set by dagre
      data: {
        label: node.label,
        type: node.type,
        line: node.location?.line,
        code: node.code,
        depth: node.depth,
        nodeGroup: node.nodeGroup,
        metadata: node.metadata,
      },
      sourcePosition: layoutDirection === 'TB' ? Position.Bottom : Position.Right,
      targetPosition: layoutDirection === 'TB' ? Position.Top : Position.Left,
    }));

    // Create edges with enhanced styling for clarity and hierarchy
    const rawEdges: Edge[] = cfg.edges.map((edge, index) => {
      const isTrue = edge.condition === 'true' || edge.label === 'then' || edge.label === 'body';
      const isFalse = edge.condition === 'false' || edge.label === 'else';
      const isException = edge.condition === 'exception';
      const isBreak = edge.condition === 'break' || edge.condition === 'continue';
      const isLoop = edge.condition === 'loop' || edge.label === 'iterate';
      const isCall = edge.condition === 'call' || edge.edgeType === 'call';
      const isHierarchy = edge.condition === 'contains' || edge.edgeType === 'hierarchy';
      const isInheritance = edge.condition === 'inherits' || edge.edgeType === 'inheritance';
      
      // Color coding for different edge types
      let strokeColor = isDark ? '#06b6d4' : '#0891b2'; // cyan
      let animated = false;
      let strokeDasharray = '';
      let strokeWidth = 2;
      
      if (isTrue) {
        strokeColor = '#10b981'; // emerald - always good for "true/yes"
        animated = true;
        strokeWidth = 3;
      } else if (isFalse) {
        strokeColor = '#ef4444'; // red - always clear for "false/no"
        strokeWidth = 2;
      } else if (isException) {
        strokeColor = '#f97316'; // orange
        strokeDasharray = '8,4';
        strokeWidth = 2;
      } else if (isBreak) {
        strokeColor = '#8b5cf6'; // violet
        strokeDasharray = '4,4';
      } else if (isLoop) {
        strokeColor = '#a855f7'; // purple
        strokeDasharray = '6,3';
        animated = true;
      } else if (isCall) {
        strokeColor = '#f59e0b'; // amber for function calls
        strokeDasharray = '5,5';
        strokeWidth = 2;
      } else if (isHierarchy) {
        strokeColor = '#8b5cf6'; // purple for hierarchy (class -> method)
        strokeDasharray = '3,3';
        strokeWidth = 2;
      } else if (isInheritance) {
        strokeColor = '#ec4899'; // pink for inheritance
        strokeDasharray = '10,5';
        strokeWidth = 2;
      }
      
      return {
        id: `edge-${index}-${edge.from}-${edge.to}`,
        source: edge.from,
        target: edge.to,
        label: showLabels ? (edge.label || edge.condition) : undefined,
        type: 'smoothstep',
        animated,
        // Use pathOptions for better edge routing
        pathOptions: {
          offset: 15, // Offset edges to prevent overlap
          borderRadius: 20, // Smoother corners
        },
        style: { 
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 22,
          height: 22,
        },
        labelStyle: {
          fill: isDark ? '#e2e8f0' : '#334155',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'ui-monospace, monospace',
        },
        labelBgStyle: {
          fill: isDark ? '#1e293b' : '#f8fafc',
          fillOpacity: 0.98,
        },
        labelBgPadding: [8, 10] as [number, number],
        labelBgBorderRadius: 8,
      };
    });

    // Apply dagre layout for clean hierarchical positioning
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rawNodes,
      rawEdges,
      layoutDirection
    );
    
    return { initialNodes: layoutedNodes, initialEdges: layoutedEdges };
  }, [cfg, showLabels, layoutDirection, isDark]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when cfg changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Auto fit view on init
  const onInit = useCallback(() => {
    setTimeout(() => {
      fitView({ padding: 0.15, maxZoom: 1.2, duration: 500 });
    }, 100);
  }, [fitView]);

  // Handle fit view button
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.15, maxZoom: 1.5, duration: 300 });
  }, [fitView]);

  // Focus on entry node
  const handleFocusEntry = useCallback(() => {
    const entryNode = nodes.find(n => n.data.type === 'entry');
    if (entryNode) {
      setCenter(entryNode.position.x, entryNode.position.y, { zoom: 1.2, duration: 500 });
    }
  }, [nodes, setCenter]);

  // Handle layout direction change
  const toggleLayoutDirection = useCallback(() => {
    setLayoutDirection(prev => prev === 'TB' ? 'LR' : 'TB');
    setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 100);
  }, [fitView]);

  // Handle empty state
  if (!cfg || !cfg.nodes || cfg.nodes.length === 0) {
    return (
      <div className={cn(
        "h-full flex items-center justify-center",
        isDark ? "text-slate-400" : "text-gray-500"
      )}>
        <div className="text-center max-w-md px-6">
          <div className={cn(
            "w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center",
            isDark 
              ? "bg-gradient-to-br from-slate-700/50 to-slate-800/50" 
              : "bg-gradient-to-br from-gray-100 to-gray-200"
          )}>
            <GitBranch className="w-10 h-10 opacity-50" />
          </div>
          <p className={cn(
            "text-lg font-medium",
            isDark ? "text-slate-300" : "text-gray-700"
          )}>No Control Flow Data</p>
          <p className={cn(
            "text-sm mt-1 mb-4",
            isDark ? "text-slate-500" : "text-gray-500"
          )}>Analyze code to generate the control flow graph</p>
          
          <div className={cn(
            "rounded-xl p-4 text-left",
            isDark ? "bg-slate-800/50" : "bg-gray-100"
          )}>
            <p className={cn(
              "text-xs font-medium mb-2",
              isDark ? "text-slate-400" : "text-gray-600"
            )}>💡 What is a Control Flow Graph?</p>
            <p className={cn(
              "text-xs leading-relaxed",
              isDark ? "text-slate-500" : "text-gray-500"
            )}>
              A visual representation of how your code executes. It shows the paths your program can take,
              including conditionals (if/else), loops (for/while), and function calls. This helps you
              understand and debug complex logic.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'rounded-xl overflow-hidden border',
        isDark ? 'border-slate-700/50' : 'border-gray-200',
        isFullscreen 
          ? cn('fixed inset-4 z-50', isDark ? 'bg-slate-900' : 'bg-white') 
          : 'h-full w-full'
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        style={{ background: isDark ? '#0f172a' : '#f8fafc' }}
        minZoom={0.1}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        selectNodesOnDrag={false}
      >
        <Background 
          color={isDark ? '#1e293b' : '#e2e8f0'}
          gap={24} 
          size={1.5}
          style={{ opacity: 0.5 }}
        />
        
        <Controls 
          style={{ 
            background: isDark ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
          }}
          showInteractive={false}
        />
        
        {showMinimap && (
          <MiniMap
            style={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              borderRadius: '12px',
            }}
            nodeColor={(node) => {
              const type = node.data?.type as keyof typeof NODE_STYLES;
              return NODE_STYLES[type]?.color || '#64748b';
            }}
            maskColor={isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(248, 250, 252, 0.85)'}
            pannable
            zoomable
          />
        )}

        {/* Control Panel */}
        <Panel position="top-right" className="flex flex-col gap-2">
          <div className={cn(
            "flex gap-1.5 backdrop-blur-sm p-1.5 rounded-xl border shadow-lg",
            isDark 
              ? "bg-slate-800/90 border-slate-700/50" 
              : "bg-white/90 border-gray-200"
          )}>
            <button
              onClick={handleFitView}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark 
                  ? "hover:bg-slate-700/70 text-slate-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              )}
              title="Fit View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={handleFocusEntry}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark 
                  ? "hover:bg-slate-700/70 text-slate-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              )}
              title="Focus Entry"
            >
              <Focus className="w-4 h-4" />
            </button>
            <button
              onClick={toggleLayoutDirection}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark 
                  ? "hover:bg-slate-700/70 text-slate-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              )}
              title={layoutDirection === 'TB' ? 'Switch to Horizontal Layout' : 'Switch to Vertical Layout'}
            >
              <TreeDeciduous className="w-4 h-4" />
            </button>
            <button
              onClick={() => zoomIn({ duration: 200 })}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark 
                  ? "hover:bg-slate-700/70 text-slate-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              )}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => zoomOut({ duration: 200 })}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark 
                  ? "hover:bg-slate-700/70 text-slate-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              )}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className={cn("w-px mx-1", isDark ? "bg-slate-600" : "bg-gray-300")} />
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showLabels 
                  ? 'bg-cyan-600/30 text-cyan-400' 
                  : isDark 
                    ? 'hover:bg-slate-700/70 text-slate-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              )}
              title={showLabels ? 'Hide Labels' : 'Show Labels'}
            >
              {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showMinimap 
                  ? 'bg-cyan-600/30 text-cyan-400' 
                  : isDark 
                    ? 'hover:bg-slate-700/70 text-slate-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              )}
              title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
            >
              <Layers className="w-4 h-4" />
            </button>
            <div className={cn("w-px mx-1", isDark ? "bg-slate-600" : "bg-gray-300")} />
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark 
                  ? "hover:bg-slate-700/70 text-slate-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              )}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showHelp 
                  ? 'bg-cyan-600/30 text-cyan-400' 
                  : isDark 
                    ? 'hover:bg-slate-700/70 text-slate-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              )}
              title="Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </Panel>

        {/* Help Panel */}
        <AnimatePresence>
          {showHelp && (
            <Panel position="top-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "backdrop-blur-sm rounded-xl p-4 border shadow-xl max-w-[300px]",
                  isDark 
                    ? "bg-slate-800/95 border-slate-700/50" 
                    : "bg-white/95 border-gray-200"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className={cn(
                    "text-sm font-semibold flex items-center gap-2",
                    isDark ? "text-slate-200" : "text-gray-800"
                  )}>
                    <HelpCircle className="w-4 h-4 text-cyan-500" />
                    How to Use
                  </p>
                  <button
                    onClick={() => setShowHelp(false)}
                    className={cn(
                      "p-1 rounded",
                      isDark ? "hover:bg-slate-700/50 text-slate-400" : "hover:bg-gray-100 text-gray-500"
                    )}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className={cn("space-y-3 text-xs", isDark ? "text-slate-400" : "text-gray-600")}>
                  <div>
                    <p className={cn("font-medium mb-1", isDark ? "text-slate-300" : "text-gray-700")}>🖱️ Navigation</p>
                    <ul className="space-y-1 pl-4 list-disc">
                      <li>Drag to pan around the graph</li>
                      <li>Scroll to zoom in/out</li>
                      <li>Click a node to select it</li>
                      <li>Hover over nodes to see code</li>
                    </ul>
                  </div>
                  <div>
                    <p className={cn("font-medium mb-1", isDark ? "text-slate-300" : "text-gray-700")}>📊 Understanding the Graph</p>
                    <ul className="space-y-1 pl-4 list-disc">
                      <li><span className="text-emerald-500 font-semibold">Green</span> = Entry point / True path</li>
                      <li><span className="text-red-500 font-semibold">Red</span> = Exit / False path</li>
                      <li><span className="text-amber-500 font-semibold">Yellow</span> = Conditions (if/else)</li>
                      <li><span className="text-violet-500 font-semibold">Purple</span> = Loops (for/while)</li>
                      <li><span className="text-sky-500 font-semibold">Blue</span> = Return statements</li>
                    </ul>
                  </div>
                  <div>
                    <p className={cn("font-medium mb-1", isDark ? "text-slate-300" : "text-gray-700")}>⌨️ Tips</p>
                    <ul className="space-y-1 pl-4 list-disc">
                      <li>Use "Fit View" to see the entire graph</li>
                      <li>Use Tree icon to toggle layout direction</li>
                      <li>Toggle labels for cleaner view</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>
        
        {/* Legend */}
        <Panel position="bottom-right">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "backdrop-blur-sm rounded-xl p-4 border shadow-xl max-w-[220px]",
              isDark 
                ? "bg-slate-800/95 border-slate-700/50" 
                : "bg-white/95 border-gray-200"
            )}
          >
            <p className={cn(
              "text-[10px] mb-3 font-semibold uppercase tracking-wider flex items-center gap-1.5",
              isDark ? "text-slate-400" : "text-gray-500"
            )}>
              <Layers className="w-3 h-3" />
              Legend
            </p>
            
            {/* Structure nodes */}
            <p className={cn(
              "text-[9px] mb-1.5 font-semibold uppercase tracking-wider",
              isDark ? "text-slate-500" : "text-gray-400"
            )}>Structure</p>
            <div className="space-y-1.5 mb-3">
              {[
                { type: 'class', label: 'Class' },
                { type: 'function', label: 'Function' },
                { type: 'method', label: 'Method' },
                { type: 'constructor', label: 'Constructor' },
              ].map(item => {
                const config = NODE_STYLES[item.type];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <div key={item.type} className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}25` }}
                    >
                      <Icon className="w-3 h-3" style={{ color: config.color }} />
                    </div>
                    <span className={cn(
                      "text-[11px] font-medium",
                      isDark ? "text-slate-300" : "text-gray-700"
                    )}>{item.label}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Control flow nodes */}
            <p className={cn(
              "text-[9px] mb-1.5 font-semibold uppercase tracking-wider",
              isDark ? "text-slate-500" : "text-gray-400"
            )}>Control Flow</p>
            <div className="space-y-1.5 mb-3">
              {[
                { type: 'condition', label: 'Condition' },
                { type: 'loop', label: 'Loop' },
                { type: 'return', label: 'Return' },
                { type: 'exit', label: 'Exit' },
              ].map(item => {
                const config = NODE_STYLES[item.type];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <div key={item.type} className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}25` }}
                    >
                      <Icon className="w-3 h-3" style={{ color: config.color }} />
                    </div>
                    <span className={cn(
                      "text-[11px] font-medium",
                      isDark ? "text-slate-300" : "text-gray-700"
                    )}>{item.label}</span>
                  </div>
                );
              })}
            </div>
            
            <div className={cn(
              "pt-3 border-t",
              isDark ? "border-slate-700/50" : "border-gray-200"
            )}>
              <p className={cn(
                "text-[10px] mb-2 font-semibold uppercase tracking-wider",
                isDark ? "text-slate-400" : "text-gray-500"
              )}>Edges</p>
              <div className="space-y-1.5">
                {[
                  { color: '#10b981', label: 'True/Then', animated: true },
                  { color: '#ef4444', label: 'False/Else' },
                  { color: '#06b6d4', label: 'Normal flow' },
                  { color: '#f59e0b', label: 'Function call', dashed: true },
                  { color: '#8b5cf6', label: 'Contains', dashed: true },
                  { color: '#ec4899', label: 'Inherits', dashed: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div 
                      className={cn(
                        'w-6 h-0.5 rounded-full',
                        item.dashed && 'border-t border-dashed'
                      )}
                      style={{ 
                        backgroundColor: item.dashed ? 'transparent' : item.color,
                        borderColor: item.dashed ? item.color : undefined,
                      }} 
                    />
                    <span className={cn(
                      "text-[10px]",
                      isDark ? "text-slate-400" : "text-gray-600"
                    )}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Panel>
      </ReactFlow>
      
      {/* Stats Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-4 left-4 flex gap-2 text-xs"
      >
        <span className={cn(
          "px-3 py-1.5 rounded-lg backdrop-blur-sm border font-medium",
          isDark 
            ? "bg-slate-800/90 border-slate-700/50 text-slate-300" 
            : "bg-white/90 border-gray-200 text-gray-700"
        )}>
          <span className="text-cyan-500 font-bold">{cfg.nodes.length}</span> nodes
        </span>
        <span className={cn(
          "px-3 py-1.5 rounded-lg backdrop-blur-sm border font-medium",
          isDark 
            ? "bg-slate-800/90 border-slate-700/50 text-slate-300" 
            : "bg-white/90 border-gray-200 text-gray-700"
        )}>
          <span className="text-cyan-500 font-bold">{cfg.edges.length}</span> edges
        </span>
      </motion.div>
    </motion.div>
  );
}

// Wrapper component with ReactFlowProvider
export function ControlFlowGraphView({ cfg }: ControlFlowGraphProps) {
  return (
    <ReactFlowProvider>
      <ControlFlowGraphInner cfg={cfg} />
    </ReactFlowProvider>
  );
}

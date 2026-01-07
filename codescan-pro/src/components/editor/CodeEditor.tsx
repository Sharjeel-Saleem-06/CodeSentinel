/**
 * Code Editor Component
 * Monaco Editor integration for code input
 */

import { useRef, useCallback, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useAnalysisStore } from '../../store/analysisStore';
import { useTheme } from '../../context/ThemeContext';
import type { CodeIssue } from '../../types/analysis';

interface CodeEditorProps {
  issues?: CodeIssue[];
  onAnalyze?: () => void;
}

export function CodeEditor({ issues = [], onAnalyze }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const { sourceCode, setSourceCode, language, preferences } = useAnalysisStore();
  const { isDark } = useTheme();

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme
    monaco.editor.defineTheme('codescan-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'operator', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#0d0f14',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#1a1d2720',
        'editor.selectionBackground': '#00ffd530',
        'editor.inactiveSelectionBackground': '#00ffd515',
        'editorLineNumber.foreground': '#5a5a5a',
        'editorLineNumber.activeForeground': '#00ffd5',
        'editorCursor.foreground': '#00ffd5',
        'editor.selectionHighlightBackground': '#bf5af220',
        'editorBracketMatch.background': '#00ffd530',
        'editorBracketMatch.border': '#00ffd5',
        'scrollbarSlider.background': '#1a1d2780',
        'scrollbarSlider.hoverBackground': '#00ffd540',
        'scrollbarSlider.activeBackground': '#00ffd560',
      },
    });

    // Define custom light theme
    monaco.editor.defineTheme('codescan-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'AF00DB' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'type', foreground: '267F99' },
        { token: 'function', foreground: '795E26' },
        { token: 'variable', foreground: '001080' },
        { token: 'operator', foreground: '000000' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1e293b',
        'editor.lineHighlightBackground': '#f1f5f910',
        'editor.selectionBackground': '#0891b230',
        'editor.inactiveSelectionBackground': '#0891b215',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#0891b2',
        'editorCursor.foreground': '#0891b2',
        'editor.selectionHighlightBackground': '#0891b220',
        'editorBracketMatch.background': '#0891b230',
        'editorBracketMatch.border': '#0891b2',
        'scrollbarSlider.background': '#cbd5e180',
        'scrollbarSlider.hoverBackground': '#0891b240',
        'scrollbarSlider.activeBackground': '#0891b260',
      },
    });

    // Set theme based on current mode
    monaco.editor.setTheme(isDark ? 'codescan-dark' : 'codescan-light');

    // Add keyboard shortcut for analysis
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onAnalyze?.();
    });

    // Focus editor
    editor.focus();
  }, [onAnalyze]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setSourceCode(value);
    }
  }, [setSourceCode]);

  // Map language to Monaco language
  const monacoLanguage = language === 'cpp' ? 'cpp' : 
                         language === 'csharp' ? 'csharp' : 
                         language;

  // Add decorations for issues
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    handleEditorMount(editor, monaco);

    // Add issue markers
    if (issues.length > 0) {
      const model = editor.getModel();
      if (model) {
        const markers = issues.map(issue => ({
          severity: issue.severity === 'critical' || issue.severity === 'high' 
            ? monaco.MarkerSeverity.Error 
            : issue.severity === 'medium' 
              ? monaco.MarkerSeverity.Warning 
              : monaco.MarkerSeverity.Info,
          message: `${issue.title}: ${issue.description}`,
          startLineNumber: issue.location.line,
          startColumn: issue.location.column + 1,
          endLineNumber: issue.location.endLine || issue.location.line,
          endColumn: issue.location.endColumn || 1000,
          source: 'CodeSentinel',
        }));

        monaco.editor.setModelMarkers(model, 'codescan', markers);
      }
    }
  }, [handleEditorMount, issues]);

  // Update theme when it changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isDark ? 'codescan-dark' : 'codescan-light');
    }
  }, [isDark]);

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-obsidian-800/50">
      <Editor
        height="100%"
        language={monacoLanguage}
        value={sourceCode}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="codescan-dark"
        options={{
          fontSize: preferences.editorFontSize,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          fontLigatures: true,
          lineNumbers: preferences.showLineNumbers ? 'on' : 'off',
          wordWrap: preferences.wordWrap ? 'on' : 'off',
          minimap: { enabled: preferences.minimap },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: 'selection',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          padding: { top: 16, bottom: 16 },
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: true,
          parameterHints: { enabled: true },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-obsidian-950">
            <div className="flex items-center gap-3 text-obsidian-400">
              <div className="w-5 h-5 border-2 border-cyber-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
}


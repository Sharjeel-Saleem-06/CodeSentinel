import { create } from 'zustand';
import type { 
  AnalysisResult, 
  AnalysisStatus, 
  Language, 
  AnalysisOptions,
  AnalysisHistoryItem,
  UserPreferences
} from '../types/analysis';

interface AnalysisState {
  // Current analysis
  sourceCode: string;
  language: Language;
  status: AnalysisStatus;
  result: AnalysisResult | null;
  error: string | null;
  
  // Options
  options: AnalysisOptions;
  
  // History
  history: AnalysisHistoryItem[];
  
  // User preferences
  preferences: UserPreferences;
  
  // UI state
  activeTab: 'issues' | 'metrics' | 'security' | 'cfg' | 'rules' | 'ai';
  selectedIssueId: string | null;
  
  // Actions
  setSourceCode: (code: string) => void;
  setLanguage: (language: Language) => void;
  setStatus: (status: AnalysisStatus) => void;
  setResult: (result: AnalysisResult | null) => void;
  setError: (error: string | null) => void;
  setOptions: (options: Partial<AnalysisOptions>) => void;
  addToHistory: (item: AnalysisHistoryItem) => void;
  clearHistory: () => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  setActiveTab: (tab: AnalysisState['activeTab']) => void;
  setSelectedIssueId: (id: string | null) => void;
  reset: () => void;
}

const DEFAULT_CODE = `// Welcome to CodeSentinel! 🛡️
// Paste your code here or start typing to analyze

function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

// Example with potential issues
function fetchUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId; // SQL Injection!
  const password = "admin123"; // Hardcoded credential
  
  if (userId == null) {
    return null;
  }
  
  return executeQuery(query);
}

class UserService {
  constructor() {
    this.apiKey = "sk-1234567890abcdef"; // Exposed API key
  }
  
  async getUser(id) {
    try {
      const response = await fetch(\`/api/users/\${id}\`);
      return response.json();
    } catch (e) {
      console.log(e); // Poor error handling
    }
  }
}
`;

const DEFAULT_OPTIONS: AnalysisOptions = {
  language: 'javascript',
  enableSecurity: true,
  enableMetrics: true,
  enableCFG: true,
  enableAI: true,
  maxIssues: 100,
  severityThreshold: 'info',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  editorFontSize: 14,
  autoAnalyze: false,
  showLineNumbers: true,
  wordWrap: true,
  minimap: true,
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  // Initial state
  sourceCode: DEFAULT_CODE,
  language: 'javascript',
  status: 'idle',
  result: null,
  error: null,
  options: DEFAULT_OPTIONS,
  history: [],
  preferences: DEFAULT_PREFERENCES,
  activeTab: 'issues',
  selectedIssueId: null,
  
  // Actions
  setSourceCode: (code) => set({ sourceCode: code }),
  
  setLanguage: (language) => set({ language }),
  
  setStatus: (status) => set({ status }),
  
  setResult: (result) => set({ result, status: result ? 'complete' : 'idle' }),
  
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  
  setOptions: (options) => set((state) => ({ 
    options: { ...state.options, ...options } 
  })),
  
  addToHistory: (item) => set((state) => ({ 
    history: [item, ...state.history].slice(0, 50) // Keep last 50
  })),
  
  clearHistory: () => set({ history: [] }),
  
  setPreferences: (prefs) => set((state) => ({ 
    preferences: { ...state.preferences, ...prefs } 
  })),
  
  setActiveTab: (activeTab) => set({ activeTab }),
  
  setSelectedIssueId: (selectedIssueId) => set({ selectedIssueId }),
  
  reset: () => set({
    sourceCode: DEFAULT_CODE,
    language: 'javascript',
    status: 'idle',
    result: null,
    error: null,
    activeTab: 'issues',
    selectedIssueId: null,
  }),
}));


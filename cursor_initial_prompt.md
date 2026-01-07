# CURSOR AI - INITIAL PROJECT SETUP PROMPT

## 🎯 PROJECT CONTEXT

I need you to build **CodeScan Pro** - a professional static code analysis platform that combines real compiler-level AST parsing with AI-enhanced explanations. This is NOT a basic AI wrapper; it's an enterprise-grade tool using genuine static analysis techniques.

**Reference Document:** Read the complete technical specification in `PROJECT_SPEC.md` (provided separately) for full architecture details.

---

## 🚀 PHASE 1 TASK: PROJECT FOUNDATION

Create the initial project structure with all necessary configurations, dependencies, and core infrastructure.

---

## 📋 SPECIFIC REQUIREMENTS

### 1. PROJECT INITIALIZATION

**Create a new React + TypeScript project using Vite:**
- Name: `codescan-pro`
- Template: React + TypeScript + SWC (for faster builds)
- Enable strict TypeScript mode
- Configure path aliases (`@/` for src directory)

**Project Structure:**
```
codescan-pro/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── editor/         # Monaco editor wrapper
│   │   ├── analysis/       # Analysis result displays
│   │   └── layout/         # Layout components
│   ├── lib/
│   │   ├── analyzers/      # Core analysis engines
│   │   │   ├── ast/        # AST parsing modules
│   │   │   ├── security/   # Security scanner
│   │   │   ├── metrics/    # Code metrics calculator
│   │   │   └── flow/       # Control flow analyzer
│   │   ├── db/             # Database queries
│   │   ├── api/            # API clients
│   │   └── utils/          # Utility functions
│   ├── workers/            # Web Workers for parsing
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript types
│   └── config/             # Configuration files
├── server/
│   ├── routes/             # Express API routes
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   └── db/                 # Database connection
└── public/                 # Static assets
```

---

### 2. INSTALL ALL DEPENDENCIES

**Core Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "typescript": "^5.3.0",
    
    "// Analysis Libraries": "",
    "@babel/parser": "^7.23.0",
    "@babel/traverse": "^7.23.0",
    "@babel/types": "^7.23.0",
    "acorn": "^8.11.0",
    "esprima": "^4.0.1",
    "eslint": "^8.55.0",
    "@typescript-eslint/parser": "^6.15.0",
    
    "// Editor": "",
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.45.0",
    
    "// UI Libraries": "",
    "tailwindcss": "^3.4.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.300.0",
    "recharts": "^2.10.0",
    "react-flow-renderer": "^10.3.17",
    
    "// Authentication": "",
    "@clerk/clerk-react": "^4.29.0",
    
    "// Backend": "",
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "pg-pool": "^3.6.1",
    "redis": "^4.6.11",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    
    "// Utilities": "",
    "axios": "^1.6.2",
    "zod": "^3.22.4",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/node": "^20.10.5",
    "@types/express": "^4.17.21",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "vite": "^5.0.8",
    "prettier": "^3.1.1",
    "eslint-config-prettier": "^9.1.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  }
}
```

**Install all packages and verify no conflicts.**

---

### 3. CONFIGURATION FILES

**A) TypeScript Configuration (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**B) Tailwind Configuration (`tailwind.config.js`):**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',
        secondary: '#6366F1',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

**C) ESLint Configuration (`.eslintrc.json`):**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react-hooks"],
  "rules": {
    "max-len": ["error", { "code": 100, "ignoreStrings": true }],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

**D) Environment Variables Template (`.env.example`):**
```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Groq API Keys (Load Balancing - Add 3-5 keys)
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...
GROQ_API_KEY_3=gsk_...

# Database
DATABASE_URL=postgresql://localhost:5432/codescan_pro
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codescan_pro
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Cache
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=50
```

**E) Prettier Configuration (`.prettierrc`):**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

---

### 4. DATABASE SETUP

**Create PostgreSQL Database Schema (`server/db/schema.sql`):**

```sql
-- Create database
CREATE DATABASE codescan_pro;

-- Connect to database
\c codescan_pro;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  profile_image_url TEXT,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User statistics
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_analyses INTEGER DEFAULT 0,
  bugs_found INTEGER DEFAULT 0,
  lines_analyzed BIGINT DEFAULT 0,
  time_saved_hours DECIMAL(10,2) DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  last_analysis_at TIMESTAMP
);

-- Analyses table
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code_snippet TEXT NOT NULL,
  language TEXT NOT NULL,
  ast_results JSONB,
  security_findings JSONB,
  metrics JSONB,
  ai_explanation TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved snippets
CREATE TABLE saved_snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  tags TEXT[],
  analysis_id UUID REFERENCES analyses(id),
  saved_at TIMESTAMP DEFAULT NOW()
);

-- Projects (multi-file analysis)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_count INTEGER DEFAULT 0,
  total_lines INTEGER DEFAULT 0,
  languages JSONB,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  last_analyzed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_analyses_language ON analyses(language);
CREATE INDEX idx_snippets_user_id ON saved_snippets(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Create JSONB GIN indexes for fast querying
CREATE INDEX idx_analyses_ast_results ON analyses USING GIN (ast_results);
CREATE INDEX idx_analyses_security_findings ON analyses USING GIN (security_findings);
CREATE INDEX idx_analyses_metrics ON analyses USING GIN (metrics);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Create Database Connection Pool (`server/db/pool.ts`):**
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Database connected');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
  process.exit(-1);
});

export default pool;
```

---

### 5. CLERK AUTHENTICATION SETUP

**Create Auth Provider (`src/components/auth/ClerkProvider.tsx`):**
```typescript
import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';
import { ReactNode } from 'react';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  );
}
```

**Create Protected Route Component (`src/components/auth/ProtectedRoute.tsx`):**
```typescript
import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}
```

---

### 6. EXPRESS SERVER SETUP

**Create Express Server (`server/index.ts`):**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pool from './db/pool';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50'),
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (to be implemented)
// app.use('/api/analyze', analyzeRoutes);
// app.use('/api/snippets', snippetsRoutes);
// app.use('/api/users', usersRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
```

**Add scripts to `package.json`:**
```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "tsx watch server/index.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\"",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

---

### 7. BASIC ROUTING SETUP

**Create App Router (`src/App.tsx`):**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from './components/auth/ClerkProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages (to be created)
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import AnalyzePage from './pages/AnalyzePage';

function App() {
  return (
    <ClerkProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <AnalyzePage />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
```

---

### 8. CREATE PLACEHOLDER PAGES

**Create empty page components in `src/pages/`:**
- `SignInPage.tsx` - Clerk SignIn component wrapper
- `SignUpPage.tsx` - Clerk SignUp component wrapper
- `DashboardPage.tsx` - Main dashboard (stats, recent analyses)
- `AnalyzePage.tsx` - Code editor + analysis interface

Each should export a basic component with a heading indicating the page name.

---

### 9. GROQ API LOAD BALANCER

**Create Groq API Client with Load Balancing (`src/lib/api/groq.ts`):**
```typescript
import axios from 'axios';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class GroqLoadBalancer {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private requestCounts: Map<string, number> = new Map();
  private lastResetTime: Map<string, number> = new Map();
  
  constructor() {
    // Load API keys from environment
    this.apiKeys = [
      process.env.GROQ_API_KEY_1,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
    ].filter(Boolean) as string[];
    
    if (this.apiKeys.length === 0) {
      throw new Error('No Groq API keys configured');
    }
    
    // Initialize counters
    this.apiKeys.forEach(key => {
      this.requestCounts.set(key, 0);
      this.lastResetTime.set(key, Date.now());
    });
  }
  
  private getNextKey(): string {
    // Round-robin with rate limit checking
    const now = Date.now();
    
    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      const key = this.apiKeys[keyIndex];
      
      // Reset counter if 1 minute has passed
      const lastReset = this.lastResetTime.get(key)!;
      if (now - lastReset > 60000) {
        this.requestCounts.set(key, 0);
        this.lastResetTime.set(key, now);
      }
      
      // Check if under rate limit (60 requests/minute)
      const count = this.requestCounts.get(key)!;
      if (count < 60) {
        this.currentKeyIndex = (keyIndex + 1) % this.apiKeys.length;
        this.requestCounts.set(key, count + 1);
        return key;
      }
    }
    
    throw new Error('All API keys have reached rate limit');
  }
  
  async chat(messages: GroqMessage[]): Promise<string> {
    const apiKey = this.getNextKey();
    
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API error:', error);
      throw error;
    }
  }
}

export const groqClient = new GroqLoadBalancer();
```

---

### 10. VERIFICATION CHECKLIST

Before moving to Phase 2, verify:

- [ ] Project created with Vite + React + TypeScript
- [ ] All dependencies installed successfully
- [ ] TypeScript strict mode enabled
- [ ] Tailwind CSS configured and working
- [ ] ESLint and Prettier configured
- [ ] PostgreSQL database created with schema
- [ ] Database connection pool working
- [ ] Clerk authentication integrated
- [ ] Express server running on port 3001
- [ ] React dev server running on port 5173
- [ ] Basic routing working (sign-in, dashboard pages load)
- [ ] Groq API load balancer implemented
- [ ] Environment variables configured
- [ ] No TypeScript errors
- [ ] No console errors in browser

---

## ✅ ACCEPTANCE CRITERIA

The project is ready for Phase 2 when:

1. **Development servers run without errors**
   - `npm run dev` starts Vite on port 5173
   - `npm run dev:server` starts Express on port 3001
   - No TypeScript compilation errors

2. **Authentication works**
   - Can navigate to `/sign-in` and see Clerk UI
   - Protected routes redirect to sign-in when not authenticated
   - After sign-in, can access `/dashboard`

3. **Database connection established**
   - PostgreSQL is running
   - Schema is created
   - Connection pool connects successfully

4. **Code quality tools work**
   - ESLint runs without critical errors
   - Prettier formats code correctly
   - TypeScript strict mode catches type errors

5. **Project structure is clean**
   - All folders created as specified
   - No unused dependencies
   - README.md exists with setup instructions

---

## 📝 NEXT STEPS (Phase 2 Preview)

Once Phase 1 is complete, we'll implement:
- Monaco Editor integration for code input
- Basic AST parser for JavaScript using @babel/parser
- Simple analysis results display
- Web Worker for non-blocking parsing

---

## 🚨 IMPORTANT NOTES FOR CURSOR

1. **Follow TypeScript strictly** - No `any` types, enable all strict checks
2. **Security first** - Never execute user code, only parse and analyze
3. **Performance matters** - Use Web Workers for heavy operations
4. **Code quality** - Write clean, documented, testable code
5. **Error handling** - Wrap all async operations in try-catch
6. **Database security** - Use parameterized queries, never string concatenation

---

**Let's build something production-ready! 🚀**

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />
</p>

<h1 align="center">
  <br>
  <img src="./public/logo.svg" alt="CodeSentinel" width="80">
  <br>
  CodeSentinel
  <br>
</h1>

<h4 align="center">🛡️ AI-Powered Static Code Analysis Platform for Enterprise-Grade Security</h4>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

<p align="center">
  <img src="./docs/screenshot-dashboard.png" alt="CodeSentinel Dashboard" width="800">
</p>

---

## 🎯 Overview

**CodeSentinel** is a comprehensive, AI-powered static code analysis platform designed for developers, security teams, and enterprises. It combines traditional static analysis with cutting-edge AI capabilities to provide deep insights into code quality, security vulnerabilities, and optimization opportunities.

### Why CodeSentinel?

- 🔍 **Deep Analysis**: Goes beyond surface-level linting to understand code semantics
- 🤖 **AI-Powered**: Leverages Llama 3.3 70B for intelligent code reviews
- 🛡️ **Security First**: OWASP Top 10 vulnerability detection out of the box
- 📊 **Visual Insights**: Interactive control flow graphs and metrics dashboards
- 🎨 **Beautiful UI**: Modern, responsive interface with dark/light themes

---

## ✨ Features

### 🔐 Security Analysis
- **OWASP Top 10 Detection**: SQL Injection, XSS, CSRF, and more
- **Secrets Detection**: API keys, passwords, tokens scanning
- **Dependency Vulnerabilities**: Known CVE detection
- **Security Score**: Comprehensive security health metrics

### 📈 Code Quality Metrics
- **Cyclomatic Complexity**: Function and file-level complexity analysis
- **Code Coverage Insights**: Test coverage recommendations
- **Duplication Detection**: Identify copy-paste code patterns
- **Maintainability Index**: Long-term code health scoring

### 🤖 AI-Powered Features
- **Senior Architect Reviews**: Get expert-level code feedback
- **Intelligent Suggestions**: Context-aware improvement recommendations
- **Custom Rule Generation**: Create rules using natural language
- **RAG-Enhanced Analysis**: Documentation-aware code reviews

### 📊 Visualization
- **Control Flow Graphs**: Interactive CFG with class/method hierarchy
- **Dependency Trees**: Visual module dependency mapping
- **Metrics Dashboard**: Real-time analysis statistics
- **Export Reports**: PDF, JSON, CSV export options

### 🌐 Multi-Language Support
Supports 15+ programming languages including:

| Language | Extension | Language | Extension |
|----------|-----------|----------|-----------|
| JavaScript | `.js` | Python | `.py` |
| TypeScript | `.ts`, `.tsx` | Java | `.java` |
| Kotlin | `.kt` | Swift | `.swift` |
| Go | `.go` | Rust | `.rs` |
| C/C++ | `.c`, `.cpp` | C# | `.cs` |
| PHP | `.php` | Ruby | `.rb` |
| Dart | `.dart` | Scala | `.scala` |
| Shell | `.sh` | SQL | `.sql` |

---

## 🚀 Demo

### Live Demo
> Coming soon on Netlify

### Screenshots

<details>
<summary>📸 View Screenshots</summary>

#### Authentication Page
<img src="./docs/auth-page.png" alt="Auth Page" width="600">

#### Dashboard
<img src="./docs/dashboard.png" alt="Dashboard" width="600">

#### Code Analysis
<img src="./docs/analysis.png" alt="Analysis" width="600">

#### Control Flow Graph
<img src="./docs/cfg.png" alt="CFG" width="600">

</details>

---

## 📦 Installation

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Sharjeel-Saleem-06/CodeSentinel.git

# Navigate to project directory
cd CodeSentinel/codescan-pro

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the `codescan-pro` directory:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# AI API (Groq)
VITE_GROQ_API_KEY=your_groq_api_key

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id
```

---

## 🎮 Usage

### Basic Analysis

1. **Upload Code**: Drag & drop files or paste code directly
2. **Select Language**: Auto-detected or manually select
3. **Run Analysis**: Click "Analyze" to start scanning
4. **Review Results**: Explore issues, metrics, and suggestions

### Custom Rules

```typescript
// Example: Create a custom security rule
{
  name: "No Hardcoded Secrets",
  pattern: "(api[_-]?key|secret|password)\\s*[:=]\\s*['\"][^'\"]+['\"]",
  severity: "error",
  message: "Hardcoded secrets detected - use environment variables",
  category: "security"
}
```

### AI Code Review

1. Navigate to the **AI Panel**
2. Select review type:
   - Quick Review
   - Deep Analysis
   - Security Audit
   - Performance Review
3. Get detailed, actionable feedback

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| TailwindCSS | Styling |
| Framer Motion | Animations |
| ReactFlow | Graph Visualization |
| Zustand | State Management |

### Authentication
| Technology | Purpose |
|------------|---------|
| Clerk | Auth Provider |
| OAuth 2.0 | Social Login |

### AI & Analysis
| Technology | Purpose |
|------------|---------|
| Groq API | LLM Inference |
| Llama 3.3 70B | Code Analysis |
| Custom Parsers | AST Analysis |

### DevOps
| Technology | Purpose |
|------------|---------|
| Netlify | Deployment |
| GitHub Actions | CI/CD |
| ESLint | Code Quality |

---

## 🏗️ Architecture

```
codescan-pro/
├── src/
│   ├── components/          # React components
│   │   ├── analysis/        # Analysis panels
│   │   ├── auth/            # Authentication
│   │   ├── ui/              # Shared UI components
│   │   └── visualization/   # CFG & charts
│   ├── context/             # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Core libraries
│   │   ├── analyzers/       # Code analyzers
│   │   └── rules/           # Analysis rules
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── netlify/                 # Netlify deployment config
```

### Data Flow

```
User Input → Parser → AST → Analyzers → Results → UI
                              ↓
                         AI Engine
                              ↓
                      Enhanced Results
```

---

## 🔧 Configuration

### Analysis Rules

Configure analysis rules in `src/lib/rules/`:

```typescript
// Custom rule configuration
export const customRules: Rule[] = [
  {
    id: 'custom-001',
    name: 'No Console Logs',
    pattern: /console\.(log|debug|info)/,
    severity: 'warning',
    languages: ['javascript', 'typescript'],
  },
];
```

### Theme Customization

Modify `tailwind.config.js` for custom themes:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',
        secondary: '#D946EF',
      },
    },
  },
};
```

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Initial Load | < 2s |
| Analysis Speed | ~1000 LOC/sec |
| Bundle Size | < 500KB (gzipped) |
| Lighthouse Score | 95+ |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/CodeSentinel.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

### Code Style

- Follow ESLint configuration
- Use TypeScript strict mode
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Muhammad Sharjeel Saleem**

- GitHub: [@Sharjeel-Saleem-06](https://github.com/Sharjeel-Saleem-06)
- LinkedIn: [@msharjeelsaleem](https://www.linkedin.com/in/msharjeelsaleem/)

---

## 🙏 Acknowledgments

- [Clerk](https://clerk.com) - Authentication
- [Groq](https://groq.com) - AI Infrastructure
- [ReactFlow](https://reactflow.dev) - Graph Visualization
- [TailwindCSS](https://tailwindcss.com) - Styling
- [Lucide](https://lucide.dev) - Icons

---

<p align="center">
  Made with ❤️ by <a href="https://www.linkedin.com/in/msharjeelsaleem/">Muhammad Sharjeel Saleem</a>
</p>

<p align="center">
  <a href="#-overview">Back to Top ↑</a>
</p>

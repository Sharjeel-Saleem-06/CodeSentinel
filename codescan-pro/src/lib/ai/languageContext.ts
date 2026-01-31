/**
 * Language Context Builder
 * Detects language, version, frameworks, and project type
 * Provides rich context for AI-powered analysis
 */

import type { Language } from '../../types/analysis';
import { detectLanguageAdvanced } from '../analyzers/languageDetector';

// ============ TYPES ============

export interface LanguageContext {
  language: Language;
  version?: string;
  frameworks: string[];
  architecture?: string;
  projectType?: string;
  libraries: string[];
  isCliApp: boolean;
  isMobileApp: boolean;
  isWebApp: boolean;
  isLibrary: boolean;
  confidence: number;
}

// ============ FRAMEWORK PATTERNS ============

const FRAMEWORK_PATTERNS: Record<string, Array<{ pattern: RegExp; framework: string; weight: number }>> = {
  kotlin: [
    { pattern: /@Composable/g, framework: 'Jetpack Compose', weight: 10 },
    { pattern: /import\s+androidx\.compose/g, framework: 'Jetpack Compose', weight: 10 },
    { pattern: /import\s+kotlinx\.coroutines/g, framework: 'Kotlin Coroutines', weight: 8 },
    { pattern: /import\s+androidx\.lifecycle/g, framework: 'Android Architecture Components', weight: 8 },
    { pattern: /import\s+dagger\.hilt/g, framework: 'Hilt', weight: 8 },
    { pattern: /import\s+org\.koin/g, framework: 'Koin', weight: 8 },
    { pattern: /import\s+retrofit2/g, framework: 'Retrofit', weight: 7 },
    { pattern: /import\s+io\.ktor/g, framework: 'Ktor', weight: 8 },
    { pattern: /import\s+androidx\.room/g, framework: 'Room Database', weight: 7 },
    { pattern: /import\s+androidx\.navigation/g, framework: 'Navigation Component', weight: 7 },
    { pattern: /StateFlow|MutableStateFlow|SharedFlow/g, framework: 'Kotlin Flow', weight: 8 },
    { pattern: /suspend\s+fun/g, framework: 'Kotlin Coroutines', weight: 5 },
    { pattern: /viewModelScope|lifecycleScope/g, framework: 'Android KTX', weight: 6 },
    { pattern: /@HiltViewModel|@Inject/g, framework: 'Hilt', weight: 8 },
    { pattern: /class\s+\w+\s*:\s*ViewModel\s*\(/g, framework: 'Android ViewModel', weight: 8 },
    { pattern: /AppCompatActivity|FragmentActivity/g, framework: 'AndroidX', weight: 5 },
  ],
  
  swift: [
    { pattern: /import\s+SwiftUI/g, framework: 'SwiftUI', weight: 10 },
    { pattern: /import\s+Combine/g, framework: 'Combine', weight: 8 },
    { pattern: /import\s+UIKit/g, framework: 'UIKit', weight: 8 },
    { pattern: /import\s+Foundation/g, framework: 'Foundation', weight: 3 },
    { pattern: /@State\s+/g, framework: 'SwiftUI', weight: 8 },
    { pattern: /@StateObject\s+/g, framework: 'SwiftUI', weight: 8 },
    { pattern: /@ObservedObject\s+/g, framework: 'SwiftUI', weight: 8 },
    { pattern: /@Published\s+/g, framework: 'Combine', weight: 7 },
    { pattern: /some\s+View/g, framework: 'SwiftUI', weight: 9 },
    { pattern: /import\s+CoreData/g, framework: 'Core Data', weight: 7 },
    { pattern: /import\s+CloudKit/g, framework: 'CloudKit', weight: 6 },
    { pattern: /import\s+Alamofire/g, framework: 'Alamofire', weight: 7 },
    { pattern: /actor\s+\w+/g, framework: 'Swift Concurrency', weight: 8 },
    { pattern: /async\s+throws|await\s+/g, framework: 'Swift Concurrency', weight: 7 },
  ],
  
  python: [
    { pattern: /from\s+fastapi\s+import|import\s+fastapi/g, framework: 'FastAPI', weight: 10 },
    { pattern: /from\s+django\s+|import\s+django/g, framework: 'Django', weight: 10 },
    { pattern: /from\s+flask\s+import|import\s+flask/g, framework: 'Flask', weight: 10 },
    { pattern: /import\s+asyncio/g, framework: 'asyncio', weight: 5 },
    { pattern: /import\s+pandas/g, framework: 'Pandas', weight: 6 },
    { pattern: /import\s+numpy/g, framework: 'NumPy', weight: 6 },
    { pattern: /import\s+tensorflow|from\s+tensorflow/g, framework: 'TensorFlow', weight: 8 },
    { pattern: /import\s+torch|from\s+torch/g, framework: 'PyTorch', weight: 8 },
    { pattern: /from\s+pydantic\s+import/g, framework: 'Pydantic', weight: 7 },
    { pattern: /from\s+sqlalchemy\s+import/g, framework: 'SQLAlchemy', weight: 7 },
    { pattern: /import\s+pytest/g, framework: 'pytest', weight: 5 },
    { pattern: /import\s+requests/g, framework: 'Requests', weight: 4 },
    { pattern: /import\s+aiohttp/g, framework: 'aiohttp', weight: 6 },
    { pattern: /from\s+celery\s+import/g, framework: 'Celery', weight: 7 },
    { pattern: /@app\.(?:get|post|put|delete|patch)/g, framework: 'FastAPI/Flask', weight: 8 },
  ],
  
  javascript: [
    { pattern: /import\s+React|from\s+['"]react['"]/g, framework: 'React', weight: 10 },
    { pattern: /import\s+\{\s*useState|useEffect|useContext/g, framework: 'React Hooks', weight: 8 },
    { pattern: /import\s+.*from\s+['"]vue['"]/g, framework: 'Vue.js', weight: 10 },
    { pattern: /import\s+.*from\s+['"]@angular/g, framework: 'Angular', weight: 10 },
    { pattern: /import\s+express/g, framework: 'Express.js', weight: 9 },
    { pattern: /import\s+.*from\s+['"]next/g, framework: 'Next.js', weight: 10 },
    { pattern: /import\s+.*from\s+['"]svelte/g, framework: 'Svelte', weight: 10 },
    { pattern: /require\(['"]express['"]\)/g, framework: 'Express.js', weight: 9 },
    { pattern: /import\s+\{\s*createApp/g, framework: 'Vue 3', weight: 9 },
    { pattern: /import\s+.*from\s+['"]@nestjs/g, framework: 'NestJS', weight: 10 },
    { pattern: /import\s+.*from\s+['"]redux/g, framework: 'Redux', weight: 8 },
    { pattern: /import\s+.*from\s+['"]zustand/g, framework: 'Zustand', weight: 8 },
    { pattern: /import\s+.*from\s+['"]@tanstack\/react-query/g, framework: 'React Query', weight: 8 },
  ],
  
  typescript: [
    // Inherits from JavaScript plus TypeScript-specific
    { pattern: /import\s+React|from\s+['"]react['"]/g, framework: 'React', weight: 10 },
    { pattern: /import\s+\{\s*useState|useEffect|useContext/g, framework: 'React Hooks', weight: 8 },
    { pattern: /import\s+.*from\s+['"]vue['"]/g, framework: 'Vue.js', weight: 10 },
    { pattern: /import\s+.*from\s+['"]@angular/g, framework: 'Angular', weight: 10 },
    { pattern: /import\s+express/g, framework: 'Express.js', weight: 9 },
    { pattern: /import\s+.*from\s+['"]next/g, framework: 'Next.js', weight: 10 },
    { pattern: /import\s+.*from\s+['"]@nestjs/g, framework: 'NestJS', weight: 10 },
    { pattern: /import\s+type\s*\{/g, framework: 'TypeScript', weight: 5 },
    { pattern: /import\s+.*from\s+['"]zod['"]/g, framework: 'Zod', weight: 7 },
    { pattern: /import\s+.*from\s+['"]trpc/g, framework: 'tRPC', weight: 8 },
    { pattern: /import\s+.*from\s+['"]prisma/g, framework: 'Prisma', weight: 8 },
  ],
  
  csharp: [
    { pattern: /using\s+Microsoft\.AspNetCore/g, framework: 'ASP.NET Core', weight: 10 },
    { pattern: /using\s+Microsoft\.EntityFrameworkCore/g, framework: 'Entity Framework Core', weight: 9 },
    { pattern: /using\s+MediatR/g, framework: 'MediatR', weight: 8 },
    { pattern: /using\s+AutoMapper/g, framework: 'AutoMapper', weight: 7 },
    { pattern: /using\s+FluentValidation/g, framework: 'FluentValidation', weight: 7 },
    { pattern: /using\s+Serilog/g, framework: 'Serilog', weight: 6 },
    { pattern: /\[ApiController\]/g, framework: 'ASP.NET Core Web API', weight: 9 },
    { pattern: /\[HttpGet\]|\[HttpPost\]|\[HttpPut\]|\[HttpDelete\]/g, framework: 'ASP.NET Core Web API', weight: 8 },
    { pattern: /IServiceCollection|IServiceProvider/g, framework: 'Microsoft DI', weight: 7 },
    { pattern: /using\s+Xunit/g, framework: 'xUnit', weight: 5 },
    { pattern: /using\s+Moq/g, framework: 'Moq', weight: 5 },
  ],
  
  java: [
    { pattern: /import\s+org\.springframework/g, framework: 'Spring', weight: 10 },
    { pattern: /@RestController|@Controller|@Service|@Repository/g, framework: 'Spring', weight: 9 },
    { pattern: /@Autowired|@Inject/g, framework: 'Spring DI', weight: 8 },
    { pattern: /import\s+javax\.persistence/g, framework: 'JPA', weight: 8 },
    { pattern: /import\s+jakarta\.persistence/g, framework: 'Jakarta Persistence', weight: 8 },
    { pattern: /import\s+org\.hibernate/g, framework: 'Hibernate', weight: 8 },
    { pattern: /import\s+io\.micronaut/g, framework: 'Micronaut', weight: 10 },
    { pattern: /import\s+io\.quarkus/g, framework: 'Quarkus', weight: 10 },
    { pattern: /import\s+org\.junit/g, framework: 'JUnit', weight: 5 },
    { pattern: /import\s+org\.mockito/g, framework: 'Mockito', weight: 5 },
  ],
  
  go: [
    { pattern: /import\s+"github\.com\/gin-gonic\/gin"/g, framework: 'Gin', weight: 10 },
    { pattern: /import\s+"github\.com\/gofiber\/fiber/g, framework: 'Fiber', weight: 10 },
    { pattern: /import\s+"github\.com\/gorilla\/mux"/g, framework: 'Gorilla Mux', weight: 9 },
    { pattern: /import\s+"github\.com\/labstack\/echo/g, framework: 'Echo', weight: 10 },
    { pattern: /import\s+"gorm\.io\/gorm"/g, framework: 'GORM', weight: 9 },
    { pattern: /import\s+"github\.com\/stretchr\/testify/g, framework: 'Testify', weight: 5 },
  ],
  
  rust: [
    { pattern: /use\s+actix_web/g, framework: 'Actix Web', weight: 10 },
    { pattern: /use\s+rocket/g, framework: 'Rocket', weight: 10 },
    { pattern: /use\s+axum/g, framework: 'Axum', weight: 10 },
    { pattern: /use\s+tokio/g, framework: 'Tokio', weight: 8 },
    { pattern: /use\s+serde/g, framework: 'Serde', weight: 7 },
    { pattern: /use\s+diesel/g, framework: 'Diesel', weight: 8 },
    { pattern: /use\s+sqlx/g, framework: 'SQLx', weight: 8 },
  ],
};

// ============ PROJECT TYPE PATTERNS ============

const PROJECT_TYPE_PATTERNS: Array<{ pattern: RegExp; type: string; language?: string }> = [
  // CLI Applications
  { pattern: /if\s+__name__\s*==\s*['"]__main__['"]/g, type: 'CLI Application', language: 'python' },
  { pattern: /argparse|click\.command|typer\.Typer/g, type: 'CLI Application', language: 'python' },
  { pattern: /fun\s+main\s*\(\s*args:\s*Array<String>/g, type: 'CLI Application', language: 'kotlin' },
  { pattern: /func\s+main\s*\(\s*\)/g, type: 'CLI Application', language: 'go' },
  
  // Mobile Apps
  { pattern: /class\s+\w+\s*:\s*(?:AppCompatActivity|FragmentActivity|Activity)/g, type: 'Android App', language: 'kotlin' },
  { pattern: /class\s+\w+\s*:\s*App\b/g, type: 'SwiftUI App', language: 'swift' },
  { pattern: /import\s+UIKit/g, type: 'iOS App', language: 'swift' },
  { pattern: /import\s+SwiftUI/g, type: 'SwiftUI App', language: 'swift' },
  { pattern: /class\s+\w+\s*extends\s+StatelessWidget|StatefulWidget/g, type: 'Flutter App', language: 'dart' },
  
  // Web APIs
  { pattern: /@RestController|@Controller/g, type: 'Spring Web API', language: 'java' },
  { pattern: /\[ApiController\]/g, type: 'ASP.NET Web API', language: 'csharp' },
  { pattern: /@app\.(get|post|put|delete|patch)/g, type: 'REST API', language: 'python' },
  { pattern: /app\.(get|post|put|delete|patch)\s*\(/g, type: 'Express API' },
  
  // Libraries
  { pattern: /export\s+(?:default\s+)?(?:class|function|const|interface|type)/g, type: 'Library/Module' },
  { pattern: /module\.exports\s*=/g, type: 'Node.js Module' },
  { pattern: /__all__\s*=/g, type: 'Python Package', language: 'python' },
];

// ============ ARCHITECTURE PATTERNS ============

const ARCHITECTURE_PATTERNS: Array<{ pattern: RegExp; architecture: string; language?: string }> = [
  // MVVM
  { pattern: /class\s+\w+ViewModel|ViewModel\s*\(/g, architecture: 'MVVM' },
  { pattern: /@HiltViewModel|viewModelScope/g, architecture: 'MVVM', language: 'kotlin' },
  
  // Clean Architecture
  { pattern: /(?:use_?case|interactor|repository)/gi, architecture: 'Clean Architecture' },
  { pattern: /domain|data|presentation/gi, architecture: 'Layered Architecture' },
  
  // MVC
  { pattern: /class\s+\w+Controller/g, architecture: 'MVC' },
  { pattern: /@Controller|Controller\b/g, architecture: 'MVC' },
  
  // Repository Pattern
  { pattern: /interface\s+\w+Repository|class\s+\w+Repository/g, architecture: 'Repository Pattern' },
  
  // CQRS
  { pattern: /ICommand|IQuery|ICommandHandler|IQueryHandler/g, architecture: 'CQRS', language: 'csharp' },
  { pattern: /IMediator|MediatR/g, architecture: 'CQRS/Mediator', language: 'csharp' },
];

// ============ CONTEXT BUILDER ============

export class LanguageContextBuilder {
  /**
   * Build comprehensive language context from code
   */
  buildContext(code: string, fileName?: string): LanguageContext {
    // Detect language
    const detection = detectLanguageAdvanced(code, fileName);
    const language = detection.language;
    
    // Detect frameworks
    const frameworks = this.detectFrameworks(code, language);
    
    // Detect project type
    const projectType = this.detectProjectType(code, language);
    
    // Detect architecture
    const architecture = this.detectArchitecture(code, language);
    
    // Detect version from syntax features
    const version = this.detectVersion(code, language);
    
    // Detect libraries
    const libraries = this.detectLibraries(code, language);
    
    // Determine app type flags
    const isCliApp = this.isCliApplication(code, language, projectType);
    const isMobileApp = projectType?.includes('App') || projectType?.includes('Mobile') || false;
    const isWebApp = projectType?.includes('API') || projectType?.includes('Web') || false;
    const isLibrary = projectType?.includes('Library') || projectType?.includes('Module') || projectType?.includes('Package') || false;
    
    return {
      language,
      version,
      frameworks,
      architecture,
      projectType,
      libraries,
      isCliApp,
      isMobileApp,
      isWebApp,
      isLibrary,
      confidence: detection.confidence,
    };
  }
  
  /**
   * Detect frameworks used in the code
   */
  private detectFrameworks(code: string, language: Language): string[] {
    const patterns = FRAMEWORK_PATTERNS[language] || [];
    const frameworkScores: Map<string, number> = new Map();
    
    for (const { pattern, framework, weight } of patterns) {
      const matches = code.match(new RegExp(pattern.source, pattern.flags));
      if (matches) {
        const currentScore = frameworkScores.get(framework) || 0;
        frameworkScores.set(framework, currentScore + (matches.length * weight));
      }
    }
    
    // Sort by score and return unique frameworks
    return Array.from(frameworkScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([framework]) => framework);
  }
  
  /**
   * Detect project type
   */
  private detectProjectType(code: string, language: Language): string | undefined {
    for (const { pattern, type, language: lang } of PROJECT_TYPE_PATTERNS) {
      if (lang && lang !== language) continue;
      if (pattern.test(code)) {
        return type;
      }
    }
    return undefined;
  }
  
  /**
   * Detect architecture pattern
   */
  private detectArchitecture(code: string, language: Language): string | undefined {
    const architectureScores: Map<string, number> = new Map();
    
    for (const { pattern, architecture, language: lang } of ARCHITECTURE_PATTERNS) {
      if (lang && lang !== language) continue;
      const matches = code.match(new RegExp(pattern.source, pattern.flags));
      if (matches) {
        const currentScore = architectureScores.get(architecture) || 0;
        architectureScores.set(architecture, currentScore + matches.length);
      }
    }
    
    if (architectureScores.size === 0) return undefined;
    
    // Return highest scoring architecture
    return Array.from(architectureScores.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  /**
   * Detect language version from syntax features
   */
  private detectVersion(code: string, language: Language): string | undefined {
    switch (language) {
      case 'kotlin':
        if (/data\s+object\s+\w+/g.test(code)) return '1.9+';
        if (/value\s+class\s+\w+/g.test(code)) return '1.5+';
        if (/sealed\s+interface/g.test(code)) return '1.5+';
        return undefined;
        
      case 'swift':
        if (/actor\s+\w+/g.test(code)) return '5.5+';
        if (/@MainActor/g.test(code)) return '5.5+';
        if (/some\s+\w+/g.test(code)) return '5.1+';
        return undefined;
        
      case 'python':
        if (/match\s+\w+\s*:/g.test(code)) return '3.10+';
        if (/\|\s*None/g.test(code)) return '3.10+';
        if (/:=/.test(code)) return '3.8+';
        return undefined;
        
      case 'typescript':
        if (/satisfies\s+\w+/g.test(code)) return '4.9+';
        if (/using\s+\w+\s*=/g.test(code)) return '5.2+';
        return undefined;
        
      default:
        return undefined;
    }
  }
  
  /**
   * Detect libraries from imports
   */
  private detectLibraries(code: string, language: Language): string[] {
    const libraries: Set<string> = new Set();
    
    // Common import patterns
    const importPatterns: Record<string, RegExp> = {
      kotlin: /import\s+([\w.]+)/g,
      swift: /import\s+(\w+)/g,
      python: /(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/g,
      javascript: /(?:import\s+.*from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g,
      typescript: /(?:import\s+.*from\s+['"]([^'"]+)['"])/g,
      java: /import\s+([\w.]+)/g,
      csharp: /using\s+([\w.]+)/g,
      go: /import\s+"([^"]+)"/g,
      rust: /use\s+([\w:]+)/g,
    };
    
    const pattern = importPatterns[language];
    if (!pattern) return [];
    
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const lib = match[1] || match[2];
      if (lib) {
        // Extract root package name
        const rootPkg = lib.split(/[./]/)[0];
        if (rootPkg && !['std', 'self', 'super', 'crate'].includes(rootPkg)) {
          libraries.add(rootPkg);
        }
      }
    }
    
    return Array.from(libraries);
  }
  
  /**
   * Determine if this is a CLI application
   */
  private isCliApplication(code: string, language: Language, projectType?: string): boolean {
    if (projectType?.includes('CLI')) return true;
    
    switch (language) {
      case 'python':
        return /if\s+__name__\s*==\s*['"]__main__['"]/.test(code) ||
               /argparse|click|typer/.test(code);
      case 'go':
        return /func\s+main\s*\(\s*\)/.test(code);
      case 'rust':
        return /fn\s+main\s*\(\s*\)/.test(code);
      default:
        return false;
    }
  }
}

// ============ SINGLETON INSTANCE ============

export const contextBuilder = new LanguageContextBuilder();

// ============ CONVENIENCE FUNCTION ============

export function buildLanguageContext(code: string, fileName?: string): LanguageContext {
  return contextBuilder.buildContext(code, fileName);
}

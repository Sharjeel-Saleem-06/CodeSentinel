/**
 * AI-Powered Code Detection System
 * Uses AI for intelligent code analysis and issue detection
 * 
 * This module integrates AI at the detection layer, not just explanations.
 * It provides:
 * 1. Language-aware analysis
 * 2. Context-sensitive detection
 * 3. False positive validation
 * 4. Architecture pattern recognition
 */

import { aiEngine } from './aiProviders';
import type { CodeIssue } from '../../types/analysis';
import type { LanguageContext } from './languageContext';

// ============ TYPES ============

export interface AIDetectionResult {
  issues: AIDetectedIssue[];
  securityFindings: AISecurityFinding[];
  architectureInsights: ArchitectureInsight[];
  codeQuality: CodeQualityAssessment;
  confidence: number;
}

export interface AIDetectedIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  line?: number;
  endLine?: number;
  suggestion: string;
  codeExample?: string;
  languageSpecific: boolean;
  confidence: number;
  falsePositiveRisk: 'low' | 'medium' | 'high';
}

export interface AISecurityFinding {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  line?: number;
  cwe?: string;
  owasp?: string;
  recommendation: string;
  confidence: number;
}

export interface ArchitectureInsight {
  pattern: string;
  compliance: 'good' | 'partial' | 'violation';
  details: string;
  recommendations: string[];
}

export interface CodeQualityAssessment {
  overall: number; // 0-100
  maintainability: number;
  reliability: number;
  security: number;
  performance: number;
  languageIdiomatic: number;
  summary: string;
}

// ============ DETECTION PROMPTS ============

const DETECTION_SYSTEM_PROMPTS: Record<string, string> = {
  kotlin: `You are an expert Kotlin and Android developer with deep knowledge of:
- Kotlin coroutines and Flow
- Jetpack Compose state management
- Android lifecycle and memory management
- MVVM and Clean Architecture patterns
- Kotlin null safety and idioms

CRITICAL RULES:
- DO NOT suggest JavaScript patterns (===, !=, var/let/const)
- Kotlin's == is value equality (correct), === is reference equality (different from JS!)
- 'by lazy' is IDIOMATIC Kotlin delegation, NOT an anti-pattern
- UI padding/margin numbers are NORMAL in Android, not magic numbers
- Consider Android lifecycle - not everything needs onDestroy cleanup

Analyze code for KOTLIN-SPECIFIC issues only.`,

  swift: `You are an expert Swift and iOS developer with deep knowledge of:
- SwiftUI property wrappers (@State, @StateObject, @Binding, etc.)
- Swift concurrency (async/await, actors)
- Memory management (ARC, retain cycles, weak/unowned)
- MVVM and Coordinator patterns
- Swift idioms and best practices

CRITICAL RULES:
- DO NOT suggest JavaScript or Python patterns
- 'guard let' with early return is IDIOMATIC Swift
- Optional chaining (?.) is the correct pattern
- SwiftUI uses declarative patterns different from UIKit

Analyze code for SWIFT-SPECIFIC issues only.`,

  python: `You are an expert Python developer with deep knowledge of:
- Python type hints and typing module
- Async/await with asyncio
- Python idioms (list comprehensions, generators, context managers)
- FastAPI, Django, Flask frameworks
- Python security best practices

CRITICAL RULES:
- Python has NO === operator! Do not suggest it.
- print() is VALID in CLI applications, not a debug statement
- 'password = getpass.getpass()' is user INPUT, not a hardcoded password
- Type hints are optional in small scripts

Analyze code for PYTHON-SPECIFIC issues only.`,

  java: `You are an expert Java developer with deep knowledge of:
- Java streams and lambdas
- Spring Boot and dependency injection
- Java memory management and GC
- Design patterns and SOLID principles
- Java security best practices

Analyze code for JAVA-SPECIFIC issues only.`,

  csharp: `You are an expert C# and .NET developer with deep knowledge of:
- Async/await patterns and Task
- ASP.NET Core and dependency injection
- LINQ and Entity Framework
- Memory management and IDisposable
- C# security best practices

CRITICAL RULES:
- async void is dangerous except for event handlers
- ConfigureAwait(false) for library code
- Understand scoped vs singleton DI lifetimes

Analyze code for C#-SPECIFIC issues only.`,

  default: `You are an expert code reviewer. Analyze the code for:
- Security vulnerabilities
- Performance issues
- Code quality problems
- Best practice violations

Be language-aware and do not apply rules from other languages.`
};

// ============ AI DETECTION ENGINE ============

export class AIDetector {
  /**
   * Run AI-powered detection on code
   */
  async detectIssues(
    code: string,
    context: LanguageContext,
    existingIssues?: CodeIssue[]
  ): Promise<AIDetectionResult> {
    const systemPrompt = DETECTION_SYSTEM_PROMPTS[context.language] || DETECTION_SYSTEM_PROMPTS.default;
    
    const userPrompt = this.buildDetectionPrompt(code, context, existingIssues);
    
    try {
      const response = await aiEngine.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 4096,
      });
      
      return this.parseDetectionResponse(response, context);
    } catch (error) {
      console.error('[AIDetector] Detection failed:', error);
      return this.getEmptyResult();
    }
  }
  
  /**
   * Validate existing issues for false positives
   */
  async validateIssues(
    issues: CodeIssue[],
    code: string,
    context: LanguageContext
  ): Promise<CodeIssue[]> {
    if (issues.length === 0) return [];
    
    const systemPrompt = `You are a code review expert specializing in ${context.language}.
Your task is to validate detected issues and identify FALSE POSITIVES.

A FALSE POSITIVE is when:
1. The issue doesn't apply to this language (e.g., === suggested for Python)
2. The pattern is actually idiomatic for this language/framework
3. The context makes the "issue" actually correct code
4. The detection misunderstood what the code does

Be STRICT about identifying false positives. Better to let a real issue through than flag correct code.`;

    const issueList = issues.slice(0, 10).map((issue, i) => 
      `${i + 1}. [${issue.severity}] ${issue.title} (Line ${issue.location?.line || 'unknown'})\n   ${issue.description}\n   Code: ${issue.codeSnippet || 'N/A'}`
    ).join('\n\n');
    
    const userPrompt = `Language: ${context.language}
Frameworks: ${context.frameworks?.join(', ') || 'None detected'}
Project Type: ${context.projectType || 'Unknown'}

CODE:
\`\`\`${context.language}
${code.slice(0, 2000)}
\`\`\`

DETECTED ISSUES TO VALIDATE:
${issueList}

For each issue, respond with EXACTLY this JSON format:
{
  "validations": [
    {
      "issueIndex": 1,
      "isValid": true/false,
      "reason": "Why this is valid or a false positive",
      "confidence": 0-100
    }
  ]
}

Be especially careful about:
- ${context.language === 'kotlin' ? 'JavaScript rules being wrongly applied' : ''}
- ${context.language === 'python' ? '=== operator (Python has no ===!)' : ''}
- ${context.language === 'swift' ? 'Guard statements and early returns (they are idiomatic!)' : ''}
- UI values being flagged as magic numbers in mobile apps
- print/console being flagged in CLI applications`;

    try {
      const response = await aiEngine.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.2,
        maxTokens: 2048,
      });
      
      const validations = this.parseValidationResponse(response);
      
      // Filter out issues that AI marked as false positives
      return issues.filter((issue, index) => {
        const validation = validations.find(v => v.issueIndex === index + 1);
        if (validation && !validation.isValid && validation.confidence > 70) {
          console.log(`[AIDetector] Filtered false positive: ${issue.title} - ${validation.reason}`);
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('[AIDetector] Validation failed:', error);
      return issues; // Return original issues if validation fails
    }
  }
  
  /**
   * Analyze architecture patterns
   */
  async analyzeArchitecture(
    code: string,
    context: LanguageContext
  ): Promise<ArchitectureInsight[]> {
    const systemPrompt = `You are a software architect specializing in ${context.language} applications.
Analyze the code for architecture patterns and best practices.

For ${context.language}, look for:
${context.language === 'kotlin' ? '- MVVM pattern compliance\n- Clean Architecture layers\n- Hilt/Koin dependency injection\n- Repository pattern\n- ViewModel usage' : ''}
${context.language === 'swift' ? '- MVVM or VIPER patterns\n- Coordinator pattern\n- SwiftUI state management\n- Protocol-oriented design' : ''}
${context.language === 'csharp' ? '- Clean Architecture\n- CQRS/Mediator pattern\n- Repository pattern\n- DI configuration' : ''}
${context.language === 'python' ? '- Layered architecture\n- Dependency injection\n- Framework structure (FastAPI, Django)' : ''}`;

    const userPrompt = `Analyze architecture patterns in this ${context.language} code:

\`\`\`${context.language}
${code.slice(0, 3000)}
\`\`\`

Respond with JSON:
{
  "insights": [
    {
      "pattern": "Pattern name",
      "compliance": "good|partial|violation",
      "details": "Explanation",
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }
  ]
}`;

    try {
      const response = await aiEngine.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.5,
        maxTokens: 2048,
      });
      
      return this.parseArchitectureResponse(response);
    } catch (error) {
      console.error('[AIDetector] Architecture analysis failed:', error);
      return [];
    }
  }
  
  /**
   * Get code quality assessment
   */
  async assessQuality(
    code: string,
    context: LanguageContext,
    issues: CodeIssue[]
  ): Promise<CodeQualityAssessment> {
    const systemPrompt = `You are a code quality expert for ${context.language}.
Provide a balanced, fair assessment of code quality.

Consider:
- Language idioms and best practices
- Security posture
- Maintainability and readability
- Performance characteristics
- Framework-specific patterns

Don't be overly harsh on small scripts or prototypes.`;

    const userPrompt = `Assess the quality of this ${context.language} code:

\`\`\`${context.language}
${code.slice(0, 2000)}
\`\`\`

Issues found: ${issues.length}
- Critical: ${issues.filter(i => i.severity === 'critical').length}
- High: ${issues.filter(i => i.severity === 'high').length}
- Medium: ${issues.filter(i => i.severity === 'medium').length}
- Low: ${issues.filter(i => i.severity === 'low' || i.severity === 'info').length}

Respond with EXACTLY this JSON format:
{
  "overall": 75,
  "maintainability": 80,
  "reliability": 70,
  "security": 85,
  "performance": 75,
  "languageIdiomatic": 80,
  "summary": "Brief 2-3 sentence summary"
}

Scores are 0-100 where:
- 90-100: Excellent
- 80-89: Good
- 70-79: Acceptable
- 60-69: Needs improvement
- Below 60: Poor`;

    try {
      const response = await aiEngine.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.3,
        maxTokens: 1024,
      });
      
      return this.parseQualityResponse(response);
    } catch (error) {
      console.error('[AIDetector] Quality assessment failed:', error);
      return this.getDefaultQualityAssessment();
    }
  }
  
  // ============ PRIVATE METHODS ============
  
  private buildDetectionPrompt(
    code: string,
    context: LanguageContext,
    existingIssues?: CodeIssue[]
  ): string {
    const existingIssuesList = existingIssues && existingIssues.length > 0
      ? `\n\nALREADY DETECTED (by static analyzer):\n${existingIssues.slice(0, 5).map(i => `- ${i.title}`).join('\n')}`
      : '';
    
    return `Analyze this ${context.language} code for issues.

CONTEXT:
- Language: ${context.language} ${context.version || ''}
- Frameworks: ${context.frameworks?.join(', ') || 'None detected'}
- Project Type: ${context.projectType || 'Unknown'}
- Architecture: ${context.architecture || 'Unknown'}
${existingIssuesList}

CODE:
\`\`\`${context.language}
${code.slice(0, 4000)}
\`\`\`

Find issues that the static analyzer might miss. Focus on:
1. ${context.language}-specific anti-patterns
2. Framework misuse (${context.frameworks?.join(', ') || 'N/A'})
3. Architecture violations
4. Subtle security issues
5. Performance problems

DO NOT report:
- Issues already in the "ALREADY DETECTED" list
- Generic issues that don't apply to ${context.language}
- Style preferences that are actually acceptable

Respond with EXACTLY this JSON format:
{
  "issues": [
    {
      "title": "Issue title",
      "description": "Clear explanation",
      "severity": "critical|high|medium|low|info",
      "category": "security|performance|architecture|best-practice|style",
      "line": 10,
      "suggestion": "How to fix",
      "codeExample": "Fixed code example if applicable",
      "languageSpecific": true,
      "confidence": 85,
      "falsePositiveRisk": "low|medium|high"
    }
  ],
  "securityFindings": [
    {
      "type": "Vulnerability type",
      "severity": "critical|high|medium|low",
      "description": "Description",
      "line": 15,
      "cwe": "CWE-XXX",
      "owasp": "A01:2021",
      "recommendation": "How to fix",
      "confidence": 90
    }
  ]
}

If no issues found, return empty arrays.`;
  }
  
  private parseDetectionResponse(response: string, context: LanguageContext): AIDetectionResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.warn('[AIDetector] No JSON found in response');
        return this.getEmptyResult();
      }
      
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const data = JSON.parse(jsonStr);
      
      const issues: AIDetectedIssue[] = (data.issues || []).map((issue: any, i: number) => ({
        id: `ai-${context.language}-${i}-${Date.now()}`,
        title: issue.title || 'Unknown Issue',
        description: issue.description || '',
        severity: this.normalizeSeverity(issue.severity),
        category: issue.category || 'best-practice',
        line: issue.line,
        endLine: issue.endLine,
        suggestion: issue.suggestion || '',
        codeExample: issue.codeExample,
        languageSpecific: issue.languageSpecific ?? true,
        confidence: issue.confidence || 70,
        falsePositiveRisk: issue.falsePositiveRisk || 'medium',
      }));
      
      const securityFindings: AISecurityFinding[] = (data.securityFindings || []).map((finding: any) => ({
        type: finding.type || 'Security Issue',
        severity: this.normalizeSeverity(finding.severity),
        description: finding.description || '',
        line: finding.line,
        cwe: finding.cwe,
        owasp: finding.owasp,
        recommendation: finding.recommendation || '',
        confidence: finding.confidence || 70,
      }));
      
      return {
        issues: issues.filter(i => i.confidence >= 60), // Only include high-confidence issues
        securityFindings: securityFindings.filter(f => f.confidence >= 70),
        architectureInsights: [],
        codeQuality: this.getDefaultQualityAssessment(),
        confidence: issues.length > 0 ? Math.round(issues.reduce((a, b) => a + b.confidence, 0) / issues.length) : 0,
      };
    } catch (error) {
      console.error('[AIDetector] Failed to parse response:', error);
      return this.getEmptyResult();
    }
  }
  
  private parseValidationResponse(response: string): Array<{ issueIndex: number; isValid: boolean; reason: string; confidence: number }> {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) return [];
      
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const data = JSON.parse(jsonStr);
      
      return data.validations || [];
    } catch (error) {
      console.error('[AIDetector] Failed to parse validation:', error);
      return [];
    }
  }
  
  private parseArchitectureResponse(response: string): ArchitectureInsight[] {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) return [];
      
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const data = JSON.parse(jsonStr);
      
      return (data.insights || []).map((insight: any) => ({
        pattern: insight.pattern || 'Unknown',
        compliance: insight.compliance || 'partial',
        details: insight.details || '',
        recommendations: insight.recommendations || [],
      }));
    } catch (error) {
      console.error('[AIDetector] Failed to parse architecture:', error);
      return [];
    }
  }
  
  private parseQualityResponse(response: string): CodeQualityAssessment {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) return this.getDefaultQualityAssessment();
      
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const data = JSON.parse(jsonStr);
      
      return {
        overall: this.clamp(data.overall || 70, 0, 100),
        maintainability: this.clamp(data.maintainability || 70, 0, 100),
        reliability: this.clamp(data.reliability || 70, 0, 100),
        security: this.clamp(data.security || 70, 0, 100),
        performance: this.clamp(data.performance || 70, 0, 100),
        languageIdiomatic: this.clamp(data.languageIdiomatic || 70, 0, 100),
        summary: data.summary || 'Code quality assessment completed.',
      };
    } catch (error) {
      console.error('[AIDetector] Failed to parse quality:', error);
      return this.getDefaultQualityAssessment();
    }
  }
  
  private normalizeSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const s = (severity || '').toLowerCase();
    if (s === 'critical' || s === 'error') return 'critical';
    if (s === 'high' || s === 'warning') return 'high';
    if (s === 'medium') return 'medium';
    if (s === 'low') return 'low';
    return 'info';
  }
  
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
  
  private getEmptyResult(): AIDetectionResult {
    return {
      issues: [],
      securityFindings: [],
      architectureInsights: [],
      codeQuality: this.getDefaultQualityAssessment(),
      confidence: 0,
    };
  }
  
  private getDefaultQualityAssessment(): CodeQualityAssessment {
    return {
      overall: 70,
      maintainability: 70,
      reliability: 70,
      security: 70,
      performance: 70,
      languageIdiomatic: 70,
      summary: 'Unable to complete full quality assessment.',
    };
  }
}

// ============ SINGLETON INSTANCE ============

export const aiDetector = new AIDetector();

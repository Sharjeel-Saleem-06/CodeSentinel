/**
 * Groq AI Service
 * Provides AI-powered code explanations using Groq's Llama 3.3 70B model
 * 
 * IMPORTANT: AI is used ONLY for explanations, NOT for primary analysis
 * All bug detection and security scanning is done by deterministic analyzers
 */

import { groqKeyManager, GROQ_CONFIG } from './groqConfig';
import type { AnalysisResult, CodeIssue } from '../../types/analysis';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Make a request to Groq API with automatic retry and key rotation
 */
async function makeGroqRequest(
  messages: GroqMessage[],
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = groqKeyManager.getNextKey();

    try {
      const response = await fetch(GROQ_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          messages,
          temperature: GROQ_CONFIG.temperature,
          max_tokens: GROQ_CONFIG.maxTokens,
        }),
      });

      if (response.status === 429) {
        // Rate limited - mark key and retry with different key
        groqKeyManager.markRateLimited(apiKey);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      lastError = error as Error;
      // If it's a network error, try again with a different key
      if (attempt < maxRetries - 1) {
        groqKeyManager.markRateLimited(apiKey);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to get response from Groq API');
}

/**
 * Generate a comprehensive code analysis explanation
 */
export async function generateAnalysisExplanation(
  result: AnalysisResult
): Promise<string> {
  const systemPrompt = `You are an expert code reviewer and security analyst. Your task is to explain code analysis results in a clear, professional, and actionable way.

Guidelines:
- Be concise but thorough
- Focus on the most critical issues first
- Provide specific, actionable recommendations
- Use technical terms appropriately but explain complex concepts
- Format your response with clear sections using markdown
- Do NOT make up issues - only explain what was found by the static analyzer
- Be encouraging while being honest about problems`;

  const issuesSummary = result.issues.slice(0, 10).map(issue => 
    `- [${issue.severity.toUpperCase()}] ${issue.title}: ${issue.description} (Line ${issue.location.line})`
  ).join('\n');

  const userPrompt = `Analyze and explain the following code analysis results:

**Language:** ${result.language}
**Total Issues Found:** ${result.issues.length}
**Security Risk Score:** ${result.security.riskScore}/100
**Maintainability Index:** ${result.metrics?.maintainabilityIndex?.toFixed(1) || 'N/A'}/100
**Cyclomatic Complexity:** ${result.metrics?.cyclomaticComplexity || 'N/A'}

**Code Structure:**
- Functions: ${result.functions.length}
- Classes: ${result.classes.length}
- Imports: ${result.imports.length}
- Lines of Code: ${result.metrics?.codeLines || 'N/A'}

**Top Issues:**
${issuesSummary || 'No issues found'}

**Security Findings:**
- Critical: ${result.issues.filter(i => i.severity === 'critical').length}
- High: ${result.issues.filter(i => i.severity === 'high').length}
- Medium: ${result.issues.filter(i => i.severity === 'medium').length}
- Low: ${result.issues.filter(i => i.severity === 'low').length}

Please provide:
1. **Executive Summary** - A brief overview of the code quality
2. **Critical Issues** - Detailed explanation of the most important problems
3. **Security Assessment** - Analysis of security vulnerabilities
4. **Recommendations** - Prioritized list of improvements
5. **Positive Aspects** - What the code does well (if applicable)`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return makeGroqRequest(messages);
}

/**
 * Generate explanation for a specific issue
 */
export async function explainIssue(issue: CodeIssue, codeContext?: string): Promise<string> {
  const systemPrompt = `You are an expert code reviewer. Explain the following code issue in detail, including why it's a problem, potential consequences, and how to fix it. Be concise but thorough.`;

  const userPrompt = `Explain this code issue:

**Issue:** ${issue.title}
**Severity:** ${issue.severity}
**Category:** ${issue.category}
**Location:** Line ${issue.location.line}
**Description:** ${issue.description}
${issue.cwe ? `**CWE:** ${issue.cwe.id} - ${issue.cwe.name}` : ''}
${issue.owasp ? `**OWASP:** ${issue.owasp.id} - ${issue.owasp.name}` : ''}

${codeContext ? `**Code Context:**\n\`\`\`\n${codeContext}\n\`\`\`` : ''}

Provide:
1. Why this is a problem
2. Potential security/performance impact
3. How to fix it with a code example
4. Best practices to prevent this`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return makeGroqRequest(messages);
}

/**
 * Generate code improvement suggestions
 */
export async function generateImprovementSuggestions(
  code: string,
  language: string,
  issues: CodeIssue[]
): Promise<string> {
  const systemPrompt = `You are an expert code reviewer. Suggest specific improvements for the given code based on the issues found. Provide refactored code examples where appropriate.`;

  const issuesList = issues.slice(0, 5).map(i => 
    `- ${i.title} (${i.severity}): ${i.description}`
  ).join('\n');

  const userPrompt = `Suggest improvements for this ${language} code:

\`\`\`${language}
${code.slice(0, 2000)}${code.length > 2000 ? '\n// ... (truncated)' : ''}
\`\`\`

**Issues Found:**
${issuesList}

Provide:
1. Specific code fixes for the top issues
2. Refactored code examples
3. General improvement suggestions
4. Security hardening recommendations`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return makeGroqRequest(messages);
}

/**
 * Chat with AI about the code
 */
export async function chatAboutCode(
  code: string,
  question: string,
  analysisContext?: AnalysisResult
): Promise<string> {
  const systemPrompt = `You are an expert code assistant. Answer questions about the provided code clearly and accurately. If you reference specific issues, mention the line numbers. Be helpful and educational.`;

  let contextInfo = '';
  if (analysisContext) {
    contextInfo = `
**Analysis Context:**
- Language: ${analysisContext.language}
- Issues Found: ${analysisContext.issues.length}
- Security Risk: ${analysisContext.security.riskScore}/100
- Complexity: ${analysisContext.metrics?.cyclomaticComplexity || 'N/A'}
`;
  }

  const userPrompt = `**Code:**
\`\`\`
${code.slice(0, 3000)}${code.length > 3000 ? '\n// ... (truncated)' : ''}
\`\`\`
${contextInfo}
**Question:** ${question}`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return makeGroqRequest(messages);
}

/**
 * Get API status
 */
export function getApiStatus() {
  return groqKeyManager.getStatus();
}

/**
 * General-purpose AI query for custom prompts
 */
export async function queryAI(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const defaultSystemPrompt = `You are an expert code analyst and software architect. 
Provide detailed, accurate, and actionable responses.
Format your response with clear sections using markdown when appropriate.
Be concise but thorough.`;

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt || defaultSystemPrompt },
    { role: 'user', content: prompt },
  ];

  return makeGroqRequest(messages);
}

/**
 * Stream AI response for real-time output
 */
export async function streamAIResponse(
  messages: GroqMessage[],
  onUpdate: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  const apiKey = groqKeyManager.getNextKey();

  try {
    const response = await fetch(GROQ_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_CONFIG.model,
        messages,
        temperature: GROQ_CONFIG.temperature,
        max_tokens: GROQ_CONFIG.maxTokens,
        stream: true,
      }),
    });

    if (response.status === 429) {
      groqKeyManager.markRateLimited(apiKey);
      onError('Rate limited. Please try again in a moment.');
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      onError(`API error: ${response.status} - ${errorText}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('No response body');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onUpdate(content);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    groqKeyManager.markRateLimited(apiKey);
    onError(error instanceof Error ? error.message : 'Unknown error');
  }
}


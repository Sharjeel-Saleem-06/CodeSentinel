/**
 * AST Parser - Phase 2: Syntax Analysis
 * Uses @babel/parser for JavaScript/TypeScript AST generation
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import type * as t from '@babel/types';
import type { 
  ASTNode, 
  FunctionInfo, 
  ClassInfo, 
  ImportInfo, 
  VariableInfo,
  ParameterInfo,
  PropertyInfo,
  SourceLocation,
  Language
} from '../../types/analysis';

// Parser options for different languages
const getParserOptions = (language: Language): parser.ParserOptions => {
  const baseOptions: parser.ParserOptions = {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    allowSuperOutsideMethod: true,
    allowUndeclaredExports: true,
    errorRecovery: true,
    plugins: [
      'jsx',
      'asyncGenerators',
      'classProperties',
      'classPrivateProperties',
      'classPrivateMethods',
      'dynamicImport',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'nullishCoalescingOperator',
      'numericSeparator',
      'objectRestSpread',
      'optionalCatchBinding',
      'optionalChaining',
      'topLevelAwait',
      'decorators-legacy',
    ],
  };

  if (language === 'typescript') {
    baseOptions.plugins = [
      ...(baseOptions.plugins || []),
      'typescript',
    ];
  }

  return baseOptions;
};

// Convert Babel location to our SourceLocation
const toSourceLocation = (loc: t.SourceLocation | null | undefined): SourceLocation => {
  if (!loc) {
    return { line: 1, column: 0 };
  }
  return {
    line: loc.start.line,
    column: loc.start.column,
    endLine: loc.end.line,
    endColumn: loc.end.column,
  };
};

// Extract parameter info from function parameters
const extractParameters = (params: (t.Identifier | t.Pattern | t.RestElement | t.TSParameterProperty)[]): ParameterInfo[] => {
  return params.map((param): ParameterInfo => {
    if (param.type === 'Identifier') {
      return {
        name: param.name,
        type: param.typeAnnotation ? 'annotated' : undefined,
        isOptional: param.optional || false,
        isRest: false,
      };
    }
    if (param.type === 'RestElement' && param.argument.type === 'Identifier') {
      return {
        name: param.argument.name,
        isOptional: false,
        isRest: true,
      };
    }
    if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
      return {
        name: param.left.name,
        defaultValue: 'default',
        isOptional: true,
        isRest: false,
      };
    }
    return {
      name: 'unknown',
      isOptional: false,
      isRest: false,
    };
  });
};

// Parse result type
export interface ParseResult {
  ast: t.File;
  astTree: ASTNode;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: ImportInfo[];
  variables: VariableInfo[];
  errors: string[];
}

/**
 * Parse source code into AST and extract structural information
 */
export function parseCode(code: string, language: Language = 'javascript'): ParseResult {
  const errors: string[] = [];
  const functions: FunctionInfo[] = [];
  const classes: ClassInfo[] = [];
  const imports: ImportInfo[] = [];
  const variables: VariableInfo[] = [];
  const variableUsages: Map<string, SourceLocation[]> = new Map();

  let ast: t.File;
  
  try {
    ast = parser.parse(code, getParserOptions(language));
  } catch (e) {
    const error = e as Error;
    errors.push(`Parse error: ${error.message}`);
    // Return empty result on parse failure
    return {
      ast: { type: 'File', program: { type: 'Program', body: [], sourceType: 'module', directives: [] } } as t.File,
      astTree: { type: 'Program', location: { line: 1, column: 0 } },
      functions: [],
      classes: [],
      imports: [],
      variables: [],
      errors,
    };
  }

  // Traverse AST to extract information
  traverse(ast, {
    // Functions
    FunctionDeclaration(path) {
      const node = path.node;
      if (node.id) {
        functions.push({
          name: node.id.name,
          location: toSourceLocation(node.loc),
          parameters: extractParameters(node.params),
          isAsync: node.async,
          isGenerator: node.generator,
          isExported: path.parent.type === 'ExportNamedDeclaration' || path.parent.type === 'ExportDefaultDeclaration',
          complexity: 1, // Will be calculated separately
          linesOfCode: (node.loc?.end.line || 1) - (node.loc?.start.line || 1) + 1,
        });
      }
    },

    // Arrow functions and function expressions
    VariableDeclarator(path) {
      const node = path.node;
      if (node.id.type === 'Identifier') {
        const init = node.init;
        
        if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression') {
          functions.push({
            name: node.id.name,
            location: toSourceLocation(node.loc),
            parameters: extractParameters(init.params),
            isAsync: init.async,
            isGenerator: init.type === 'FunctionExpression' ? init.generator : false,
            isExported: false,
            complexity: 1,
            linesOfCode: (init.loc?.end.line || 1) - (init.loc?.start.line || 1) + 1,
          });
        } else {
          // Regular variable
          const parent = path.parentPath?.node as t.VariableDeclaration;
          const kind = parent?.kind;
          const validKind: 'var' | 'let' | 'const' = 
            kind === 'var' || kind === 'let' || kind === 'const' ? kind : 'var';
          variables.push({
            name: node.id.name,
            kind: validKind,
            location: toSourceLocation(node.loc),
            usages: [],
            isUnused: true, // Will be updated during usage tracking
          });
        }
      }
    },

    // Classes
    ClassDeclaration(path) {
      const node = path.node;
      if (node.id) {
        const methods: FunctionInfo[] = [];
        const properties: PropertyInfo[] = [];

        node.body.body.forEach((member) => {
          if (member.type === 'ClassMethod') {
            const methodName = member.key.type === 'Identifier' ? member.key.name : 'computed';
            methods.push({
              name: methodName,
              location: toSourceLocation(member.loc),
              parameters: extractParameters(member.params),
              isAsync: member.async,
              isGenerator: member.generator,
              isExported: false,
              complexity: 1,
              linesOfCode: (member.loc?.end.line || 1) - (member.loc?.start.line || 1) + 1,
            });
          } else if (member.type === 'ClassProperty') {
            const propName = member.key.type === 'Identifier' ? member.key.name : 'computed';
            properties.push({
              name: propName,
              visibility: member.accessibility || 'public',
              isStatic: member.static,
              isReadonly: member.readonly || false,
            });
          }
        });

        classes.push({
          name: node.id.name,
          location: toSourceLocation(node.loc),
          superClass: node.superClass?.type === 'Identifier' ? node.superClass.name : undefined,
          methods,
          properties,
          isAbstract: node.abstract || false,
          isExported: path.parent.type === 'ExportNamedDeclaration' || path.parent.type === 'ExportDefaultDeclaration',
        });
      }
    },

    // Imports
    ImportDeclaration(path) {
      const node = path.node;
      const specifiers: string[] = [];
      let isDefault = false;
      let isNamespace = false;

      node.specifiers.forEach((spec) => {
        if (spec.type === 'ImportDefaultSpecifier') {
          specifiers.push(spec.local.name);
          isDefault = true;
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          specifiers.push(`* as ${spec.local.name}`);
          isNamespace = true;
        } else if (spec.type === 'ImportSpecifier') {
          specifiers.push(spec.local.name);
        }
      });

      imports.push({
        source: node.source.value,
        specifiers,
        isDefault,
        isNamespace,
        location: toSourceLocation(node.loc),
      });
    },

    // Track variable usages
    Identifier(path) {
      const name = path.node.name;
      // Skip if it's a declaration
      if (path.parent.type === 'VariableDeclarator' && (path.parent as t.VariableDeclarator).id === path.node) {
        return;
      }
      // Skip if it's a property access key
      if (path.parent.type === 'MemberExpression' && (path.parent as t.MemberExpression).property === path.node && !(path.parent as t.MemberExpression).computed) {
        return;
      }
      
      const usages = variableUsages.get(name) || [];
      usages.push(toSourceLocation(path.node.loc));
      variableUsages.set(name, usages);
    },
  });

  // Update variable usages
  variables.forEach((variable) => {
    const usages = variableUsages.get(variable.name) || [];
    variable.usages = usages;
    variable.isUnused = usages.length === 0;
  });

  // Build simplified AST tree for visualization
  const astTree = buildASTTree(ast.program);

  return {
    ast,
    astTree,
    functions,
    classes,
    imports,
    variables,
    errors,
  };
}

/**
 * Build a simplified AST tree for visualization
 */
function buildASTTree(node: t.Node, depth = 0): ASTNode {
  if (depth > 10) {
    return {
      type: node.type,
      location: toSourceLocation(node.loc),
    };
  }

  const astNode: ASTNode = {
    type: node.type,
    location: toSourceLocation(node.loc),
  };

  // Add name for named nodes
  if ('id' in node && node.id && 'name' in node.id) {
    astNode.name = node.id.name;
  }
  if ('name' in node && typeof node.name === 'string') {
    astNode.name = node.name;
  }

  // Add children for container nodes
  const children: ASTNode[] = [];
  
  if ('body' in node) {
    const body = node.body;
    if (Array.isArray(body)) {
      body.forEach((child) => {
        if (child && typeof child === 'object' && 'type' in child) {
          children.push(buildASTTree(child as t.Node, depth + 1));
        }
      });
    } else if (body && typeof body === 'object' && 'type' in body) {
      children.push(buildASTTree(body as t.Node, depth + 1));
    }
  }

  if ('declarations' in node && Array.isArray(node.declarations)) {
    node.declarations.forEach((decl) => {
      children.push(buildASTTree(decl, depth + 1));
    });
  }

  if (children.length > 0) {
    astNode.children = children;
  }

  return astNode;
}

/**
 * Get all identifiers from the code
 */
export function getAllIdentifiers(code: string, language: Language = 'javascript'): string[] {
  const identifiers: Set<string> = new Set();
  
  try {
    const ast = parser.parse(code, getParserOptions(language));
    
    traverse(ast, {
      Identifier(path) {
        identifiers.add(path.node.name);
      },
    });
  } catch {
    // Ignore parse errors
  }
  
  return Array.from(identifiers);
}


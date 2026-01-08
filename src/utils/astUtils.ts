/**
 * AST Utilities for TypeScript/TSX code analysis
 * Uses TypeScript Compiler API to parse and analyze code
 */
import * as ts from 'typescript';

export interface CodeBlockInfo {
    name: string;
    type: 'variable' | 'function' | 'array' | 'object';
    start: number;      // Character offset of the entire declaration
    end: number;
    valueStart: number; // Character offset of the initializer/value
    valueEnd: number;
    text: string;       // The actual code text
}

/**
 * Parse TypeScript/TSX code and return the source file
 */
function parseCode(code: string): ts.SourceFile {
    return ts.createSourceFile(
        'temp.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
    );
}

/**
 * Find all variable declarations with array initializers (like FormConfig)
 */
export function findArrayVariables(code: string): CodeBlockInfo[] {
    const sourceFile = parseCode(code);
    const results: CodeBlockInfo[] = [];

    function visit(node: ts.Node) {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
            const initializer = node.initializer;
            if (initializer && ts.isArrayLiteralExpression(initializer)) {
                results.push({
                    name: node.name.text,
                    type: 'array',
                    start: node.getStart(sourceFile),
                    end: node.getEnd(),
                    valueStart: initializer.getStart(sourceFile),
                    valueEnd: initializer.getEnd(),
                    text: code.slice(initializer.getStart(sourceFile), initializer.getEnd()),
                });
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return results;
}

/**
 * Find the code block (variable, function, etc.) that contains the given position
 */
export function findCodeBlockAtPosition(code: string, position: number): CodeBlockInfo | null {
    const sourceFile = parseCode(code);
    let result: CodeBlockInfo | null = null;
    let smallestRange = Infinity;

    function visit(node: ts.Node) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();

        // Check if position is within this node
        if (position >= start && position <= end) {
            // Variable declarations with initializers
            if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
                const range = end - start;
                if (range < smallestRange) {
                    smallestRange = range;

                    let type: CodeBlockInfo['type'] = 'variable';
                    if (ts.isArrayLiteralExpression(node.initializer)) {
                        type = 'array';
                    } else if (ts.isObjectLiteralExpression(node.initializer)) {
                        type = 'object';
                    } else if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
                        type = 'function';
                    }

                    result = {
                        name: node.name.text,
                        type,
                        start,
                        end,
                        valueStart: node.initializer.getStart(sourceFile),
                        valueEnd: node.initializer.getEnd(),
                        text: code.slice(node.initializer.getStart(sourceFile), node.initializer.getEnd()),
                    };
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return result;
}

/**
 * Find a specific variable by name and return its value location
 */
export function findVariableByName(code: string, variableName: string): CodeBlockInfo | null {
    const sourceFile = parseCode(code);
    let result: CodeBlockInfo | null = null;

    function visit(node: ts.Node) {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
            if (node.name.text === variableName && node.initializer) {
                let type: CodeBlockInfo['type'] = 'variable';
                if (ts.isArrayLiteralExpression(node.initializer)) {
                    type = 'array';
                } else if (ts.isObjectLiteralExpression(node.initializer)) {
                    type = 'object';
                }

                result = {
                    name: variableName,
                    type,
                    start: node.getStart(sourceFile),
                    end: node.getEnd(),
                    valueStart: node.initializer.getStart(sourceFile),
                    valueEnd: node.initializer.getEnd(),
                    text: code.slice(node.initializer.getStart(sourceFile), node.initializer.getEnd()),
                };
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return result;
}

/**
 * Check if the current position is inside a FormConfig-like array
 * (arrays containing objects with type/name/label properties)
 */
export function isInsideFormConfig(code: string, position: number): CodeBlockInfo | null {
    const block = findCodeBlockAtPosition(code, position);
    if (!block || block.type !== 'array') {
        return null;
    }

    // Check if it looks like a FormConfig (has objects with type/name/label)
    // Simple heuristic: check if the text contains these keywords
    const hasFormConfigPattern =
        block.text.includes('type:') &&
        (block.text.includes('name:') || block.text.includes('label:'));

    return hasFormConfigPattern ? block : null;
}

/**
 * Get all identifiable code blocks in the file for quick navigation
 */
export function getAllCodeBlocks(code: string): CodeBlockInfo[] {
    const sourceFile = parseCode(code);
    const results: CodeBlockInfo[] = [];

    function visit(node: ts.Node) {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
            let type: CodeBlockInfo['type'] = 'variable';
            if (ts.isArrayLiteralExpression(node.initializer)) {
                type = 'array';
            } else if (ts.isObjectLiteralExpression(node.initializer)) {
                type = 'object';
            } else if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
                type = 'function';
            }

            results.push({
                name: node.name.text,
                type,
                start: node.getStart(sourceFile),
                end: node.getEnd(),
                valueStart: node.initializer.getStart(sourceFile),
                valueEnd: node.initializer.getEnd(),
                text: code.slice(node.initializer.getStart(sourceFile), node.initializer.getEnd()),
            });
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return results;
}

/**
 * Extended info for FormConfig variables, includes full statement range
 */
export interface FormConfigBlock extends CodeBlockInfo {
    typeName: string;           // The type annotation name (e.g., "FormConfig")
    statementStart: number;     // Start of the entire statement (from "const")
    statementEnd: number;       // End of the entire statement (including ";")
    componentHint?: 'EasySearch' | 'EasyTable' | 'EasyForm'; // Detected usage context
}

/**
 * Find FormConfig variable when cursor is on its type annotation (e.g., "FormConfig")
 * Returns the full statement range including "const" keyword
 */
export function findFormConfigByType(code: string, position: number): FormConfigBlock | null {
    const sourceFile = parseCode(code);
    let result: FormConfigBlock | null = null;

    function visit(node: ts.Node) {
        // Look for variable declarations with type annotations
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.type && node.initializer) {
            // Check if position is on the type annotation
            const typeStart = node.type.getStart(sourceFile);
            const typeEnd = node.type.getEnd();

            // Also check if position is on the variable name
            const nameStart = node.name.getStart(sourceFile);
            const nameEnd = node.name.getEnd();

            const isOnType = position >= typeStart && position <= typeEnd;
            const isOnName = position >= nameStart && position <= nameEnd;

            if (isOnType || isOnName) {
                // Get the type name
                let typeName = '';
                if (ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName)) {
                    typeName = node.type.typeName.text;
                } else if (ts.isArrayTypeNode(node.type)) {
                    typeName = 'Array';
                } else {
                    typeName = node.type.getText(sourceFile);
                }

                // Find the parent VariableStatement to get full range including "const"
                let statementStart = node.getStart(sourceFile);
                let statementEnd = node.getEnd();

                let parent: ts.Node | undefined = node.parent;
                while (parent) {
                    if (ts.isVariableStatement(parent)) {
                        statementStart = parent.getStart(sourceFile);
                        statementEnd = parent.getEnd();
                        break;
                    }
                    parent = parent.parent;
                }

                // Detect component hint by scanning for usage
                let componentHint: FormConfigBlock['componentHint'];
                const varName = node.name.text;
                if (code.includes(`<EasySearch`) && code.includes(`config={${varName}}`)) {
                    componentHint = 'EasySearch';
                } else if (code.includes(`<EasyTable`) && code.includes(`config={${varName}}`)) {
                    componentHint = 'EasyTable';
                } else if (code.includes(`<EasyForm`) && code.includes(`config={${varName}}`)) {
                    componentHint = 'EasyForm';
                }

                let blockType: CodeBlockInfo['type'] = 'variable';
                if (ts.isArrayLiteralExpression(node.initializer)) {
                    blockType = 'array';
                } else if (ts.isObjectLiteralExpression(node.initializer)) {
                    blockType = 'object';
                }

                result = {
                    name: node.name.text,
                    type: blockType,
                    typeName,
                    start: node.getStart(sourceFile),
                    end: node.getEnd(),
                    valueStart: node.initializer.getStart(sourceFile),
                    valueEnd: node.initializer.getEnd(),
                    statementStart,
                    statementEnd,
                    text: code.slice(node.initializer.getStart(sourceFile), node.initializer.getEnd()),
                    componentHint,
                };
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return result;
}

/**
 * Find all FormConfig-typed variables in the file
 */
export function findAllFormConfigs(code: string): FormConfigBlock[] {
    const sourceFile = parseCode(code);
    const results: FormConfigBlock[] = [];

    function visit(node: ts.Node) {
        // 1. Variable Declarations
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
            const varName = node.name.text;

            // Check type if present
            let typeName = '';
            if (node.type && ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName)) {
                typeName = node.type.typeName.text;
            }

            // Detection Logic
            const isFormConfigType = typeName === 'FormConfig' || typeName.includes('Config');
            const isColumnsCode = varName === 'columnsCode';

            const initText = node.initializer.getText(sourceFile);
            const isArrayLiteral = ts.isArrayLiteralExpression(node.initializer);

            const isArrayWithFormPattern = isArrayLiteral &&
                initText.includes('type:') &&
                (initText.includes('name:') || initText.includes('label:'));

            const isArrayWithColumnPattern = isArrayLiteral &&
                (initText.includes('title:') && initText.includes('dataIndex:'));

            if (isFormConfigType || isColumnsCode || isArrayWithFormPattern || isArrayWithColumnPattern) {
                let statementStart = node.getStart(sourceFile);
                let statementEnd = node.getEnd();

                let parent: ts.Node | undefined = node.parent;
                while (parent) {
                    if (ts.isVariableStatement(parent)) {
                        statementStart = parent.getStart(sourceFile);
                        statementEnd = parent.getEnd();
                        break;
                    }
                    parent = parent.parent;
                }

                let componentHint: FormConfigBlock['componentHint'];
                if (isColumnsCode || isArrayWithColumnPattern) {
                    componentHint = 'EasyTable';
                } else if (code.includes(`<EasySearch`) && code.includes(`config={${varName}}`)) {
                    componentHint = 'EasySearch';
                } else if (code.includes(`<EasyTable`) && code.includes(`config={${varName}}`)) {
                    componentHint = 'EasyTable';
                } else if (code.includes(`<EasyForm`) && code.includes(`config={${varName}}`)) {
                    componentHint = 'EasyForm';
                }

                results.push({
                    name: varName,
                    type: 'array',
                    typeName: typeName || 'Array',
                    start: node.getStart(sourceFile),
                    end: node.getEnd(),
                    valueStart: node.initializer.getStart(sourceFile),
                    valueEnd: node.initializer.getEnd(),
                    statementStart,
                    statementEnd,
                    text: code.slice(node.initializer.getStart(sourceFile), node.initializer.getEnd()),
                    componentHint,
                });
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return results;
}


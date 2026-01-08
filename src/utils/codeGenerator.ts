/**
 * Code Generator for FormConfig
 * Handles bidirectional conversion between FormConfig code and UI-editable data
 */
import * as ts from 'typescript';

/**
 * Represents a single form field that can be edited in the UI
 */
export interface FormField {
    id: string;             // Unique ID for React keys and drag-n-drop
    type: string;           // 'text', 'select', 'date', 'number', etc.
    name: string;           // Field name in form data
    label: string;          // Display label
    placeholder?: string;   // Placeholder text
    required?: boolean;     // Is required
    data?: string;          // Raw code for data property (e.g., async functions)
    rules?: string;         // Raw code for validation rules
    props?: string;         // Raw code for additional props
    // Store any other properties as raw code
    otherProps?: Record<string, string>;
}

/**
 * Generate unique ID for new fields
 */
export function generateFieldId(): string {
    return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse FormConfig array code into editable FormField array
 */
export function parseFormConfigCode(code: string): FormField[] {
    const sourceFile = ts.createSourceFile(
        'temp.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
    );

    const fields: FormField[] = [];

    function visit(node: ts.Node) {
        // Looking for array literal expressions
        if (ts.isArrayLiteralExpression(node)) {
            node.elements.forEach((element) => {
                if (ts.isObjectLiteralExpression(element)) {
                    const field: FormField = {
                        id: generateFieldId(),
                        type: '',
                        name: '',
                        label: '',
                        otherProps: {},
                    };

                    element.properties.forEach((prop) => {
                        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                            const propName = prop.name.text;
                            const propValue = prop.initializer;

                            // Extract string values
                            if (ts.isStringLiteral(propValue)) {
                                if (propName === 'type') field.type = propValue.text;
                                else if (propName === 'name') field.name = propValue.text;
                                else if (propName === 'label') field.label = propValue.text;
                                else if (propName === 'title') field.label = propValue.text; // Map title to label
                                else if (propName === 'dataIndex') field.name = propValue.text; // Map dataIndex to name
                                else if (propName === 'placeholder') field.placeholder = propValue.text;
                                else field.otherProps![propName] = `"${propValue.text}"`;
                            }
                            // Extract boolean values
                            else if (propValue.kind === ts.SyntaxKind.TrueKeyword) {
                                if (propName === 'required') field.required = true;
                                else field.otherProps![propName] = 'true';
                            }
                            else if (propValue.kind === ts.SyntaxKind.FalseKeyword) {
                                if (propName === 'required') field.required = false;
                                else field.otherProps![propName] = 'false';
                            }
                            // Complex values stored as raw code
                            else {
                                const rawCode = code.slice(propValue.getStart(sourceFile), propValue.getEnd());
                                if (propName === 'data') field.data = rawCode;
                                else if (propName === 'rules') field.rules = rawCode;
                                else if (propName === 'props') field.props = rawCode;
                                else field.otherProps![propName] = rawCode;
                            }
                        }
                    });

                    if (field.type || field.name) {
                        fields.push(field);
                    }
                }
            });
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return fields;
}

/**
 * Generate FormConfig array code from FormField array
 */
export function generateFormConfigCode(fields: FormField[], indent: string = '  '): string {
    if (fields.length === 0) {
        return '[]';
    }

    const lines: string[] = ['['];

    fields.forEach((field, index) => {
        lines.push(`${indent}{`);

        // Required properties
        lines.push(`${indent}${indent}type: "${field.type}",`);
        lines.push(`${indent}${indent}name: "${field.name}",`);
        lines.push(`${indent}${indent}label: "${field.label}",`);

        // Optional simple properties
        if (field.placeholder) {
            lines.push(`${indent}${indent}placeholder: "${field.placeholder}",`);
        }
        if (field.required !== undefined) {
            lines.push(`${indent}${indent}required: ${field.required},`);
        }

        // Complex properties (kept as raw code)
        if (field.data) {
            lines.push(`${indent}${indent}data: ${field.data},`);
        }
        if (field.rules) {
            lines.push(`${indent}${indent}rules: ${field.rules},`);
        }
        if (field.props) {
            lines.push(`${indent}${indent}props: ${field.props},`);
        }

        // Other properties
        if (field.otherProps) {
            Object.entries(field.otherProps).forEach(([key, value]) => {
                lines.push(`${indent}${indent}${key}: ${value},`);
            });
        }

        lines.push(`${indent}}${index < fields.length - 1 ? ',' : ''}`);
    });

    lines.push(']');
    return lines.join('\n');
}

/**
 * Generate full variable declaration code
 */
export function generateFullDeclaration(
    variableName: string,
    typeName: string,
    fields: FormField[],
    indent: string = '  '
): string {
    const arrayCode = generateFormConfigCode(fields, indent);
    return `const ${variableName}: ${typeName} = ${arrayCode};`;
}

/**
 * Available field types for the dropdown
 */
export const FIELD_TYPES = [
    { value: 'text', label: '文本输入 (text)' },
    { value: 'select', label: '下拉选择 (select)' },
    { value: 'date', label: '日期选择 (date)' },
    { value: 'dateRange', label: '日期范围 (dateRange)' },
    { value: 'number', label: '数字输入 (number)' },
    { value: 'textarea', label: '多行文本 (textarea)' },
    { value: 'radio', label: '单选 (radio)' },
    { value: 'checkbox', label: '多选 (checkbox)' },
    { value: 'switch', label: '开关 (switch)' },
    { value: 'cascader', label: '级联选择 (cascader)' },
    { value: 'treeSelect', label: '树选择 (treeSelect)' },
    { value: 'upload', label: '文件上传 (upload)' },
];

/**
 * Create a new empty field with default values
 */
export function createEmptyField(): FormField {
    return {
        id: generateFieldId(),
        type: 'text',
        name: '',
        label: '',
    };
}

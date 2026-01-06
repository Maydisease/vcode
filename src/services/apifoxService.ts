// Apifox API Service
// Fetches OpenAPI spec from Apifox via Tauri backend (to avoid CORS)

import { invoke } from '@tauri-apps/api/core';

export interface ApifoxEndpoint {
    id: string;
    path: string;
    method: string;
    summary: string;
    description?: string;
    parameters: ApifoxParameter[];
    requestBody?: ApifoxRequestBody;
}

export interface ApifoxParameter {
    name: string;
    in: 'query' | 'path' | 'header';
    required: boolean;
    description?: string;
    schema: {
        type: string;
        format?: string;
        enum?: string[];
    };
}

export interface ApifoxRequestBody {
    required: boolean;
    content: {
        'application/json'?: {
            schema: ApifoxSchema;
        };
    };
}

export interface ApifoxSchema {
    type: string;
    properties?: Record<string, ApifoxPropertySchema>;
    required?: string[];
}

export interface ApifoxPropertySchema {
    type: string;
    description?: string;
    format?: string;
    enum?: string[];
    items?: ApifoxPropertySchema;
    properties?: Record<string, ApifoxPropertySchema>;
    required?: string[];
}

/**
 * Fetch OpenAPI spec from Apifox via Tauri backend
 */
export async function fetchApifoxOpenAPI(projectId: string, token: string): Promise<any> {
    try {
        // Call Rust backend to make the request (bypasses CORS)
        const result = await invoke('fetch_apifox_openapi', {
            projectId,
            token,
        });
        return result;
    } catch (error) {
        console.error('Failed to fetch Apifox OpenAPI:', error);
        throw error;
    }
}

/**
 * Resolve $ref references in OpenAPI schema
 * @param obj The object containing potential $ref
 * @param components The components object containing schemas
 * @param visited Set to track visited refs and prevent infinite loops
 */
function resolveRef(obj: any, components: any, visited: Set<string> = new Set()): any {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    // Handle $ref
    if (obj.$ref && typeof obj.$ref === 'string') {
        // Parse the $ref path: "#/components/schemas/SomeType"
        const refPath = obj.$ref;

        // Prevent infinite loops
        if (visited.has(refPath)) {
            return { type: 'object', description: `Circular reference: ${refPath}` };
        }
        visited.add(refPath);

        // Extract the schema name from the path
        const match = refPath.match(/#\/components\/schemas\/(.+)/);
        if (match && components?.schemas) {
            const schemaName = match[1];
            const resolvedSchema = components.schemas[schemaName];
            if (resolvedSchema) {
                // Recursively resolve the referenced schema
                return resolveRef({ ...resolvedSchema }, components, visited);
            }
        }

        // If we can't resolve, return a placeholder
        return { type: 'object', description: `Unresolved ref: ${refPath}` };
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => resolveRef(item, components, new Set(visited)));
    }

    // Handle objects recursively
    const resolved: any = {};
    for (const [key, value] of Object.entries(obj)) {
        resolved[key] = resolveRef(value, components, new Set(visited));
    }
    return resolved;
}

/**
 * Parse OpenAPI spec to extract endpoint list with resolved $refs
 */
export function parseOpenAPIEndpoints(openApiSpec: any): ApifoxEndpoint[] {
    const endpoints: ApifoxEndpoint[] = [];
    const paths = openApiSpec.paths || {};
    const components = openApiSpec.components || {};

    for (const [path, pathItem] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(pathItem as Record<string, any>)) {
            if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                // Resolve $refs in request body schema
                let requestBody = operation.requestBody;
                if (requestBody) {
                    requestBody = resolveRef(requestBody, components);
                }

                // Resolve $refs in parameters
                const parameters = (operation.parameters || []).map((p: any) => {
                    const resolved = resolveRef(p, components);
                    return {
                        name: resolved.name,
                        in: resolved.in,
                        required: resolved.required || false,
                        description: resolved.description,
                        schema: resolved.schema || { type: 'string' },
                    };
                });

                const endpoint: ApifoxEndpoint = {
                    id: `${method.toUpperCase()}-${path}`,
                    path,
                    method: method.toUpperCase(),
                    summary: operation.summary || path,
                    description: operation.description,
                    parameters,
                    requestBody,
                };
                endpoints.push(endpoint);
            }
        }
    }

    // Sort by path for better UX
    return endpoints.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Flatten nested properties from a schema into a field list
 */
function flattenProperties(
    properties: Record<string, any>,
    requiredFields: string[],
    prefix: string = ''
): Array<{ name: string; type: string; required: boolean; description?: string }> {
    const fields: Array<{ name: string; type: string; required: boolean; description?: string }> = [];

    for (const [name, prop] of Object.entries(properties)) {
        const fieldName = prefix ? `${prefix}.${name}` : name;
        const isRequired = requiredFields.includes(name);

        // Handle nested objects
        if (prop.type === 'object' && prop.properties) {
            fields.push(...flattenProperties(prop.properties, prop.required || [], fieldName));
        }
        // Handle arrays with object items
        else if (prop.type === 'array' && prop.items?.properties) {
            fields.push({
                name: `${fieldName}[]`,
                type: 'array<object>',
                required: isRequired,
                description: prop.description,
            });
            // Also add nested fields from array items
            fields.push(...flattenProperties(prop.items.properties, prop.items.required || [], `${fieldName}[]`));
        }
        // Regular fields
        else {
            let type = prop.type || 'any';
            if (prop.type === 'array' && prop.items?.type) {
                type = `array<${prop.items.type}>`;
            }
            fields.push({
                name: fieldName,
                type,
                required: isRequired,
                description: prop.description,
            });
        }
    }

    return fields;
}

/**
 * Extract request body fields from endpoint (with $ref resolved)
 */
export function extractRequestFields(endpoint: ApifoxEndpoint): Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
}> {
    const fields: Array<{
        name: string;
        type: string;
        required: boolean;
        description?: string;
    }> = [];

    // Extract from request body
    const schema = endpoint.requestBody?.content?.['application/json']?.schema;
    if (schema?.properties) {
        const requiredFields = schema.required || [];
        fields.push(...flattenProperties(schema.properties, requiredFields));
    }

    // Extract from query/path parameters
    for (const param of endpoint.parameters) {
        if (param.in === 'query' || param.in === 'path') {
            fields.push({
                name: param.name,
                type: param.schema.type,
                required: param.required,
                description: param.description,
            });
        }
    }

    return fields;
}

/**
 * Format endpoint info for LLM context
 */
export function formatEndpointForPrompt(endpoint: ApifoxEndpoint): string {
    const fields = extractRequestFields(endpoint);
    const fieldLines = fields
        .map(f => `  - ${f.name}: ${f.type}${f.required ? ' (必填)' : ''}${f.description ? ` - ${f.description}` : ''}`)
        .join('\n');

    return `${endpoint.method} ${endpoint.path}
${endpoint.summary || ''}
参数:
${fieldLines || '  (无参数)'}`;
}

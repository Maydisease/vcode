// OpenAI Compatible API Service
// All API calls are routed through Tauri backend to bypass CORS restrictions

import type { ModelConfig } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

let openaiConfig: { baseUrl: string; apiKey: string } | null = null;

/**
 * Initialize OpenAI API configuration
 */
export function initializeOpenAI(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    openaiConfig = { apiKey, baseUrl };
}

/**
 * Test OpenAI API connection via Tauri backend (bypasses CORS)
 */
export async function testOpenAIConnection(): Promise<boolean> {
    if (!openaiConfig) {
        throw new Error('OpenAI API not initialized');
    }

    try {
        await invoke('test_openai_connection', {
            baseUrl: openaiConfig.baseUrl,
            apiKey: openaiConfig.apiKey
        });
        return true;
    } catch (error) {
        console.error('OpenAI connection test failed:', error);
        throw error;
    }
}

/**
 * Fetch available models from OpenAI API via Tauri backend
 */
export async function fetchOpenAIModels(): Promise<Array<{ id: string; name: string }>> {
    if (!openaiConfig) {
        throw new Error('OpenAI API not initialized');
    }

    try {
        const models = await invoke<Array<{ id: string; name: string }>>('fetch_openai_models', {
            baseUrl: openaiConfig.baseUrl,
            apiKey: openaiConfig.apiKey
        });
        return models;
    } catch (error) {
        console.error('Failed to fetch OpenAI models:', error);
        throw error;
    }
}

/**
 * Convert File to base64 string (without data URL prefix)
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

interface StreamChunk {
    content: string;
    done: boolean;
    error: string | null;
}

/**
 * Generate code from image using OpenAI-compatible API via Tauri backend
 */
export async function* generateCodeFromImageOpenAI(
    imageFile: File,
    prompts: string[],
    modelConfig: ModelConfig
): AsyncGenerator<string> {
    if (!openaiConfig) {
        throw new Error('OpenAI API not initialized');
    }

    const imageBase64 = await fileToBase64(imageFile);
    const systemPrompt = prompts.join('\n\n');

    // Create a queue to collect chunks
    const chunks: StreamChunk[] = [];
    let resolveWait: (() => void) | null = null;
    let unlisten: UnlistenFn | null = null;

    // Set up event listener
    unlisten = await listen<StreamChunk>('llm-chunk', (event) => {
        chunks.push(event.payload);
        if (resolveWait) {
            resolveWait();
            resolveWait = null;
        }
    });

    // Start the generation (don't await - let it run in background)
    const generatePromise = invoke('generate_code_openai', {
        baseUrl: openaiConfig.baseUrl,
        apiKey: openaiConfig.apiKey,
        model: modelConfig.model,
        systemPrompt: systemPrompt,
        imageBase64: imageBase64,
        imageMimeType: imageFile.type,
        maxTokens: modelConfig.maxTokens
    }).catch((error) => {
        chunks.push({ content: '', done: true, error: String(error) });
        if (resolveWait) {
            resolveWait();
            resolveWait = null;
        }
    });

    try {
        // Process chunks as they arrive
        while (true) {
            // Wait for new chunks if queue is empty
            while (chunks.length === 0) {
                await new Promise<void>((resolve) => {
                    resolveWait = resolve;
                });
            }

            const chunk = chunks.shift()!;

            if (chunk.error) {
                throw new Error(chunk.error);
            }

            if (chunk.content) {
                yield chunk.content;
            }

            if (chunk.done) {
                break;
            }
        }
    } finally {
        if (unlisten) {
            unlisten();
        }
        // Ensure the invoke promise is settled
        await generatePromise;
    }
}

// OpenAI Compatible API Service
// All API calls are routed through Tauri backend to bypass CORS restrictions

import type { ModelConfig } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useLogStore } from '../stores/logStore';

let openaiConfig: { baseUrl: string; apiKey: string } | null = null;

/**
 * Initialize OpenAI API configuration
 */
export function initializeOpenAI(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    openaiConfig = { apiKey, baseUrl };
}

/**
 * Helpler to log API calls to logStore
 */
async function logApiCall<T>(
    endpoint: string,
    reason: string,
    fn: () => Promise<T>,
    tokenEstimator?: (result: T) => { prompt: number, completion: number }
): Promise<T> {
    const startTime = Date.now();
    const { addApiLog } = useLogStore.getState();
    const baseUrl = openaiConfig?.baseUrl || 'unknown';
    const fullUrl = `${baseUrl}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1"); // Normalize slashes

    try {
        const result = await fn();
        const duration = Date.now() - startTime;

        let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        if (tokenEstimator) {
            const estimated = tokenEstimator(result);
            usage = {
                promptTokens: estimated.prompt,
                completionTokens: estimated.completion,
                totalTokens: estimated.prompt + estimated.completion
            };
        }

        addApiLog({
            url: fullUrl,
            reason,
            status: 'success',
            duration,
            usage
        });

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        addApiLog({
            url: fullUrl,
            reason,
            status: 'failed',
            duration,
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        });
        throw error;
    }
}

/**
 * Test OpenAI API connection via Tauri backend (bypasses CORS)
 */
export async function testOpenAIConnection(): Promise<boolean> {
    if (!openaiConfig) {
        throw new Error('OpenAI API not initialized');
    }

    return logApiCall('models', 'Connection Test', async () => {
        await invoke('test_openai_connection', {
            baseUrl: openaiConfig!.baseUrl,
            apiKey: openaiConfig!.apiKey
        });
        return true;
    });
}

/**
 * Fetch available models from OpenAI API via Tauri backend
 */
export async function fetchOpenAIModels(): Promise<Array<{ id: string; name: string }>> {
    if (!openaiConfig) {
        throw new Error('OpenAI API not initialized');
    }

    return logApiCall('models', 'Fetch Models', async () => {
        return await invoke<Array<{ id: string; name: string }>>('fetch_openai_models', {
            baseUrl: openaiConfig!.baseUrl,
            apiKey: openaiConfig!.apiKey
        });
    });
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
    let accumulatedContent = '';

    // Log the generation call
    // Since it's a generator, we wrap the setup interactions, but tracking full stream duration 
    // and tokens is harder in this specific generator structure without refactoring.
    // We will log the *initiation* of the request here, but maybe update with tokens later?
    // For now, let's log the start and end of the stream process roughly.
    const startTime = Date.now();
    const { addApiLog } = useLogStore.getState();
    const baseUrl = openaiConfig.baseUrl;
    const fullUrl = `${baseUrl}/chat/completions`.replace(/([^:]\/)\/+/g, "$1");

    // Set up event listener
    unlisten = await listen<StreamChunk>('llm-chunk', (event) => {
        const payload = event.payload;
        if (payload.content) accumulatedContent += payload.content;

        chunks.push(payload);
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
                // Log failure
                addApiLog({
                    url: fullUrl,
                    reason: 'Generate Code (Stream Error)',
                    status: 'failed',
                    duration: Date.now() - startTime,
                    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
                });
                throw new Error(chunk.error);
            }

            if (chunk.content) {
                yield chunk.content;
            }

            if (chunk.done) {
                // Log success
                // Note: We don't have exact token counts from the stream events usually, unless the backend sends usage.
                // We'll estimate or just log duration.
                addApiLog({
                    url: fullUrl,
                    reason: 'Generate Code (Stream Complete)',
                    status: 'success',
                    duration: Date.now() - startTime,
                    usage: {
                        promptTokens: 0,
                        completionTokens: Math.ceil(accumulatedContent.length / 4), // Rough estimate
                        totalTokens: Math.ceil(accumulatedContent.length / 4)
                    }
                });
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

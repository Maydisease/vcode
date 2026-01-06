import { invoke } from '@tauri-apps/api/core';

interface TokenCountResult {
    count: number;
    is_estimated: boolean;
}

/**
 * Count tokens in the given text using Rust tokenizer
 */
export async function countTokens(text: string): Promise<TokenCountResult> {
    try {
        return await invoke<TokenCountResult>('count_tokens', { text });
    } catch (error) {
        console.error('Token counting failed:', error);
        // Fallback estimation
        return {
            count: estimateTokens(text),
            is_estimated: true,
        };
    }
}

/**
 * Initialize tokenizer with a specific path
 */
export async function initTokenizer(path: string): Promise<boolean> {
    try {
        return await invoke<boolean>('init_tokenizer', { path });
    } catch (error) {
        console.error('Failed to initialize tokenizer:', error);
        return false;
    }
}

/**
 * Simple client-side token estimation fallback
 */
function estimateTokens(text: string): number {
    let chineseChars = 0;
    let otherChars = 0;

    for (const char of text) {
        const code = char.charCodeAt(0);
        if (code >= 0x4e00 && code <= 0x9fff) {
            chineseChars++;
        } else if (!/\s/.test(char)) {
            otherChars++;
        }
    }

    // Chinese: ~1.5 tokens per char, Other: ~4 chars per token
    const chineseTokens = Math.ceil(chineseChars * 1.5);
    const otherTokens = Math.ceil(otherChars / 4);

    return chineseTokens + otherTokens + 1;
}

/**
 * Format token count for display
 */
export function formatTokenCount(count: number): string {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
}

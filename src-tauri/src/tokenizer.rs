use once_cell::sync::Lazy;
use std::sync::Mutex;
use tokenizers::Tokenizer;

/// Default tokenizer using embedded Qwen tokenizer data
static DEFAULT_TOKENIZER: Lazy<Mutex<Option<Tokenizer>>> = Lazy::new(|| {
    // Try to load from bundled tokenizer.json
    let tokenizer = Tokenizer::from_file("tokenizer.json").ok();
    Mutex::new(tokenizer)
});

/// Count tokens in given text using the default tokenizer
/// Falls back to simple estimation if tokenizer is not available
fn count_tokens_internal(text: &str) -> usize {
    let guard = DEFAULT_TOKENIZER.lock().unwrap();

    if let Some(tokenizer) = guard.as_ref() {
        if let Ok(encoding) = tokenizer.encode(text, false) {
            return encoding.len();
        }
    }

    // Fallback: simple estimation (Chinese ~1.5 tokens/char, English ~4 chars/token)
    estimate_tokens(text)
}

/// Simple token estimation for fallback
fn estimate_tokens(text: &str) -> usize {
    let mut chinese_chars = 0;
    let mut other_chars = 0;

    for c in text.chars() {
        if c >= '\u{4e00}' && c <= '\u{9fff}' {
            chinese_chars += 1;
        } else if !c.is_whitespace() {
            other_chars += 1;
        }
    }

    // Chinese: ~1.5 tokens per character
    // English/other: ~4 characters per token
    let chinese_tokens = (chinese_chars as f64 * 1.5).ceil() as usize;
    let other_tokens = (other_chars as f64 / 4.0).ceil() as usize;

    chinese_tokens + other_tokens + 1 // +1 to avoid 0
}

/// Tauri command to count tokens
#[tauri::command]
pub fn count_tokens(text: String) -> Result<TokenCountResult, String> {
    let count = count_tokens_internal(&text);
    let is_estimated = DEFAULT_TOKENIZER.lock().unwrap().is_none();

    Ok(TokenCountResult {
        count,
        is_estimated,
    })
}

/// Result of token counting
#[derive(serde::Serialize)]
pub struct TokenCountResult {
    pub count: usize,
    pub is_estimated: bool,
}

/// Initialize tokenizer from a specific path
#[tauri::command]
pub fn init_tokenizer(path: String) -> Result<bool, String> {
    let tokenizer = Tokenizer::from_file(&path)
        .map_err(|e| format!("Failed to load tokenizer from {}: {}", path, e))?;

    let mut guard = DEFAULT_TOKENIZER.lock().unwrap();
    *guard = Some(tokenizer);

    Ok(true)
}

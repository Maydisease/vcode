// LLM API Service Module
// Handles all AI API requests from Rust to bypass CORS restrictions

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};

use crate::http_client;

// ============================================================================
// OpenAI Compatible API - Connection Test
// ============================================================================

#[tauri::command]
pub async fn test_openai_connection(base_url: String, api_key: String) -> Result<String, String> {
    // Debug logging
    println!("[LLM] test_openai_connection called");
    println!("[LLM] base_url: {}", base_url);
    println!("[LLM] api_key length: {}", api_key.len());

    let base_url = base_url.trim_end_matches('/');
    let url = format!("{}/models", base_url);
    println!("[LLM] final url: {}", url);

    let client = http_client::get_client();

    let response = match client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
    {
        Ok(resp) => {
            println!("[LLM] Request succeeded with status: {}", resp.status());
            resp
        }
        Err(e) => {
            println!("[LLM] Request failed: {:?}", e);
            return Err(format!("网络请求失败: {}", e));
        }
    };

    let status = response.status();

    if !status.is_success() {
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误响应".to_string());
        return Err(format!("API error {}: {}", status, error_body));
    }

    // Try to parse the response to verify it's valid JSON
    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("响应解析失败: {}", e))?;

    // Check if it has a 'data' field (OpenAI models endpoint returns this)
    if json.get("data").is_some() {
        Ok("连接成功".to_string())
    } else {
        Ok("连接成功 (非标准响应格式)".to_string())
    }
}

// ============================================================================
// Gemini API
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiModel {
    name: String,
    display_name: String,
    description: String,
    input_token_limit: i64,
    output_token_limit: i64,
}

#[tauri::command]
pub async fn test_gemini_connection(api_key: String) -> Result<String, String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models?key={}&pageSize=1",
        api_key
    );

    let client = http_client::get_client();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误响应".to_string());
        return Err(format!("API error {}: {}", status, error_body));
    }

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("响应解析失败: {}", e))?;

    if json.get("models").is_some() {
        Ok("连接成功".to_string())
    } else {
        Err("API 响应格式异常".to_string())
    }
}

#[tauri::command]
pub async fn fetch_gemini_models(api_key: String) -> Result<Vec<GeminiModel>, String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models?key={}",
        api_key
    );

    let client = http_client::get_client();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误响应".to_string());
        return Err(format!("API error {}: {}", status, error_body));
    }

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("响应解析失败: {}", e))?;

    let models = json
        .get("models")
        .and_then(|m| m.as_array())
        .ok_or("无法解析模型列表")?;

    let result: Vec<GeminiModel> = models
        .iter()
        .filter(|m| {
            m.get("supportedGenerationMethods")
                .and_then(|s| s.as_array())
                .map(|arr| arr.iter().any(|v| v.as_str() == Some("generateContent")))
                .unwrap_or(false)
        })
        .map(|m| GeminiModel {
            name: m
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("")
                .replace("models/", ""),
            display_name: m
                .get("displayName")
                .and_then(|n| n.as_str())
                .unwrap_or("")
                .to_string(),
            description: m
                .get("description")
                .and_then(|n| n.as_str())
                .unwrap_or("")
                .to_string(),
            input_token_limit: m
                .get("inputTokenLimit")
                .and_then(|n| n.as_i64())
                .unwrap_or(0),
            output_token_limit: m
                .get("outputTokenLimit")
                .and_then(|n| n.as_i64())
                .unwrap_or(0),
        })
        .collect();

    Ok(result)
}

// ============================================================================
// OpenAI Compatible API
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenAIModel {
    id: String,
    name: String,
}

#[tauri::command]
pub async fn fetch_openai_models(
    base_url: String,
    api_key: String,
) -> Result<Vec<OpenAIModel>, String> {
    let base_url = base_url.trim_end_matches('/');
    let url = format!("{}/models", base_url);

    let client = http_client::get_client();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误响应".to_string());
        return Err(format!("API error {}: {}", status, error_body));
    }

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("响应解析失败: {}", e))?;

    let models = json
        .get("data")
        .and_then(|d| d.as_array())
        .ok_or("无法解析模型列表")?;

    let mut result: Vec<OpenAIModel> = models
        .iter()
        .map(|m| {
            let id = m
                .get("id")
                .and_then(|i| i.as_str())
                .unwrap_or("")
                .to_string();
            OpenAIModel {
                id: id.clone(),
                name: id,
            }
        })
        .collect();

    result.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(result)
}

// ============================================================================
// Streaming Code Generation
// ============================================================================

#[derive(Debug, Serialize, Clone)]
pub struct StreamChunk {
    pub content: String,
    pub done: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn generate_code_openai(
    app: AppHandle,
    base_url: String,
    api_key: String,
    model: String,
    system_prompt: String,
    image_base64: String,
    image_mime_type: String,
    max_tokens: i64,
) -> Result<(), String> {
    // Normalize base_url by removing trailing slash
    let base_url = base_url.trim_end_matches('/');
    let url = format!("{}/chat/completions", base_url);

    // Debug logging
    println!("[LLM] generate_code_openai called");
    println!("[LLM] base_url: {}", base_url);
    println!("[LLM] final url: {}", url);
    println!("[LLM] model: {}", model);

    let request_body = json!({
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "请根据这张设计图生成代码。"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": format!("data:{};base64,{}", image_mime_type, image_base64)
                        }
                    }
                ]
            }
        ],
        "max_tokens": max_tokens,
        "stream": true
    });

    let client = http_client::get_client();
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .body(request_body.to_string())
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误响应".to_string());
        let _ = app.emit(
            "llm-chunk",
            StreamChunk {
                content: String::new(),
                done: true,
                error: Some(format!("API error {}: {}", status, error_body)),
            },
        );
        return Err(format!("API error: {}", error_body));
    }

    // Stream the response
    let mut stream = response.bytes_stream();
    use futures::StreamExt;

    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                let text = String::from_utf8_lossy(&chunk);
                buffer.push_str(&text);

                // Process complete lines
                while let Some(pos) = buffer.find('\n') {
                    let line = buffer[..pos].to_string();
                    buffer = buffer[pos + 1..].to_string();

                    if line.starts_with("data: ") {
                        let data = &line[6..];
                        if data == "[DONE]" {
                            let _ = app.emit(
                                "llm-chunk",
                                StreamChunk {
                                    content: String::new(),
                                    done: true,
                                    error: None,
                                },
                            );
                            return Ok(());
                        }

                        if let Ok(json) = serde_json::from_str::<Value>(data) {
                            if let Some(content) = json
                                .get("choices")
                                .and_then(|c| c.get(0))
                                .and_then(|c| c.get("delta"))
                                .and_then(|d| d.get("content"))
                                .and_then(|c| c.as_str())
                            {
                                let _ = app.emit(
                                    "llm-chunk",
                                    StreamChunk {
                                        content: content.to_string(),
                                        done: false,
                                        error: None,
                                    },
                                );
                            }
                        }
                    }
                }
            }
            Err(e) => {
                let _ = app.emit(
                    "llm-chunk",
                    StreamChunk {
                        content: String::new(),
                        done: true,
                        error: Some(format!("Stream error: {}", e)),
                    },
                );
                return Err(format!("Stream error: {}", e));
            }
        }
    }

    let _ = app.emit(
        "llm-chunk",
        StreamChunk {
            content: String::new(),
            done: true,
            error: None,
        },
    );

    Ok(())
}

#[tauri::command]
pub async fn generate_code_gemini(
    app: AppHandle,
    api_key: String,
    model: String,
    prompt: String,
    image_base64: String,
    image_mime_type: String,
    temperature: f64,
    top_p: f64,
    max_tokens: i64,
) -> Result<(), String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent?alt=sse&key={}",
        model, api_key
    );

    let request_body = json!({
        "contents": [{
            "parts": [
                {
                    "text": prompt
                },
                {
                    "inline_data": {
                        "mime_type": image_mime_type,
                        "data": image_base64
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": temperature,
            "topP": top_p,
            "maxOutputTokens": max_tokens
        }
    });

    let client = http_client::get_client();
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(request_body.to_string())
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误响应".to_string());
        let _ = app.emit(
            "llm-chunk",
            StreamChunk {
                content: String::new(),
                done: true,
                error: Some(format!("API error {}: {}", status, error_body)),
            },
        );
        return Err(format!("API error: {}", error_body));
    }

    // Stream the response
    let mut stream = response.bytes_stream();
    use futures::StreamExt;

    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                let text = String::from_utf8_lossy(&chunk);
                buffer.push_str(&text);

                // Process complete lines
                while let Some(pos) = buffer.find('\n') {
                    let line = buffer[..pos].to_string();
                    buffer = buffer[pos + 1..].to_string();

                    if line.starts_with("data: ") {
                        let data = &line[6..];

                        if let Ok(json) = serde_json::from_str::<Value>(data) {
                            if let Some(content) = json
                                .get("candidates")
                                .and_then(|c| c.get(0))
                                .and_then(|c| c.get("content"))
                                .and_then(|c| c.get("parts"))
                                .and_then(|p| p.get(0))
                                .and_then(|p| p.get("text"))
                                .and_then(|t| t.as_str())
                            {
                                let _ = app.emit(
                                    "llm-chunk",
                                    StreamChunk {
                                        content: content.to_string(),
                                        done: false,
                                        error: None,
                                    },
                                );
                            }
                        }
                    }
                }
            }
            Err(e) => {
                let _ = app.emit(
                    "llm-chunk",
                    StreamChunk {
                        content: String::new(),
                        done: true,
                        error: Some(format!("Stream error: {}", e)),
                    },
                );
                return Err(format!("Stream error: {}", e));
            }
        }
    }

    let _ = app.emit(
        "llm-chunk",
        StreamChunk {
            content: String::new(),
            done: true,
            error: None,
        },
    );

    Ok(())
}

#[tauri::command]
pub async fn parse_image_description(
    api_key: String,
    image_base64: String,
    image_mime_type: String,
) -> Result<String, String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
        api_key
    );

    let request_body = json!({
        "contents": [{
            "parts": [
                {
                    "text": "请详细描述这张 UI 设计图的内容，包括布局、颜色、组件、文字等信息。使用中文回答。"
                },
                {
                    "inline_data": {
                        "mime_type": image_mime_type,
                        "data": image_base64
                    }
                }
            ]
        }]
    });

    let client = http_client::get_client();
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(request_body.to_string())
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误响应".to_string());
        return Err(format!("API error {}: {}", status, error_body));
    }

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("响应解析失败: {}", e))?;

    let text = json
        .get("candidates")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("content"))
        .and_then(|c| c.get("parts"))
        .and_then(|p| p.get(0))
        .and_then(|p| p.get("text"))
        .and_then(|t| t.as_str())
        .unwrap_or("无法解析响应")
        .to_string();

    Ok(text)
}

// ============================================================================
// Background Task Generation
// ============================================================================

use crate::tasks::{TaskManager, TaskStatus};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn start_generation_task(
    task_manager: State<'_, TaskManager>,
    provider: String,
    api_key: String,
    base_url: Option<String>,
    model: String,
    prompt: String,
    image_base64: String,
    image_mime_type: String,
    temperature: f64,
    top_p: f64,
    max_tokens: i64,
) -> Result<String, String> {
    let task_id = Uuid::new_v4().to_string();
    let task_manager = task_manager.inner().clone();

    // Create the task in manager
    task_manager.create_task(task_id.clone());

    let task_id_clone = task_id.clone();

    tauri::async_runtime::spawn(async move {
        let result = if provider == "google" {
            run_gemini_task(
                &task_manager,
                &task_id_clone,
                api_key,
                model,
                prompt,
                image_base64,
                image_mime_type,
                temperature,
                top_p,
                max_tokens,
            )
            .await
        } else {
            run_openai_task(
                &task_manager,
                &task_id_clone,
                api_key,
                base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string()),
                model,
                prompt,
                image_base64,
                image_mime_type,
                max_tokens,
            )
            .await
        };

        if let Err(e) = result {
            task_manager.set_error(&task_id_clone, e);
        } else {
            task_manager.update_status(&task_id_clone, TaskStatus::Completed);
        }
    });

    Ok(task_id)
}

async fn run_gemini_task(
    task_manager: &TaskManager,
    task_id: &str,
    api_key: String,
    model: String,
    prompt: String,
    image_base64: String,
    image_mime_type: String,
    temperature: f64,
    top_p: f64,
    max_tokens: i64,
) -> Result<(), String> {
    task_manager.update_status(task_id, TaskStatus::Running);

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent?alt=sse&key={}",
        model, api_key
    );

    let request_body = json!({
        "contents": [{
            "parts": [
                {
                    "text": prompt
                },
                {
                    "inline_data": {
                        "mime_type": image_mime_type,
                        "data": image_base64
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": temperature,
            "topP": top_p,
            "maxOutputTokens": max_tokens
        }
    });

    let client = http_client::get_client();
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(request_body.to_string())
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_body = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, error_body));
    }

    let mut stream = response.bytes_stream();
    use futures::StreamExt;

    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                let text = String::from_utf8_lossy(&chunk);
                buffer.push_str(&text);

                while let Some(pos) = buffer.find('\n') {
                    let line = buffer[..pos].to_string();
                    buffer = buffer[pos + 1..].to_string();

                    if line.starts_with("data: ") {
                        let data = &line[6..];
                        if let Ok(json) = serde_json::from_str::<Value>(data) {
                            if let Some(content) = json
                                .get("candidates")
                                .and_then(|c| c.get(0))
                                .and_then(|c| c.get("content"))
                                .and_then(|c| c.get("parts"))
                                .and_then(|p| p.get(0))
                                .and_then(|p| p.get("text"))
                                .and_then(|t| t.as_str())
                            {
                                task_manager.append_content(task_id, content);
                            }
                        }
                    }
                }
            }
            Err(e) => return Err(format!("Stream error: {}", e)),
        }
    }

    Ok(())
}

async fn run_openai_task(
    task_manager: &TaskManager,
    task_id: &str,
    api_key: String,
    base_url: String,
    model: String,
    system_prompt: String,
    image_base64: String,
    image_mime_type: String,
    max_tokens: i64,
) -> Result<(), String> {
    task_manager.update_status(task_id, TaskStatus::Running);

    let base_url = base_url.trim_end_matches('/');
    let url = format!("{}/chat/completions", base_url);

    let request_body = json!({
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "请根据这张设计图生成代码。"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": format!("data:{};base64,{}", image_mime_type, image_base64)
                        }
                    }
                ]
            }
        ],
        "max_tokens": max_tokens,
        "stream": true
    });

    let client = http_client::get_client();
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .body(request_body.to_string())
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_body = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, error_body));
    }

    let mut stream = response.bytes_stream();
    use futures::StreamExt;

    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                let text = String::from_utf8_lossy(&chunk);
                buffer.push_str(&text);

                while let Some(pos) = buffer.find('\n') {
                    let line = buffer[..pos].to_string();
                    buffer = buffer[pos + 1..].to_string();

                    if line.starts_with("data: ") {
                        let data = &line[6..];
                        if data == "[DONE]" {
                            return Ok(());
                        }

                        if let Ok(json) = serde_json::from_str::<Value>(data) {
                            if let Some(content) = json
                                .get("choices")
                                .and_then(|c| c.get(0))
                                .and_then(|c| c.get("delta"))
                                .and_then(|d| d.get("content"))
                                .and_then(|c| c.as_str())
                            {
                                task_manager.append_content(task_id, content);
                            }
                        }
                    }
                }
            }
            Err(e) => return Err(format!("Stream error: {}", e)),
        }
    }

    Ok(())
}

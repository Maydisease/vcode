// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde_json::Value;

mod http_client;
mod llm;
mod server;
mod tokenizer;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn fetch_apifox_openapi(project_id: String, token: String) -> Result<Value, String> {
    let url = format!(
        "https://api.apifox.com/v1/projects/{}/export-openapi?locale=zh-CN",
        project_id
    );

    let client = http_client::get_direct_client();

    let response = client
        .post(&url)
        .header("X-Apifox-Api-Version", "2024-03-28")
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .body("{}")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(json)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle().clone();
            // Start the static file server
            tauri::async_runtime::spawn(async move {
                server::start_server(handle).await;
            });
            // Initialize HTTP client
            http_client::init();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            fetch_apifox_openapi,
            tokenizer::count_tokens,
            tokenizer::init_tokenizer,
            server::set_proxy_rules,
            server::set_auth_token,
            // LLM commands
            llm::test_openai_connection,
            llm::test_gemini_connection,
            llm::fetch_gemini_models,
            llm::fetch_openai_models,
            llm::generate_code_openai,
            llm::generate_code_gemini,
            llm::parse_image_description,
            // HTTP commands
            http_client::set_proxy_enabled,
            http_client::get_proxy_enabled
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

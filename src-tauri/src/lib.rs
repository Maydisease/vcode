// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde_json::Value;

mod history;
mod http_client;
mod llm;
mod prompts;
mod server;
mod tasks;

mod tokenizer;

use history::HistoryStore;
use prompts::PromptStore;
use tasks::TaskManager;
use tauri::Manager;

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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(TaskManager::new())
        .manage(HistoryStore::new())
        .manage(PromptStore::new())
        .setup(|app| {
            let handle = app.handle().clone();
            // Start the static file server
            tauri::async_runtime::spawn(async move {
                server::start_server(handle).await;
            });
            // Initialize HTTP client
            http_client::init();

            // Initialize history store
            let history_store = app.state::<HistoryStore>();
            if let Err(e) = history_store.init(&app.handle()) {
                eprintln!("Failed to initialize history store: {}", e);
            }
            // Initialize prompt store
            let prompt_store = app.state::<PromptStore>();
            if let Err(e) = prompt_store.init(&app.handle()) {
                eprintln!("Failed to initialize prompt store: {}", e);
            }
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
            llm::start_generation_task,
            // Task commands
            tasks::poll_task_status,
            // HTTP commands
            http_client::set_proxy_enabled,
            http_client::get_proxy_enabled,
            // History commands
            history::save_history_record,
            history::get_history,
            history::delete_history_record,
            history::clear_history,
            // Prompt commands
            prompts::save_prompt,
            prompts::get_prompt
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

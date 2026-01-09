use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, Runtime};
use uuid::Uuid;

pub struct PromptStore {
    path: Mutex<Option<PathBuf>>,
}

impl PromptStore {
    pub fn new() -> Self {
        Self {
            path: Mutex::new(None),
        }
    }

    pub fn init<R: Runtime>(&self, app: &AppHandle<R>) -> Result<(), String> {
        let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        let prompts_dir = app_dir.join("prompts");

        if !prompts_dir.exists() {
            fs::create_dir_all(&prompts_dir).map_err(|e| e.to_string())?;
        }

        *self.path.lock().unwrap() = Some(prompts_dir);
        Ok(())
    }

    fn get_dir(&self) -> Result<PathBuf, String> {
        self.path
            .lock()
            .unwrap()
            .clone()
            .ok_or_else(|| "Prompt store not initialized".to_string())
    }

    pub fn save(&self, content: &str) -> Result<String, String> {
        let dir = self.get_dir()?;
        let id = Uuid::new_v4().to_string();
        let file_path = dir.join(format!("{}.txt", id));

        fs::write(file_path, content).map_err(|e| e.to_string())?;

        Ok(id)
    }

    pub fn get(&self, id: &str) -> Result<String, String> {
        let dir = self.get_dir()?;
        // Basic security check to prevent path traversal
        if id.contains("..") || id.contains('/') || id.contains('\\') {
            return Err("Invalid prompt ID".to_string());
        }

        let file_path = dir.join(format!("{}.txt", id));

        if !file_path.exists() {
            return Err("Prompt file not found".to_string());
        }

        let content = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
        Ok(content)
    }
}

// Commands

#[tauri::command]
pub async fn save_prompt(
    state: tauri::State<'_, PromptStore>,
    content: String,
) -> Result<String, String> {
    state.save(&content)
}

#[tauri::command]
pub async fn get_prompt(
    state: tauri::State<'_, PromptStore>,
    id: String,
) -> Result<String, String> {
    state.get(&id)
}

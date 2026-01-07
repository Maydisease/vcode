use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, Runtime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileVersion {
    pub label: String,
    pub content: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub file_type: String, // "file" | "folder"
    pub content: Option<String>,
    pub language: Option<String>,
    pub children: Option<Vec<FileNode>>,
    pub parent_id: Option<String>,
    pub versions: Option<Vec<FileVersion>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HistoryRecord {
    pub id: String,
    pub timestamp: i64,
    pub image_preview: Option<String>,
    pub generated_code: String,
    pub files: Option<Vec<FileNode>>,
    pub mode: String, // "general" | "easyform"
    pub model_used: String,
    pub prompt_summary: Option<String>,
    pub selected_apis: Option<Vec<String>>,
    pub input_tokens: Option<i64>,
    pub output_tokens: Option<i64>,
    pub duration: Option<i64>,
}

#[derive(Default)]
pub struct HistoryStore {
    // We might cache records in memory, or just file I/O every time.
    // For simplicity and to avoid memory bloat with images, let's verify if we need caching.
    // Actually, full file I/O is safer for persistence.
    path: Mutex<Option<PathBuf>>,
}

impl HistoryStore {
    pub fn new() -> Self {
        Self {
            path: Mutex::new(None),
        }
    }

    pub fn init<R: Runtime>(&self, app: &AppHandle<R>) -> Result<(), String> {
        let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        if !app_dir.exists() {
            fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
        }
        let history_path = app_dir.join("history.json");
        *self.path.lock().unwrap() = Some(history_path);
        Ok(())
    }

    fn get_path(&self) -> Result<PathBuf, String> {
        self.path
            .lock()
            .unwrap()
            .clone()
            .ok_or_else(|| "History store not initialized".to_string())
    }

    fn load_records(&self) -> Result<Vec<HistoryRecord>, String> {
        let path = self.get_path()?;
        if !path.exists() {
            return Ok(Vec::new());
        }
        let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
        let records: Vec<HistoryRecord> = serde_json::from_str(&content).unwrap_or_default();
        Ok(records)
    }

    fn save_records(&self, records: &[HistoryRecord]) -> Result<(), String> {
        let path = self.get_path()?;
        let content = serde_json::to_string_pretty(records).map_err(|e| e.to_string())?;
        fs::write(path, content).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn add_record(&self, record: HistoryRecord) -> Result<(), String> {
        let mut records = self.load_records()?;
        // Add to beginning
        records.insert(0, record);
        // Limit to 50
        if records.len() > 50 {
            records.truncate(50);
        }
        self.save_records(&records)?;
        Ok(())
    }

    pub fn delete_record(&self, id: &str) -> Result<(), String> {
        let mut records = self.load_records()?;
        records.retain(|r| r.id != id);
        self.save_records(&records)?;
        Ok(())
    }

    pub fn clear(&self) -> Result<(), String> {
        self.save_records(&[])?;
        Ok(())
    }
}

// Commands
#[tauri::command]
pub async fn save_history_record(
    state: tauri::State<'_, HistoryStore>,
    record: HistoryRecord,
) -> Result<(), String> {
    state.add_record(record)
}

#[tauri::command]
pub async fn get_history(
    state: tauri::State<'_, HistoryStore>,
) -> Result<Vec<HistoryRecord>, String> {
    state.load_records()
}

#[tauri::command]
pub async fn delete_history_record(
    state: tauri::State<'_, HistoryStore>,
    id: String,
) -> Result<(), String> {
    state.delete_record(&id)
}

#[tauri::command]
pub async fn clear_history(state: tauri::State<'_, HistoryStore>) -> Result<(), String> {
    state.clear()
}

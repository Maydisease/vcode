use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum TaskStatus {
    Queued,
    Running,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskState {
    pub id: String,
    pub status: TaskStatus,
    pub content: String, // Accumulated logs or generated content
    pub error: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Clone)]
pub struct TaskManager {
    tasks: Arc<Mutex<HashMap<String, TaskState>>>,
}

impl TaskManager {
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn create_task(&self, id: String) {
        let mut tasks = self.tasks.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();
        tasks.insert(
            id.clone(),
            TaskState {
                id,
                status: TaskStatus::Queued,
                content: String::new(),
                error: None,
                created_at: now,
                updated_at: now,
            },
        );
    }

    pub fn update_status(&self, id: &str, status: TaskStatus) {
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.get_mut(id) {
            task.status = status;
            task.updated_at = chrono::Utc::now().timestamp_millis();
        }
    }

    pub fn append_content(&self, id: &str, content: &str) {
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.get_mut(id) {
            task.content.push_str(content);
            task.updated_at = chrono::Utc::now().timestamp_millis();
        }
    }

    pub fn set_error(&self, id: &str, error: String) {
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.get_mut(id) {
            task.status = TaskStatus::Failed;
            task.error = Some(error);
            task.updated_at = chrono::Utc::now().timestamp_millis();
        }
    }

    pub fn get_task(&self, id: &str) -> Option<TaskState> {
        let tasks = self.tasks.lock().unwrap();
        tasks.get(id).cloned()
    }
}

#[tauri::command]
pub fn poll_task_status(
    state: tauri::State<'_, TaskManager>,
    task_id: String,
) -> Result<TaskState, String> {
    state
        .get_task(&task_id)
        .ok_or_else(|| "Task not found".to_string())
}

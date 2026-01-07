use lazy_static::lazy_static;
use reqwest::Client;
use std::sync::{Arc, RwLock};

lazy_static! {
    static ref USE_SYSTEM_PROXY: Arc<RwLock<bool>> = Arc::new(RwLock::new(true)); // Default to enabled (use system proxy)
    static ref GLOBAL_CLIENT: Arc<RwLock<Option<Client>>> = Arc::new(RwLock::new(None));
    static ref DIRECT_CLIENT: Client = build_client(false); // Client that always bypasses proxy
}

/// Helper to build a client based on current settings
fn build_client(use_system_proxy: bool) -> Client {
    let mut builder = Client::builder().danger_accept_invalid_certs(true); // Keep this for server.rs compatibility + dev environments

    if !use_system_proxy {
        builder = builder.no_proxy();
    }

    builder.build().unwrap_or_else(|_| Client::new())
}

/// Initialize the global client
pub fn init() {
    let use_proxy = *USE_SYSTEM_PROXY.read().unwrap();
    let client = build_client(use_proxy);
    *GLOBAL_CLIENT.write().unwrap() = Some(client);
}

/// Get a clone of the current global client (cheap, shares connection pool)
pub fn get_client() -> Client {
    // If not initialized, init
    if GLOBAL_CLIENT.read().unwrap().is_none() {
        init();
    }

    GLOBAL_CLIENT.read().unwrap().as_ref().unwrap().clone()
}

/// Get a client that strictly bypasses any system proxy (no_proxy)
pub fn get_direct_client() -> Client {
    DIRECT_CLIENT.clone()
}

#[tauri::command]
pub fn set_proxy_enabled(enabled: bool) {
    println!("[HTTP] Setting system proxy enabled: {}", enabled);
    *USE_SYSTEM_PROXY.write().unwrap() = enabled;

    // Rebuild global client
    let new_client = build_client(enabled);
    *GLOBAL_CLIENT.write().unwrap() = Some(new_client);
}

#[tauri::command]
pub fn get_proxy_enabled() -> bool {
    *USE_SYSTEM_PROXY.read().unwrap()
}

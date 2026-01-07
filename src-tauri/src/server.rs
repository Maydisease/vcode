use axum::{
    body::Body,
    extract::{Request, State},
    http::{header, Method, StatusCode, Uri},
    response::{IntoResponse, Response},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{
    net::SocketAddr,
    path::PathBuf,
    sync::{Arc, RwLock},
};
use tauri::Manager;
use tower::ServiceExt;
use tower_http::{cors::CorsLayer, services::ServeFile, trace::TraceLayer};

// Proxy rule structure matching frontend
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ProxyRule {
    pub id: String,
    pub prefix: String,
    pub target: String,
    pub enabled: bool,
}

// Shared proxy rules state
pub type ProxyRulesState = Arc<RwLock<Vec<ProxyRule>>>;

// Global proxy rules instance
lazy_static::lazy_static! {
    pub static ref PROXY_RULES: ProxyRulesState = Arc::new(RwLock::new(Vec::new()));
    pub static ref AUTH_TOKEN: Arc<RwLock<Option<String>>> = Arc::new(RwLock::new(None));
}

// State to hold the root directory
#[derive(Clone)]
struct AppState {
    static_dir: PathBuf,
}

pub async fn start_server(app_handle: tauri::AppHandle) {
    let resource_dir = app_handle
        .path()
        .resource_dir()
        .expect("Resource dir not found");

    let static_dir = if cfg!(debug_assertions) {
        PathBuf::from("../public")
    } else {
        // In release mode, resources are bundled in the resources directory
        // The tauri.conf.json bundles "../public/**/*" which Tauri places in _up_/public/
        resource_dir.join("_up_").join("public")
    };

    println!(
        "Starting sandbox server on port 1422, serving: {:?}",
        static_dir
    );

    // Debug: list files in static_dir
    if !cfg!(debug_assertions) {
        println!("[Server] Resource dir: {:?}", resource_dir);
        if let Ok(entries) = std::fs::read_dir(&static_dir) {
            for entry in entries.flatten() {
                println!("[Server] Found: {:?}", entry.path());
            }
        }
        // Check if playground.html exists
        let playground_path = static_dir.join("playground.html");
        println!(
            "[Server] Looking for playground.html at: {:?}, exists: {}",
            playground_path,
            playground_path.exists()
        );
    }

    let state = AppState {
        static_dir: static_dir.clone(),
    };

    let app = Router::new()
        .fallback(handle_request)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 1422));

    tauri::async_runtime::spawn(async move {
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
        axum::serve(listener, app).await.unwrap();
    });
}

// Tauri command to set proxy rules from frontend
#[tauri::command]
pub fn set_proxy_rules(rules: Vec<ProxyRule>) {
    println!("[Proxy] Setting {} rules: {:?}", rules.len(), rules);
    let mut proxy_rules = PROXY_RULES.write().unwrap();
    *proxy_rules = rules;
}

#[tauri::command]
pub fn set_auth_token(token: String) {
    let mut auth_token = AUTH_TOKEN.write().unwrap();
    if token.is_empty() {
        println!("[Proxy] Clearing auth token");
        *auth_token = None;
    } else {
        println!("[Proxy] Setting auth token: {}", token);
        *auth_token = Some(token);
    }
}

// Main request handler
async fn handle_request(
    State(state): State<AppState>,
    method: Method,
    uri: Uri,
    headers: axum::http::HeaderMap,
    body: axum::body::Bytes,
) -> Response {
    let path = uri.path().to_string();
    let query = uri.query().map(|q| q.to_string());

    // Check if path matches any proxy rule
    let matching_rule = {
        let proxy_rules = PROXY_RULES.read().unwrap();
        proxy_rules
            .iter()
            .filter(|r| r.enabled)
            .find(|r| path.starts_with(&r.prefix))
            .cloned()
    };

    if let Some(rule) = matching_rule {
        // Strip the prefix from the path to avoid duplication when appending to target
        let dest_path = if path.starts_with(&rule.prefix) {
            &path[rule.prefix.len()..]
        } else {
            &path
        };

        return handle_proxy_request(
            dest_path,
            query.as_deref(),
            &rule.target,
            method,
            headers,
            body,
        )
        .await;
    }

    // Fall back to static file serving
    handle_static_request(state, uri).await
}

// Handle proxy request - forward to target server
async fn handle_proxy_request(
    path: &str,
    query: Option<&str>,
    target: &str,
    method: Method,
    headers: axum::http::HeaderMap,
    body: axum::body::Bytes,
) -> Response {
    let mut target_url = if target.ends_with('/') {
        format!("{}{}", target.trim_end_matches('/'), path)
    } else {
        format!("{}{}", target, path)
    };

    if let Some(q) = query {
        target_url.push('?');
        target_url.push_str(q);
    }

    println!("[Proxy] {} {} -> {}", method, path, target_url);
    if let Some(q) = query {
        println!("[Proxy] Params: {}", q);
    }

    // Get client that bypasses system proxy (force no_proxy for internal forwarding)
    let client = crate::http_client::get_direct_client();

    let mut proxy_req = match method {
        Method::GET => client.get(&target_url),
        Method::POST => client.post(&target_url),
        Method::PUT => client.put(&target_url),
        Method::DELETE => client.delete(&target_url),
        Method::PATCH => client.patch(&target_url),
        _ => client.get(&target_url),
    };

    // Forward relevant headers
    for (key, value) in headers.iter() {
        if key == header::HOST
            || key == header::CONNECTION
            || key == header::CONTENT_LENGTH
            || key == header::TRANSFER_ENCODING
            || key == header::UPGRADE
            || key == header::COOKIE
        // We will potentially inject our own cookie
        {
            continue;
        }
        if let Ok(v) = value.to_str() {
            proxy_req = proxy_req.header(key.as_str(), v);
        }
    }

    // Inject Auth Token if present
    {
        let token_guard = AUTH_TOKEN.read().unwrap();
        if let Some(token) = token_guard.as_ref() {
            // Check if there are existing cookies to append to, or create new
            // For simplicity, we'll currently just overwrite/add the Cookie header
            // If original request had cookies, we might need to merge.
            // But typical use case here suggests we control the auth.

            // Construct the cookie string.
            // NOTE: If we want to preserve original cookies, we'd need to read them from `headers`
            // before the loop above skips them, and merge.
            // For now, let's assume we append our token to any existing cookies or just set it.

            let mut cookie_value = String::new();
            if let Some(original_cookie) = headers.get(header::COOKIE) {
                if let Ok(s) = original_cookie.to_str() {
                    cookie_value.push_str(s);
                    cookie_value.push_str("; ");
                }
            }
            cookie_value.push_str(&format!("tokenId={}", token));

            proxy_req = proxy_req.header(header::COOKIE, cookie_value);
        } else if let Some(original_cookie) = headers.get(header::COOKIE) {
            // If no auth token override, forward original cookies
            if let Ok(v) = original_cookie.to_str() {
                proxy_req = proxy_req.header(header::COOKIE, v);
            }
        }
    }

    // Forward body for POST/PUT/PATCH
    if method == Method::POST || method == Method::PUT || method == Method::PATCH {
        proxy_req = proxy_req.body(body.to_vec());
    }

    // Send request
    match proxy_req.send().await {
        Ok(response) => {
            let status = StatusCode::from_u16(response.status().as_u16())
                .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

            let mut builder = Response::builder().status(status);

            for (key, value) in response.headers().iter() {
                if key == header::TRANSFER_ENCODING
                    || key == header::CONNECTION
                    || key == header::CONTENT_LENGTH
                    || key == header::CONTENT_ENCODING
                // Reqwest decodes automatically
                {
                    continue;
                }
                builder = builder.header(key.as_str(), value.to_str().unwrap_or(""));
            }

            builder = builder
                .header("Access-Control-Allow-Origin", "*")
                .header(
                    "Access-Control-Allow-Methods",
                    "GET, POST, PUT, DELETE, OPTIONS",
                )
                .header("Access-Control-Allow-Headers", "*");

            match response.bytes().await {
                Ok(bytes) => builder.body(Body::from(bytes)).unwrap_or_else(|_| {
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "Failed to build response",
                    )
                        .into_response()
                }),
                Err(e) => (
                    StatusCode::BAD_GATEWAY,
                    format!("Failed to read response: {}", e),
                )
                    .into_response(),
            }
        }
        Err(e) => {
            println!("[Proxy] Request failed: {}", e);
            (
                StatusCode::BAD_GATEWAY,
                format!("Proxy request failed: {}", e),
            )
                .into_response()
        }
    }
}

// Static file handler with try_files logic
async fn handle_static_request(state: AppState, uri: Uri) -> Response {
    let path = uri.path();
    if path.contains("..") {
        return (StatusCode::BAD_REQUEST, "Invalid path").into_response();
    }

    let clean_path = path.trim_start_matches('/');
    let full_path = state.static_dir.join(clean_path);

    if full_path.exists() && full_path.is_file() {
        return serve_file(full_path).await;
    }

    let js_path = state.static_dir.join(format!("{}.js", clean_path));
    if js_path.exists() {
        return serve_file(js_path).await;
    }

    let index_path = state.static_dir.join(clean_path).join("index.js");
    if index_path.exists() {
        return serve_file(index_path).await;
    }

    (StatusCode::NOT_FOUND, "Not found").into_response()
}

async fn serve_file(path: PathBuf) -> Response {
    let serve_file = ServeFile::new(path);
    let req = Request::builder().body(Body::empty()).unwrap();

    match serve_file.oneshot(req).await {
        Ok(res) => {
            let mut response = res.into_response();
            response.headers_mut().insert(
                axum::http::header::CACHE_CONTROL,
                "no-cache, no-store, must-revalidate".parse().unwrap(),
            );
            response
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to serve file").into_response(),
    }
}

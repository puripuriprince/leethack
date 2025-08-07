use anyhow::Result;
use axum::http::{
    header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    HeaderValue, Method,
};
use std::time::Duration;
use tower_http::cors::CorsLayer;
use tracing::{info, error};
use tracing_subscriber;

use leethack_backend::{api, config::Config, docker_vm::DockerVmManager, AppState};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    info!("Starting LeetHack Backend Server...");

    // Load configuration
    let config = Config::from_env();
    info!("Server configuration: {}:{}", config.server.host, config.server.port);

    // Initialize application state
    let app_state = AppState::new()
        .map_err(|e| {
            error!("Failed to initialize application state: {}", e);
            e
        })?;

    info!("Docker client initialized successfully");

    // Start cleanup task
    let cleanup_state = app_state.clone();
    let cleanup_interval = config.session.cleanup_interval_minutes;
    let max_idle = config.session.max_idle_minutes;
    
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(cleanup_interval * 60));
        loop {
            interval.tick().await;
            if let Err(e) = DockerVmManager::cleanup_inactive_sessions(&cleanup_state, max_idle).await {
                error!("Failed to cleanup sessions: {}", e);
            }
        }
    });

    // Create router with CORS
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::DELETE])
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);

    let app = api::create_router(app_state).layer(cors);

    // Start server
    let addr = format!("{}:{}", config.server.host, config.server.port);
    
    info!("LeetHack Backend listening on {}", addr);
    info!("API endpoints available at:");
    info!("  Health check: GET http://{}/", addr);
    info!("  Create session: POST http://{}/api/terminal/session", addr);
    info!("  Execute command: POST http://{}/api/terminal/execute", addr);

    axum::Server::bind(&addr.parse()?)
        .serve(app.into_make_service())
        .await
        .map_err(|e| {
            error!("Server error: {}", e);
            anyhow::anyhow!("Server failed: {}", e)
        })?;

    Ok(())
}

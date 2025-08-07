use axum::{
    extract::{Path, State, WebSocketUpgrade, ws::{WebSocket, Message}},
    http::StatusCode,
    response::{Json, Response},
    routing::{delete, get, post},
    Router,
};
use serde_json::{json, Value};
use std::collections::HashMap;
use tracing::{info, error, debug};
use futures::{sink::SinkExt, stream::StreamExt};

use crate::{
    docker_vm::DockerVmManager,
    AppState, CreateSessionRequest, CreateSessionResponse, ExecuteCommandRequest,
    ExecuteCommandResponse,
};

pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/", get(health_check))
        .route("/api/terminal/session", post(create_session))
        .route("/api/terminal/execute", post(execute_command))
        .route("/api/terminal/ws/:session_id", get(websocket_handler))
        .route("/api/terminal/session/:session_id", get(get_session))
        .route("/api/terminal/session/:session_id", delete(destroy_session))
        .route("/api/sessions", get(list_sessions))
        .with_state(state)
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "service": "LeetHack Backend",
        "version": "0.1.0"
    }))
}

async fn create_session(
    State(state): State<AppState>,
    Json(request): Json<CreateSessionRequest>,
) -> Result<Json<CreateSessionResponse>, StatusCode> {
    info!("Creating session for challenge: {}", request.challenge);

    match DockerVmManager::create_vm_session(&state, &request.challenge).await {
        Ok(session) => {
            let mut environment = HashMap::new();
            environment.insert("USER".to_string(), "hacker".to_string());
            environment.insert("SHELL".to_string(), "/bin/bash".to_string());
            environment.insert("PWD".to_string(), "/home/hacker".to_string());

            let response = CreateSessionResponse {
                session_id: session.id,
                status: session.status,
                challenge: session.challenge_id,
                environment,
            };

            Ok(Json(response))
        }
        Err(e) => {
            error!("Failed to create session: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn execute_command(
    State(state): State<AppState>,
    Json(request): Json<ExecuteCommandRequest>,
) -> Result<Json<ExecuteCommandResponse>, StatusCode> {
    info!("Executing command '{}' in session {}", request.command, request.session_id);
    
    // Debug: Log all active sessions
    let session_count = state.sessions.len();
    info!("Currently have {} active sessions", session_count);
    for session_ref in state.sessions.iter() {
        info!("Active session: {} (status: {:?})", session_ref.key(), session_ref.value().status);
    }

    // Handle built-in commands
    if request.command.trim() == "clear" {
        let response = ExecuteCommandResponse {
            session_id: request.session_id,
            command: request.command,
            output: String::new(),
            exit_code: 0,
            timestamp: chrono::Utc::now(),
        };
        return Ok(Json(response));
    }
    
    // Let all commands go through the Docker container execution
    // This ensures real command execution and proper directory navigation

    match DockerVmManager::execute_command(&state, &request.session_id, &request.command).await {
        Ok(execution) => {
            let response = ExecuteCommandResponse {
                session_id: execution.session_id,
                command: execution.command,
                output: execution.output,
                exit_code: execution.exit_code,
                timestamp: execution.timestamp,
            };
            Ok(Json(response))
        }
        Err(e) => {
            error!("Failed to execute command: {}", e);
            
            // Return error as command output rather than HTTP error
            let response = ExecuteCommandResponse {
                session_id: request.session_id,
                command: request.command,
                output: format!("Error: {}", e),
                exit_code: 1,
                timestamp: chrono::Utc::now(),
            };
            Ok(Json(response))
        }
    }
}

async fn get_session(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    match state.sessions.get(&session_id) {
        Some(session) => {
            let session_data = json!({
                "sessionId": session.id,
                "status": session.status,
                "challenge": session.challenge_id,
                "createdAt": session.created_at,
                "lastActivity": session.last_activity,
                "sshPort": session.ssh_port,
                "webPort": session.web_port
            });
            Ok(Json(json!({
                "success": true,
                "data": session_data
            })))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn destroy_session(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    info!("Destroying session: {}", session_id);

    match DockerVmManager::destroy_session(&state, &session_id).await {
        Ok(_) => Ok(Json(json!({
            "success": true,
            "message": "Session destroyed successfully"
        }))),
        Err(e) => {
            error!("Failed to destroy session: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn list_sessions(State(state): State<AppState>) -> Json<Value> {
    let sessions: Vec<Value> = state
        .sessions
        .iter()
        .map(|entry| {
            let session = entry.value();
            json!({
                "sessionId": session.id,
                "challenge": session.challenge_id,
                "status": session.status,
                "createdAt": session.created_at,
                "lastActivity": session.last_activity,
                "containerId": session.container_id
            })
        })
        .collect();

    Json(json!({
        "success": true,
        "data": sessions
    }))
}

async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Response {
    ws.on_upgrade(move |socket| handle_websocket(socket, state, session_id))
}

async fn handle_websocket(socket: WebSocket, state: AppState, session_id: String) {
    let (mut sender, mut receiver) = socket.split();
    
    info!("WebSocket connection established for session: {}", session_id);
    
    // Check if session exists
    if !state.sessions.contains_key(&session_id) {
        let _ = sender.send(Message::Text(json!({
            "type": "error",
            "message": "Session not found"
        }).to_string())).await;
        return;
    }
    
    // Send welcome message
    let _ = sender.send(Message::Text(json!({
        "type": "connected",
        "session_id": session_id
    }).to_string())).await;
    
    // Handle incoming messages
    while let Some(msg) = receiver.next().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    if let Ok(data) = serde_json::from_str::<serde_json::Value>(&text) {
                        if let Some(msg_type) = data.get("type").and_then(|t| t.as_str()) {
                            match msg_type {
                                "command" => {
                                    if let Some(command) = data.get("command").and_then(|c| c.as_str()) {
                                        // Check if this is an interactive command
                                        if is_interactive_command(command) {
                                            info!("Interactive commands not yet fully supported via WebSocket: {}", command);
                                            let response = json!({
                                                "type": "error",
                                                "message": "Interactive commands like vim/nano are not yet fully supported via WebSocket. Please use regular terminal for now."
                                            });
                                            let _ = sender.send(Message::Text(response.to_string())).await;
                                            
                                        } else {
                                            // Execute regular command
                                            match DockerVmManager::execute_command(&state, &session_id, command).await {
                                                Ok(execution) => {
                                                    let response = json!({
                                                        "type": "command_result",
                                                        "command": execution.command,
                                                        "output": execution.output,
                                                        "exit_code": execution.exit_code,
                                                        "timestamp": execution.timestamp
                                                    });
                                                    let _ = sender.send(Message::Text(response.to_string())).await;
                                                }
                                                Err(e) => {
                                                    let response = json!({
                                                        "type": "error",
                                                        "message": format!("Command execution failed: {}", e)
                                                    });
                                                    let _ = sender.send(Message::Text(response.to_string())).await;
                                                }
                                            }
                                        }
                                    }
                                }
                                "input" => {
                                    // Handle interactive input (for future implementation)
                                    if let Some(input) = data.get("input").and_then(|i| i.as_str()) {
                                        debug!("Received interactive input: {} (not yet supported)", input);
                                    }
                                }
                                _ => {
                                    debug!("Unknown message type: {}", msg_type);
                                }
                            }
                        }
                    }
                }
                Message::Close(_) => {
                    info!("WebSocket connection closed for session: {}", session_id);
                    break;
                }
                _ => {}
            }
        }
    }
}

/// Check if a command is interactive and needs special WebSocket handling
fn is_interactive_command(command: &str) -> bool {
    let cmd = command.trim().to_lowercase();
    let interactive_commands = [
        "vim", "vi", "nano", "emacs", "less", "more", "man", "htop", "top",
        "mysql", "psql", "mongo", "redis-cli", "python", "python3", "node",
        "irb", "ssh", "telnet", "ftp", "sftp"
    ];
    
    for interactive_cmd in &interactive_commands {
        if cmd.starts_with(interactive_cmd) &&
           (cmd.len() == interactive_cmd.len() || cmd.chars().nth(interactive_cmd.len()) == Some(' ')) {
            return true;
        }
    }
    
    false
}

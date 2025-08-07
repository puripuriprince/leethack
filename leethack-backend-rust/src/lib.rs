use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use chrono::{DateTime, Utc};
use dashmap::DashMap;

pub mod docker_vm;
pub mod api;
pub mod config;

// VM Session Management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VmSession {
    pub id: String,
    pub challenge_id: String,
    pub container_id: Option<String>,
    pub status: VmStatus,
    pub created_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub ssh_port: Option<u16>,
    pub web_port: Option<u16>,
    pub current_directory: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VmStatus {
    Starting,
    Running,
    Stopped,
    Error(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandExecution {
    pub session_id: String,
    pub command: String,
    pub output: String,
    pub exit_code: i32,
    pub duration_ms: u64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSessionRequest {
    pub challenge: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSessionResponse {
    pub session_id: String,
    pub status: VmStatus,
    pub challenge: String,
    pub environment: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecuteCommandRequest {
    pub session_id: String,
    pub command: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecuteCommandResponse {
    pub session_id: String,
    pub command: String,
    pub output: String,
    pub exit_code: i32,
    pub timestamp: DateTime<Utc>,
}

// Application State
pub type SessionStore = Arc<DashMap<String, VmSession>>;

#[derive(Clone)]
pub struct AppState {
    pub sessions: SessionStore,
    pub docker_client: bollard::Docker,
}

impl AppState {
    pub fn new() -> Result<Self> {
        let docker_client = bollard::Docker::connect_with_local_defaults()
            .map_err(|e| anyhow::anyhow!("Failed to connect to Docker: {}", e))?;
        
        Ok(Self {
            sessions: Arc::new(DashMap::new()),
            docker_client,
        })
    }
}

// Challenge configurations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChallengeConfig {
    pub id: String,
    pub name: String,
    pub description: String,
    pub docker_image: String,
    pub exposed_ports: Vec<u16>,
    pub environment_vars: HashMap<String, String>,
}

impl ChallengeConfig {
    pub fn sql_injection() -> Self {
        let mut env_vars = HashMap::new();
        env_vars.insert("CHALLENGE_TYPE".to_string(), "sql_injection".to_string());
        
        Self {
            id: "sql-injection".to_string(),
            name: "SQL Injection Challenge".to_string(),
            description: "Learn to exploit SQL injection vulnerabilities".to_string(),
            docker_image: "leethack-vm:latest".to_string(),
            exposed_ports: vec![2222, 8080],
            environment_vars: env_vars,
        }
    }
    
    pub fn get_challenge(id: &str) -> Option<Self> {
        match id {
            "sql-injection" => Some(Self::sql_injection()),
            _ => None,
        }
    }
}

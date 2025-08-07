use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub docker: DockerConfig,
    pub session: SessionConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerConfig {
    pub default_image: String,
    pub memory_limit_mb: u64,
    pub cpu_shares: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionConfig {
    pub max_idle_minutes: i64,
    pub cleanup_interval_minutes: u64,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "127.0.0.1".to_string(),
                port: 3001,
            },
            docker: DockerConfig {
                default_image: "leethack-vm:latest".to_string(),
                memory_limit_mb: 512,
                cpu_shares: 512,
            },
            session: SessionConfig {
                max_idle_minutes: 30,
                cleanup_interval_minutes: 10,
            },
        }
    }
}

impl Config {
    pub fn from_env() -> Self {
        let mut config = Self::default();
        
        if let Ok(host) = std::env::var("LEETHACK_HOST") {
            config.server.host = host;
        }
        
        if let Ok(port) = std::env::var("LEETHACK_PORT") {
            if let Ok(port) = port.parse() {
                config.server.port = port;
            }
        }
        
        if let Ok(image) = std::env::var("LEETHACK_DOCKER_IMAGE") {
            config.docker.default_image = image;
        }
        
        config
    }
}

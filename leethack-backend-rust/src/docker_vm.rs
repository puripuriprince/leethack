use anyhow::Result;
use bollard::container::{Config, CreateContainerOptions, StartContainerOptions, RemoveContainerOptions};
use bollard::models::{ContainerCreateResponse, PortBinding};
use bollard::Docker;
use chrono::Utc;
use std::collections::HashMap;
use tracing::{info, error, debug};
use uuid::Uuid;

use crate::{VmSession, VmStatus, ChallengeConfig, AppState, CommandExecution};

pub struct DockerVmManager;

impl DockerVmManager {
    pub async fn create_vm_session(
        state: &AppState,
        challenge_id: &str,
    ) -> Result<VmSession> {
        let session_id = Uuid::new_v4().to_string();
        info!("Creating VM session {} for challenge {}", session_id, challenge_id);

        // Get challenge configuration
        let challenge_config = ChallengeConfig::get_challenge(challenge_id)
            .ok_or_else(|| anyhow::anyhow!("Unknown challenge: {}", challenge_id))?;

        // Create VM session record
        let mut session = VmSession {
            id: session_id.clone(),
            challenge_id: challenge_id.to_string(),
            container_id: None,
            status: VmStatus::Starting,
            created_at: Utc::now(),
            last_activity: Utc::now(),
            ssh_port: None,
            web_port: None,
            current_directory: "/home/hacker".to_string(),
        };

        // Store the session
        state.sessions.insert(session_id.clone(), session.clone());

        // Create Docker container asynchronously
        let docker_client = state.docker_client.clone();
        let sessions = state.sessions.clone();
        
        tokio::spawn(async move {
            match Self::create_docker_container(&docker_client, &challenge_config, &session_id).await {
                Ok((container_id, ssh_port, web_port)) => {
                    // Update session with container details
                    if let Some(mut session) = sessions.get_mut(&session_id) {
                        session.container_id = Some(container_id);
                        session.ssh_port = Some(ssh_port);
                        session.web_port = Some(web_port);
                        session.status = VmStatus::Running;
                        debug!("Updated session {} with container details", session_id);
                    }
                }
                Err(e) => {
                    error!("Failed to create container for session {}: {}", session_id, e);
                    if let Some(mut session) = sessions.get_mut(&session_id) {
                        session.status = VmStatus::Error(e.to_string());
                    }
                }
            }
        });

        // Update session status to starting
        session.status = VmStatus::Starting;
        Ok(session)
    }

    async fn create_docker_container(
        docker: &Docker,
        challenge_config: &ChallengeConfig,
        session_id: &str,
    ) -> Result<(String, u16, u16)> {
        // Ensure the challenge image exists
        Self::ensure_image_exists(docker, &challenge_config.docker_image).await?;

        // Find available ports
        let ssh_port = Self::find_available_port().await?;
        let web_port = Self::find_available_port().await?;

        // Configure port bindings
        let mut port_bindings = HashMap::new();
        port_bindings.insert(
            "2222/tcp".to_string(),
            Some(vec![PortBinding {
                host_ip: Some("127.0.0.1".to_string()),
                host_port: Some(ssh_port.to_string()),
            }]),
        );
        port_bindings.insert(
            "8080/tcp".to_string(),
            Some(vec![PortBinding {
                host_ip: Some("127.0.0.1".to_string()),
                host_port: Some(web_port.to_string()),
            }]),
        );

        // Container configuration
        let config = Config {
            image: Some(challenge_config.docker_image.clone()),
            env: Some(
                challenge_config
                    .environment_vars
                    .iter()
                    .map(|(k, v)| format!("{}={}", k, v))
                    .collect(),
            ),
            exposed_ports: Some({
                let mut exposed = HashMap::new();
                exposed.insert("2222/tcp".to_string(), HashMap::new());
                exposed.insert("8080/tcp".to_string(), HashMap::new());
                exposed
            }),
            host_config: Some(bollard::models::HostConfig {
                port_bindings: Some(port_bindings),
                privileged: Some(false),
                memory: Some(512 * 1024 * 1024), // 512MB
                cpu_shares: Some(512),
                ..Default::default()
            }),
            working_dir: Some("/home/hacker".to_string()),
            ..Default::default()
        };

        // Create container
        let container_name = format!("leethack-vm-{}", session_id);
        let options = CreateContainerOptions {
            name: container_name.clone(),
            platform: None,
        };

        debug!("Creating container {} with config: {:?}", container_name, config);

        let response: ContainerCreateResponse = docker
            .create_container(Some(options), config)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create container: {}", e))?;

        let container_id = response.id;
        info!("Created container {} with ID {}", container_name, container_id);

        // Start container
        docker
            .start_container(&container_id, None::<StartContainerOptions<String>>)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to start container: {}", e))?;

        info!("Started container {} on ports SSH:{} Web:{}", container_id, ssh_port, web_port);

        // Wait a moment for services to start
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

        Ok((container_id, ssh_port, web_port))
    }

    async fn ensure_image_exists(docker: &Docker, image_name: &str) -> Result<()> {
        // Check if image exists locally
        match docker.inspect_image(image_name).await {
            Ok(_) => {
                debug!("Docker image {} already exists", image_name);
                return Ok(());
            }
            Err(_) => {
                info!("Docker image {} not found locally", image_name);
            }
        }

        // If image doesn't exist, return an error with instructions
        Err(anyhow::anyhow!(
            "Docker image '{}' not found. Please build it first with: docker build -t {} -f Dockerfile.firecracker .",
            image_name, image_name
        ))
    }

    async fn find_available_port() -> Result<u16> {
        use std::net::{TcpListener, SocketAddr};
        
        let listener = TcpListener::bind(SocketAddr::from(([127, 0, 0, 1], 0)))
            .map_err(|e| anyhow::anyhow!("Failed to bind to port: {}", e))?;
        
        let port = listener
            .local_addr()
            .map_err(|e| anyhow::anyhow!("Failed to get local addr: {}", e))?
            .port();
        
        Ok(port)
    }

    pub async fn execute_command(
        state: &AppState,
        session_id: &str,
        command: &str,
    ) -> Result<CommandExecution> {
        // Wait for session to be ready (with timeout)
        let session = {
            let mut attempts = 0;
            loop {
                if let Some(session) = state.sessions.get(session_id) {
                    match session.status {
                        VmStatus::Running => {
                            if session.container_id.is_some() {
                                break session.clone();
                            }
                        }
                        VmStatus::Error(_) => {
                            return Err(anyhow::anyhow!("Session failed"));
                        }
                        VmStatus::Starting => {
                            // Still starting, wait a bit
                        }
                        VmStatus::Stopped => {
                            return Err(anyhow::anyhow!("Session is stopped"));
                        }
                    }
                } else {
                    return Err(anyhow::anyhow!("Session not found: {}", session_id));
                }
                
                attempts += 1;
                if attempts > 20 { // 10 seconds total (20 * 500ms)
                    return Err(anyhow::anyhow!("Timeout waiting for session to be ready"));
                }
                
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
        };

        let container_id = session
            .container_id
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Container not available for session: {}", session_id))?;

        // Get current working directory from session
        let current_dir = session.current_directory.clone();

        // Update last activity
        if let Some(mut session) = state.sessions.get_mut(session_id) {
            session.last_activity = Utc::now();
        }

        let start_time = std::time::Instant::now();
        let timestamp = Utc::now();

        debug!("Executing command '{}' in container {} from directory {}", command, container_id, current_dir);

        // First check if the container is running
        let container_info = state
            .docker_client
            .inspect_container(container_id, None)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to inspect container: {}", e))?;

        if !container_info.state.unwrap_or_default().running.unwrap_or(false) {
            return Err(anyhow::anyhow!("Container is not running"));
        }

        // Process command for directory tracking
        let (processed_command, is_cd_command, target_dir) = Self::process_command(command, &current_dir);

        // Execute command in container with TTY support for interactive commands
        let exec_config = bollard::exec::CreateExecOptions {
            attach_stdout: Some(true),
            attach_stderr: Some(true),
            attach_stdin: Some(true),
            cmd: Some(vec!["bash", "-c", &processed_command]),
            working_dir: Some(&current_dir),
            user: Some("root"),
            tty: Some(true),
            ..Default::default()
        };

        let exec_response = state
            .docker_client
            .create_exec(container_id, exec_config)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create exec: {}", e))?;

        let exec_start_config = bollard::exec::StartExecOptions {
            detach: false,
            ..Default::default()
        };

        let exec_stream = state
            .docker_client
            .start_exec(&exec_response.id, Some(exec_start_config))
            .await
            .map_err(|e| anyhow::anyhow!("Failed to start exec stream: {}", e))?;

        let mut command_output = String::new();
        
        // Handle the stream properly - no timeout for interactive commands
        if let bollard::exec::StartExecResults::Attached { mut output, .. } = exec_stream {
            use futures::StreamExt;
            
            // Check if command is interactive
            let is_interactive = Self::is_interactive_command(command);
            
            if is_interactive {
                // For interactive commands, stream without timeout
                while let Some(chunk_result) = output.next().await {
                    match chunk_result {
                        Ok(log_output) => {
                            // Convert LogOutput to bytes properly
                            let bytes = match log_output {
                                bollard::container::LogOutput::StdOut { message } => message,
                                bollard::container::LogOutput::StdErr { message } => message,
                                bollard::container::LogOutput::StdIn { message } => message,
                                bollard::container::LogOutput::Console { message } => message,
                            };
                            command_output.push_str(&String::from_utf8_lossy(&bytes));
                        }
                        Err(e) => {
                            debug!("Stream error: {}", e);
                            break;
                        }
                    }
                }
            } else {
                // For regular commands, use timeout
                use tokio::time::{timeout, Duration};
                let timeout_duration = Duration::from_secs(30);
                
                match timeout(timeout_duration, async {
                    while let Some(chunk_result) = output.next().await {
                        match chunk_result {
                            Ok(log_output) => {
                                let bytes = match log_output {
                                    bollard::container::LogOutput::StdOut { message } => message,
                                    bollard::container::LogOutput::StdErr { message } => message,
                                    bollard::container::LogOutput::StdIn { message } => message,
                                    bollard::container::LogOutput::Console { message } => message,
                                };
                                command_output.push_str(&String::from_utf8_lossy(&bytes));
                            }
                            Err(e) => {
                                debug!("Stream error: {}", e);
                                break;
                            }
                        }
                    }
                }).await {
                    Ok(_) => {
                        debug!("Command stream completed successfully");
                    }
                    Err(_) => {
                        debug!("Command execution timed out after 30 seconds");
                        command_output.push_str("\n[Command timed out after 30 seconds]");
                    }
                }
            }
        } else {
            return Err(anyhow::anyhow!("Unexpected detached exec result"));
        }

        // Get exit code
        let exec_inspect = state
            .docker_client
            .inspect_exec(&exec_response.id)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to inspect exec: {}", e))?;

        let exit_code = exec_inspect.exit_code.unwrap_or(-1) as i32;
        let duration_ms = start_time.elapsed().as_millis() as u64;

        debug!("Command completed with exit code {} in {}ms", exit_code, duration_ms);

        // Update session directory if cd command was successful
        if is_cd_command && exit_code == 0 {
            if let Some(mut session) = state.sessions.get_mut(session_id) {
                let new_dir = if let Some(target) = target_dir {
                    Self::resolve_path(&current_dir, &target)
                } else {
                    "/home/hacker".to_string() // cd with no args goes to home
                };
                session.current_directory = new_dir.clone();
                debug!("Updated session {} current directory to: {}", session_id, new_dir);
            }
        }

        Ok(CommandExecution {
            session_id: session_id.to_string(),
            command: command.to_string(),
            output: command_output,
            exit_code,
            duration_ms,
            timestamp,
        })
    }

    pub async fn destroy_session(state: &AppState, session_id: &str) -> Result<()> {
        let session = state
            .sessions
            .remove(session_id)
            .ok_or_else(|| anyhow::anyhow!("Session not found: {}", session_id))?;

        if let Some(container_id) = session.1.container_id {
            info!("Destroying container {} for session {}", container_id, session_id);
            
            // Stop and remove container
            let _ = state.docker_client.stop_container(&container_id, None).await;
            
            let remove_options = RemoveContainerOptions {
                force: true,
                ..Default::default()
            };
            
            state
                .docker_client
                .remove_container(&container_id, Some(remove_options))
                .await
                .map_err(|e| anyhow::anyhow!("Failed to remove container: {}", e))?;
            
            info!("Successfully destroyed session {}", session_id);
        }
        
        Ok(())
    }

    pub async fn cleanup_inactive_sessions(state: &AppState, max_idle_minutes: i64) -> Result<()> {
        let now = Utc::now();
        let mut sessions_to_remove = Vec::new();
        
        for session_ref in state.sessions.iter() {
            let session = session_ref.value();
            let idle_duration = now.signed_duration_since(session.last_activity);
            
            if idle_duration.num_minutes() > max_idle_minutes {
                sessions_to_remove.push(session.id.clone());
            }
        }
        
        for session_id in sessions_to_remove {
            info!("Cleaning up inactive session: {}", session_id);
            let _ = Self::destroy_session(state, &session_id).await;
        }
        
        Ok(())
    }

    /// Process a command to handle directory changes and path resolution
    fn process_command(command: &str, _current_dir: &str) -> (String, bool, Option<String>) {
        let trimmed = command.trim();
        
        // Check if it's a cd command
        if trimmed == "cd" || trimmed.starts_with("cd ") {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            let is_cd = true;
            let target_dir = if parts.len() > 1 {
                Some(parts[1].to_string())
            } else {
                None // cd with no args
            };
            (command.to_string(), is_cd, target_dir)
        } else {
            // For all other commands, just return as-is
            (command.to_string(), false, None)
        }
    }

    /// Resolve a path relative to the current directory
    fn resolve_path(current_dir: &str, target: &str) -> String {
        if target.starts_with('/') {
            // Absolute path
            target.to_string()
        } else if target == ".." {
            // Parent directory
            let parts: Vec<&str> = current_dir.split('/').filter(|s| !s.is_empty()).collect();
            if parts.len() <= 1 {
                "/home/hacker".to_string() // Don't go above /home/hacker
            } else {
                let mut new_parts = parts;
                new_parts.pop();
                format!("/{}", new_parts.join("/"))
            }
        } else if target == "." {
            // Current directory
            current_dir.to_string()
        } else if target.starts_with("../") {
            // Relative path starting with ../
            let parent = Self::resolve_path(current_dir, "..");
            let remaining = &target[3..]; // Remove "../"
            Self::resolve_path(&parent, remaining)
        } else {
            // Relative path - append to current directory
            if current_dir.ends_with('/') {
                format!("{}{}", current_dir, target)
            } else {
                format!("{}/{}", current_dir, target)
            }
        }
    }

    /// Check if a command is interactive and needs special TTY handling
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

    /// Execute an interactive command with bidirectional streaming
    pub async fn execute_interactive_command(
        state: &AppState,
        session_id: &str,
        command: &str,
        mut input_stream: tokio::sync::mpsc::Receiver<String>,
        output_sender: tokio::sync::mpsc::Sender<String>,
    ) -> Result<()> {
        // Wait for session to be ready
        let session = {
            let mut attempts = 0;
            loop {
                if let Some(session) = state.sessions.get(session_id) {
                    match session.status {
                        VmStatus::Running => {
                            if session.container_id.is_some() {
                                break session.clone();
                            }
                        }
                        VmStatus::Error(ref error) => {
                            return Err(anyhow::anyhow!("Session error: {}", error));
                        }
                        VmStatus::Starting => {
                            // Still starting, wait a bit
                        }
                        VmStatus::Stopped => {
                            return Err(anyhow::anyhow!("Session is stopped"));
                        }
                    }
                } else {
                    return Err(anyhow::anyhow!("Session not found: {}", session_id));
                }
                
                attempts += 1;
                if attempts > 20 {
                    return Err(anyhow::anyhow!("Timeout waiting for session to be ready"));
                }
                
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
        };

        let container_id = session
            .container_id
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Container not available for session: {}", session_id))?;

        let current_dir = session.current_directory.clone();

        debug!("Starting interactive command '{}' in container {} from directory {}", command, container_id, current_dir);

        // Create exec with TTY for interactive commands
        let exec_config = bollard::exec::CreateExecOptions {
            attach_stdout: Some(true),
            attach_stderr: Some(true),
            attach_stdin: Some(true),
            cmd: Some(vec!["bash", "-c", command]),
            working_dir: Some(&current_dir),
            user: Some("root"),
            tty: Some(true), // Essential for interactive commands
            ..Default::default()
        };

        let exec_response = state
            .docker_client
            .create_exec(container_id, exec_config)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create exec: {}", e))?;

        let exec_start_config = bollard::exec::StartExecOptions {
            detach: false,
            ..Default::default()
        };

        let exec_stream = state
            .docker_client
            .start_exec(&exec_response.id, Some(exec_start_config))
            .await
            .map_err(|e| anyhow::anyhow!("Failed to start exec stream: {}", e))?;

        if let bollard::exec::StartExecResults::Attached { mut output, input } = exec_stream {
            use futures::StreamExt;
            use tokio::io::AsyncWriteExt;
            
            let mut stdin_writer = input;
            
            // Spawn task to handle output streaming
            let output_sender_clone = output_sender.clone();
            let output_task = tokio::spawn(async move {
                while let Some(chunk_result) = output.next().await {
                    match chunk_result {
                        Ok(log_output) => {
                            let bytes = match log_output {
                                bollard::container::LogOutput::StdOut { message } => message,
                                bollard::container::LogOutput::StdErr { message } => message,
                                bollard::container::LogOutput::StdIn { message } => message,
                                bollard::container::LogOutput::Console { message } => message,
                            };
                            let output_str = String::from_utf8_lossy(&bytes).to_string();
                            if let Err(_) = output_sender_clone.send(output_str).await {
                                debug!("Output channel closed, ending output task");
                                break;
                            }
                        }
                        Err(e) => {
                            debug!("Output stream error: {}", e);
                            break;
                        }
                    }
                }
            });
            
            // Spawn task to handle input streaming
            let input_task = tokio::spawn(async move {
                while let Some(input_data) = input_stream.recv().await {
                    let input_bytes = input_data.into_bytes();
                    if let Err(e) = stdin_writer.write_all(&input_bytes).await {
                        debug!("Failed to send input to container: {}", e);
                        break;
                    }
                    if let Err(e) = stdin_writer.flush().await {
                        debug!("Failed to flush input to container: {}", e);
                        break;
                    }
                }
            });
            
            // Wait for either task to complete
            tokio::select! {
                _ = output_task => {
                    debug!("Interactive command output ended");
                }
                _ = input_task => {
                    debug!("Interactive command input ended");
                }
            }
        } else {
            return Err(anyhow::anyhow!("Unexpected detached exec result"));
        }

        Ok(())
    }
}

import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { NodeSSH } from 'node-ssh';

const execAsync = promisify(exec);

export interface VMSession {
  id: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  vmId?: string;
  ipAddress?: string;
  ssh?: NodeSSH;
  challenge: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface CommandResult {
  output: string;
  exitCode: number;
  error?: string;
}

export class VMManager {
  private sessions: Map<string, VMSession> = new Map();
  private vmCounter = 0;

  constructor() {
    this.initializeVMManager();
  }

  private async initializeVMManager() {
    console.log('[VM Manager] Initializing Firecracker VM Manager...');
    
    // Check if Firecracker/Ignite is available
    try {
      await this.checkFirecrackerAvailability();
      console.log('[VM Manager] Firecracker is available');
    } catch (error) {
      console.warn('[VM Manager] Firecracker not available, using Docker fallback');
    }
  }

  private async checkFirecrackerAvailability(): Promise<boolean> {
    try {
      // Check if ignite command exists
      await execAsync('which ignite');
      return true;
    } catch {
      // Check if docker is available as fallback
      try {
        await execAsync('which docker');
        console.log('[VM Manager] Using Docker as Firecracker alternative');
        return true;
      } catch {
        throw new Error('Neither Firecracker nor Docker is available');
      }
    }
  }

  async createSession(challenge: string = 'sql-injection'): Promise<VMSession> {
    const sessionId = `session-${Date.now()}-${++this.vmCounter}`;
    
    const session: VMSession = {
      id: sessionId,
      status: 'starting',
      challenge,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);

    try {
      // Try to create actual VM, but don't fail if it doesn't work
      await this.createVM(session);
      session.status = 'running';
      console.log(`[VM Manager] Session ${sessionId} created successfully with VM`);
    } catch (error) {
      console.warn(`[VM Manager] Failed to create VM for session ${sessionId}, using fallback mode:`, error);
      // Still mark as running so commands can be executed in simulation mode
      session.status = 'running';
      console.log(`[VM Manager] Session ${sessionId} running in simulation mode`);
    }

    return session;
  }

  private async createVM(session: VMSession): Promise<void> {
    try {
      // Try Firecracker/Ignite first
      await this.createFirecrackerVM(session);
    } catch (error) {
      console.log('[VM Manager] Firecracker failed, trying Docker fallback...');
      await this.createDockerVM(session);
    }
  }

  private async createFirecrackerVM(session: VMSession): Promise<void> {
    const vmName = `leethack-${session.challenge}-${session.id}`;
    
    // Create Firecracker VM using Ignite
    const createCommand = `ignite run weaveworks/ignite-ubuntu:latest --name ${vmName} --ssh --ports 22:0`;
    
    try {
      const { stdout } = await execAsync(createCommand);
      console.log(`[VM Manager] Ignite VM created: ${stdout}`);
      
      // Get VM IP address
      const inspectCommand = `ignite inspect vm ${vmName} --template '{{.Status.Network.IPAddresses}}'`;
      const { stdout: ipOutput } = await execAsync(inspectCommand);
      
      session.vmId = vmName;
      session.ipAddress = ipOutput.trim().replace(/[\[\]]/g, '');
      
      // Wait for VM to be ready and setup SSH
      await this.setupSSH(session);
      await this.setupChallengeEnvironment(session);
      
    } catch (error) {
      throw new Error(`Failed to create Firecracker VM: ${error}`);
    }
  }

  private async createDockerVM(session: VMSession): Promise<void> {
    const containerName = `leethack-${session.challenge}-${session.id}`;
    
    // Create Docker container with security tools pre-installed
    const createCommand = `docker run -d --name ${containerName} --privileged ` +
      `-p 0:22 -p 0:80 -p 0:3306 ` +
      `--cap-add=NET_ADMIN --cap-add=SYS_ADMIN ` +
      `kalilinux/kali-rolling:latest tail -f /dev/null`;
    
    try {
      const { stdout } = await execAsync(createCommand);
      session.vmId = containerName;
      
      // Get container IP
      const inspectCommand = `docker inspect ${containerName} --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`;
      const { stdout: ipOutput } = await execAsync(inspectCommand);
      session.ipAddress = ipOutput.trim();
      
      // Setup the container environment
      await this.setupDockerEnvironment(session);
      
      console.log(`[VM Manager] Docker container created: ${containerName} at ${session.ipAddress}`);
    } catch (error) {
      throw new Error(`Failed to create Docker container: ${error}`);
    }
  }

  private async setupSSH(session: VMSession): Promise<void> {
    if (!session.ipAddress) return;
    
    const ssh = new NodeSSH();
    let retries = 10;
    
    while (retries > 0) {
      try {
        await ssh.connect({
          host: session.ipAddress,
          username: 'root',
          password: 'root', // Default for challenge VMs
          readyTimeout: 10000
        });
        
        session.ssh = ssh;
        console.log(`[VM Manager] SSH connection established to ${session.ipAddress}`);
        return;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Failed to establish SSH connection: ${error}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  private async setupDockerEnvironment(session: VMSession): Promise<void> {
    const containerName = session.vmId!;
    
    // Install essential tools and create challenge environment
    const setupCommands = [
      'apt-get update',
      'apt-get install -y curl wget nmap sqlmap netcat-traditional python3 python3-pip openssh-server',
      'service ssh start',
      'useradd -m -s /bin/bash hacker',
      'echo "hacker:hacker" | chpasswd',
      'mkdir -p /home/hacker/webapp /home/hacker/tools /home/hacker/scripts',
      'chown -R hacker:hacker /home/hacker',
      'chmod 755 /home/hacker'
    ];

    for (const cmd of setupCommands) {
      try {
        await execAsync(`docker exec ${containerName} bash -c "${cmd}"`);
      } catch (error) {
        console.warn(`[VM Manager] Setup command failed: ${cmd}`, error);
      }
    }

    // Setup challenge-specific environment
    await this.setupChallengeFiles(session);
  }

  private async setupChallengeEnvironment(session: VMSession): Promise<void> {
    if (!session.ssh) return;
    
    try {
      // Install required tools
      await session.ssh.execCommand('apt-get update && apt-get install -y curl wget nmap sqlmap netcat python3');
      
      // Create user and directories
      await session.ssh.execCommand('useradd -m -s /bin/bash hacker');
      await session.ssh.execCommand('mkdir -p /home/hacker/webapp /home/hacker/tools /home/hacker/scripts');
      
      // Setup challenge files
      await this.setupChallengeFiles(session);
      
    } catch (error) {
      console.error('[VM Manager] Failed to setup challenge environment:', error);
    }
  }

  private async setupChallengeFiles(session: VMSession): Promise<void> {
    const readmeContent = `=== LeetHack Challenge: ${session.challenge.toUpperCase()} ===

Target: http://localhost:8080/webapp/login.php
Goal: Exploit SQL injection to access admin account

Available Tools:
- curl: HTTP client for web requests
- wget: Download files from web servers  
- sqlmap: Automated SQL injection tool
- nmap: Network scanner and port discovery
- netcat: Networking utility for connections
- python3: Python interpreter for custom scripts

Tips:
- Start by exploring the web application with curl
- Look for vulnerable parameters in forms
- Try basic SQL injection payloads first
- Use sqlmap for automated testing
- Check the source code for hints

Target Application:
The vulnerable web app is running on port 8080
Try: curl http://localhost:8080/webapp/login.php

Good luck, hacker!
`;

    if (session.vmId && session.vmId.startsWith('leethack-')) {
      // Docker container
      await execAsync(`docker exec ${session.vmId} bash -c "echo '${readmeContent}' > /home/hacker/README.txt"`);
      
      // Create vulnerable web app files
      const loginPhp = `<?php
// Vulnerable login script for SQL injection challenge
if ($_GET['username'] && $_GET['password']) {
    $username = $_GET['username'];
    $password = $_GET['password'];
    
    // VULNERABLE SQL QUERY - DO NOT USE IN PRODUCTION
    $query = "SELECT * FROM users WHERE username='$username' AND password='$password'";
    
    echo "<h3>Debug Info:</h3>";
    echo "<p>SQL Query: " . htmlspecialchars($query) . "</p>";
    
    // Simulate database check
    if (strpos($username, "' OR '1'='1") !== false || strpos($username, "admin'--") !== false) {
        echo "<div style='color: green;'><h2>SUCCESS! You've successfully exploited the SQL injection!</h2>";
        echo "<p>Congratulations! You accessed the admin account.</p>";
        echo "<p>Flag: LEETHACK{sql_1nj3ct10n_m4st3r}</p></div>";
    } else {
        echo "<div style='color: red;'><h2>Login Failed</h2>";
        echo "<p>Invalid username or password.</p></div>";
    }
} else {
    echo "<h2>Login Page</h2>";
    echo "<form method='GET'>";
    echo "Username: <input type='text' name='username' placeholder='Enter username'><br><br>";
    echo "Password: <input type='password' name='password' placeholder='Enter password'><br><br>";
    echo "<button type='submit'>Login</button>";
    echo "</form>";
}
?>`;

      await execAsync(`docker exec ${session.vmId} bash -c "mkdir -p /var/www/html/webapp"`);
      await execAsync(`docker exec ${session.vmId} bash -c "echo '${loginPhp}' > /var/www/html/webapp/login.php"`);
      await execAsync(`docker exec ${session.vmId} bash -c "apt-get install -y apache2 php && service apache2 start"`);
    }
  }

  async executeCommand(sessionId: string, command: string): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.lastActivity = new Date();

    // Handle clear command locally
    if (command.trim() === 'clear') {
      return { output: '', exitCode: 0 };
    }

    // Handle built-in commands that work regardless of container status
    if (command.trim() === 'help') {
      return {
        output: `Available commands:
ls               - list directory contents
cd <dir>         - change directory
pwd              - print working directory
cat <file>       - display file contents
curl <url>       - make HTTP request
nmap <target>    - network scan
sqlmap <options> - SQL injection tool
clear            - clear terminal
help             - show this help message

Challenge Environment:
- Target webapp: http://localhost:8080/webapp/login.php
- Tools: nmap, sqlmap, curl available
- Goal: Find and exploit SQL injection vulnerabilities`,
        exitCode: 0
      };
    }

    try {
      if (session.ssh) {
        // Use SSH for Firecracker VMs
        return await this.executeSSHCommand(session, command);
      } else if (session.vmId) {
        // Use Docker exec for Docker containers
        return await this.executeDockerCommand(session, command);
      } else {
        // Fallback: simulate some basic commands for demo
        return await this.simulateCommand(command);
      }
    } catch (error) {
      console.error('Command execution error:', error);
      // Fallback to simulation if real execution fails
      return await this.simulateCommand(command);
    }
  }

  private async simulateCommand(command: string): Promise<CommandResult> {
    const cmd = command.trim().toLowerCase();
    
    // Simulate common penetration testing commands
    if (cmd.startsWith('ls')) {
      return {
        output: `webapp/
tools/
scripts/
README.txt`,
        exitCode: 0
      };
    }
    
    if (cmd.startsWith('nmap')) {
      return {
        output: `Starting Nmap 7.93 ( https://nmap.org )
Nmap scan report for localhost (127.0.0.1)
Host is up (0.000020s latency).

PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
3306/tcp open  mysql
8080/tcp open  http-proxy

Nmap done: 1 IP address (1 host up) scanned in 0.24 seconds`,
        exitCode: 0
      };
    }
    
    if (cmd.includes('curl') && cmd.includes('localhost:8080')) {
      if (cmd.includes('login.php')) {
        return {
          output: `<html>
<head><title>Vulnerable Login</title></head>
<body>
<h2>Login</h2>
<form method="POST" action="login.php">
    Username: <input type="text" name="username"><br><br>
    Password: <input type="password" name="password"><br><br>
    <input type="submit" value="Login">
</form>
<!-- Hint: Try SQL injection in the username field -->
<!-- Example: admin' OR '1'='1'-- -->
</body>
</html>`,
          exitCode: 0
        };
      }
    }
    
    if (cmd.includes('sqlmap')) {
      if (cmd.includes('localhost:8080')) {
        return {
          output: `        ___
       __H__
 ___ ___[.]_____ ___ ___  {1.7.2#stable}
|_ -| . [.]     | .'| . |
|___|_  [.]_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org

[INFO] testing connection to the target URL
[INFO] checking if the target is protected by some kind of WAF/IPS
[INFO] testing if the target URL content is stable
[INFO] target URL content is stable
[INFO] testing if GET parameter 'username' is dynamic
[INFO] GET parameter 'username' appears to be dynamic
[INFO] heuristic (basic) test shows that GET parameter 'username' might be injectable
[INFO] testing for SQL injection on GET parameter 'username'
[INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'
[INFO] GET parameter 'username' appears to be 'AND boolean-based blind - WHERE or HAVING clause' injectable

GET parameter 'username' is vulnerable. Do you want to keep testing the others? [y/N] 

sqlmap identified the following injection point(s):
---
Parameter: username (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: username=admin' AND 1234=1234-- &password=test

    Type: time-based blind  
    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)
    Payload: username=admin' AND (SELECT 1234 FROM (SELECT(SLEEP(5)))xyz)-- &password=test
---

[INFO] the back-end DBMS is MySQL
[INFO] fetching database names
available databases [3]:
[*] information_schema
[*] mysql  
[*] vulnerable_app

Database: vulnerable_app
Table: users
[3 entries]
+----+----------+----------+
| id | username | password |
+----+----------+----------+
| 1  | admin    | admin123 |
| 2  | user     | pass456  |
| 3  | guest    | guest789 |
+----+----------+----------+

[SUCCESS] SQL injection successful! Flag: LEETHACK{sql_1nj3ct10n_m4st3r}`,
          exitCode: 0
        };
      } else {
        return {
          output: `Usage: sqlmap -u "http://target/page.php?param=value" [options]

Example: sqlmap -u "http://localhost:8080/webapp/login.php?username=admin&password=test"
Try: sqlmap -u "http://localhost:8080/webapp/login.php" --data="username=admin&password=test"`,
          exitCode: 0
        };
      }
    }
    
    if (cmd.startsWith('cd')) {
      return { output: '', exitCode: 0 };
    }
    
    if (cmd === 'pwd') {
      return { output: '/home/hacker', exitCode: 0 };
    }
    
    if (cmd.startsWith('cat')) {
      const filename = cmd.split(' ')[1];
      if (filename === 'README.txt') {
        return {
          output: `=== LeetHack SQL Injection Challenge ===

Target: http://localhost:8080/webapp/login.php
Database: MySQL (vulnerable to SQL injection)

Your mission:
1. Analyze the login form at the target URL
2. Test for SQL injection vulnerabilities
3. Extract data from the database
4. Find the hidden flag

Available tools:
- curl: Test HTTP requests to the webapp
- nmap: Scan for open ports and services  
- sqlmap: Automated SQL injection testing

Hints:
- Start by examining the login form with curl
- Try basic SQL injection payloads in the username field
- Use sqlmap for automated testing and data extraction
- Look for boolean-based and time-based SQL injection

Good luck, hacker!`,
          exitCode: 0
        };
      }
    }
    
    // Default response for unrecognized commands
    return {
      output: `bash: ${command}: command not found
Type 'help' for available commands`,
      exitCode: 1
    };
  }

  private async executeSSHCommand(session: VMSession, command: string): Promise<CommandResult> {
    if (!session.ssh) {
      throw new Error('SSH connection not available');
    }

    try {
      const result = await session.ssh.execCommand(command, {
        cwd: '/home/hacker'
      });

      return {
        output: result.stdout + (result.stderr ? '\n' + result.stderr : ''),
        exitCode: result.code || 0
      };
    } catch (error) {
      throw new Error(`SSH command execution failed: ${error}`);
    }
  }

  private async executeDockerCommand(session: VMSession, command: string): Promise<CommandResult> {
    const containerName = session.vmId!;
    const dockerCommand = `docker exec -u hacker -w /home/hacker ${containerName} bash -c "${command.replace(/"/g, '\\"')}"`;
    
    try {
      const { stdout, stderr } = await execAsync(dockerCommand);
      return {
        output: stdout + (stderr ? '\n' + stderr : ''),
        exitCode: 0
      };
    } catch (error: any) {
      return {
        output: error.stdout + (error.stderr ? '\n' + error.stderr : ''),
        exitCode: error.code || 1,
        error: error.message
      };
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      if (session.ssh) {
        session.ssh.dispose();
      }

      if (session.vmId) {
        if (session.vmId.includes('docker') || session.vmId.startsWith('leethack-')) {
          // Destroy Docker container
          await execAsync(`docker rm -f ${session.vmId}`);
        } else {
          // Destroy Firecracker VM
          await execAsync(`ignite rm -f ${session.vmId}`);
        }
      }

      session.status = 'stopped';
      this.sessions.delete(sessionId);
      
      console.log(`[VM Manager] Session ${sessionId} destroyed`);
    } catch (error) {
      console.error(`[VM Manager] Failed to destroy session ${sessionId}:`, error);
    }
  }

  getSession(sessionId: string): VMSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): VMSession[] {
    return Array.from(this.sessions.values());
  }

  // Cleanup inactive sessions
  async cleanupInactiveSessions(): Promise<void> {
    const now = new Date();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.sessions) {
      if (now.getTime() - session.lastActivity.getTime() > maxInactiveTime) {
        console.log(`[VM Manager] Cleaning up inactive session: ${sessionId}`);
        await this.destroySession(sessionId);
      }
    }
  }
}

export const vmManager = new VMManager();

// Only start cleanup if in production or when explicitly needed
if (process.env.NODE_ENV === 'production') {
  // Cleanup inactive sessions every 10 minutes
  setInterval(() => {
    vmManager.cleanupInactiveSessions();
  }, 10 * 60 * 1000);
}

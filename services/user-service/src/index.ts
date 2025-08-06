import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('User Service is running!');
});

// Terminal session endpoints
app.post('/api/terminal/session', (req: Request, res: Response) => {
  const sessionId = `session-${Date.now()}`;
  res.json({
    success: true,
    data: {
      sessionId,
      status: 'active',
      environment: {
        USER: 'hacker',
        SHELL: '/bin/bash',
        PWD: '/home/hacker'
      }
    }
  });
});

app.post('/api/terminal/execute', (req: Request, res: Response) => {
  const { sessionId, command } = req.body;
  
  // Mock command execution - in real implementation this would interact with firecracker VMs
  const executeCommand = (cmd: string): { output: string; exitCode: number } => {
    const trimmedCmd = cmd.trim().toLowerCase();
    
    switch (trimmedCmd) {
      case 'ls':
        return {
          output: 'webapp\ntools\nscripts\nREADME.txt',
          exitCode: 0
        };
      case 'ls -la':
        return {
          output: `total 16
drwxr-xr-x 5 hacker hacker 4096 Aug  6 17:45 .
drwxr-xr-x 3 root   root   4096 Aug  6 17:30 ..
drwxr-xr-x 3 hacker hacker 4096 Aug  6 17:45 webapp
drwxr-xr-x 2 hacker hacker 4096 Aug  6 17:45 tools
drwxr-xr-x 2 hacker hacker 4096 Aug  6 17:45 scripts
-rw-r--r-- 1 hacker hacker  156 Aug  6 17:45 README.txt`,
          exitCode: 0
        };
      case 'pwd':
        return {
          output: '/home/hacker',
          exitCode: 0
        };
      case 'whoami':
        return {
          output: 'hacker',
          exitCode: 0
        };
      case 'help':
        return {
          output: `Available commands:
ls, ls -la       - list directory contents
cd <dir>         - change directory
pwd              - print working directory
cat <file>       - display file contents
curl <url>       - make HTTP request
sqlmap           - automated SQL injection tool
nmap             - network scanner
help             - show this help message

Challenge Goal: Find and exploit SQL injection in the web application`,
          exitCode: 0
        };
      default:
        return {
          output: `bash: ${cmd}: command not found\nType 'help' for available commands`,
          exitCode: 127
        };
    }
  };

  const result = executeCommand(command);
  
  res.json({
    success: true,
    data: {
      sessionId,
      command,
      output: result.output,
      exitCode: result.exitCode,
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});
import express, { Request, Response } from 'express';
import cors from 'cors';
import { vmManager } from './vm-manager';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('User Service is running!');
});

// Terminal session endpoints
app.post('/api/terminal/session', async (req: Request, res: Response) => {
  try {
    const { challenge = 'sql-injection' } = req.body;
    const session = await vmManager.createSession(challenge);
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        challenge: session.challenge,
        environment: {
          USER: 'hacker',
          SHELL: '/bin/bash',
          PWD: '/home/hacker'
        }
      }
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create VM session'
    });
  }
});

app.post('/api/terminal/execute', async (req: Request, res: Response) => {
  try {
    const { sessionId, command } = req.body;
    
    if (!sessionId || !command) {
      return res.status(400).json({
        success: false,
        error: 'Missing sessionId or command'
      });
    }

    const session = vmManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: `Session is ${session.status}, cannot execute commands`
      });
    }

    const result = await vmManager.executeCommand(sessionId, command);
    
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
  } catch (error) {
    console.error('Command execution failed:', error);
    res.status(500).json({
      success: false,
      error: 'Command execution failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get session status
app.get('/api/terminal/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = vmManager.getSession(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  
  res.json({
    success: true,
    data: {
      sessionId: session.id,
      status: session.status,
      challenge: session.challenge,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }
  });
});

// Destroy session
app.delete('/api/terminal/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    await vmManager.destroySession(sessionId);
    
    res.json({
      success: true,
      message: 'Session destroyed successfully'
    });
  } catch (error) {
    console.error('Failed to destroy session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to destroy session'
    });
  }
});

// List all sessions (for debugging)
app.get('/api/terminal/sessions', (req: Request, res: Response) => {
  const sessions = vmManager.getAllSessions();
  
  res.json({
    success: true,
    data: sessions.map(session => ({
      sessionId: session.id,
      status: session.status,
      challenge: session.challenge,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }))
  });
});

app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});
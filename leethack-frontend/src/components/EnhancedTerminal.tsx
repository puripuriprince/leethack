"use client";

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

// Types
interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  exitCode: number;
  duration: number;
}

// Utility function to format duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface EnhancedTerminalProps {
  onCommand?: (command: string) => Promise<string>;
  isConnected?: boolean;
  className?: string;
  initialMessage?: string;
}

export function EnhancedTerminal({ 
  onCommand,
  isConnected = true,
  className = "",
  initialMessage = "Welcome to LeetHack Terminal - Type 'help' for available commands"
}: EnhancedTerminalProps) {
  const [currentInput, setCurrentInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [terminalHistory, setTerminalHistory] = useState<TerminalCommand[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [sessionDuration, setSessionDuration] = useState<string>("00:00");
  const [isClient, setIsClient] = useState<boolean>(false);
  const [currentDirectory, setCurrentDirectory] = useState<string>("~");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInteractiveMode, setIsInteractiveMode] = useState<boolean>(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<Date>(new Date());

  // Auto-focus the input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-scroll to bottom when new commands are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // Set client flag and update session duration
  useEffect(() => {
    setIsClient(true);
    const updateDuration = () => {
      const now = new Date();
      const start = sessionStartTime.current;
      const durationSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      setSessionDuration(formatDuration(durationSeconds));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => {
      clearInterval(interval);
      // Clean up WebSocket connection
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  // Initialize VM session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/terminal/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            challenge: 'sql-injection'
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Session created successfully:', result.session_id);
          setSessionId(result.session_id);
          
          // Initialize WebSocket connection for interactive commands
          setTimeout(() => {
            connectWebSocket(result.session_id);
          }, 1000); // Small delay to ensure session is ready
          
          // Add initialization message
          const initMessage: TerminalCommand = {
            id: `init-${Date.now()}`,
            command: '',
            output: `VM Session initialized: ${result.session_id}\nEnvironment: ${result.challenge}\n${initialMessage}`,
            timestamp: new Date(),
            exitCode: 0,
            duration: 0
          };
          setTerminalHistory([initMessage]);
        } else {
          throw new Error(`Failed to create session: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to initialize VM session:', error);
        
        const errorMessage: TerminalCommand = {
          id: `error-${Date.now()}`,
          command: '',
          output: `Failed to initialize VM session: ${error}\nUsing fallback mode. Some commands may not work as expected.`,
          timestamp: new Date(),
          exitCode: 1,
          duration: 0
        };
        setTerminalHistory([errorMessage]);
      }
    };

    initializeSession();
  }, [initialMessage]);

  // WebSocket connection helper
  const connectWebSocket = (sessionId: string) => {
    if (wsConnection) {
      wsConnection.close();
    }

    const wsUrl = `ws://localhost:3001/api/terminal/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for session:', sessionId);
      setWsConnection(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnection(null);
      setIsInteractiveMode(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnection(null);
      setIsInteractiveMode(false);
    };

    return ws;
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'command_result') {
      const commandEntry: TerminalCommand = {
        id: `ws-cmd-${Date.now()}`,
        command: data.command,
        output: data.output,
        timestamp: new Date(data.timestamp || Date.now()),
        exitCode: data.exit_code || 0,
        duration: 0
      };
      setTerminalHistory(prev => [...prev, commandEntry]);
    } else if (data.type === 'error') {
      const errorEntry: TerminalCommand = {
        id: `ws-error-${Date.now()}`,
        command: '',
        output: `Error: ${data.message}`,
        timestamp: new Date(),
        exitCode: 1,
        duration: 0
      };
      setTerminalHistory(prev => [...prev, errorEntry]);
    }
    setIsExecuting(false);
  };

  // Check if command is interactive
  const isInteractiveCommand = (command: string): boolean => {
    const cmd = command.trim().toLowerCase();
    const interactiveCommands = ['vim', 'vi', 'nano', 'emacs', 'less', 'more', 'man', 'htop', 'top'];
    return interactiveCommands.some(icmd => 
      cmd.startsWith(icmd) && (cmd.length === icmd.length || cmd[icmd.length] === ' ')
    );
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (currentInput.trim() && !isExecuting) {
        const command = currentInput.trim();
        const newHistory = [...commandHistory, command];
        setCommandHistory(newHistory);
        setCurrentInput("");
        setHistoryIndex(-1);
        setIsExecuting(true);

        // Add command to terminal history immediately
        const commandEntry: TerminalCommand = {
          id: `cmd-${Date.now()}`,
          command: command,
          output: "",
          timestamp: new Date(),
          exitCode: 0,
          duration: 0
        };

        setTerminalHistory(prev => [...prev, commandEntry]);

        try {
          // Check if it's an interactive command
          if (isInteractiveCommand(command)) {
            // Use WebSocket for interactive commands
            if (!wsConnection && sessionId) {
              connectWebSocket(sessionId);
            }
            
            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
              wsConnection.send(JSON.stringify({
                type: 'command',
                command: command
              }));
              // Don't set isExecuting to false here, wait for WebSocket response
            } else {
              // Fallback if WebSocket not available
              const output = `Interactive command '${command}' requires WebSocket connection. WebSocket not available - using fallback.`;
              setTerminalHistory((prev: TerminalCommand[]) => 
                prev.map((entry: TerminalCommand) => 
                  entry.id === commandEntry.id 
                    ? { ...entry, output, exitCode: 1, duration: 0 }
                    : entry
                )
              );
              setIsExecuting(false);
            }
          } else {
            // Execute regular command via HTTP
            const startTime = Date.now();
            let output = "";
            
            if (onCommand) {
              output = await onCommand(command);
            } else {
              // Default command handling
              output = await executeDefaultCommand(command);
            }

            const duration = (Date.now() - startTime) / 1000;

            // Update the command entry with the output
            setTerminalHistory((prev: TerminalCommand[]) => 
              prev.map((entry: TerminalCommand) => 
                entry.id === commandEntry.id 
                  ? { ...entry, output, duration }
                  : entry
              )
            );
            setIsExecuting(false);
          }

          // Get current directory from 'pwd' after any command
          // This ensures we always show the real container directory
          if (sessionId) {
            try {
              const pwdResponse = await fetch(`${API_BASE_URL}/api/terminal/execute`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  session_id: sessionId,
                  command: 'pwd'
                })
              });
              
              if (pwdResponse.ok) {
                const pwdResult = await pwdResponse.json();
                const realPath = pwdResult.output.trim();
                const displayPath = realPath.replace('/home/hacker', '~');
                setCurrentDirectory(displayPath);
              }
            } catch (error) {
              console.error('Failed to get current directory:', error);
            }
          }

        } catch (error) {
          console.error('Command execution failed:', error);
          setTerminalHistory((prev: TerminalCommand[]) => 
            prev.map((entry: TerminalCommand) => 
              entry.id === commandEntry.id 
                ? { ...entry, output: "Command execution failed", exitCode: 1 }
                : entry
            )
          );
        } finally {
          setIsExecuting(false);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const executeDefaultCommand = async (command: string): Promise<string> => {
    const cmd = command.trim().toLowerCase();
    
    if (cmd === 'clear') {
      setTerminalHistory([]);
      return '';
    } else if (cmd === 'help') {
      return `Available commands:
ls, ls -la       - list directory contents
cd <dir>         - change directory
pwd              - print working directory
cat <file>       - display file contents
curl <url>       - make HTTP request
clear            - clear terminal
help             - show this help message

Type commands to interact with the challenge environment.`;
    } else {
      // Try to call the backend API
      try {
        if (!sessionId) {
          return `Error: VM session not initialized. Please wait for session to start.`;
        }

        console.log('Executing command with session ID:', sessionId);
        const response = await fetch(`${API_BASE_URL}/api/terminal/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            command: command
          })
        });

        if (response.ok) {
          const result = await response.json();
          return result.output;
        } else {
          const errorText = await response.text();
          console.error('Command execution failed:', errorText);
          return `Error: Failed to execute command (${response.status})`;
        }
      } catch (error) {
        console.error('Network error:', error);
        return `Error: Could not connect to backend service. Make sure the user service is running on port 3001.`;
      }
    }
  };

  const getPrompt = () => {
    return `hacker@leethack`;
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 font-mono text-sm ${className}`}>
      {/* Terminal Content */}
      <div className="flex-1 flex flex-col">
        {/* Welcome Message */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <span className="font-semibold">LeetHack Terminal</span>
          </div>
          <p className="text-gray-400 text-sm">
            {initialMessage}
          </p>
        </div>

        {/* Terminal History */}
        <div 
          ref={terminalRef}
          className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          <div className="space-y-2">
            {terminalHistory.map((cmd: TerminalCommand) => (
              <motion.div
                key={cmd.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                {/* Command Input */}
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">➜</span>
                  <span className="text-blue-400 font-semibold">{getPrompt()}</span>
                  <span className="text-gray-500">:</span>
                  <span className="text-purple-400">{currentDirectory}</span>
                  <span className="text-gray-500">$</span>
                  <span className="text-white">{cmd.command}</span>
                </div>
                
                {/* Command Output */}
                {cmd.output && (
                  <div className="ml-4 text-gray-300 whitespace-pre-wrap">
                    {cmd.output}
                  </div>
                )}
                
                {/* Error Output */}
                {cmd.exitCode !== 0 && (
                  <div className="ml-4 text-red-400">
                    Command failed with exit code {cmd.exitCode}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Current Input Line */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-green-400">➜</span>
            <span className="text-blue-400 font-semibold">{getPrompt()}</span>
            <span className="text-gray-500">:</span>
            <span className="text-purple-400">{currentDirectory}</span>
            <span className="text-gray-500">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 ml-2"
              placeholder={isExecuting ? "Executing..." : "Enter command..."}
              autoComplete="off"
              spellCheck="false"
              disabled={isExecuting}
            />
            {isExecuting && (
              <div className="text-yellow-400 text-xs">Executing...</div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">Disconnected</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span>Duration:</span>
              <span className="text-white">{isClient ? sessionDuration : "00:00"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span>User:</span>
              <span className="text-green-400">hacker</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Shell:</span>
              <span className="text-blue-400">/bin/bash</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedTerminal;

"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { TerminalSession, TerminalCommand } from '@/types';

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
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [terminalHistory, setTerminalHistory] = useState<TerminalCommand[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sessionDuration, setSessionDuration] = useState("00:00");
  const [isClient, setIsClient] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState("~");
  const [isExecuting, setIsExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef(new Date());

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

    return () => clearInterval(interval);
  }, []);

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
          // Execute command
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
          setTerminalHistory(prev => 
            prev.map(entry => 
              entry.id === commandEntry.id 
                ? { ...entry, output, duration }
                : entry
            )
          );

          // Handle directory changes
          if (command.startsWith('cd ')) {
            const newDir = command.split(' ')[1];
            if (newDir === '..') {
              setCurrentDirectory(prev => {
                const parts = prev.split('/').filter(p => p);
                parts.pop();
                return parts.length === 0 ? '~' : '/' + parts.join('/');
              });
            } else if (newDir && !newDir.startsWith('/')) {
              setCurrentDirectory(prev => 
                prev === '~' ? `~/${newDir}` : `${prev}/${newDir}`
              );
            }
          }

        } catch (error) {
          console.error('Command execution failed:', error);
          setTerminalHistory(prev => 
            prev.map(entry => 
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
        const response = await fetch('http://localhost:3001/api/terminal/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: 'session-1',
            command: command
          })
        });

        if (response.ok) {
          const result = await response.json();
          return result.data.output;
        } else {
          return `Error: Failed to execute command (${response.status})`;
        }
      } catch (error) {
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
            <span className="text-lg">⚡</span>
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

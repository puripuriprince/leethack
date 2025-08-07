"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Minimize2, Maximize2, X, Wifi, WifiOff } from 'lucide-react';
import { mockTerminalSession } from '@/data/mockData';
import { formatDuration } from '@/lib/utils';
import { TerminalSession, TerminalCommand } from '@/types';

interface TerminalProps {
  session?: TerminalSession;
  onCommand?: (command: string) => void;
  isConnected?: boolean;
  className?: string;
}

export function Terminal({ 
  session = mockTerminalSession, 
  onCommand,
  isConnected = true,
  className = ""
}: TerminalProps) {
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [sessionDuration, setSessionDuration] = useState("00:00");
  const [isClient, setIsClient] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

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
  }, [session.history]);

  // Set client flag and update session duration
  useEffect(() => {
    setIsClient(true);
    const updateDuration = () => {
      const now = new Date();
      const start = session.startTime;
      const durationSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      setSessionDuration(formatDuration(durationSeconds));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [session.startTime]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        const newHistory = [...commandHistory, currentInput];
        setCommandHistory(newHistory);
        onCommand?.(currentInput);
        setCurrentInput("");
        setHistoryIndex(-1);
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

  const handleCopy = () => {
    if (terminalRef.current) {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        navigator.clipboard.writeText(selection.toString());
      }
    }
  };

  const getPrompt = () => {
    return `${session.environment.USER}@leethack`;
  };

  const getCurrentPath = () => {
    return session.currentDirectory;
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 font-mono text-sm ${className}`}>
      {/* Terminal Content */}
      <div className="flex-1 flex flex-col">
        {/* Welcome Message */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2 text-terminal-orange mb-2">
            <span className="text-lg">⚡</span>
            <span className="font-semibold">Welcome to LeetHack Terminal</span>
          </div>
          <p className="text-gray-400 text-sm">
            Type 'help' for available commands. Use Tab for auto-completion.
          </p>
        </div>

        {/* Terminal History */}
        <div 
          ref={terminalRef}
          className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          <div className="space-y-2">
            {session.history.map((cmd: TerminalCommand) => (
              <motion.div
                key={cmd.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                {/* Command Input */}
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-terminal-green">➜</span>
                  <span className="text-terminal-blue font-semibold">{getPrompt()}</span>
                  <span className="text-gray-500">:</span>
                  <span className="text-terminal-purple">{getCurrentPath()}</span>
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
            <span className="text-terminal-green">➜</span>
            <span className="text-terminal-blue font-semibold">{getPrompt()}</span>
            <span className="text-gray-500">:</span>
            <span className="text-terminal-purple">{getCurrentPath()}</span>
            <span className="text-gray-500">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 ml-2"
              placeholder="Enter command..."
              autoComplete="off"
              spellCheck="false"
            />
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
              <span>Session:</span>
              <span className="text-white">{session.id}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Duration:</span>
              <span className="text-white">{isClient ? sessionDuration : "00:00"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span>User:</span>
              <span className="text-terminal-green">{session.environment.USER}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Shell:</span>
              <span className="text-terminal-blue">{session.environment.SHELL}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terminal; 
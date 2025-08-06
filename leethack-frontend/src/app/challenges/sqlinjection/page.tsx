"use client";

import { useState, useEffect } from 'react';
import { EnhancedTerminal } from '@/components/EnhancedTerminal';
import { mockChallenges, mockTerminalSession } from '@/data/mockData';
import { Challenge, TerminalSession, TerminalCommand } from '@/types';
import { Clock, Users, Star, Play, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SQLInjectionChallenge() {
  const challenge = mockChallenges.find(c => c.title === "SQL Injection Basics") || mockChallenges[0];
  const [terminalSession, setTerminalSession] = useState<TerminalSession>(mockTerminalSession);
  const [isConnected, setIsConnected] = useState(true);

  const handleCommand = async (command: string): Promise<string> => {
    // Execute command and return output directly
    return await executeCommand(command);
  };

  const executeCommand = async (command: string): Promise<string> => {
    // Mock command execution - in real implementation this would call your firecracker VM API
    const cmd = command.trim().toLowerCase();
    
    if (cmd === 'ls') {
      return `webapp/
tools/
scripts/
README.txt`;
    } else if (cmd === 'ls -la') {
      return `total 16
drwxr-xr-x 5 hacker hacker 4096 Aug  6 17:45 .
drwxr-xr-x 3 root   root   4096 Aug  6 17:30 ..
drwxr-xr-x 3 hacker hacker 4096 Aug  6 17:45 webapp
drwxr-xr-x 2 hacker hacker 4096 Aug  6 17:45 tools
drwxr-xr-x 2 hacker hacker 4096 Aug  6 17:45 scripts
-rw-r--r-- 1 hacker hacker  156 Aug  6 17:45 README.txt`;
    } else if (cmd === 'cd webapp') {
      setTerminalSession(prev => ({
        ...prev,
        currentDirectory: '/home/hacker/webapp'
      }));
      return '';
    } else if (cmd === 'pwd') {
      return terminalSession.currentDirectory;
    } else if (cmd === 'cat readme.txt') {
      return `SQL Injection Challenge Environment
=====================================

Target: http://localhost:8080/login.php
Goal: Bypass authentication using SQL injection

Files:
- login.php: Vulnerable login form
- database.sql: Database schema
- config.php: Database configuration

Start by examining the login form and try different payloads!`;
    } else if (cmd.startsWith('curl ') || cmd.includes('localhost:8080')) {
      return `<html>
<head><title>Vulnerable Login</title></head>
<body>
<h2>Login</h2>
<form method="POST" action="login.php">
    Username: <input type="text" name="username"><br><br>
    Password: <input type="password" name="password"><br><br>
    <input type="submit" value="Login">
</form>
</body>
</html>`;
    } else if (cmd === 'help') {
      return `Available commands:
ls, ls -la       - list directory contents
cd <dir>         - change directory
pwd              - print working directory
cat <file>       - display file contents
curl <url>       - make HTTP request
sqlmap           - automated SQL injection tool
nmap             - network scanner
help             - show this help message

Challenge Goal: Find and exploit SQL injection in the web application`;
    } else if (cmd.includes('sqlmap')) {
      return `sqlmap 1.7.2

Usage: sqlmap [options]

Target:
  -u URL, --url=URL   Target URL

Injection:
  --data=DATA         Data string to be sent through POST

Example: sqlmap -u "http://localhost:8080/login.php" --data="username=admin&password=test"`;
    } else if (cmd === 'clear') {
      setTerminalSession(prev => ({
        ...prev,
        history: []
      }));
      return '';
    } else {
      return `bash: ${command}: command not found
Type 'help' for available commands`;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-orange-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyStars = (difficulty: string) => {
    const count = difficulty.toLowerCase() === 'easy' ? 1 : difficulty.toLowerCase() === 'medium' ? 2 : 3;
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < count ? 'fill-current' : 'fill-none'} ${getDifficultyColor(difficulty)}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left Sidebar - Challenge Details */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Challenge Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/challenges" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">
              {challenge.title}
            </h1>
          </div>
          
          {/* Challenge Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
            <div className="flex items-center gap-1">
              <span className="text-orange-400">🏆</span>
              <span>{challenge.points} points</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{challenge.totalSubmissions} attempts</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-400">✓</span>
              <span>{challenge.acceptanceRate.toFixed(1)}% solved</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {challenge.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Difficulty</span>
            <div className="flex items-center gap-1">
              {getDifficultyStars(challenge.difficulty)}
            </div>
          </div>
        </div>

        {/* Challenge Description */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Challenge Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {challenge.description}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Objective</h3>
              <p className="text-gray-300 leading-relaxed">
                Find and exploit SQL injection vulnerabilities in the provided web application. 
                Extract sensitive information from the database to complete the challenge.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Environment</h3>
              <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm">
                <div className="text-green-400">Target: http://localhost:8080/login.php</div>
                <div className="text-blue-400">Database: MySQL 5.7</div>
                <div className="text-yellow-400">Tools: sqlmap, curl, nmap</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Learning Goals</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Understanding SQL injection attack vectors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Learning payload construction techniques</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Practicing information extraction methods</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Recognizing vulnerable code patterns</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Terminal */}
      <div className="flex-1 flex flex-col">
        {/* Terminal Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-300 font-mono text-sm">
                hacker@leethack:~$ SQL Injection Challenge
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 bg-gray-900">
          <EnhancedTerminal 
            onCommand={handleCommand}
            isConnected={isConnected}
            initialMessage="SQL Injection Challenge - Type 'help' for available commands"
          />
        </div>
      </div>
    </div>
  );
}

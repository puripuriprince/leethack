"use client";

import { useState } from 'react';
import { Terminal } from '@/components/Terminal';
import { mockChallenges } from '@/data/mockData';
import { Challenge } from '@/types';
import { Clock, Users, Star, Play } from 'lucide-react';

export default function ChallengesPage() {
  const [selectedChallenge] = useState<Challenge>(mockChallenges[0]);

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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">
              {selectedChallenge.title}
            </h1>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Play className="w-4 h-4" />
              Start Challenge
            </button>
          </div>
          
          {/* Challenge Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <span className="text-orange-400">🏆</span>
              <span>{selectedChallenge.points} points</span>
            </div>
                         <div className="flex items-center gap-1">
               <Users className="w-4 h-4" />
               <span>{selectedChallenge.totalSubmissions} attempts</span>
             </div>
             <div className="flex items-center gap-1">
               <span className="text-green-400">✓</span>
               <span>{selectedChallenge.acceptanceRate.toFixed(1)}% solved</span>
             </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>No time limit</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedChallenge.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-gray-400">Difficulty</span>
            <div className="flex items-center gap-1">
              {getDifficultyStars(selectedChallenge.difficulty)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <div className="flex">
            <button className="px-6 py-3 text-white border-b-2 border-blue-500 bg-gray-750">
              Description
            </button>
            <button className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-750 transition-colors">
              Hints
            </button>
            <button className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-750 transition-colors">
              Submissions
            </button>
          </div>
        </div>

        {/* Challenge Description */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Challenge Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {selectedChallenge.description}
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

        {/* Bottom tabs */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              Challenge Info
            </button>
            <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
              Hints
            </button>
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
                hacker@leethack:~/home/hacker$ 55:32
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Connected</span>
            </div>
          </div>
        </div>

        {/* Terminal Tabs */}
        <div className="bg-gray-850 border-b border-gray-700">
          <div className="flex">
            <button className="px-6 py-3 text-white bg-gray-800 border-r border-gray-700">
              Terminal
            </button>
            <button className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-r border-gray-700">
              Tools
            </button>
            <button className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-r border-gray-700">
              Replay
            </button>
            <button className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              Notes
            </button>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 bg-gray-900">
          <Terminal />
        </div>
      </div>
    </div>
  );
} 
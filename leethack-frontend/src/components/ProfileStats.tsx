"use client";

import { motion } from "framer-motion";
import { 
  Trophy, 
  Flame, 
  Calendar, 
  Target, 
  Award, 
  TrendingUp,
  Zap,
  Clock,
  CheckCircle
} from "lucide-react";
import { User, UserStats, UserRank } from "@/types";
import { getRankColor, getRankBgColor, formatNumber, formatPercentage } from "@/lib/utils";

interface ProfileStatsProps {
  user: User;
  stats: UserStats;
  rank: UserRank;
  className?: string;
}

export default function ProfileStats({ user, stats, rank, className = "" }: ProfileStatsProps) {
  const difficultyStats = [
    { 
      level: "Easy", 
      solved: stats.problemsSolved.easy, 
      color: "text-difficulty-easy",
      bgColor: "bg-difficulty-easy/20",
      borderColor: "border-difficulty-easy/30"
    },
    { 
      level: "Medium", 
      solved: stats.problemsSolved.medium, 
      color: "text-difficulty-medium",
      bgColor: "bg-difficulty-medium/20",
      borderColor: "border-difficulty-medium/30"
    },
    { 
      level: "Hard", 
      solved: stats.problemsSolved.hard, 
      color: "text-difficulty-hard",
      bgColor: "bg-difficulty-hard/20",
      borderColor: "border-difficulty-hard/30"
    }
  ];

  const totalSolved = stats.problemsSolved.easy + stats.problemsSolved.medium + stats.problemsSolved.hard;

  const mainStats = [
    {
      icon: CheckCircle,
      label: "Problems Solved",
      value: formatNumber(stats.totalSolved),
      color: "text-terminal-green"
    },
    {
      icon: Target,
      label: "Acceptance Rate",
      value: `${stats.acceptanceRate}%`,
      color: "text-terminal-blue"
    },
    {
      icon: Trophy,
      label: "Global Ranking",
      value: `#${formatNumber(stats.ranking)}`,
      color: "text-terminal-orange"
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: `${stats.streak.current} days`,
      color: "text-terminal-red"
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Rank Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="h-16 w-16 rounded-full ring-2 ring-border"
            />
            <div>
              <h2 className="text-2xl font-bold">{user.displayName}</h2>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getRankColor(rank.title)} font-mono`}>
              {rank.title.toUpperCase()}
            </div>
            <div className="text-sm text-muted-foreground">
              Rating: {rank.rating} (Max: {rank.maxRating})
            </div>
          </div>
        </div>
        
        {/* Rank Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rating Progress</span>
            <span className={getRankColor(rank.title)}>{rank.rating} / {rank.maxRating}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${getRankBgColor(rank.title).split(' ')[0]} ${getRankColor(rank.title).replace('text-', 'bg-')}`}
              initial={{ width: 0 }}
              animate={{ width: `${(rank.rating / rank.maxRating) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-card border border-border rounded-lg p-4 hover-glow group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold group-hover:scale-105 transition-transform">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Problems Solved Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Problems Solved</h3>
          <span className="text-2xl font-bold text-terminal-green">{totalSolved}</span>
        </div>
        
        <div className="space-y-4">
          {difficultyStats.map((difficulty, index) => {
            const percentage = totalSolved > 0 ? (difficulty.solved / totalSolved) * 100 : 0;
            
            return (
              <div key={difficulty.level} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${difficulty.color}`}>
                    {difficulty.level}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {difficulty.solved} solved
                    </span>
                    <span className={`text-sm font-mono ${difficulty.color}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${difficulty.bgColor.replace('/20', '')}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contest Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-5 w-5 text-terminal-purple" />
            <h3 className="text-lg font-semibold">Contest Performance</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contest Ranking</span>
              <span className="font-semibold">#{formatNumber(stats.contestRanking)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contests Participated</span>
              <span className="font-semibold">{rank.contestsParticipated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current XP</span>
              <span className="font-semibold text-terminal-blue">{formatNumber(stats.xp)} XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Level</span>
              <span className="font-semibold text-terminal-orange">Level {stats.level}</span>
            </div>
          </div>
        </motion.div>

        {/* Streak Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Flame className="h-5 w-5 text-terminal-red" />
            <h3 className="text-lg font-semibold">Streak Information</h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-center p-4 bg-terminal-red/10 rounded-lg border border-terminal-red/20">
              <div className="text-3xl font-bold text-terminal-red mb-1">
                {stats.streak.current}
              </div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Longest Streak</span>
              <span className="font-semibold">{stats.streak.longest} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Submission</span>
              <span className="font-semibold">
                {stats.streak.lastSubmissionDate ? 
                  stats.streak.lastSubmissionDate.toLocaleDateString() : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Skills Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Skills & Expertise</h3>
        <div className="flex flex-wrap gap-2">
          {stats.skillTags.map((skill, index) => (
            <motion.span
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
              className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              {skill}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 
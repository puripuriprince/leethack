// Core user types
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  email?: string;
  location?: string;
  bio?: string;
  joinDate: Date;
  lastActive: Date;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

// Ranking and progression types
export type RankTitle = 
  | 'newbie' 
  | 'pupil' 
  | 'specialist' 
  | 'expert' 
  | 'candidate' 
  | 'master' 
  | 'grandmaster' 
  | 'legendary';

export interface UserRank {
  title: RankTitle;
  rating: number;
  maxRating: number;
  rank: number;
  contestsParticipated: number;
}

// Challenge and difficulty types
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  category: string[];
  tags: string[];
  description: string;
  hints?: string[];
  points: number;
  acceptanceRate: number;
  totalSubmissions: number;
  totalAccepted: number;
  isLocked: boolean;
  isPremium: boolean;
  companies?: string[];
  relatedTopics?: string[];
}

// User progress and stats
export interface UserStats {
  totalSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  ranking: number;
  contestRanking: number;
  streak: {
    current: number;
    longest: number;
    lastSubmissionDate?: Date;
  };
  problemsSolved: {
    easy: number;
    medium: number;
    hard: number;
  };
  skillTags: string[];
  xp: number;
  level: number;
}

// Submission and activity types
export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  status: 'accepted' | 'wrong-answer' | 'runtime-error' | 'timeout' | 'memory-limit';
  language: string;
  code: string;
  submissionTime: Date;
  runtime?: number;
  memory?: number;
  testsPassed?: number;
  totalTests?: number;
}

// Activity heatmap data
export interface ActivityData {
  date: string; // YYYY-MM-DD format
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // GitHub-style intensity levels
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  user: User;
  stats: UserStats;
  userRank: UserRank;
  recentActivity: ActivityData[];
}

// Contest types
export interface Contest {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  type: 'individual' | 'team';
  status: 'upcoming' | 'live' | 'finished';
  participants: number;
  challenges: Challenge[];
  prizes?: string[];
}

// Community and social features
export interface Post {
  id: string;
  author: User;
  title: string;
  content: string;
  type: 'writeup' | 'guide' | 'discussion' | 'solution';
  challengeId?: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  isBookmarked?: boolean;
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  replies?: Comment[];
  parentId?: string;
}

// Shop and customization
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'theme' | 'badge' | 'title' | 'animation' | 'boost';
  price: number;
  currency: 'xp' | 'coins';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview?: string;
  isOwned?: boolean;
  isEquipped?: boolean;
  requirements?: {
    level?: number;
    rank?: RankTitle;
    achievements?: string[];
  };
}

// Terminal session types (for hack interface)
export interface TerminalSession {
  id: string;
  challengeId: string;
  userId: string;
  status: 'active' | 'completed' | 'timeout' | 'disconnected';
  startTime: Date;
  endTime?: Date;
  currentDirectory: string;
  history: TerminalCommand[];
  environment: Record<string, string>;
  flags?: string[];
  score?: number;
}

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  exitCode: number;
  duration: number;
}

// Badge and achievement system
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: string;
  unlockedAt?: Date;
  progress?: {
    current: number;
    total: number;
  };
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'achievement' | 'contest' | 'social' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  data?: Record<string, any>;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// UI state types
export interface UIState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  activeTab: string;
  notifications: Notification[];
  loading: boolean;
  error?: string;
} 
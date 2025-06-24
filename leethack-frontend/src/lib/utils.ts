import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RankTitle, DifficultyLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Rank utilities
export const getRankColor = (rank: RankTitle): string => {
  const rankColors = {
    newbie: "text-rank-newbie",
    pupil: "text-rank-pupil", 
    specialist: "text-rank-specialist",
    expert: "text-rank-expert",
    candidate: "text-rank-candidate",
    master: "text-rank-master",
    grandmaster: "text-rank-grandmaster",
    legendary: "text-rank-legendary",
  };
  return rankColors[rank];
};

export const getRankBgColor = (rank: RankTitle): string => {
  const rankBgColors = {
    newbie: "bg-rank-newbie/20 border-rank-newbie/30",
    pupil: "bg-rank-pupil/20 border-rank-pupil/30",
    specialist: "bg-rank-specialist/20 border-rank-specialist/30", 
    expert: "bg-rank-expert/20 border-rank-expert/30",
    candidate: "bg-rank-candidate/20 border-rank-candidate/30",
    master: "bg-rank-master/20 border-rank-master/30",
    grandmaster: "bg-rank-grandmaster/20 border-rank-grandmaster/30",
    legendary: "bg-rank-legendary/20 border-rank-legendary/30",
  };
  return rankBgColors[rank];
};

export const getRankFromRating = (rating: number): RankTitle => {
  if (rating >= 3000) return "legendary";
  if (rating >= 2400) return "grandmaster";
  if (rating >= 2100) return "master";
  if (rating >= 1900) return "candidate";
  if (rating >= 1600) return "expert";
  if (rating >= 1400) return "specialist";
  if (rating >= 1200) return "pupil";
  return "newbie";
};

// Difficulty utilities
export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  const colors = {
    easy: "text-difficulty-easy",
    medium: "text-difficulty-medium", 
    hard: "text-difficulty-hard",
  };
  return colors[difficulty];
};

export const getDifficultyBgColor = (difficulty: DifficultyLevel): string => {
  const colors = {
    easy: "bg-difficulty-easy/20 border-difficulty-easy/30",
    medium: "bg-difficulty-medium/20 border-difficulty-medium/30",
    hard: "bg-difficulty-hard/20 border-difficulty-hard/30",
  };
  return colors[difficulty];
};

// Format utilities
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return "0%";
  return ((value / total) * 100).toFixed(1) + "%";
};

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);
  const months = Math.floor(diff / 2628000000);
  const years = Math.floor(diff / 31536000000);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

// Animation utilities
export const getRandomDelay = (max: number = 0.5): string => {
  return `${Math.random() * max}s`;
};

export const staggerChildren = (index: number, delay: number = 0.1): string => {
  return `${index * delay}s`;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

// Date utilities
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const getDateString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const getDaysInYear = (year: number): number => {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
};

// Activity heatmap utilities
export const generateYearGrid = (year: number = new Date().getFullYear()) => {
  const days = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  
  return days;
};

export const getActivityLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
};

// Terminal utilities
export const formatTerminalPrompt = (username: string, directory: string): string => {
  return `${username}@leethack:${directory}$ `;
};

export const parseCommand = (input: string): { command: string; args: string[] } => {
  const parts = input.trim().split(/\s+/);
  return {
    command: parts[0] || "",
    args: parts.slice(1),
  };
};

// Theme utilities
export const getThemeClass = (theme: "dark" | "light"): string => {
  return theme === "dark" ? "dark" : "";
};

// Local storage utilities
export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return defaultValue;
  }
};

// API utilities
export const createApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
  const url = new URL(endpoint, baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 
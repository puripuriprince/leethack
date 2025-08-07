import { 
  User, 
  UserStats, 
  UserRank, 
  Challenge, 
  LeaderboardEntry, 
  ActivityData, 
  Badge, 
  TerminalSession,
  Post,
  Contest,
  ShopItem
} from "@/types";

// Mock current user
export const mockCurrentUser: User = {
  id: "user-1",
  username: "hackmaster",
  displayName: "Alex Chen",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  email: "alex@leethack.dev",
  location: "San Francisco, CA",
  bio: "Full-stack developer passionate about cybersecurity and competitive programming. Love solving complex challenges and learning new technologies.",
  joinDate: new Date("2023-01-15"),
  lastActive: new Date(),
  socialLinks: {
    github: "https://github.com/hackmaster",
    twitter: "https://twitter.com/hackmaster",
    linkedin: "https://linkedin.com/in/hackmaster",
    website: "https://hackmaster.dev"
  }
};

// Mock user stats
export const mockUserStats: UserStats = {
  totalSolved: 247,
  totalSubmissions: 394,
  acceptanceRate: 62.7,
  ranking: 1547,
  contestRanking: 234,
  streak: {
    current: 12,
    longest: 47,
    lastSubmissionDate: new Date()
  },
  problemsSolved: {
    easy: 89,
    medium: 124,
    hard: 34
  },
  skillTags: ["Web Security", "Cryptography", "Reverse Engineering", "Linux", "Python", "JavaScript"],
  xp: 15420,
  level: 23
};

// Mock user rank
export const mockUserRank: UserRank = {
  title: "expert",
  rating: 1847,
  maxRating: 1923,
  rank: 1547,
  contestsParticipated: 28
};

// Mock activity data for heatmap
export const generateMockActivityData = (): ActivityData[] => {
  const data: ActivityData[] = [];
  const today = new Date('2025-06-23'); // Fixed date to avoid hydration mismatch
  
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Use deterministic "random" based on date to avoid hydration mismatch
    const seed = date.getTime();
    const pseudoRandom = (seed * 9301 + 49297) % 233280 / 233280;
    const count = pseudoRandom < 0.7 ? Math.floor(pseudoRandom * 8) : 0;
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
    
    data.push({
      date: date.toISOString().split('T')[0],
      count,
      level: level as 0 | 1 | 2 | 3 | 4
    });
  }
  
  return data;
};

export const mockActivityData = generateMockActivityData();

// Mock challenges
export const mockChallenges: Challenge[] = [
  {
    id: "challenge-1",
    title: "SQL Injection Playground",
    slug: "sql-injection-playground",
    difficulty: "easy",
    category: ["Web Security"],
    tags: ["SQL", "Database", "Injection"],
    description: "Learn to identify and exploit SQL injection vulnerabilities in a controlled environment.",
    hints: ["Try different payloads", "Look for error messages", "Consider union-based attacks"],
    points: 100,
    acceptanceRate: 78.5,
    totalSubmissions: 2843,
    totalAccepted: 2232,
    isLocked: false,
    isPremium: false,
    companies: ["Google", "Meta", "Microsoft"],
    relatedTopics: ["Database Security", "Web Applications"]
  },
  {
    id: "challenge-2", 
    title: "Advanced Buffer Overflow",
    slug: "advanced-buffer-overflow",
    difficulty: "hard",
    category: ["Binary Exploitation"],
    tags: ["Buffer Overflow", "Assembly", "Memory"],
    description: "Exploit a complex buffer overflow vulnerability with modern protections enabled.",
    hints: ["Analyze the binary structure", "Consider ROP techniques", "Bypass ASLR and stack canaries"],
    points: 500,
    acceptanceRate: 23.2,
    totalSubmissions: 1247,
    totalAccepted: 289,
    isLocked: false,
    isPremium: true,
    companies: ["CrowdStrike", "FireEye", "Mandiant"],
    relatedTopics: ["Reverse Engineering", "System Security"]
  },
  {
    id: "challenge-3",
    title: "XSS Filter Bypass",
    slug: "xss-filter-bypass",
    difficulty: "medium",
    category: ["Web Security"],
    tags: ["XSS", "Filter Bypass", "JavaScript"],
    description: "Bypass various XSS filters and execute JavaScript in a sandboxed environment.",
    points: 250,
    acceptanceRate: 45.8,
    totalSubmissions: 1876,
    totalAccepted: 859,
    isLocked: false,
    isPremium: false,
    companies: ["HackerOne", "Bugcrowd", "Synack"],
    relatedTopics: ["Client-side Security", "Web Applications"]
  }
];

// Mock leaderboard entries
export const mockLeaderboardEntries: LeaderboardEntry[] = [
  {
    rank: 1,
    user: {
      id: "user-top1",
      username: "cyberking",
      displayName: "Sarah Rodriguez",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b2e2d6bc?w=150&h=150&fit=crop&crop=face",
      joinDate: new Date("2022-03-10"),
      lastActive: new Date()
    },
    stats: {
      totalSolved: 892,
      totalSubmissions: 1156,
      acceptanceRate: 77.2,
      ranking: 1,
      contestRanking: 1,
      streak: { current: 156, longest: 203 },
      problemsSolved: { easy: 245, medium: 384, hard: 263 },
      skillTags: ["All Categories"],
      xp: 89240,
      level: 78
    },
    userRank: {
      title: "legendary",
      rating: 3421,
      maxRating: 3421,
      rank: 1,
      contestsParticipated: 89
    },
    recentActivity: mockActivityData.slice(-50)
  },
  {
    rank: 2,
    user: {
      id: "user-top2", 
      username: "pentester_pro",
      displayName: "Marcus Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      joinDate: new Date("2022-01-20"),
      lastActive: new Date()
    },
    stats: {
      totalSolved: 847,
      totalSubmissions: 1087,
      acceptanceRate: 77.9,
      ranking: 2,
      contestRanking: 3,
      streak: { current: 89, longest: 145 },
      problemsSolved: { easy: 198, medium: 378, hard: 271 },
      skillTags: ["Penetration Testing", "Network Security"],
      xp: 82470,
      level: 71
    },
    userRank: {
      title: "legendary",
      rating: 3287,
      maxRating: 3367,
      rank: 2,
      contestsParticipated: 76
    },
    recentActivity: mockActivityData.slice(-50)
  }
];

// Add current user to leaderboard
mockLeaderboardEntries.push({
  rank: mockUserStats.ranking,
  user: mockCurrentUser,
  stats: mockUserStats,
  userRank: mockUserRank,
  recentActivity: mockActivityData.slice(-30)
});

// Mock badges
export const mockBadges: Badge[] = [
  {
    id: "badge-1",
    name: "First Blood",
    description: "Solved your first challenge",
    icon: "🩸",
    category: "Achievement",
    rarity: "common",
    requirements: "Solve 1 challenge",
    unlockedAt: new Date("2023-01-16")
  },
  {
    id: "badge-2",
    name: "Century Club",
    description: "Solved 100 challenges",
    icon: "💯",
    category: "Progress",
    rarity: "rare",
    requirements: "Solve 100 challenges",
    unlockedAt: new Date("2023-08-22")
  },
  {
    id: "badge-3",
    name: "Speed Demon",
    description: "Solved a challenge in under 5 minutes",
    icon: "⚡",
    category: "Performance",
    rarity: "epic",
    requirements: "Complete a challenge in under 5 minutes",
    unlockedAt: new Date("2023-05-14")
  },
  {
    id: "badge-4",
    name: "Legendary Hacker",
    description: "Reached legendary rank",
    icon: "👑",
    category: "Rank",
    rarity: "legendary",
    requirements: "Achieve legendary rank (3000+ rating)",
    progress: { current: 1847, total: 3000 }
  }
];

// Mock terminal session
export const mockTerminalSession: TerminalSession = {
  id: "session-1",
  challengeId: "challenge-1",
  userId: "user-1",
  status: "active",
  startTime: new Date('2025-06-23T14:30:00'), // Fixed time to avoid hydration mismatch
  currentDirectory: "/home/hacker",
  history: [
    {
      id: "cmd-1",
      command: "ls -la",
      output: `total 24
drwxr-xr-x 3 hacker hacker 4096 Jun 23 15:30 .
drwxr-xr-x 3 root   root   4096 Jun 23 15:00 ..
-rw-r--r-- 1 hacker hacker  220 Jun 23 15:00 .bash_logout
-rw-r--r-- 1 hacker hacker 3771 Jun 23 15:00 .bashrc
-rw-r--r-- 1 hacker hacker  807 Jun 23 15:00 .profile
drwxr-xr-x 2 hacker hacker 4096 Jun 23 15:30 webapp`,
      timestamp: new Date('2025-06-23T14:31:00'),
      exitCode: 0,
      duration: 1.2
    },
    {
      id: "cmd-2",
      command: "cd webapp",
      output: "",
      timestamp: new Date('2025-06-23T14:32:00'),
      exitCode: 0,
      duration: 0.1
    },
    {
      id: "cmd-3",
      command: "cat index.php",
      output: `<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "vulnerable_db";

if(isset($_GET['id'])) {
    $id = $_GET['id'];
    $conn = new mysqli($servername, $username, $password, $dbname);
    $sql = "SELECT * FROM users WHERE id = " . $id;
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            echo "ID: " . $row["id"]. " - Name: " . $row["name"]. "<br>";
        }
    } else {
        echo "0 results";
    }
}
?>`,
      timestamp: new Date('2025-06-23T14:33:00'),
      exitCode: 0,
      duration: 0.5
    }
  ],
  environment: {
    USER: "hacker",
    HOME: "/home/hacker",
    PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    SHELL: "/bin/bash"
  },
  flags: ["web", "sql-injection"],
  score: 0
};

// Mock posts for community
export const mockPosts: Post[] = [
  {
    id: "post-1",
    author: {
      id: "user-author1",
      username: "securityguru",
      displayName: "Jennifer Park",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      joinDate: new Date("2022-06-15"),
      lastActive: new Date()
    },
    title: "Advanced SQL Injection Techniques: Beyond the Basics",
    content: "In this comprehensive guide, I'll walk you through advanced SQL injection techniques that go beyond simple union-based attacks...",
    type: "guide",
    challengeId: "challenge-1",
    tags: ["SQL Injection", "Web Security", "Advanced"],
    upvotes: 89,
    downvotes: 3,
    comments: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isBookmarked: true,
    hasUpvoted: false
  }
];

// Mock contests
export const mockContests: Contest[] = [
  {
    id: "contest-1",
    name: "Weekly Web Security Challenge",
    description: "Test your web application security skills in this weekly contest featuring real-world scenarios.",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    duration: 180, // 3 hours
    type: "individual",
    status: "upcoming",
    participants: 1247,
    challenges: mockChallenges.slice(0, 2),
    prizes: ["$500 Cash Prize", "LeetHack Pro Subscription", "Exclusive Badge"]
  }
];

// Mock shop items
export const mockShopItems: ShopItem[] = [
  {
    id: "item-1",
    name: "Matrix Theme",
    description: "Transform your terminal with the iconic Matrix digital rain effect",
    category: "theme",
    price: 1000,
    currency: "xp",
    rarity: "rare",
    preview: "/themes/matrix-preview.gif",
    isOwned: false,
    requirements: { level: 10 }
  },
  {
    id: "item-2",
    name: "Speed Boost",
    description: "Double XP for 24 hours",
    category: "boost",
    price: 500,
    currency: "coins",
    rarity: "common",
    isOwned: false
  },
  {
    id: "item-3",
    name: "Elite Hacker",
    description: "Exclusive title showing your dedication to the craft",
    category: "title",
    price: 5000,
    currency: "xp",
    rarity: "legendary",
    isOwned: true,
    isEquipped: true,
    requirements: { rank: "expert", level: 25 }
  }
]; 
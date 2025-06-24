"use client";

import { motion } from "framer-motion";
import { 
  Settings, 
  Share, 
  Edit, 
  MapPin, 
  Calendar, 
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  Globe
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ProfileStats from "@/components/ProfileStats";
import Heatmap from "@/components/Heatmap";
import { 
  mockCurrentUser, 
  mockUserStats, 
  mockUserRank, 
  mockActivityData, 
  mockBadges 
} from "@/data/mockData";
import { getRankColor, formatTimeAgo } from "@/lib/utils";

export default function ProfilePage() {
  const socialLinks = [
    { 
      icon: Github, 
      href: mockCurrentUser.socialLinks?.github, 
      label: "GitHub",
      color: "hover:text-gray-400"
    },
    { 
      icon: Twitter, 
      href: mockCurrentUser.socialLinks?.twitter, 
      label: "Twitter",
      color: "hover:text-blue-400"
    },
    { 
      icon: Linkedin, 
      href: mockCurrentUser.socialLinks?.linkedin, 
      label: "LinkedIn",
      color: "hover:text-blue-600"
    },
    { 
      icon: Globe, 
      href: mockCurrentUser.socialLinks?.website, 
      label: "Website",
      color: "hover:text-terminal-green"
    }
  ];

  const unlockedBadges = mockBadges.filter(badge => badge.unlockedAt);
  const lockedBadges = mockBadges.filter(badge => !badge.unlockedAt);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card border border-border rounded-lg p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            {/* User Info */}
            <div className="flex items-start space-x-6 mb-6 lg:mb-0">
              <img
                src={mockCurrentUser.avatar}
                alt={mockCurrentUser.displayName}
                className="h-24 w-24 rounded-full ring-4 ring-border"
              />
              <div className="space-y-2">
                <div>
                  <h1 className="text-3xl font-bold">{mockCurrentUser.displayName}</h1>
                  <p className="text-lg text-muted-foreground">@{mockCurrentUser.username}</p>
                  <div className={`text-lg font-mono font-semibold ${getRankColor(mockUserRank.title)}`}>
                    {mockUserRank.title.toUpperCase()} • {mockUserRank.rating} Rating
                  </div>
                </div>
                
                {/* Bio */}
                {mockCurrentUser.bio && (
                  <p className="text-muted-foreground max-w-2xl">{mockCurrentUser.bio}</p>
                )}
                
                {/* Location and Join Date */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {mockCurrentUser.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{mockCurrentUser.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {mockCurrentUser.joinDate.toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Social Links */}
                <div className="flex items-center space-x-4">
                  {socialLinks.map((social) => 
                    social.href ? (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg border border-border transition-all duration-200 ${social.color} hover:border-current`}
                        title={social.label}
                      >
                        <social.icon className="h-4 w-4" />
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                <Share className="h-4 w-4" />
                <span>Share</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
              <button className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics */}
            <ProfileStats 
              user={mockCurrentUser}
              stats={mockUserStats}
              rank={mockUserRank}
            />
            
            {/* Activity Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <Heatmap data={mockActivityData} />
            </motion.div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Achievements</h3>
              
              {/* Unlocked Badges */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Unlocked ({unlockedBadges.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {unlockedBadges.map((badge, index) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="p-3 bg-secondary/50 rounded-lg border border-border hover:bg-secondary transition-colors group cursor-pointer"
                        title={badge.description}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                            {badge.icon}
                          </div>
                          <div className="text-xs font-medium truncate">{badge.name}</div>
                          {badge.unlockedAt && (
                            <div className="text-xs text-muted-foreground">
                              {formatTimeAgo(badge.unlockedAt)}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Progress Badges */}
                {lockedBadges.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      In Progress ({lockedBadges.length})
                    </h4>
                    <div className="space-y-2">
                      {lockedBadges.map((badge, index) => (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="p-3 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-lg opacity-50">{badge.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{badge.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {badge.description}
                              </div>
                              {badge.progress && (
                                <div className="mt-1">
                                  <div className="flex justify-between text-xs">
                                    <span>{badge.progress.current}</span>
                                    <span>{badge.progress.total}</span>
                                  </div>
                                  <div className="w-full bg-secondary rounded-full h-1 mt-1">
                                    <div 
                                      className="bg-terminal-blue h-1 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${(badge.progress.current / badge.progress.total) * 100}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <button className="text-sm text-terminal-blue hover:text-terminal-green transition-colors">
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {[
                  { action: "Solved", target: "SQL Injection Playground", time: "2 hours ago", color: "text-terminal-green" },
                  { action: "Attempted", target: "Buffer Overflow Challenge", time: "5 hours ago", color: "text-terminal-orange" },
                  { action: "Earned badge", target: "Speed Demon", time: "1 day ago", color: "text-terminal-purple" },
                  { action: "Joined contest", target: "Weekly Web Security", time: "2 days ago", color: "text-terminal-blue" },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${activity.color.replace('text-', 'bg-')}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className={activity.color}>{activity.action}</span>{" "}
                        <span className="font-medium">{activity.target}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 
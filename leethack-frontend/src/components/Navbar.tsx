"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Trophy, 
  User, 
  ShoppingBag, 
  Users, 
  Home,
  Menu,
  X,
  Zap,
  Bell,
  Settings
} from "lucide-react";
import { mockCurrentUser, mockUserRank } from "@/data/mockData";
import { getRankColor } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/challenges", label: "Challenges", icon: Terminal },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/community", label: "Community", icon: Users },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Zap className="h-8 w-8 text-terminal-blue group-hover:text-terminal-green transition-colors duration-300" />
              <div className="absolute inset-0 bg-terminal-blue/20 rounded-full blur-xl group-hover:bg-terminal-green/20 transition-colors duration-300" />
            </div>
            <span className="text-xl font-bold gradient-text">LeetHack</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-200 group"
              >
                <item.icon className="h-4 w-4 group-hover:text-terminal-blue transition-colors duration-200" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-terminal-red rounded-full animate-pulse" />
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary transition-all duration-200 group"
              >
                <div className="flex items-center space-x-2">
                  <img
                    src={mockCurrentUser.avatar}
                    alt={mockCurrentUser.displayName}
                    className="h-8 w-8 rounded-full ring-2 ring-border group-hover:ring-terminal-blue transition-all duration-200"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">{mockCurrentUser.displayName}</div>
                    <div className={`text-xs ${getRankColor(mockUserRank.title)} font-mono`}>
                      {mockUserRank.title.toUpperCase()} ({mockUserRank.rating})
                    </div>
                  </div>
                </div>
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
                  >
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center space-x-3">
                        <img
                          src={mockCurrentUser.avatar}
                          alt={mockCurrentUser.displayName}
                          className="h-12 w-12 rounded-full"
                        />
                        <div>
                          <div className="font-medium">{mockCurrentUser.displayName}</div>
                          <div className="text-sm text-muted-foreground">@{mockCurrentUser.username}</div>
                          <div className={`text-xs ${getRankColor(mockUserRank.title)} font-mono mt-1`}>
                            {mockUserRank.title.toUpperCase()} • {mockUserRank.rating} Rating
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-secondary transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>View Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-secondary transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                      <hr className="my-2 border-border" />
                      <button className="flex items-center space-x-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-200 w-full text-left">
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all duration-200"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-border"
            >
              <div className="py-4 space-y-2">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all duration-200 group"
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5 group-hover:text-terminal-blue transition-colors duration-200" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
} 
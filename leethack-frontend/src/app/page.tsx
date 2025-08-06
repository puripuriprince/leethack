"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Code, 
  Shield, 
  Trophy, 
  Users, 
  ArrowRight, 
  Play,
  Target,
  Zap,
  Lock,
  Terminal
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { mockChallenges } from '@/data/mockData';

export default function HomePage() {
  const featuredChallenges = mockChallenges.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6"
            >
              Master Cybersecurity
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-orange-500 bg-clip-text text-transparent block">
                Through Hacking
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Practice ethical hacking skills with real-world challenges. 
              Learn penetration testing, web security, and more in a safe, gamified environment.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link 
                href="/challenges" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                <Play className="w-5 h-5" />
                Start Hacking
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/profile" 
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-105 border border-gray-600"
              >
                <Trophy className="w-5 h-5" />
                View Profile
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose LeetHack?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The most comprehensive platform for learning cybersecurity through hands-on practice
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Terminal,
                title: "Real Terminal Experience",
                description: "Practice in authentic terminal environments with Warp.dev aesthetics"
              },
              {
                icon: Shield,
                title: "Safe Learning Environment",
                description: "Learn ethical hacking in controlled, isolated environments"
              },
              {
                icon: Trophy,
                title: "Competitive Scoring",
                description: "Track progress with LeetCode-style rankings and achievements"
              },
              {
                icon: Target,
                title: "Real-World Scenarios",
                description: "Face challenges based on actual security vulnerabilities"
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Learn alongside thousands of security enthusiasts"
              },
              {
                icon: Zap,
                title: "Instant Feedback",
                description: "Get immediate results and detailed explanations"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Challenges */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Featured Challenges
            </h2>
            <p className="text-xl text-gray-300">
              Start with these popular challenges
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {featuredChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500/50 transition-all duration-300 group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full border ${
                      challenge.difficulty.toLowerCase() === 'easy' 
                        ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                        : challenge.difficulty.toLowerCase() === 'medium'
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                        : 'bg-red-500/20 border-red-500/30 text-red-400'
                    }`}>
                      {challenge.difficulty.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <span>🏆</span>
                      <span>{challenge.points}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {challenge.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {challenge.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {challenge.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link 
                      href={`/challenges`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors"
        >
                      Try Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/challenges" 
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 border border-gray-600 hover:border-blue-500/50"
            >
              View All Challenges
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-orange-600/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of security professionals mastering their craft
            </p>
            <Link 
              href="/challenges" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 shadow-lg inline-flex items-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Start Hacking Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

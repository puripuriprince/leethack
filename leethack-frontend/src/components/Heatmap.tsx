"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActivityData } from "@/types";
import { getActivityLevel, isSameDay, getDateString } from "@/lib/utils";

interface HeatmapProps {
  data: ActivityData[];
  year?: number;
  className?: string;
}

export default function Heatmap({ data, year = new Date().getFullYear(), className = "" }: HeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<ActivityData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate weeks grid for the year
  const generateWeeksGrid = () => {
    const weeks: Date[][] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Find the start of the first week (Sunday)
    const firstWeekStart = new Date(startDate);
    firstWeekStart.setDate(startDate.getDate() - startDate.getDay());
    
    let currentDate = new Date(firstWeekStart);
    
    while (currentDate <= endDate) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }
    
    return weeks;
  };

  const weeks = generateWeeksGrid();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const getActivityForDate = (date: Date): ActivityData => {
    const dateString = getDateString(date);
    return data.find(d => d.date === dateString) || {
      date: dateString,
      count: 0,
      level: 0
    };
  };

  const getIntensityClass = (level: number): string => {
    switch (level) {
      case 0: return "bg-gray-800 hover:bg-gray-700";
      case 1: return "bg-terminal-green/30 hover:bg-terminal-green/40";
      case 2: return "bg-terminal-green/50 hover:bg-terminal-green/60";
      case 3: return "bg-terminal-green/70 hover:bg-terminal-green/80";
      case 4: return "bg-terminal-green hover:bg-terminal-green/90";
      default: return "bg-gray-800 hover:bg-gray-700";
    }
  };

  const handleMouseEnter = (event: React.MouseEvent, activity: ActivityData) => {
    setHoveredDay(activity);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const totalContributions = data.reduce((sum, day) => sum + day.count, 0);
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Submission Activity</h3>
          <p className="text-sm text-muted-foreground">
            {totalContributions} submissions in {year}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getIntensityClass(level)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="relative">
        {/* Month Labels */}
        <div className="flex mb-2">
          {months.map((month, index) => {
            const monthWidth = Math.floor(52 / 12); // Approximate weeks per month
            const leftOffset = index * monthWidth * 14; // 14px per week
            
            return (
              <div
                key={month}
                className="text-xs text-muted-foreground absolute"
                style={{ left: `${leftOffset}px` }}
              >
                {month}
              </div>
            );
          })}
        </div>

        {/* Day Labels */}
        <div className="flex">
          <div className="flex flex-col space-y-1 pr-2 text-xs text-muted-foreground">
            <div className="h-3"></div> {/* Spacer for Monday */}
            <div>Mon</div>
            <div className="h-3"></div> {/* Spacer for Tuesday */}
            <div>Wed</div>
            <div className="h-3"></div> {/* Spacer for Thursday */}
            <div>Fri</div>
            <div className="h-3"></div> {/* Spacer for Saturday */}
          </div>

          {/* Weeks Grid */}
          <div className="flex space-x-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((day, dayIndex) => {
                  const activity = getActivityForDate(day);
                  const isCurrentYear = day.getFullYear() === year;
                  
                  return (
                    <motion.div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 ${
                        isCurrentYear 
                          ? getIntensityClass(activity.level)
                          : "bg-gray-900"
                      }`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        delay: (weekIndex * 7 + dayIndex) * 0.001,
                        duration: 0.2
                      }}
                      whileHover={{ scale: 1.2 }}
                      onMouseEnter={(e) => isCurrentYear && handleMouseEnter(e, activity)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredDay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed z-50 bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-lg pointer-events-none"
              style={{
                left: mousePosition.x + 10,
                top: mousePosition.y - 50,
              }}
            >
              <div className="font-medium">
                {hoveredDay.count} submission{hoveredDay.count !== 1 ? 's' : ''}
              </div>
              <div className="text-muted-foreground text-xs">
                {formatDate(hoveredDay.date)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center p-3 bg-card/50 rounded-lg border border-border">
          <div className="text-2xl font-bold text-terminal-green">{totalContributions}</div>
          <div className="text-xs text-muted-foreground">Total Submissions</div>
        </div>
        <div className="text-center p-3 bg-card/50 rounded-lg border border-border">
          <div className="text-2xl font-bold text-terminal-blue">{maxCount}</div>
          <div className="text-xs text-muted-foreground">Best Day</div>
        </div>
        <div className="text-center p-3 bg-card/50 rounded-lg border border-border">
          <div className="text-2xl font-bold text-terminal-orange">
            {data.filter(d => d.count > 0).length}
          </div>
          <div className="text-xs text-muted-foreground">Active Days</div>
        </div>
      </div>
    </div>
  );
} 
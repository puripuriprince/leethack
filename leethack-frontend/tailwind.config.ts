import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#fafafa",
        card: {
          DEFAULT: "#141414",
          foreground: "#fafafa",
        },
        popover: {
          DEFAULT: "#141414",
          foreground: "#fafafa",
        },
        primary: {
          DEFAULT: "#0ea5e9",
          foreground: "#0a0a0a",
        },
        secondary: {
          DEFAULT: "#262626",
          foreground: "#fafafa",
        },
        muted: {
          DEFAULT: "#262626",
          foreground: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#262626",
          foreground: "#fafafa",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#fafafa",
        },
        border: "#374151",
        input: "#374151",
        ring: "#0ea5e9",
        chart: {
          "1": "#0ea5e9",
          "2": "#10b981",
          "3": "#f59e0b",
          "4": "#8b5cf6",
          "5": "#ef4444",
        },
        // Custom colors for LeetHack
        terminal: {
          bg: "#0c0c0c",
          border: "#262626",
          text: "#ffffff",
          green: "#00ff00",
          blue: "#00d4ff",
          orange: "#ff8c00",
          purple: "#d946ef",
          red: "#ff4444",
        },
        rank: {
          newbie: "#cccccc",
          pupil: "#77ff77",
          specialist: "#77dddd",
          expert: "#aaaaff",
          candidate: "#ff88ff",
          master: "#ffcc88",
          grandmaster: "#ff7777",
          legendary: "#ff0000",
        },
        difficulty: {
          easy: "#00b04f",
          medium: "#ffa116",
          hard: "#ff375f",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        inter: ["Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "typing": "typing 2s steps(20, end) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        typing: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config; 
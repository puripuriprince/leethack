#!/bin/bash
echo "Starting LeetHack Backend with VM Support..."

cd /Users/Nicholas/leethack/services/user-service

echo "Installing dependencies..."
npm install

echo "Starting server..."
npm run dev

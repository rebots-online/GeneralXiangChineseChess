#!/bin/bash

# Production build script for General Xiang Chinese Chess

# Exit on error
set -e

echo "Starting production build process..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo "Error: .env.production file not found. Please create it with the required environment variables."
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run type checking
echo "Running type checking..."
npm run typecheck

# Run linting
echo "Running linting..."
npm run lint

# Run tests
echo "Running tests..."
npm test

# Build the application
echo "Building the application..."
npm run build

# Check if the build was successful
if [ $? -eq 0 ]; then
  echo "Production build completed successfully!"
  echo "The build output is in the .next directory."
  echo "To start the production server, run: npm run start"
else
  echo "Production build failed. Please check the errors above."
  exit 1
fi

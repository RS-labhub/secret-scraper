#!/bin/bash

# ProductHunt Scraper Backend Startup Script

echo "🚀 Starting ProductHunt Scraper Backend..."

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "Python is not installed or not in PATH"
    exit 1
fi

# Check if pip is available
if ! command -v pip &> /dev/null; then
    echo "pip is not installed or not in PATH"
    exit 1
fi

# Install requirements
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Start the server
echo "Starting FastAPI server on http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"
python main.py

#!/bin/bash

# VEO Batch Processing System - Test Script
# Tests the native app before building the .app bundle

echo "🧪 Testing VEO Batch Processing System..."

# Change to the native-app directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run the application in development mode
echo "🚀 Starting VEO Batch Processing System in test mode..."
echo "📝 Use --dev flag for development features"
echo "🛑 Press Ctrl+C to stop the application"
echo ""

python main.py --dev

# Deactivate virtual environment when done
deactivate

echo "✅ Test session ended."

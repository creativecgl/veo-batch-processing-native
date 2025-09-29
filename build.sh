#!/bin/bash

# VEO Batch Processing System - Build Script for macOS
# Creates a standalone .app bundle for easy team distribution

echo "🚀 Building VEO Batch Processing System for macOS..."

# Change to the native-app directory
cd "$(dirname "$0")"

# Check if virtual environment exists, create if it doesn't
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

# Create the .app bundle
echo "🔨 Building .app bundle with PyInstaller..."
pyinstaller \
    --onedir \
    --windowed \
    --name "VEO Batch Processing System" \
    --icon="web/icon.icns" \
    --add-data "web:web" \
    --hidden-import=eel \
    --hidden-import=requests \
    --hidden-import=google.generativeai \
    --clean \
    main.py

# Check if build was successful
if [ -d "dist/VEO Batch Processing System.app" ]; then
    echo "✅ Build successful!"
    echo "📁 App bundle created at: dist/VEO Batch Processing System.app"
    echo ""
    echo "🎉 Your team can now install the app by:"
    echo "   1. Drag 'VEO Batch Processing System.app' to their Applications folder"
    echo "   2. Right-click the app and select 'Open' (first time only)"
    echo "   3. Add their Google Gemini API key in Configuration"
    echo ""
    
    # Option to open the dist folder
    read -p "Would you like to open the dist folder? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open dist/
    fi
else
    echo "❌ Build failed. Check the output above for errors."
    exit 1
fi

# Deactivate virtual environment
deactivate

echo "🎯 Build complete! The app is ready for distribution."
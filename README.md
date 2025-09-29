# VEO Batch Processing System - Native macOS App

Beautiful native macOS application for batch video generation using Google's VEO models. Features a Google Flow-inspired design with full file system access for custom output paths.

## 🌟 Features

- **Beautiful Native Interface**: Google Flow-inspired design with professional dark theme
- **Batch Video Generation**: Queue multiple video generation jobs
- **Custom Output Folders**: Choose exactly where videos are saved on your Mac
- **Native macOS Integration**: 
  - File system access via native dialogs
  - Finder integration
  - Native notifications
  - Optimized for macOS
- **Secure API Key Storage**: Safely stored in browser local storage
- **Professional Queue Management**: Track job status, preview videos, easy downloads
- **Multiple VEO Models**: Support for VEO 2, VEO 3, and Fast variants

## 🚀 Quick Start

### Testing the App (Development)
```bash
./test.sh
```
This will create a virtual environment, install dependencies, and launch the app in test mode.

### Building the .app Bundle
```bash
./build.sh
```
This creates a standalone `.app` file that your team can easily install.

## 📦 Team Distribution

After building, share the `.app` file with your team:

1. **For the recipient**: Drag `VEO Batch Processing System.app` to Applications folder
2. **First launch**: Right-click the app → "Open" (bypasses Gatekeeper)
3. **Setup**: Add Google Gemini API key in Configuration tab
4. **Configure**: Choose custom output folder for videos

## 🔧 Configuration

### API Key Setup
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key and paste in Configuration tab

### Output Folder
- Use the "Choose Output Folder" button in Configuration
- Videos will be saved to your selected location
- "Open Folder" button provides quick Finder access

## 💡 Usage

1. **Add Jobs**: Enter prompts, configure settings, add to queue
2. **Batch Process**: Click "Start Generation" to process all queued jobs
3. **Download**: Videos download directly to your chosen folder
4. **Manage**: Clear queue, track progress, preview results

## 🛠 Development

### Project Structure
```
native-app/
├── main.py              # Python backend (Eel)
├── web/                 # Frontend assets
│   ├── index.html       # Main UI
│   ├── index.css        # Google Flow styling
│   └── index.js         # JavaScript bridge
├── requirements.txt     # Python dependencies
├── build.sh            # Build script
├── test.sh             # Test script
└── README.md           # This file
```

### Python Backend (main.py)
- **Eel Framework**: Creates web-to-native bridge
- **File System Access**: Native folder selection dialogs
- **Download Management**: Custom path downloads with progress
- **Notifications**: Native macOS notifications
- **PyInstaller Ready**: Configured for .app bundle creation

### Frontend Bridge (index.js)
- **Eel Integration**: Seamless Python-JavaScript communication
- **Google GenAI**: Direct API integration for video generation
- **Local Storage**: Secure API key and settings persistence
- **Professional UI**: Queue management, progress tracking, error handling

## 🔧 Technical Details

### Dependencies
- **Python**: Eel, requests, google-generativeai
- **Frontend**: Vanilla JavaScript, TailwindCSS (CDN), Google GenAI SDK
- **Build**: PyInstaller for .app bundle creation

### Security
- API keys stored in browser localStorage (not in Python)
- No server component - fully client-side generation
- File system access via native macOS dialogs

### Performance
- Asynchronous video generation
- Native file operations
- Optimized memory usage
- Clean error handling

## 🚨 Troubleshooting

### Build Issues
```bash
# Clean rebuild
rm -rf venv dist build
./build.sh
```

### App Won't Launch
- Right-click app → "Open" (first time only)
- Check Console app for error messages
- Ensure macOS allows apps from unidentified developers

### Generation Failures
- Verify API key in Configuration tab
- Check internet connection
- Review error messages in queue cards
- Try simpler prompts for testing

### File Access Issues
- Grant app folder access when prompted
- Use "Choose Output Folder" for custom locations
- Check folder permissions

## 🎯 Next Steps

Your VEO Batch Processing System is now ready! 

**For Testing:**
```bash
./test.sh
```

**For Team Distribution:**
```bash
./build.sh
```

The native app provides your team with a professional, easy-to-use tool for batch video generation with full macOS integration and beautiful Google Flow-inspired design.

---

**Need Help?** Check the error messages in the app's queue or run the test script for debugging.
# VEO Batch Processing System - Native macOS App

Beautiful native macOS application for batch video generation using Google's VEO models. Features a Google Flow-inspired design with full file system access for custom output paths.

## 🌟 Features

- **Batch Video Generation**: Generate 1-20 identical videos in one batch
- **Auto-Download**: Videos automatically download to your custom folder with sequential naming
- **Queue Statistics**: Real-time tracking of queued/generating/completed/failed jobs
- **Native macOS Integration**: File system access, notifications, and Finder integration
- **Multiple VEO Models**: Support for VEO 2, VEO 3, and Fast variants
- **Professional UI**: Google Flow-inspired dark theme with smooth animations

## 🚀 Quick Start

```bash
# Test the app
./test.sh

# Build .app bundle for distribution
./build.sh
```

## 📋 Requirements

- macOS 10.14+
- Python 3.8+
- Google Gemini API key

## 🎯 Usage

1. **Configure**: Add API key and select output folder in Configuration tab
2. **Create**: Enter prompt, configure settings, set batch size
3. **Generate**: Add to queue and start generation
4. **Download**: Videos auto-download with custom naming (video_001.mp4, etc.)

## 🔧 Technical Stack

- **Backend**: Python + Eel (web-to-native bridge)
- **Frontend**: Vanilla JS + Tailwind CSS
- **API**: Google GenAI SDK for VEO video generation
- **Build**: PyInstaller for .app bundle creation

## 📦 Latest Updates

- ✅ Batch generation (1-20 videos per job)
- ✅ Auto-download with custom naming
- ✅ Queue statistics display
- ✅ Fixed blob URL download issue
- ✅ Centered folder picker dialog

## 📝 License

MIT License

---

**Repository**: https://github.com/creativecgl/veo-batch-processing-native
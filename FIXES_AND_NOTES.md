# VEO Native App - What It Took to Fix It

## CRITICAL FIX #1: Missing tkinter Module

**Problem:**
```
ModuleNotFoundError: No module named '_tkinter'
```

**Root Cause:**
- Homebrew Python 3.13 doesn't include tkinter
- tkinter needed for native macOS folder dialogs

**Solution:**
1. Deleted old venv (built with Homebrew Python)
2. Recreated venv using conda Python (has tkinter built-in)
3. Reinstalled all dependencies

**Commands:**
```bash
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## CRITICAL FIX #2: Wrong Port Confusion

**Problem:**
- User tried localhost:3000 → Got "ERR_INVALID_HTTP_RESPONSE"

**Why:**
- App uses `port=0` = RANDOM port selection
- Could be 8000, 8080, 59167, anything!

**How to Find Actual Port:**
```bash
# Find the running process
ps aux | grep 'python main.py'

# Find what port it's using (replace PID)
lsof -nP -p [PID] | grep TCP
```

**Result:** App was actually on port **59167**

---

## KEY INSIGHT: Auto-Launch Behavior

**The app should auto-open Chrome - no manual URL needed!**

```python
eed.start(
    'index.html',
    port=0,           # Random port
    mode='chrome-app', # Auto-opens Chrome
    app_mode=True      # Standalone window
)
```

If Chrome doesn't auto-open → Use `lsof` to find port

---

## WORKING COMMANDS

```bash
cd '/Users/Arudz/MASTER Dropbox/arudz goudsouzian/PRODUCTION FORCE/DEMOROOM/AI ROOM/VEO3 BATCH TOOL/VEO 3 BATCH TOOL V3/native-app'
source venv/bin/activate
python main.py --dev
```

---

## NEXT: Test & Build

1. ✅ Test native folder selection
2. ✅ Test native notifications  
3. ⏳ Run `./build.sh` for .app bundle
4. ⏳ Distribute to team

---

## Lessons Learned

1. **Use conda Python for macOS GUI apps** (has tkinter)
2. **Don't guess port numbers** - use `lsof` to find them
3. **Random ports are normal** with `port=0`
4. **Eel auto-opens Chrome** - no manual URL needed

**Date:** September 28, 2025
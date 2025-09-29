#!/usr/bin/env python3
"""
VEO Batch Processing System - Native macOS Wrapper
Simple wrapper to make the web interface easily shareable with full file system access
"""

import eel
import os
import sys
import json
import requests
from pathlib import Path
from tkinter import filedialog, messagebox
import tkinter as tk
from typing import Optional, Dict, Any
import subprocess
import tempfile

# Initialize Eel with the web directory
eel.init('web')

class VEONativeApp:
    def __init__(self):
        self.output_folder = os.path.expanduser("~/Downloads/VEO-Videos")
        self.ensure_output_folder()
        self.api_key = None
        
    def ensure_output_folder(self):
        """Create default output folder if it doesn't exist"""
        os.makedirs(self.output_folder, exist_ok=True)
    
    def get_resource_path(self, relative_path):
        """Get absolute path to resource, works for dev and for PyInstaller"""
        try:
            # PyInstaller creates a temp folder and stores path in _MEIPASS
            base_path = sys._MEIPASS
        except Exception:
            base_path = os.path.abspath(".")
        return os.path.join(base_path, relative_path)

# Global app instance
app = VEONativeApp()

@eel.expose
def select_output_folder():
    """Open native folder selection dialog"""
    try:
        # Create a temporary tkinter root window
        root = tk.Tk()
        
        # Center the window on screen
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        x = (screen_width // 2) - 200
        y = (screen_height // 2) - 150
        
        # Position window centered (still tiny, but centered)
        root.geometry(f'1x1+{x}+{y}')
        root.title('')
        root.attributes('-topmost', True)
        
        # Update the window to ensure it's rendered
        root.update()
        
        # Bring window to front and focus
        root.lift()
        root.focus_force()
        
        # Show folder selection dialog
        folder = filedialog.askdirectory(
            parent=root,
            title="Select Output Folder for Generated Videos",
            initialdir=app.output_folder
        )
        
        root.destroy()
        
        if folder:
            app.output_folder = folder
            return folder
        return app.output_folder
        
    except Exception as e:
        print(f"Error selecting folder: {e}")
        return app.output_folder

@eel.expose
def get_output_folder():
    """Get current output folder"""
    return app.output_folder

@eel.expose
def set_output_folder(folder_path):
    """Set output folder"""
    if os.path.exists(folder_path):
        app.output_folder = folder_path
        return True
    return False

@eel.expose
def download_video_to_custom_path(video_url, filename):
    """Download video to the user-selected custom path"""
    try:
        # Ensure output folder exists
        os.makedirs(app.output_folder, exist_ok=True)
        
        # Create full file path
        file_path = os.path.join(app.output_folder, filename)
        
        # Download the video
        print(f"Downloading video to: {file_path}")
        response = requests.get(video_url, stream=True)
        response.raise_for_status()
        
        # Save to custom path
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return {
            "success": True, 
            "path": file_path,
            "folder": app.output_folder
        }
        
    except Exception as e:
        print(f"Download error: {e}")
        return {
            "success": False, 
            "error": str(e)
        }

@eel.expose
def open_folder_in_finder(folder_path=None):
    """Open folder in Finder"""
    try:
        path_to_open = folder_path or app.output_folder
        subprocess.run(['open', path_to_open])
        return True
    except Exception as e:
        print(f"Error opening folder: {e}")
        return False

@eel.expose
def show_native_notification(title, message):
    """Show native macOS notification"""
    try:
        script = f'''
        display notification "{message}" with title "{title}"
        '''
        subprocess.run(['osascript', '-e', script])
        return True
    except Exception as e:
        print(f"Notification error: {e}")
        return False

@eel.expose
def get_app_info():
    """Get app information"""
    return {
        "name": "VEO Batch Processing System",
        "version": "1.0.0",
        "output_folder": app.output_folder,
        "platform": "macOS"
    }

def main():
    """Main entry point"""
    try:
        print("Starting VEO Batch Processing System...")
        print(f"Output folder: {app.output_folder}")
        
        # Start the Eel application with more stable settings
        # Use 'chrome' mode instead of 'chrome-app' for better stability
        eel.start(
            'index.html',
            size=(1400, 900),
            port=0,  # Use random available port
            mode='chrome',  # More stable than chrome-app
            host='localhost',
            block=True,  # Keep the app running
            cmdline_args=['--disable-web-security', '--allow-running-insecure-content']
        )
        
    except (SystemExit, KeyboardInterrupt):
        print("\nShutting down VEO Batch Processing System...")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting application: {e}")
        import traceback
        traceback.print_exc()
        # Show error dialog
        root = tk.Tk()
        root.geometry('1x1+0+0')  # Make it tiny
        root.title('')
        messagebox.showerror("Error", f"Failed to start VEO Batch Processing System:\n{e}", parent=root)
        root.destroy()
        sys.exit(1)

if __name__ == '__main__':
    main()

"""
Auto-Updater for Mushroom Print Service
Checks GitHub Releases for new versions and auto-updates the executable.
"""

import os
import sys
import json
import shutil
import subprocess
import urllib.request
import urllib.error
import ssl
import tempfile
from pathlib import Path

# SSL Context for .exe compatibility (Windows certificate issues)
# This is safe because we only connect to github.com
try:
    SSL_CONTEXT = ssl.create_default_context()
except:
    SSL_CONTEXT = ssl._create_unverified_context()

# Try to use certifi if available, otherwise skip verification
try:
    import certifi
    SSL_CONTEXT.load_verify_locations(certifi.where())
except ImportError:
    # certifi not available, disable verification for .exe builds
    SSL_CONTEXT = ssl._create_unverified_context()

# --- Configuration ---
GITHUB_REPO = "marciomvm/SmartLabel"
RELEASE_ASSET_NAME = "MushroomPrintService.exe"  # Name of the .exe in releases
CHECK_UPDATE_ON_START = True

# GitHub Token for private repos (create at: https://github.com/settings/tokens)
# Token needs 'repo' scope for private repos
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

# Fallback: Read from config file if env not set
if not GITHUB_TOKEN:
    config_file = Path(__file__).parent / "github_token.txt"
    if config_file.exists():
        GITHUB_TOKEN = config_file.read_text().strip()

def get_current_version():
    """Get version from version.txt or return default"""
    version_file = Path(__file__).parent / "version.txt"
    if version_file.exists():
        return version_file.read_text().strip()
    return "0.0.0"

def set_current_version(version: str):
    """Save version to version.txt"""
    version_file = Path(__file__).parent / "version.txt"
    version_file.write_text(version)

def get_github_headers():
    """Get headers for GitHub API requests"""
    headers = {"User-Agent": "MushroomPrintService"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers

def get_latest_release():
    """Fetch latest release info from GitHub API"""
    url = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
    try:
        req = urllib.request.Request(url, headers=get_github_headers())
        with urllib.request.urlopen(req, timeout=10, context=SSL_CONTEXT) as response:
            data = json.loads(response.read().decode())
            return {
                "version": data.get("tag_name", "").lstrip("v"),
                "name": data.get("name", ""),
                "assets": data.get("assets", []),
                "body": data.get("body", "")
            }
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("⚠️  No releases found yet. Create one on GitHub!")
        elif e.code == 401:
            print("⚠️  GitHub Token invalid or missing for private repo!")
        else:
            print(f"⚠️  GitHub API error: {e.code}")
        return None
    except Exception as e:
        print(f"⚠️  Could not check for updates: {e}")
        return None

def compare_versions(current: str, latest: str) -> bool:
    """Returns True if latest is newer than current"""
    try:
        current_parts = [int(x) for x in current.split(".")]
        latest_parts = [int(x) for x in latest.split(".")]
        return latest_parts > current_parts
    except:
        return False

def download_update(asset_url: str, dest_path: str) -> bool:
    """Download the new executable"""
    print(f"⬇️  Downloading update from: {asset_url}")
    try:
        headers = {
            "User-Agent": "MushroomPrintService",
            "Accept": "application/octet-stream"
        }
        # Add token for private repos
        if GITHUB_TOKEN:
            headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
        req = urllib.request.Request(asset_url, headers=headers)
        with urllib.request.urlopen(req, timeout=120, context=SSL_CONTEXT) as response:
            with open(dest_path, 'wb') as f:
                shutil.copyfileobj(response, f)
        print(f"✅ Download complete: {dest_path}")
        return True
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False

def apply_update(new_exe_path: str):
    """
    Replace current executable with new one.
    Creates a batch script to:
    1. Wait for current process to exit
    2. Replace the .exe
    3. Restart the new version
    """
    if not getattr(sys, 'frozen', False):
        print("⚠️  Not running as executable. Skipping auto-replace.")
        print(f"📦 New version downloaded to: {new_exe_path}")
        return False
    
    current_exe = sys.executable
    backup_exe = current_exe + ".bak"
    
    # Create updater batch script
    batch_script = f'''@echo off
echo Applying update...
timeout /t 2 /nobreak >nul
del "{backup_exe}" 2>nul
move "{current_exe}" "{backup_exe}"
move "{new_exe_path}" "{current_exe}"
echo Update complete! Restarting...
start "" "{current_exe}"
del "%~f0"
'''
    
    batch_path = os.path.join(tempfile.gettempdir(), "update_mushroom_print.bat")
    with open(batch_path, 'w') as f:
        f.write(batch_script)
    
    print("🔄 Applying update and restarting...")
    subprocess.Popen(['cmd', '/c', batch_path], creationflags=subprocess.CREATE_NO_WINDOW)
    sys.exit(0)

def check_for_updates(auto_apply: bool = True) -> dict:
    """
    Main update check function.
    Returns dict with update status and info.
    """
    current_version = get_current_version()
    print(f"📦 Current version: {current_version}")
    
    release = get_latest_release()
    if not release:
        return {"update_available": False, "error": "Could not fetch release info"}
    
    latest_version = release["version"]
    print(f"🌐 Latest version: {latest_version}")
    
    if not compare_versions(current_version, latest_version):
        print("✅ You are running the latest version!")
        return {"update_available": False, "current": current_version, "latest": latest_version}
    
    print(f"🆕 New version available: {latest_version}")
    
    # Find the .exe asset
    exe_asset = None
    for asset in release["assets"]:
        if asset["name"] == RELEASE_ASSET_NAME:
            exe_asset = asset
            break
    
    if not exe_asset:
        print(f"⚠️  Could not find {RELEASE_ASSET_NAME} in release assets")
        return {"update_available": True, "error": "Asset not found", "latest": latest_version}
    
    if auto_apply:
        # Download to temp location
        temp_exe = os.path.join(tempfile.gettempdir(), f"MushroomPrintService_{latest_version}.exe")
        
        if download_update(exe_asset["browser_download_url"], temp_exe):
            set_current_version(latest_version)
            apply_update(temp_exe)
            return {"update_available": True, "applied": True, "latest": latest_version}
        else:
            return {"update_available": True, "applied": False, "error": "Download failed"}
    
    return {
        "update_available": True,
        "current": current_version,
        "latest": latest_version,
        "download_url": exe_asset["browser_download_url"]
    }

if __name__ == "__main__":
    # Test the updater
    print("=== Auto-Updater Test ===")
    result = check_for_updates(auto_apply=False)
    print(json.dumps(result, indent=2))

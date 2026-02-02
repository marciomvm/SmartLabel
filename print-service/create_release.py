"""
Create GitHub Release with the MushroomPrintService.exe
"""
import os
import json
import urllib.request
import urllib.error
from pathlib import Path

# Configuration
GITHUB_REPO = "marciomvm/SmartLabel"
VERSION = "1.0.1"
TAG = f"v{VERSION}"
RELEASE_NAME = f"v{VERSION} - SSL Fix"
RELEASE_BODY = """🍄 Mushroom Print Service v1.0.1

## Fixes
- Fixed SSL certificate verification error on Windows
- Auto-update now works correctly on .exe builds

## Features
- Label printing for Grain, Substrate, and LC batches
- Auto-update system (checks for new versions on startup)
- COM port auto-detection
- QR code generation with batch info
"""

# Read token
token_file = Path(__file__).parent / "github_token.txt"
GITHUB_TOKEN = token_file.read_text().strip()

def api_request(url, method="GET", data=None, content_type="application/json"):
    """Make GitHub API request"""
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "User-Agent": "MushroomPrintService",
        "Accept": "application/vnd.github.v3+json",
    }
    if content_type:
        headers["Content-Type"] = content_type
    
    if data and isinstance(data, dict):
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"API Error {e.code}: {error_body}")
        raise

def upload_asset(upload_url, file_path, content_type="application/octet-stream"):
    """Upload release asset"""
    file_name = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    
    # Prepare upload URL
    upload_url = upload_url.replace("{?name,label}", f"?name={file_name}")
    
    print(f"📤 Uploading {file_name} ({file_size / 1024 / 1024:.1f} MB)...")
    
    with open(file_path, 'rb') as f:
        data = f.read()
    
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "User-Agent": "MushroomPrintService",
        "Content-Type": content_type,
        "Content-Length": str(file_size),
    }
    
    req = urllib.request.Request(upload_url, data=data, headers=headers, method="POST")
    
    with urllib.request.urlopen(req, timeout=300) as response:
        return json.loads(response.read().decode())

def main():
    print(f"🚀 Creating GitHub Release {TAG}...")
    
    # 1. Create Release
    release_url = f"https://api.github.com/repos/{GITHUB_REPO}/releases"
    release_data = {
        "tag_name": TAG,
        "target_commitish": "improvements-v2",  # Current branch
        "name": RELEASE_NAME,
        "body": RELEASE_BODY,
        "draft": False,
        "prerelease": False
    }
    
    print("📝 Creating release...")
    release = api_request(release_url, method="POST", data=release_data)
    print(f"✅ Release created: {release['html_url']}")
    
    # 2. Upload the .exe
    exe_path = Path(__file__).parent / "dist" / "MushroomPrintService.exe"
    if not exe_path.exists():
        print(f"❌ Executable not found: {exe_path}")
        return
    
    upload_url = release["upload_url"]
    asset = upload_asset(upload_url, str(exe_path))
    print(f"✅ Asset uploaded: {asset['browser_download_url']}")
    
    print("\n" + "=" * 50)
    print("🎉 Release published successfully!")
    print(f"📦 Release URL: {release['html_url']}")
    print("=" * 50)

if __name__ == "__main__":
    main()

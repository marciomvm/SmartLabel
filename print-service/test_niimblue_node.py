"""
Test using niimblue-node CLI directly
This will help us understand the exact protocol they use
"""
import subprocess
import os
import sys

def check_node_installed():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js installed: {result.stdout.strip()}")
            return True
        else:
            print("❌ Node.js not found")
            return False
    except FileNotFoundError:
        print("❌ Node.js not installed")
        return False

def check_npm_installed():
    """Check if npm is installed"""
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm installed: {result.stdout.strip()}")
            return True
        else:
            print("❌ npm not found")
            return False
    except FileNotFoundError:
        print("❌ npm not installed")
        return False

def install_niimblue_node():
    """Install niimblue-node globally"""
    print("\n🔧 Installing niimblue-node...")
    try:
        result = subprocess.run(['npm', 'install', '-g', '@mmote/niimblue-node'], 
                              capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print("✅ niimblue-node installed successfully")
            return True
        else:
            print(f"❌ Installation failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Installation timed out")
        return False
    except Exception as e:
        print(f"❌ Installation error: {e}")
        return False

def test_niimblue_cli():
    """Test niimblue CLI"""
    print("\n🧪 Testing niimblue CLI...")
    
    # Test if CLI is available
    try:
        result = subprocess.run(['niimblue-cli', '--help'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ niimblue-cli is working")
            print("Available commands:")
            print(result.stdout)
            return True
        else:
            print(f"❌ CLI test failed: {result.stderr}")
            return False
    except FileNotFoundError:
        print("❌ niimblue-cli not found in PATH")
        return False

def scan_for_printers():
    """Scan for Niimbot printers"""
    print("\n🔍 Scanning for Niimbot printers...")
    
    try:
        # Scan for BLE devices
        result = subprocess.run(['niimblue-cli', 'scan', '-t', 'ble'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("BLE scan results:")
            print(result.stdout)
        else:
            print(f"BLE scan failed: {result.stderr}")
        
        # Scan for serial devices
        result = subprocess.run(['niimblue-cli', 'scan', '-t', 'serial'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("\nSerial scan results:")
            print(result.stdout)
        else:
            print(f"Serial scan failed: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("❌ Scan timed out")
    except Exception as e:
        print(f"❌ Scan error: {e}")

def test_print_with_niimblue(image_path):
    """Test printing with niimblue-node"""
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    print(f"\n🖨️  Testing print with niimblue-node: {image_path}")
    
    # Try BLE first
    print("Attempting BLE connection...")
    try:
        result = subprocess.run([
            'niimblue-cli', 'print',
            '-t', 'ble',
            '-m', 'B1',
            '-i', image_path,
            '--label-width', '50',
            '--label-height', '30'
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ BLE print successful!")
            print(result.stdout)
            return True
        else:
            print(f"❌ BLE print failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("❌ BLE print timed out")
    except Exception as e:
        print(f"❌ BLE print error: {e}")
    
    # Try serial if BLE failed
    print("\nAttempting serial connection...")
    try:
        result = subprocess.run([
            'niimblue-cli', 'print',
            '-t', 'serial',
            '-m', 'B1',
            '-i', image_path,
            '--label-width', '50',
            '--label-height', '30'
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ Serial print successful!")
            print(result.stdout)
            return True
        else:
            print(f"❌ Serial print failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("❌ Serial print timed out")
    except Exception as e:
        print(f"❌ Serial print error: {e}")
    
    return False

def main():
    print("="*60)
    print("NIIMBLUE-NODE INTEGRATION TEST")
    print("="*60)
    
    # Check prerequisites
    if not check_node_installed():
        print("\n❌ Please install Node.js first:")
        print("   https://nodejs.org/")
        return
    
    if not check_npm_installed():
        print("\n❌ npm not available")
        return
    
    # Install niimblue-node
    if not install_niimblue_node():
        print("\n❌ Failed to install niimblue-node")
        return
    
    # Test CLI
    if not test_niimblue_cli():
        print("\n❌ CLI not working")
        return
    
    # Scan for printers
    scan_for_printers()
    
    # Test print
    test_images = [
        'label_G-20260130-TEST.png',
        'test_solid_black.png',
        'label_G-20260129-01.png'
    ]
    
    for img in test_images:
        if os.path.exists(img):
            if test_print_with_niimblue(img):
                print(f"\n🎉 SUCCESS! niimblue-node can print {img}")
                print("\nNow we can analyze what protocol it uses!")
                break
    else:
        print("\n⚠️  No test images found. Create one first:")
        print("   python test_fixed_protocol.py")

if __name__ == "__main__":
    main()
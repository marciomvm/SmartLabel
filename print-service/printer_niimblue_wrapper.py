"""
Python wrapper for niimblue-node CLI
Uses the working niimblue implementation via subprocess
"""
import subprocess
import os
import sys
import tempfile
from PIL import Image

def check_niimblue_available():
    """Check if niimblue-cli is available"""
    try:
        # Try direct command first
        result = subprocess.run(['niimblue-cli', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return True
    except:
        pass
    
    # Try Windows npm global path
    try:
        npm_path = os.path.expanduser(r'~\AppData\Roaming\npm\niimblue-cli.cmd')
        if os.path.exists(npm_path):
            result = subprocess.run([npm_path, '--help'], 
                                  capture_output=True, text=True, timeout=10)
            return result.returncode == 0
    except:
        pass
    
    return False

def get_niimblue_command():
    """Get the correct niimblue-cli command"""
    # Try direct command first
    try:
        result = subprocess.run(['niimblue-cli', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return 'niimblue-cli'
    except:
        pass
    
    # Try Windows npm global path
    npm_path = os.path.expanduser(r'~\AppData\Roaming\npm\niimblue-cli.cmd')
    if os.path.exists(npm_path):
        return npm_path
    
    return None

def print_label_niimblue(image_path: str, connection_type: str = 'ble', 
                        address: str = None, model: str = 'B1', 
                        label_width: int = None, label_height: int = None, 
                        quantity: int = 1):
    """
    Print label using niimblue-node CLI
    
    Args:
        image_path: Path to image file
        connection_type: 'ble' or 'serial'
        address: Bluetooth address or serial port (auto-detect if None)
        model: Printer model (B1, D110, etc.)
        label_width: Label width in mm (optional)
        label_height: Label height in mm (optional)
        quantity: Number of copies
    """
    
    niimblue_cmd = get_niimblue_command()
    if not niimblue_cmd:
        print("❌ niimblue-cli not available!")
        print("Install with: npm install -g @mmote/niimblue-node")
        return False
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    # Auto-detect address if not provided
    if not address and connection_type == 'ble':
        print("🔍 Scanning for B1 printer...")
        try:
            result = subprocess.run([niimblue_cmd, 'scan', '-t', 'ble'], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if 'B1-' in line:
                        address = line.split(':')[0] + ':' + ':'.join(line.split(':')[1:6])
                        print(f"✅ Found B1: {address}")
                        break
        except:
            pass
        
        if not address:
            print("❌ Could not find B1 printer")
            return False
    
    print(f"🖨️  Printing via niimblue-node...")
    print(f"   Image: {image_path}")
    print(f"   Connection: {connection_type}")
    print(f"   Address: {address}")
    print(f"   Model: {model}")
    if label_width and label_height:
        print(f"   Label: {label_width}x{label_height}mm")
    print(f"   Quantity: {quantity}")
    
    # Build command
    cmd = [niimblue_cmd, 'print', '-t', connection_type]
    
    if address:
        cmd.extend(['-a', address])
    
    cmd.extend(['-p', model])
    
    if label_width and label_height:
        cmd.extend(['--label-width', str(label_width)])
        cmd.extend(['--label-height', str(label_height)])
    
    if quantity > 1:
        cmd.extend(['-n', str(quantity)])
    
    cmd.append(image_path)
    
    print(f"\n🔧 Command: {' '.join(cmd)}")
    
    try:
        # Run with real-time output
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, 
                                 stderr=subprocess.STDOUT, 
                                 universal_newlines=True, bufsize=1)
        
        # Print output in real-time
        for line in process.stdout:
            print(f"   {line.rstrip()}")
        
        process.wait()
        
        if process.returncode == 0:
            print("\n✅ Print completed successfully!")
            return True
        else:
            print(f"\n❌ Print failed with code: {process.returncode}")
            return False
            
    except subprocess.TimeoutExpired:
        print("\n❌ Print timed out")
        return False
    except Exception as e:
        print(f"\n❌ Print error: {e}")
        return False

def optimize_image_for_niimblue(input_path: str, output_path: str = None):
    """
    Optimize image for niimblue printing
    """
    if not output_path:
        name, ext = os.path.splitext(input_path)
        output_path = f"{name}_optimized{ext}"
    
    print(f"🎨 Optimizing image: {input_path} → {output_path}")
    
    try:
        img = Image.open(input_path)
        
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
            print("   ✅ Converted to grayscale")
        
        # Ensure reasonable size (niimblue will resize anyway)
        max_size = (800, 600)
        if img.width > max_size[0] or img.height > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            print(f"   ✅ Resized to: {img.size}")
        
        # Save optimized version
        img.save(output_path, optimize=True)
        print(f"   ✅ Saved: {output_path}")
        
        return output_path
        
    except Exception as e:
        print(f"   ❌ Optimization failed: {e}")
        return input_path

def main():
    if len(sys.argv) < 2:
        print("Usage: python printer_niimblue_wrapper.py <image.png> [connection] [address]")
        print("\nExamples:")
        print("  python printer_niimblue_wrapper.py label.png")
        print("  python printer_niimblue_wrapper.py label.png ble")
        print("  python printer_niimblue_wrapper.py label.png ble 14:09:06:1c:f6:7d")
        print("  python printer_niimblue_wrapper.py label.png serial COM3")
        print("\nConnection types: ble, serial")
        print("Address: Bluetooth MAC or serial port (auto-detect if omitted)")
        sys.exit(1)
    
    image_path = sys.argv[1]
    connection_type = sys.argv[2] if len(sys.argv) > 2 else 'ble'
    address = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Optimize image first
    optimized_path = optimize_image_for_niimblue(image_path)
    
    # Try printing (without label dimensions to avoid resize issues)
    success = print_label_niimblue(optimized_path, connection_type, address, 'B1')
    
    if not success and connection_type == 'ble':
        print("\n🔄 BLE failed, trying serial...")
        success = print_label_niimblue(optimized_path, 'serial', None, 'B1')
    
    if success:
        print("\n🎉 SUCCESS! niimblue-node printed the label!")
        print("\nYou can now use this as your printing solution:")
        print(f"  python printer_niimblue_wrapper.py {image_path}")
    else:
        print("\n❌ Both BLE and serial failed")
        print("Check printer connection and try manual commands")

if __name__ == "__main__":
    main()
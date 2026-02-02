from flask import Flask, request, jsonify
from flask_cors import CORS
from label_generator import generate_label
import os
import sys
import subprocess

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from Next.js (localhost:3000)

def print_with_niimblue(image_path):
    """Print using niimblue-node CLI (USB -> BLE fallback)"""
    
    # Get the niimblue command
    npm_path = os.path.expanduser(r'~\AppData\Roaming\npm\niimblue-cli.cmd')
    if os.path.exists(npm_path):
        niimblue_cmd = npm_path
    else:
        niimblue_cmd = 'niimblue-cli'
        
    print(f"🖨️  Using command: {niimblue_cmd}")

    # Helper for cleaner error messages
    def run_cmd(cmd_list, timeout_sec):
        try:
            return subprocess.run(cmd_list, capture_output=True, text=True, timeout=timeout_sec)
        except FileNotFoundError:
            return None # Command not found
        except subprocess.TimeoutExpired:
            raise

    def detect_com_port():
        """Auto-detect the Niimbot/Serial COM port using PowerShell"""
        try:
            # Look for devices with generic serial names
            cmd = [
                'powershell', '-Command',
                'Get-WmiObject Win32_SerialPort | Select-Object -ExpandProperty DeviceID'
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            ports = result.stdout.strip().splitlines()
            
            # Prioritize ports that aren't COM1/COM2 (usually system)
            # Typically USB-Serial is COM3, COM4, etc.
            candidates = [p.strip() for p in ports if p.strip().startswith('COM') and p.strip() not in ['COM1', 'COM2']]
            
            if candidates:
                print(f"🔎 Detected Candidate Ports: {candidates}")
                return candidates[0] # Return first candidate (e.g., COM3)
            
            # Fallback check for common ports if WMI returns nothing (sometimes requires admin)
            return 'COM3' 
        except Exception as e:
            print(f"⚠️  Port detection failed: {e}")
            return 'COM3'

    # 1. Try USB / Serial (Auto-Detected)
    detected_port = detect_com_port()
    print(f"🔌 Attempting USB/Serial connection ({detected_port} detected)...")
    
    cmd_serial_auto = [
        niimblue_cmd, 'print',
        '-t', 'serial',
        '-a', detected_port,
        '-p', 'B1', 
        image_path
    ]
    
    # Try detected port first
    try:
        result = run_cmd(cmd_serial_auto, 40)
        if result and result.returncode == 0:
            print(f"✅ Serial {detected_port} Print successful: {result.stdout}")
            return True, result.stdout
        elif result:
            print(f"⚠️  {detected_port} failed. trying others...")
    except Exception:
        pass

    # Fallback to hardcoded COM4/COM3 if auto failed and detected was different
    fallback_ports = ['COM4', 'COM3']
    if detected_port in fallback_ports: fallback_ports.remove(detected_port)
    
    for port in fallback_ports:
        print(f"🔌 Retrying on {port}...")
        cmd_fallback = [
             niimblue_cmd, 'print',
            '-t', 'serial',
            '-a', port,
            '-p', 'B1', 
            image_path
        ]
        try:
            result = run_cmd(cmd_fallback, 40)
            if result and result.returncode == 0:
                print(f"✅ Serial {port} Print successful!")
                return True, result.stdout
        except:
            continue
    
    # Backup: Try generic USB scanning
    cmd_usb_auto = [
        niimblue_cmd, 'print',
        '-t', 'usb',
        '-p', 'B1', 
        image_path
    ]


    # Execute USB Auto
    try:
        result = run_cmd(cmd_usb_auto, 40)
        if result and result.returncode == 0:
            print(f"✅ USB Auto Print successful: {result.stdout}")
            return True, result.stdout
    except Exception as e:
        print(f"⚠️  USB Auto Error: {str(e)}")
        
    # 2. Try BLE (Fallback)
    print("📡 Attempting Bluetooth connection...")
    cmd_ble = [
        niimblue_cmd, 'print',
        '-t', 'ble',
        '-a', '14:09:06:1c:f6:7d', 
        '-p', 'B1',
        image_path
    ]
    
    try:
        result = run_cmd(cmd_ble, 60)
        if result is None:
             return False, "Tool 'niimblue-cli' missing."

        if result.returncode == 0:
            print(f"✅ BLE Print successful: {result.stdout}")
            return True, result.stdout
        else:
             err_msg = result.stderr.strip()
             print(f"❌ BLE failed: {err_msg}")
             return False, f"USB & BLE failed. BLE Error: {err_msg}"
             
    except subprocess.TimeoutExpired:
        error_msg = "Print timeout - printer not found or busy"
        print(f"❌ {error_msg}")
        return False, error_msg
    except Exception as e:
        error_msg = f"Print error: {str(e)}"
        print(f"❌ {error_msg}")
        return False, error_msg

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Mushroom Print Service"})

@app.route('/print-label', methods=['POST'])
def print_label_endpoint():
    data = request.json
    batch_id = data.get('batch_id')
    batch_type = data.get('batch_type', 'BATCH')
    strain = data.get('strain', 'Unknown')
    
    if not batch_id:
        return jsonify({"error": "Missing batch_id"}), 400
        
    try:
        # 1. Generate Image
        label_size = data.get('label_size', '40x30') # Default to 40x30
        lc_batch = data.get('lc_batch', '')
        date_str = data.get('date')
        print(f"🏷️  Generating label for batch: {batch_id} (Size: {label_size}, LC: {lc_batch}, Date: {date_str})")
        image_path = generate_label(batch_id, batch_type, strain, date_str=date_str, label_size=label_size, lc_batch=lc_batch)
        print(f"✅ Label generated: {image_path}")
        
        # 2. Print using niimblue-node
        success, output = print_with_niimblue(image_path)
        
        if success:
            return jsonify({
                "status": "printed", 
                "file": image_path,
                "batch_id": batch_id,
                "message": f"Label printed successfully for {batch_type} {batch_id}",
                "print_output": output
            })
        else:
            return jsonify({
                "error": f"Print failed: {output}",
                "file": image_path,
                "batch_id": batch_id
            }), 500
        
    except Exception as e:
        error_msg = f"Error processing batch {batch_id}: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({"error": error_msg}), 500

if __name__ == '__main__':
    print("🍄 Print Service running on port 5000...")
    app.run(host='0.0.0.0', port=5000)

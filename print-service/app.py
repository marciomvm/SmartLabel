from flask import Flask, request, jsonify
from flask_cors import CORS
from label_generator import generate_label
import os
import sys
import subprocess

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from Next.js (localhost:3000)

def print_with_niimblue(image_path):
    """Print using niimblue-node CLI"""
    try:
        # Get the niimblue command
        npm_path = os.path.expanduser(r'~\AppData\Roaming\npm\niimblue-cli.cmd')
        if os.path.exists(npm_path):
            niimblue_cmd = npm_path
        else:
            niimblue_cmd = 'niimblue-cli'
        
        # Build print command
        cmd = [
            niimblue_cmd, 'print',
            '-t', 'ble',
            '-a', '14:09:06:1c:f6:7d',  # Your B1 address
            '-p', 'B1',
            image_path
        ]
        
        print(f"🖨️  Executing: {' '.join(cmd)}")
        
        # Execute print command
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print(f"✅ Print successful: {result.stdout}")
            return True, result.stdout
        else:
            print(f"❌ Print failed: {result.stderr}")
            return False, result.stderr
            
    except subprocess.TimeoutExpired:
        error_msg = "Print timeout - printer may be busy"
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
        print(f"🏷️  Generating label for batch: {batch_id} (Size: {label_size}, LC: {lc_batch})")
        image_path = generate_label(batch_id, batch_type, strain, label_size=label_size, lc_batch=lc_batch)
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

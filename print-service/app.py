from flask import Flask, request, jsonify
from flask_cors import CORS
from label_generator import generate_label
import os
import sys

# Mock printer import to allow running without hardware for now
try:
    from printer import print_image
except ImportError:
    print("Printer module not found, using mock.")
    def print_image(path):
        print(f"MOCK PRINTING: {path}")

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from Next.js (localhost:3000)

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
        image_path = generate_label(batch_id, batch_type, strain)
        
        # 2. Print (Send to Bluetooth)
        print_image(image_path)
        
        # 3. Cleanup (optional, maybe keep for debugging)
        # os.remove(image_path)
        
        return jsonify({"status": "printed", "file": image_path})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🍄 Print Service running on port 5000...")
    app.run(host='0.0.0.0', port=5000)

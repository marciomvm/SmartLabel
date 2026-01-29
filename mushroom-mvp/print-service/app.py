"""
Flask Print Service for Mushroom MVP
Handles label generation and printing to NIIMBOT B1
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import asyncio
import os
import logging
from label_generator import generate_label, save_label, get_label_bytes
from printer import get_printer, PrinterCLI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Allow requests from Next.js app

# Configuration
LABELS_DIR = os.path.join(os.path.dirname(__file__), 'labels')
os.makedirs(LABELS_DIR, exist_ok=True)

# Store connected printer address
PRINTER_ADDRESS = os.environ.get('NIIMBOT_ADDRESS', None)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "mushroom-print-service",
        "version": "1.0.0"
    })


@app.route('/status', methods=['GET'])
def printer_status():
    """Check printer connection status"""
    return jsonify({
        "printer_address": PRINTER_ADDRESS,
        "connected": False,  # Would need async check
        "message": "Pair your NIIMBOT B1 via Windows Bluetooth settings first"
    })


@app.route('/scan', methods=['GET'])
def scan_printers():
    """Scan for available NIIMBOT printers"""
    async def do_scan():
        printer = get_printer()
        return await printer.scan_for_printers()
    
    try:
        devices = asyncio.run(do_scan())
        return jsonify({
            "success": True,
            "printers": devices
        })
    except Exception as e:
        logger.error(f"Scan error: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "printers": []
        })


@app.route('/generate-label', methods=['POST'])
def generate_label_endpoint():
    """Generate a label image without printing"""
    data = request.json
    
    batch_id = data.get('batch_id', 'TEST-001')
    batch_type = data.get('batch_type', '')
    strain = data.get('strain', '')
    
    try:
        # Generate and save label
        filename = f"{batch_id.replace('/', '_').replace('-', '_')}.png"
        filepath = os.path.join(LABELS_DIR, filename)
        save_label(batch_id, batch_type, strain, filepath)
        
        return jsonify({
            "success": True,
            "message": "Label generated",
            "file": filename,
            "path": filepath
        })
    except Exception as e:
        logger.error(f"Label generation error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/preview-label', methods=['POST'])
def preview_label():
    """Generate and return label image for preview"""
    data = request.json
    
    batch_id = data.get('batch_id', 'TEST-001')
    batch_type = data.get('batch_type', '')
    strain = data.get('strain', '')
    
    try:
        # Generate label
        img = generate_label(batch_id, batch_type, strain)
        
        # Save to temp file
        filename = f"preview_{batch_id.replace('/', '_')}.png"
        filepath = os.path.join(LABELS_DIR, filename)
        img.save(filepath)
        
        return send_file(filepath, mimetype='image/png')
    except Exception as e:
        logger.error(f"Preview error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/print-label', methods=['POST'])
def print_label():
    """Generate and print a label"""
    data = request.json
    
    batch_id = data.get('batch_id', 'TEST-001')
    batch_type = data.get('batch_type', '')
    strain = data.get('strain', '')
    dry_run = data.get('dry_run', False)
    
    logger.info(f"Print request: {batch_id} ({batch_type})")
    
    try:
        # Generate label
        filename = f"{batch_id.replace('/', '_').replace('-', '_')}.png"
        filepath = os.path.join(LABELS_DIR, filename)
        save_label(batch_id, batch_type, strain, filepath)
        
        if dry_run:
            return jsonify({
                "success": True,
                "message": "Dry run - label generated but not printed",
                "file": filepath
            })
        
        # Try to print using CLI
        async def do_print():
            return await PrinterCLI.print_image(filepath, PRINTER_ADDRESS)
        
        try:
            printed = asyncio.run(do_print())
        except Exception as e:
            logger.warning(f"CLI print failed: {e}")
            printed = False
        
        if printed:
            return jsonify({
                "success": True,
                "message": "Label printed successfully",
                "file": filepath
            })
        else:
            # Fallback: Just generate the file, user can print via NIIMBOT app
            return jsonify({
                "success": True,
                "printed": False,
                "message": "Label generated. Open in NIIMBOT app to print manually.",
                "file": filepath,
                "instructions": [
                    "1. Open NIIMBOT app on your phone",
                    "2. Import the image from this path:",
                    filepath,
                    "3. Print from the app"
                ]
            })
            
    except Exception as e:
        logger.error(f"Print error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/labels/<filename>', methods=['GET'])
def get_label_file(filename):
    """Serve a generated label file"""
    filepath = os.path.join(LABELS_DIR, filename)
    if os.path.exists(filepath):
        return send_file(filepath, mimetype='image/png')
    return jsonify({"error": "File not found"}), 404


def main():
    """Start the Flask server"""
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting Mushroom Print Service on port {port}")
    logger.info(f"Labels directory: {LABELS_DIR}")
    app.run(host='0.0.0.0', port=port, debug=True)


if __name__ == '__main__':
    main()

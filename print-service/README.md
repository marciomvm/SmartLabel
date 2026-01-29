# Mushroom Print Service 🖨️
A local Python service to act as a bridge between the Vercel web app and your physical NIIMBOT printer.

## Setup
1. Install Python 3.
2. Install dependencies:
   ```bash
   pip install flask flask-cors pillow qrcode[pil] bleak
   ```

## Running
```bash
python app.py
```
The service will listen on `localhost:5000`.

## Features
- Generates 40x30mm labels with QR Code, ID, Strain, and Date.
- Uses Bluetooth LE (Bleak) to find NIIMBOT printers.
- Exposes API for the web app.

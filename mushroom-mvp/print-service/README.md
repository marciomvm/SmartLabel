# Mushroom Print Service

Local Python service for printing labels to NIIMBOT B1.

## Quick Start

### 1. Install Dependencies

```powershell
cd print-service
pip install flask flask-cors pillow qrcode[pil] bleak
```

Or with Poetry:
```powershell
poetry install
```

### 2. Pair Your NIIMBOT B1

1. Turn on the B1 printer
2. Open Windows Settings → Bluetooth & devices
3. Click "Add device" → Bluetooth
4. Select "NIIMBOT B1" or similar
5. Complete pairing

### 3. Start the Service

```powershell
python app.py
```

The service will run on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```

### Generate Label (without printing)
```
POST /generate-label
Content-Type: application/json

{
  "batch_id": "G-001",
  "batch_type": "GRAIN",
  "strain": "Oyster"
}
```

### Print Label
```
POST /print-label
Content-Type: application/json

{
  "batch_id": "G-001",
  "batch_type": "GRAIN",
  "strain": "Oyster"
}
```

### Preview Label (returns image)
```
POST /preview-label
Content-Type: application/json

{
  "batch_id": "G-001",
  "batch_type": "GRAIN"
}
```

### Scan for Printers
```
GET /scan
```

## Label Specifications

- **Size**: 15mm x 30mm (NIIMBOT B1 default)
- **Resolution**: 203 DPI
- **Pixels**: 120 x 239
- **Format**: 1-bit PNG (black/white)

## Manual Printing (Fallback)

If direct Bluetooth printing doesn't work:

1. The service saves labels to `print-service/labels/`
2. Open NIIMBOT app on your phone
3. Transfer the PNG file to your phone
4. Import and print from the app

## Troubleshooting

### Printer not found
- Ensure B1 is turned on
- Check Windows Bluetooth settings
- Try repairing the device

### Print quality issues
- Use genuine NIIMBOT label rolls
- Adjust density in the API call
- Clean the print head

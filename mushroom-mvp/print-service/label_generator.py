"""
Label Generator for Mushroom MVP
Creates label images optimized for NIIMBOT B1 (15mm x 30mm @ 203 DPI)
"""

from PIL import Image, ImageDraw, ImageFont
import qrcode
from io import BytesIO
import os

# NIIMBOT B1 Label Specs (15mm x 30mm @ 203 DPI)
LABEL_WIDTH_MM = 30
LABEL_HEIGHT_MM = 15
DPI = 203

# Convert mm to pixels
def mm_to_px(mm: float) -> int:
    return int(mm * DPI / 25.4)

LABEL_WIDTH_PX = mm_to_px(LABEL_WIDTH_MM)   # ~239 pixels
LABEL_HEIGHT_PX = mm_to_px(LABEL_HEIGHT_MM)  # ~120 pixels
QR_SIZE_PX = mm_to_px(12)  # ~96 pixels


def generate_label(batch_id: str, batch_type: str = "", strain: str = "") -> Image.Image:
    """
    Generate a label image for a mushroom batch.
    
    Layout:
    ┌──────────────────────────────┐
    │  ┌────────┐  G-001          │
    │  │  QR    │  GRAIN          │
    │  │  CODE  │  Oyster         │
    │  └────────┘                 │
    └──────────────────────────────┘
    """
    
    # Create blank white image
    img = Image.new('1', (LABEL_WIDTH_PX, LABEL_HEIGHT_PX), color=1)  # 1-bit (black/white)
    draw = ImageDraw.Draw(img)
    
    # Generate QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=3,
        border=1,
    )
    qr.add_data(batch_id)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_img = qr_img.resize((QR_SIZE_PX, QR_SIZE_PX), Image.Resampling.NEAREST)
    
    # Paste QR code on the left
    qr_x = 4
    qr_y = (LABEL_HEIGHT_PX - QR_SIZE_PX) // 2
    img.paste(qr_img, (qr_x, qr_y))
    
    # Text positioning
    text_x = qr_x + QR_SIZE_PX + 8
    
    # Try to load a font (fallback to default if not available)
    try:
        font_large = ImageFont.truetype("arial.ttf", 16)
        font_small = ImageFont.truetype("arial.ttf", 10)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw Batch ID (large, bold)
    draw.text((text_x, 10), batch_id, font=font_large, fill=0)
    
    # Draw Type
    if batch_type:
        type_abbrev = batch_type[:5].upper()  # GRAIN, SUBST, BULK
        draw.text((text_x, 32), type_abbrev, font=font_small, fill=0)
    
    # Draw Strain (if provided)
    if strain:
        strain_abbrev = strain[:8]  # Truncate long names
        draw.text((text_x, 46), strain_abbrev, font=font_small, fill=0)
    
    return img


def save_label(batch_id: str, batch_type: str = "", strain: str = "", output_path: str = None) -> str:
    """Generate and save label to file"""
    img = generate_label(batch_id, batch_type, strain)
    
    if output_path is None:
        output_path = f"labels/{batch_id.replace('/', '_')}.png"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else "labels", exist_ok=True)
    
    img.save(output_path)
    return output_path


def get_label_bytes(batch_id: str, batch_type: str = "", strain: str = "") -> bytes:
    """Generate label and return as bytes (for sending to printer)"""
    img = generate_label(batch_id, batch_type, strain)
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()


if __name__ == "__main__":
    # Test generation
    path = save_label("G-001", "GRAIN", "Oyster")
    print(f"Label saved to: {path}")

import qrcode
from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime

def generate_label(batch_id, batch_type, strain_name, date_str=None):
    """
    Generates a 40x30mm label (approx 320x240 px at 203 DPI)
    Layout:
    [ QR CODE ]  [ TEXT ]
    """
    # Dimensions for NIIMBOT B1 (Adjust based on label size, using 40x30mm as standard)
    # 203 DPI = ~8 dots per mm
    # 40mm = 320 px
    # 30mm = 240 px
    W, H = 320, 240
    
    # White background
    img = Image.new('RGB', (W, H), 'white')
    draw = ImageDraw.Draw(img)
    
    # --- 1. QR Code (Left Side) ---
    # Size: 180x180 px square, centered vertically on the left
    qr = qrcode.QRCode(box_size=4, border=1)
    qr.add_data(batch_id)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Resize QR to fit nicely
    qr_size = 180
    qr_img = qr_img.resize((qr_size, qr_size))
    
    # Paste QR at (10, 30) - slightly padded
    img.paste(qr_img, (10, (H - qr_size) // 2))
    
    # --- 2. Text Info (Right Side) ---
    # Fonts
    try:
        font_large = ImageFont.truetype("arial.ttf", 24)
        font_medium = ImageFont.truetype("arial.ttf", 18)
        font_small = ImageFont.truetype("arial.ttf", 16)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

    text_x = 200
    current_y = 20
    
    # TYPE (Header)
    draw.text((text_x, current_y), batch_type, font=font_small, fill='black')
    current_y += 30
    
    # ID (Bold)
    # Ex: G-2026...
    short_id = batch_id.split('-')[-1] # Show last sequence "01" large?
    # Or show full ID small? Let's show full ID split
    draw.text((text_x, current_y), batch_id[:10], font=font_small, fill='black')
    current_y += 20
    draw.text((text_x, current_y), batch_id[11:], font=font_large, fill='black') # "-01"
    current_y += 35
    
    # Strain
    strain_short = strain_name[:12] # Truncate if too long
    draw.text((text_x, current_y), strain_short, font=font_medium, fill='black')
    current_y += 25
    
    # Date
    if not date_str:
        date_str = datetime.now().strftime("%d/%m")
    draw.text((text_x, current_y), date_str, font=font_small, fill='gray')

    # Save
    output_path = f"label_{batch_id}.png"
    img.save(output_path)
    return output_path

if __name__ == "__main__":
    # Test
    generate_label("G-20260129-01", "GRAIN", "Lions Mane")
    print("Test label generated.")

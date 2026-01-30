import qrcode
from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime

# Label Dimensions Configuration (203 DPI)
# 1 mm = ~8 pixels
LABEL_SIZES = {
    "30x15": {"w": 236, "h": 118, "qr_sz": 100, "qr_x": 10, "text_x": 120, "font_mult": 0.6},
    "40x30": {"w": 315, "h": 236, "qr_sz": 180, "qr_x": 10, "text_x": 200, "font_mult": 1.0}, # Standard
    "50x30": {"w": 394, "h": 236, "qr_sz": 180, "qr_x": 20, "text_x": 220, "font_mult": 1.1}, # Wider
    "40x70": {"w": 315, "h": 551, "qr_sz": 250, "qr_x": 32, "text_x": 20, "text_y_start": 280, "vertical": True, "font_mult": 1.2}, # Vertical Long
    "50x50": {"w": 394, "h": 394, "qr_sz": 280, "qr_x": 57, "text_x": 20, "text_y_start": 300, "vertical": True, "font_mult": 1.2}, # Square
    "50x80": {"w": 394, "h": 630, "qr_sz": 350, "qr_x": 22, "text_x": 20, "text_y_start": 380, "vertical": True, "font_mult": 1.4},
}

# Native B1 Print Width
NATIVE_WIDTH = 384 

def get_font(size, variant="regular"):
    try:
        if variant == "bold":
            return ImageFont.truetype("arialbd.ttf", size)
        return ImageFont.truetype("arial.ttf", size)
    except:
        return ImageFont.load_default()

def fit_text(draw, text, max_width, font_path="arial.ttf", max_font_size=30, min_font_size=10):
    """
    Dynamically finds the best font size to fit text within max_width.
    """
    font_size = max_font_size
    while font_size >= min_font_size:
        try:
            font = ImageFont.truetype(font_path, font_size)
        except:
            font = ImageFont.load_default()
            return font # Fallback
            
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        
        if text_width <= max_width:
            return font
        
        font_size -= 2
        
    return get_font(min_font_size)

def generate_label(batch_id, batch_type, strain_name, date_str=None, label_size="40x30"):
    """
    Generates a label image based on the selected size.
    Default size: 40x30mm
    """
    # 1. Get Configuration
    config = LABEL_SIZES.get(label_size, LABEL_SIZES["40x30"])
    W, H = config["w"], config["h"]
    
    # Create canvas
    img = Image.new('RGB', (W, H), 'white')
    draw = ImageDraw.Draw(img)
    
    # 2. QR Code
    # Payload: Richer data for scanning
    qr_data = f"{batch_id}|{batch_type}|{strain_name}"
    
    qr = qrcode.QRCode(box_size=5, border=1)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    qr_size = config["qr_sz"]
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    # Position QR
    if config.get("vertical"):
        # Centered horizontally at top
        qr_x = (W - qr_size) // 2
        qr_y = 20
        img.paste(qr_img, (qr_x, qr_y))
        
        text_start_x = 10
        text_start_y = config.get("text_y_start", qr_size + 30)
        max_text_width = W - 20
    else:
        # Left side centered vertically
        qr_x = config["qr_x"]
        qr_y = (H - qr_size) // 2
        img.paste(qr_img, (qr_x, qr_y))
        
        text_start_x = config["text_x"]
        text_start_y = 20
        max_text_width = W - text_start_x - 10

    # 3. Text Content
    current_y = text_start_y
    f_mult = config["font_mult"]
    
    # TYPE (Header)
    font_small = get_font(int(16 * f_mult))
    draw.text((text_start_x, current_y), batch_type, font=font_small, fill='black')
    current_y += int(25 * f_mult)
    
    # ID (Split for emphasis)
    # G-2026.01.29 - 01
    mid_font_size = int(20 * f_mult)
    large_font_size = int(28 * f_mult)
    
    # Split ID: "G-20260129" and "01"
    parts = batch_id.split('-')
    if len(parts) > 1:
        prefix = "-".join(parts[:-1])
        suffix = parts[-1]
    else:
        prefix = batch_id
        suffix = ""

    font_id_pre = get_font(mid_font_size)
    draw.text((text_start_x, current_y), prefix, font=font_id_pre, fill='black')
    current_y += int(22 * f_mult)
    
    if suffix:
        font_id_suf = get_font(large_font_size, "bold")
        draw.text((text_start_x, current_y), f"-{suffix}", font=font_id_suf, fill='black')
        current_y += int(35 * f_mult)
    
    # STRAIN NAME (Dynamic Fit)
    # Allow 2 lines if needed or scale down
    # Strategy: Find best fit font for single line first
    font_strain = fit_text(draw, strain_name, max_text_width, max_font_size=int(26 * f_mult))
    
    # Check if it fits even with min font, if not, simple truncate or wrap? 
    # For now, fit_text ensures it fits width, but might be small.
    draw.text((text_start_x, current_y), strain_name, font=font_strain, fill='black')
    current_y += int(30 * f_mult)
    
    # DATE
    if not date_str:
        date_str = datetime.now().strftime("%d/%m/%Y")
    
    font_date = get_font(int(14 * f_mult))
    draw.text((text_start_x, current_y), date_str, font=font_date, fill='gray')

    # 4. Resize Canvas to Native Width (384px) if needed for printer logic
    # The printer.py handles centering, but it expects a file.
    # We save exactly the size requested. printer.py will center it on 384px.
    
    # Save
    if not os.path.exists("generated_labels"):
        os.makedirs("generated_labels")
        
    filename = f"label_{batch_id}_{label_size}.png"
    output_path = os.path.join("generated_labels", filename)
    img.save(output_path)
    
    # Return absolute path
    return os.path.abspath(output_path)

if __name__ == "__main__":
    # Test Generation
    print("Generating test labels...")
    generate_label("G-20260130-01", "GRAIN", "Lions Mane Mushroom", label_size="40x30")
    generate_label("G-20260130-02", "SUBSTRATE", "Golden Teacher Special", label_size="50x30")
    generate_label("G-20260130-03", "AGAR", "Pink Oyster", label_size="30x15")
    print("Done. Check 'generated_labels' folder.")

"""
Test different label sizes with Niimbot B1
"""
import qrcode
from PIL import Image, ImageDraw, ImageFont
import os
import subprocess

def mm_to_pixels(mm, dpi=203):
    """Convert millimeters to pixels at given DPI"""
    return int(mm * dpi / 25.4)

def create_test_label(width_mm, height_mm, label_text="TEST"):
    """Create a test label with specified dimensions"""
    
    # Convert to pixels
    W = mm_to_pixels(width_mm)
    H = mm_to_pixels(height_mm)
    
    print(f"Creating {width_mm}x{height_mm}mm label ({W}x{H} pixels)")
    
    # Create image
    img = Image.new('RGB', (W, H), 'white')
    draw = ImageDraw.Draw(img)
    
    # Draw border
    draw.rectangle([0, 0, W-1, H-1], outline='black', width=2)
    
    # Try to load font
    try:
        font_large = ImageFont.truetype("arial.ttf", max(12, min(24, H//10)))
        font_small = ImageFont.truetype("arial.ttf", max(8, min(16, H//15)))
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Determine layout based on aspect ratio
    if W > H:  # Landscape
        layout = "horizontal"
    else:  # Portrait or square
        layout = "vertical"
    
    if layout == "horizontal" and W > 200:
        # QR code on left, text on right
        qr_size = min(H - 20, W // 3)
        if qr_size > 50:
            # Create QR code
            qr = qrcode.QRCode(box_size=max(1, qr_size//25), border=1)
            qr.add_data(f"{width_mm}x{height_mm}mm")
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            qr_img = qr_img.resize((qr_size, qr_size))
            
            # Paste QR code
            qr_y = (H - qr_size) // 2
            img.paste(qr_img, (10, qr_y))
            
            # Add text
            text_x = qr_size + 20
            text_y = H // 2 - 20
            draw.text((text_x, text_y), f"{width_mm}x{height_mm}mm", font=font_large, fill='black')
            draw.text((text_x, text_y + 25), label_text, font=font_small, fill='black')
        else:
            # Too small for QR, just text
            draw.text((10, H//2 - 10), f"{width_mm}x{height_mm}", font=font_small, fill='black')
    
    elif layout == "vertical" and H > 100:
        # QR code on top, text below
        qr_size = min(W - 20, H // 2)
        if qr_size > 50:
            # Create QR code
            qr = qrcode.QRCode(box_size=max(1, qr_size//25), border=1)
            qr.add_data(f"{width_mm}x{height_mm}mm")
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            qr_img = qr_img.resize((qr_size, qr_size))
            
            # Paste QR code
            qr_x = (W - qr_size) // 2
            img.paste(qr_img, (qr_x, 10))
            
            # Add text
            text_y = qr_size + 20
            draw.text((10, text_y), f"{width_mm}x{height_mm}mm", font=font_small, fill='black')
            draw.text((10, text_y + 20), label_text, font=font_small, fill='black')
        else:
            # Too small for QR, just text
            draw.text((5, H//2 - 10), f"{width_mm}x{height_mm}", font=font_small, fill='black')
    
    else:
        # Very small, just dimensions
        draw.text((5, H//2 - 5), f"{width_mm}x{height_mm}", font=font_small, fill='black')
    
    # Save
    filename = f"test_label_{width_mm}x{height_mm}mm.png"
    img.save(filename)
    print(f"✅ Saved: {filename}")
    
    return filename

def print_test_label(filename):
    """Print test label using niimblue-node"""
    try:
        npm_path = os.path.expanduser(r'~\AppData\Roaming\npm\niimblue-cli.cmd')
        if os.path.exists(npm_path):
            niimblue_cmd = npm_path
        else:
            niimblue_cmd = 'niimblue-cli'
        
        cmd = [
            niimblue_cmd, 'print',
            '-t', 'ble',
            '-a', '14:09:06:1c:f6:7d',
            '-p', 'B1',
            filename
        ]
        
        print(f"🖨️  Printing {filename}...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print(f"✅ Printed successfully!")
            return True
        else:
            print(f"❌ Print failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Print error: {e}")
        return False

def main():
    print("="*60)
    print("NIIMBOT B1 LABEL SIZE TESTING")
    print("="*60)
    
    # Common B1 label sizes
    test_sizes = [
        (15, 30, "Small"),      # Pequeno
        (20, 30, "Compact"),    # Compacto  
        (30, 15, "Wide"),       # Largo
        (40, 30, "Current"),    # Atual (seu sistema)
        (50, 30, "Large"),      # Grande
        (40, 70, "Long"),       # Longo
        (50, 50, "Square"),     # Quadrado
    ]
    
    print(f"\nTesting {len(test_sizes)} different label sizes:")
    for width, height, desc in test_sizes:
        print(f"  - {width}x{height}mm ({desc})")
    
    print(f"\nB1 Specifications:")
    print(f"  - Width range: 20-50mm")
    print(f"  - Native width: 48mm (384 pixels)")
    print(f"  - Current system: ~48x30mm (384x240 pixels)")
    
    # Create test labels
    print(f"\n" + "="*60)
    print("CREATING TEST LABELS")
    print("="*60)
    
    created_files = []
    for width, height, desc in test_sizes:
        try:
            filename = create_test_label(width, height, desc)
            created_files.append((filename, width, height, desc))
        except Exception as e:
            print(f"❌ Failed to create {width}x{height}mm: {e}")
    
    # Print test labels
    print(f"\n" + "="*60)
    print("PRINTING TEST LABELS")
    print("="*60)
    
    print("⚠️  This will print multiple test labels!")
    response = input("Continue? (y/N): ").lower().strip()
    
    if response == 'y':
        results = []
        for filename, width, height, desc in created_files:
            success = print_test_label(filename)
            results.append((width, height, desc, success))
            
            if success:
                input(f"✅ {desc} ({width}x{height}mm) printed. Press Enter for next...")
            else:
                print(f"❌ {desc} ({width}x{height}mm) failed.")
        
        # Summary
        print(f"\n" + "="*60)
        print("TEST RESULTS SUMMARY")
        print("="*60)
        
        for width, height, desc, success in results:
            status = "✅ SUCCESS" if success else "❌ FAILED"
            print(f"{status}: {desc} ({width}x{height}mm)")
        
        print(f"\n💡 Recommendations:")
        print(f"  - Check which sizes printed clearly")
        print(f"  - Consider QR code readability")
        print(f"  - Choose size based on your label stock")
        
    else:
        print("Test cancelled. Files created but not printed.")
    
    print(f"\n📁 Created files:")
    for filename, _, _, _ in created_files:
        print(f"  - {filename}")

if __name__ == "__main__":
    main()
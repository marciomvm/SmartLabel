"""
Final comparison: Our method vs NiimPrintX method
"""
from PIL import Image, ImageOps
import math

def our_method(image_path):
    """Our corrected method"""
    img = Image.open(image_path).convert('L')
    
    # Resize to 384 if needed
    if img.width != 384:
        new_img = Image.new('L', (384, img.height), 255)
        x_offset = (384 - img.width) // 2
        new_img.paste(img, (x_offset, 0))
        img = new_img
    
    # Invert and convert to 1-bit
    img = ImageOps.invert(img).convert('1')
    pixels = list(img.getdata())
    
    # Process row 100
    row_bytes = bytearray(48)
    for col_byte in range(48):
        byte_val = 0
        for bit in range(8):
            pixel_idx = 100 * 384 + col_byte * 8 + bit
            if pixels[pixel_idx] == 255:  # CORRECTED: check for 255
                byte_val |= (1 << (7 - bit))
        row_bytes[col_byte] = byte_val
    
    return bytes(row_bytes)

def niimprintx_method(image_path):
    """Exact NiimPrintX method"""
    img = Image.open(image_path).convert('L')
    
    # Resize to 384 if needed
    if img.width != 384:
        new_img = Image.new('L', (384, img.height), 255)
        x_offset = (384 - img.width) // 2
        new_img.paste(img, (x_offset, 0))
        img = new_img
    
    # Invert and convert to 1-bit
    img = ImageOps.invert(img).convert('1')
    
    # Process row 100 (NiimPrintX way)
    line_data = [img.getpixel((x, 100)) for x in range(384)]
    line_data = "".join("0" if pix == 0 else "1" for pix in line_data)
    line_data = int(line_data, 2).to_bytes(math.ceil(384 / 8), "big")
    
    return line_data

if __name__ == "__main__":
    test_img = "label_G-20260130-TEST.png"
    
    print("=" * 60)
    print("🔬 FINAL COMPARISON TEST")
    print("=" * 60)
    
    our = our_method(test_img)
    niim = niimprintx_method(test_img)
    
    print(f"\n✅ Our method (row 100, first 20 bytes):")
    print(f"   {our[:20].hex()}")
    
    print(f"\n✅ NiimPrintX method (row 100, first 20 bytes):")
    print(f"   {niim[:20].hex()}")
    
    print(f"\n📊 RESULT:")
    if our == niim:
        print("   ✅✅✅ PERFECT MATCH! Methods are identical!")
    else:
        print("   ❌ Methods differ")
        print(f"   Difference at byte: {next((i for i, (a, b) in enumerate(zip(our, niim)) if a != b), -1)}")
    
    print("\n" + "=" * 60)

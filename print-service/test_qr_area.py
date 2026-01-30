"""
Test to check QR code area specifically
"""
from PIL import Image, ImageOps

def analyze_image(image_path):
    print("=" * 60)
    print("🔍 ANALYZING IMAGE")
    print("=" * 60)
    
    # Load original
    img_original = Image.open(image_path).convert('L')
    print(f"\n📐 Original image: {img_original.size}")
    
    # Check a pixel in QR code area (should be black)
    # QR code is at x=10-210, y=20-220
    qr_pixel = img_original.getpixel((50, 100))
    print(f"   Pixel at QR area (50, 100): {qr_pixel}")
    print(f"   Is black? {qr_pixel < 128}")
    
    # Method 1: Original (wrong)
    print("\n❌ METHOD 1: Original (no inversion)")
    img1 = img_original.point(lambda x: 0 if x < 128 else 255, '1')
    pixel1 = img1.getpixel((50, 100))
    print(f"   After conversion: {pixel1}")
    print(f"   0=black, 255=white in 1-bit mode")
    
    # Method 2: NiimPrintX (correct)
    print("\n✅ METHOD 2: NiimPrintX (with inversion)")
    img2 = ImageOps.invert(img_original).convert('1')
    pixel2 = img2.getpixel((50, 100))
    print(f"   After inversion+conversion: {pixel2}")
    
    # Check row 100 (middle of QR code)
    print("\n📊 ROW 100 ANALYSIS (middle of QR code):")
    
    # Original method
    img1 = img_original.point(lambda x: 0 if x < 128 else 255, '1')
    pixels1 = [img1.getpixel((x, 100)) for x in range(384)]
    black_count1 = sum(1 for p in pixels1 if p == 0)
    print(f"   Original method: {black_count1} black pixels")
    
    # NiimPrintX method
    img2 = ImageOps.invert(img_original).convert('1')
    pixels2 = [img2.getpixel((x, 100)) for x in range(384)]
    black_count2 = sum(1 for p in pixels2 if p == 0)
    print(f"   NiimPrintX method: {black_count2} black pixels")
    
    # Show first 50 pixels of row 100
    print(f"\n   First 50 pixels (original): {pixels1[:50]}")
    print(f"   First 50 pixels (inverted): {pixels2[:50]}")
    
    # Convert to bytes
    print("\n📦 BYTE CONVERSION (row 100, first 10 bytes):")
    
    # Original
    row_bytes1 = bytearray(48)
    for col_byte in range(48):
        byte_val = 0
        for bit in range(8):
            pixel_idx = col_byte * 8 + bit
            if pixels1[pixel_idx] == 0:
                byte_val |= (1 << (7 - bit))
        row_bytes1[col_byte] = byte_val
    print(f"   Original: {bytes(row_bytes1[:10]).hex()}")
    
    # Inverted
    row_bytes2 = bytearray(48)
    for col_byte in range(48):
        byte_val = 0
        for bit in range(8):
            pixel_idx = col_byte * 8 + bit
            if pixels2[pixel_idx] == 0:
                byte_val |= (1 << (7 - bit))
        row_bytes2[col_byte] = byte_val
    print(f"   Inverted: {bytes(row_bytes2[:10]).hex()}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    analyze_image("label_G-20260130-TEST.png")

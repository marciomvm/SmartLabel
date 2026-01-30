"""
Test to verify image inversion is working correctly
"""
from PIL import Image, ImageOps
import struct

def test_original_method(image_path):
    """Original method (WRONG - produces blank output)"""
    img = Image.open(image_path).convert('L')
    img = img.point(lambda x: 0 if x < 128 else 255, '1')
    pixels = list(img.getdata())
    
    # Check first row
    row_bytes = []
    for col_byte in range(48):  # 384/8 = 48 bytes per row
        byte_val = 0
        for bit in range(8):
            pixel_idx = col_byte * 8 + bit
            if pixels[pixel_idx] == 0:
                byte_val |= (1 << (7 - bit))
        row_bytes.append(byte_val)
    
    return bytes(row_bytes)

def test_niimprintx_method(image_path):
    """NiimPrintX method (CORRECT - with inversion)"""
    img = Image.open(image_path).convert('L')
    img = ImageOps.invert(img).convert('1')
    pixels = list(img.getdata())
    
    # Check first row
    row_bytes = []
    for col_byte in range(48):  # 384/8 = 48 bytes per row
        byte_val = 0
        for bit in range(8):
            pixel_idx = col_byte * 8 + bit
            if pixels[pixel_idx] == 0:
                byte_val |= (1 << (7 - bit))
        row_bytes.append(byte_val)
    
    return bytes(row_bytes)

if __name__ == "__main__":
    test_img = "label_G-20260130-TEST.png"
    
    print("=" * 60)
    print("🧪 IMAGE INVERSION TEST")
    print("=" * 60)
    
    # Test original
    print("\n❌ ORIGINAL METHOD (Wrong):")
    original = test_original_method(test_img)
    print(f"   First 20 bytes: {original[:20].hex()}")
    print(f"   All zeros? {all(b == 0 for b in original)}")
    print(f"   All 0xFF? {all(b == 0xFF for b in original)}")
    
    # Test NiimPrintX
    print("\n✅ NIIMPRINTX METHOD (Correct - with inversion):")
    niimprintx = test_niimprintx_method(test_img)
    print(f"   First 20 bytes: {niimprintx[:20].hex()}")
    print(f"   All zeros? {all(b == 0 for b in niimprintx)}")
    print(f"   All 0xFF? {all(b == 0xFF for b in niimprintx)}")
    
    # Compare
    print("\n📊 COMPARISON:")
    print(f"   Methods are different: {original != niimprintx}")
    print(f"   Original has data: {not all(b == 0 for b in original) and not all(b == 0xFF for b in original)}")
    print(f"   NiimPrintX has data: {not all(b == 0 for b in niimprintx) and not all(b == 0xFF for b in niimprintx)}")
    
    print("\n" + "=" * 60)
    print("✅ Test complete!")
    print("=" * 60)

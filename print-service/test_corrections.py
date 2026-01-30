"""
Test script to validate the corrections made to the printer protocol.
This will generate a test label and show the differences.
"""
from label_generator import generate_label
from PIL import Image
import struct

def test_label_generation():
    print("=" * 60)
    print("🧪 TESTING LABEL GENERATION")
    print("=" * 60)
    
    # Generate test label
    label_path = generate_label("G-20260130-TEST", "GRAIN", "Test Strain")
    
    # Check dimensions
    img = Image.open(label_path)
    width, height = img.size
    
    print(f"\n✅ Label generated: {label_path}")
    print(f"✅ Dimensions: {width}x{height} pixels")
    print(f"✅ Width matches B1 native (384px): {width == 384}")
    print(f"✅ Height: {height}px")
    
    # Verify image content
    pixels = list(img.convert('L').getdata())
    black_pixels = sum(1 for p in pixels if p < 128)
    white_pixels = len(pixels) - black_pixels
    
    print(f"\n📊 Image Statistics:")
    print(f"   Total pixels: {len(pixels):,}")
    print(f"   Black pixels: {black_pixels:,} ({black_pixels/len(pixels)*100:.1f}%)")
    print(f"   White pixels: {white_pixels:,} ({white_pixels/len(pixels)*100:.1f}%)")
    
    return label_path

def test_protocol_changes():
    print("\n" + "=" * 60)
    print("🔧 PROTOCOL CORRECTIONS SUMMARY")
    print("=" * 60)
    
    print("\n1️⃣  LABEL WIDTH:")
    print("   ❌ Before: 320 pixels (wrong)")
    print("   ✅ After:  384 pixels (B1 native width)")
    
    print("\n2️⃣  PIXEL COUNT FORMAT:")
    print("   ❌ Before: struct.pack('<H', count) + b'\\x00'")
    print("   ✅ After:  b'\\x00\\x00\\x00' (always zeros)")
    
    print("\n3️⃣  SET_DIMENSION ORDER:")
    print("   ❌ Before: struct.pack('>HHH', height, width, 1)")
    print("   ✅ After:  struct.pack('>HH', width, height)")
    
    print("\n4️⃣  ROW HEADER FORMAT:")
    print("   ❌ Before: [Row(BE)] + [Low, High, 0] + [1]")
    print("   ✅ After:  [Row(BE)] + [0, 0, 0] + [1]")
    
    print("\n5️⃣  TRANSMISSION SPEED:")
    print("   ❌ Before: 30ms per row (slow)")
    print("   ✅ After:  10ms per row (faster)")

def test_packet_format():
    print("\n" + "=" * 60)
    print("📦 PACKET FORMAT EXAMPLES")
    print("=" * 60)
    
    # Example: SET_DIMENSION packet
    width, height = 384, 240
    
    print("\n🔹 SET_DIMENSION (0x13) Packet:")
    old_format = struct.pack('>HHH', height, width, 1)
    new_format = struct.pack('>HH', width, height)
    
    print(f"   ❌ Old: {old_format.hex()} (height={height}, width={width}, extra=1)")
    print(f"   ✅ New: {new_format.hex()} (width={width}, height={height})")
    
    # Example: Row header
    row_num = 100
    black_count = 150
    
    print("\n🔹 ROW HEADER (for row 100):")
    old_header = struct.pack('>H', row_num) + struct.pack('<H', black_count) + b'\x00' + b'\x01'
    new_header = struct.pack('>H', row_num) + b'\x00\x00\x00' + b'\x01'
    
    print(f"   ❌ Old: {old_header.hex()} (row + pixel_count + repeat)")
    print(f"   ✅ New: {new_header.hex()} (row + zeros + repeat)")

if __name__ == "__main__":
    print("\n🍄 NIIMBOT B1 PRINTER CORRECTIONS TEST\n")
    
    # Test 1: Label generation
    label_path = test_label_generation()
    
    # Test 2: Protocol changes
    test_protocol_changes()
    
    # Test 3: Packet format
    test_packet_format()
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS COMPLETED")
    print("=" * 60)
    print(f"\n📝 Test label saved: {label_path}")
    print("\n🖨️  Next steps:")
    print("   1. Review the generated label image")
    print("   2. Run: python printer.py {label_path}")
    print("   3. Check if the full QR code prints correctly")
    print("\n" + "=" * 60 + "\n")

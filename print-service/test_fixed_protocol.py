"""
Test script to verify the fixed protocol implementation
Creates simple test patterns and prints them
"""
import asyncio
from PIL import Image, ImageDraw, ImageFont
import os

async def test_protocol():
    """Run comprehensive protocol tests"""
    
    print("=" * 60)
    print("NIIMBOT B1 PROTOCOL FIX - TEST SUITE")
    print("=" * 60)
    
    # Test 1: Create solid black rectangle
    print("\n[Test 1] Creating solid black test pattern...")
    img = Image.new('L', (384, 240), 0)  # Solid black
    img.save('test_solid_black.png')
    print("✅ Saved: test_solid_black.png")
    
    # Test 2: Create black and white stripes
    print("\n[Test 2] Creating stripe test pattern...")
    img = Image.new('L', (384, 240), 255)  # White background
    draw = ImageDraw.Draw(img)
    for i in range(0, 384, 40):
        draw.rectangle([i, 0, i+20, 240], fill=0)  # Black stripes
    img.save('test_stripes.png')
    print("✅ Saved: test_stripes.png")
    
    # Test 3: Create checkerboard
    print("\n[Test 3] Creating checkerboard test pattern...")
    img = Image.new('L', (384, 240), 255)
    draw = ImageDraw.Draw(img)
    square_size = 20
    for y in range(0, 240, square_size):
        for x in range(0, 384, square_size):
            if (x // square_size + y // square_size) % 2 == 0:
                draw.rectangle([x, y, x+square_size, y+square_size], fill=0)
    img.save('test_checkerboard.png')
    print("✅ Saved: test_checkerboard.png")
    
    # Test 4: Create text test
    print("\n[Test 4] Creating text test pattern...")
    img = Image.new('L', (384, 240), 255)
    draw = ImageDraw.Draw(img)
    try:
        # Try to use a larger font
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()
    
    draw.text((10, 100), "NIIMBOT B1", fill=0, font=font)
    draw.text((10, 150), "TEST PRINT", fill=0, font=font)
    img.save('test_text.png')
    print("✅ Saved: test_text.png")
    
    # Test 5: Verify existing label dimensions
    print("\n[Test 5] Checking existing label...")
    label_files = [f for f in os.listdir('.') if f.startswith('label_') and f.endswith('.png')]
    if label_files:
        label_file = label_files[0]
        img = Image.open(label_file)
        print(f"   Found: {label_file}")
        print(f"   Dimensions: {img.size}")
        if img.width == 384:
            print("   ✅ Width is correct (384px)")
        else:
            print(f"   ⚠️  Width is {img.width}px, will be padded to 384px")
    else:
        print("   ⚠️  No label files found")
    
    print("\n" + "=" * 60)
    print("TEST PATTERNS CREATED")
    print("=" * 60)
    print("\nNow test with printer:")
    print("  1. Simple test:  python printer_fixed.py test_solid_black.png")
    print("  2. Stripes:      python printer_fixed.py test_stripes.png")
    print("  3. Checkerboard: python printer_fixed.py test_checkerboard.png")
    print("  4. Text:         python printer_fixed.py test_text.png")
    if label_files:
        print(f"  5. Real label:   python printer_fixed.py {label_files[0]}")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_protocol())

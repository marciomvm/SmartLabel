"""
Test if B1 needs rotated images
Based on diagnostic: Variant 3 prints at top only
This suggests width/height are swapped in printer's interpretation
"""
import asyncio
from bleak import BleakScanner, BleakClient
from PIL import Image, ImageOps, ImageDraw
import struct
import math

SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

def make_packet(command: int, data: bytes = b'') -> bytes:
    length = len(data)
    payload = bytes([command, length]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    return b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'

def create_test_pattern():
    """Create a test pattern with text to verify orientation"""
    img = Image.new('L', (384, 240), 255)  # White background
    draw = ImageDraw.Draw(img)
    
    # Draw border
    draw.rectangle([0, 0, 383, 239], outline=0, width=5)
    
    # Draw text
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("arial.ttf", 30)
    except:
        font = ImageFont.load_default()
    
    draw.text((50, 100), "TOP", fill=0, font=font)
    
    # Draw arrow pointing up
    draw.polygon([(192, 50), (150, 100), (234, 100)], fill=0)
    
    return img

def process_image(img: Image, rotate=False):
    """Process image with optional rotation"""
    if rotate:
        print(f"🔄 Rotating image 90° clockwise")
        img = img.rotate(-90, expand=True)
    
    # Ensure correct width
    target_width = 384 if not rotate else 240
    if img.width != target_width:
        new_img = Image.new('L', (target_width, img.height), 255)
        x_offset = (target_width - img.width) // 2
        new_img.paste(img, (x_offset, 0))
        img = new_img
    
    width, height = img.size
    print(f"📐 Processed dimensions: {width}x{height}")
    
    # Invert and convert
    img = ImageOps.invert(img).convert('1')
    
    packets = []
    for y in range(height):
        line_data = [img.getpixel((x, y)) for x in range(width)]
        line_data = "".join("0" if pix == 0 else "1" for pix in line_data)
        line_bytes = int(line_data, 2).to_bytes(math.ceil(width / 8), "big")
        header = struct.pack(">H", y) + b'\x00\x00\x00' + b'\x01'
        pkt = make_packet(0x85, header + line_bytes)
        packets.append(pkt)
    
    return packets, width, height

async def test_rotation(client, packets, width, height, test_name):
    """Test printing with specific configuration"""
    print(f"\n{'='*60}")
    print(f"TESTING: {test_name}")
    print(f"{'='*60}")
    
    try:
        # Init (Variant 3 style - working)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xDC, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x21, b'\x03'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x23, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x01, b'\x01'), response=False)
        await asyncio.sleep(0.2)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x03, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        
        # Set dimension (height, width)
        print(f"📏 Dimension: height={height}, width={width}")
        await client.write_gatt_char(CHAR_UUID, make_packet(0x13, struct.pack('>HH', height, width)), response=False)
        await asyncio.sleep(0.1)
        
        # Set quantity
        await client.write_gatt_char(CHAR_UUID, make_packet(0x15, struct.pack('>H', 1)), response=False)
        await asyncio.sleep(0.1)
        
        # Send data
        print(f"📤 Sending {len(packets)} rows...")
        for i, pkt in enumerate(packets):
            await client.write_gatt_char(CHAR_UUID, pkt, response=False)
            await asyncio.sleep(0.01)
        
        print(f"✅ All rows sent")
        
        # Finalize
        await asyncio.sleep(0.5)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xE3, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xF3, b'\x01'), response=False)
        await asyncio.sleep(1.0)
        
        print(f"✅ {test_name} completed")
        return True
        
    except Exception as e:
        print(f"❌ {test_name} failed: {e}")
        return False

async def run_rotation_tests():
    """Test with and without rotation"""
    print("="*60)
    print("ROTATION TEST - Finding Correct Orientation")
    print("="*60)
    
    # Create test pattern
    print("\n📝 Creating test pattern with 'TOP' text and arrow...")
    img = create_test_pattern()
    img.save('test_orientation.png')
    print("✅ Saved: test_orientation.png")
    
    # Find printer
    print("\n🔍 Scanning for B1 printer...")
    devices = await BleakScanner.discover(timeout=5.0)
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    
    if not target:
        print("❌ B1 Not Found")
        return
    
    print(f"✅ Found: {target.name}")
    
    async with BleakClient(target.address, timeout=30.0) as client:
        print(f"✅ Connected")
        
        # Setup notifications
        def notification_handler(sender, data):
            pass  # Silent mode
        await client.start_notify(CHAR_UUID, notification_handler)
        
        # Test 1: Normal orientation (384x240)
        print("\n" + "="*60)
        print("TEST 1: Normal Orientation (384x240)")
        print("="*60)
        packets1, w1, h1 = process_image(img.copy(), rotate=False)
        await test_rotation(client, packets1, w1, h1, "Normal (384x240)")
        
        print("\n⏸️  Waiting 3 seconds...")
        await asyncio.sleep(3)
        
        # Test 2: Rotated 90° (240x384)
        print("\n" + "="*60)
        print("TEST 2: Rotated 90° Clockwise (240x384)")
        print("="*60)
        packets2, w2, h2 = process_image(img.copy(), rotate=True)
        await test_rotation(client, packets2, w2, h2, "Rotated 90° (240x384)")
        
        await client.stop_notify(CHAR_UUID)
        
        print("\n" + "="*60)
        print("INSTRUCTIONS:")
        print("="*60)
        print("Look at the 2 printed labels:")
        print("1. Which one shows 'TOP' text correctly oriented?")
        print("2. Which one has the arrow pointing up?")
        print("3. Which one fills the entire label area?")
        print("="*60)

if __name__ == "__main__":
    asyncio.run(run_rotation_tests())

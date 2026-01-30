"""
Test with native B1 label sizes
Based on diagnostic: Variant 3 worked but printed at top only
Try different actual label dimensions
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

def create_test_image(width, height):
    """Create test image with size info"""
    img = Image.new('L', (width, height), 255)
    draw = ImageDraw.Draw(img)
    
    # Draw border
    draw.rectangle([0, 0, width-1, height-1], outline=0, width=3)
    
    # Draw diagonal lines
    draw.line([(0, 0), (width-1, height-1)], fill=0, width=2)
    draw.line([(0, height-1), (width-1, 0)], fill=0, width=2)
    
    # Draw center cross
    draw.line([(width//2, 0), (width//2, height-1)], fill=0, width=2)
    draw.line([(0, height//2), (width-1, height//2)], fill=0, width=2)
    
    return img

def process_image(img: Image):
    """Process image - Variant 3 style"""
    width, height = img.size
    print(f"   Image: {width}x{height}")
    
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

async def test_size(client, width, height, test_name):
    """Test specific size"""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name} ({width}x{height})")
    print(f"{'='*60}")
    
    try:
        # Create test image
        img = create_test_image(width, height)
        packets, w, h = process_image(img)
        
        # Init (Variant 3 - working style)
        print("   Init...")
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
        
        # Set dimension (height, width) - Variant 3 format
        print(f"   Dimension: height={h}, width={w}")
        dim_pkt = make_packet(0x13, struct.pack('>HH', h, w))
        print(f"   Packet: {dim_pkt.hex()}")
        await client.write_gatt_char(CHAR_UUID, dim_pkt, response=False)
        await asyncio.sleep(0.1)
        
        # Set quantity
        await client.write_gatt_char(CHAR_UUID, make_packet(0x15, struct.pack('>H', 1)), response=False)
        await asyncio.sleep(0.1)
        
        # Send data
        print(f"   Sending {len(packets)} rows...")
        for pkt in packets:
            await client.write_gatt_char(CHAR_UUID, pkt, response=False)
            await asyncio.sleep(0.01)
        
        print(f"   ✅ Rows sent")
        
        # Finalize
        await asyncio.sleep(0.5)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xE3, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xF3, b'\x01'), response=False)
        await asyncio.sleep(1.0)
        
        print(f"   ✅ Completed")
        return True
        
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False

async def run_size_tests():
    """Test different label sizes"""
    print("="*60)
    print("NATIVE SIZE TEST - Finding Correct Dimensions")
    print("="*60)
    print("\nB1 supports multiple label sizes:")
    print("  - 15x30mm (approx 60x120 pixels at 203dpi)")
    print("  - 40x30mm (approx 160x120 pixels)")
    print("  - 50x30mm (approx 200x120 pixels)")
    print("  - 12x40mm (approx 48x160 pixels)")
    print("\nBut printer has 384 pixel printhead width")
    print("Let's test common configurations...")
    
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
        responses = []
        def notification_handler(sender, data):
            responses.append(data.hex())
            print(f"      🔔 {data.hex()}")
        await client.start_notify(CHAR_UUID, notification_handler)
        
        # Test different sizes
        test_configs = [
            # (width, height, description)
            (384, 240, "Original size - full width"),
            (384, 120, "Full width, half height"),
            (192, 240, "Half width, full height"),
            (240, 384, "Swapped dimensions"),
            (96, 240, "Quarter width (niim.blue style)"),
        ]
        
        for width, height, desc in test_configs:
            await test_size(client, width, height, desc)
            print(f"\n⏸️  Waiting 3 seconds before next test...")
            await asyncio.sleep(3)
        
        await client.stop_notify(CHAR_UUID)
        
        print("\n" + "="*60)
        print("INSTRUCTIONS:")
        print("="*60)
        print("Look at the 5 printed labels and tell me:")
        print("1. Which one(s) filled the entire label area?")
        print("2. Which one(s) showed the pattern correctly?")
        print("3. Any that looked correct but wrong size?")
        print("="*60)

if __name__ == "__main__":
    asyncio.run(run_size_tests())

"""
DIAGNOSTIC VERSION - Tests multiple protocol variations
Helps identify exactly what the B1 needs
"""
import asyncio
from bleak import BleakScanner, BleakClient
from PIL import Image, ImageOps
import struct
import math

SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

def make_packet(command: int, data: bytes = b'') -> bytes:
    """Create Niimbot protocol packet with checksum"""
    length = len(data)
    payload = bytes([command, length]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    return b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'

def create_simple_test_image():
    """Create a simple 384x240 black rectangle for testing"""
    img = Image.new('L', (384, 240), 0)  # Solid black
    return img

def process_image_niimprintx_style(img: Image):
    """Process image exactly like NiimPrintX does"""
    # Ensure 384px width
    if img.width != 384:
        new_img = Image.new('L', (384, img.height), 255)
        x_offset = (384 - img.width) // 2
        new_img.paste(img, (x_offset, 0))
        img = new_img
    
    width, height = img.size
    
    # Invert BEFORE 1-bit conversion
    img = ImageOps.invert(img).convert('1')
    
    packets = []
    for y in range(height):
        line_data = [img.getpixel((x, y)) for x in range(width)]
        line_data = "".join("0" if pix == 0 else "1" for pix in line_data)
        line_bytes = int(line_data, 2).to_bytes(math.ceil(width / 8), "big")
        
        # Header: row_number (2 bytes) + 3 zeros + repeat (1 byte)
        header = struct.pack(">H", y) + b'\x00\x00\x00' + b'\x01'
        pkt = make_packet(0x85, header + line_bytes)
        packets.append(pkt)
    
    return packets, width, height

async def test_variant(client, variant_name, init_func, dimension_func, packets, width, height, quantity=1):
    """Test a specific protocol variant"""
    print(f"\n{'='*60}")
    print(f"TESTING: {variant_name}")
    print(f"{'='*60}")
    
    try:
        # Initialization
        await init_func(client)
        
        # Set dimensions
        await dimension_func(client, width, height)
        
        # Set quantity
        await client.write_gatt_char(CHAR_UUID, make_packet(0x15, struct.pack('>H', quantity)), response=False)
        await asyncio.sleep(0.1)
        
        # Send image data
        print(f"Sending {len(packets)} rows...")
        for i, pkt in enumerate(packets):
            await client.write_gatt_char(CHAR_UUID, pkt, response=False)
            await asyncio.sleep(0.01)
            
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i+1}/{len(packets)}", end='\r')
        
        print(f"\n  ✅ All rows sent")
        
        # Finalization
        await asyncio.sleep(0.5)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xE3, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xF3, b'\x01'), response=False)
        await asyncio.sleep(1.0)
        
        print(f"  ✅ {variant_name} completed")
        return True
        
    except Exception as e:
        print(f"  ❌ {variant_name} failed: {e}")
        return False

# === INITIALIZATION VARIANTS ===

async def init_with_0xc1(client):
    """Init with 0xC1 command (used in many test files)"""
    print("  Init: 0xC1 + Heartbeat + Density + LabelType + StartPrint + StartPage")
    await client.write_gatt_char(CHAR_UUID, b'\x03' + make_packet(0xC1, b'\x01'), response=False)
    await asyncio.sleep(0.5)
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

async def init_niimprintx_style(client):
    """Init like NiimPrintX (no 0xC1)"""
    print("  Init: Heartbeat + Density + LabelType + StartPrint + StartPage")
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

# === DIMENSION VARIANTS ===

async def dimension_height_width(client, width, height):
    """SET_DIMENSION as (height, width) - NiimPrintX style"""
    print(f"  Dimension: HEIGHT, WIDTH = {height}, {width}")
    pkt = make_packet(0x13, struct.pack('>HH', height, width))
    print(f"  Packet: {pkt.hex()}")
    await client.write_gatt_char(CHAR_UUID, pkt, response=False)
    await asyncio.sleep(0.1)

async def dimension_width_height(client, width, height):
    """SET_DIMENSION as (width, height) - intuitive order"""
    print(f"  Dimension: WIDTH, HEIGHT = {width}, {height}")
    pkt = make_packet(0x13, struct.pack('>HH', width, height))
    print(f"  Packet: {pkt.hex()}")
    await client.write_gatt_char(CHAR_UUID, pkt, response=False)
    await asyncio.sleep(0.1)

async def run_diagnostics():
    """Run all diagnostic tests"""
    print("="*60)
    print("NIIMBOT B1 DIAGNOSTIC TEST SUITE")
    print("="*60)
    print("\nCreating test image (384x240 solid black)...")
    
    img = create_simple_test_image()
    packets, width, height = process_image_niimprintx_style(img)
    
    print(f"Image: {width}x{height} pixels")
    print(f"Packets: {len(packets)} rows")
    print(f"First packet sample: {packets[0][:20].hex()}...")
    
    # Find printer
    print("\nScanning for B1 printer...")
    devices = await BleakScanner.discover(timeout=5.0)
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    
    if not target:
        print("❌ B1 Not Found")
        return
    
    print(f"✅ Found: {target.name} ({target.address})")
    
    # Connect
    async with BleakClient(target.address, timeout=30.0) as client:
        print(f"✅ Connected to {target.name}")
        
        # Setup notification handler
        responses = []
        def notification_handler(sender, data):
            responses.append(data)
            print(f"    🔔 RX: {data.hex()}")
        
        await client.start_notify(CHAR_UUID, notification_handler)
        
        # Test variants
        variants = [
            ("Variant 1: 0xC1 + (height,width)", init_with_0xc1, dimension_height_width),
            ("Variant 2: 0xC1 + (width,height)", init_with_0xc1, dimension_width_height),
            ("Variant 3: NiimPrintX + (height,width)", init_niimprintx_style, dimension_height_width),
            ("Variant 4: NiimPrintX + (width,height)", init_niimprintx_style, dimension_width_height),
        ]
        
        results = {}
        for variant_name, init_func, dim_func in variants:
            result = await test_variant(client, variant_name, init_func, dim_func, packets, width, height)
            results[variant_name] = result
            
            # Wait between tests
            print("\n⏸️  Waiting 3 seconds before next test...")
            await asyncio.sleep(3)
        
        await client.stop_notify(CHAR_UUID)
        
        # Summary
        print("\n" + "="*60)
        print("TEST RESULTS SUMMARY")
        print("="*60)
        for variant_name, result in results.items():
            status = "✅ SUCCESS" if result else "❌ FAILED"
            print(f"{status}: {variant_name}")
        
        print("\n" + "="*60)
        print("INSTRUCTIONS:")
        print("="*60)
        print("1. Check which variant(s) printed correctly")
        print("2. Look at the physical output from the printer")
        print("3. Report back which variant worked (if any)")
        print("4. If none worked, we'll try more variations")
        print("="*60)

if __name__ == "__main__":
    asyncio.run(run_diagnostics())

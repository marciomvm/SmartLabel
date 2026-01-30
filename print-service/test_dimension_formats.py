"""
Test different SET_DIMENSION formats for different B1 firmware versions
"""
import asyncio
from bleak import BleakScanner, BleakClient
from PIL import Image, ImageOps
import struct

SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

def make_packet(command: int, data: bytes = b'') -> bytes:
    length = len(data)
    payload = bytes([command, length]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    return b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'

async def test_format(client, format_name, dimension_data, img_data):
    """Test a specific dimension format"""
    print(f"\n{'='*60}")
    print(f"Testing: {format_name}")
    print(f"Dimension data: {dimension_data.hex()}")
    print(f"{'='*60}")
    
    # Init
    await client.write_gatt_char(CHAR_UUID, b'\x03' + make_packet(0xC1, b'\x01'), response=False)
    await asyncio.sleep(0.3)
    await client.write_gatt_char(CHAR_UUID, make_packet(0xDC, b'\x01'), response=False)
    await asyncio.sleep(0.1)
    await client.write_gatt_char(CHAR_UUID, make_packet(0x21, b'\x05'), response=False)  # Max density
    await asyncio.sleep(0.1)
    await client.write_gatt_char(CHAR_UUID, make_packet(0x23, b'\x01'), response=False)
    await asyncio.sleep(0.1)
    await client.write_gatt_char(CHAR_UUID, make_packet(0x01, struct.pack('>H', 1) + b'\x00\x00\x00\x00\x00'), response=False)
    await asyncio.sleep(0.2)
    await client.write_gatt_char(CHAR_UUID, make_packet(0x03, b'\x01'), response=False)
    await asyncio.sleep(0.1)
    
    # SET_DIMENSION with test format
    await client.write_gatt_char(CHAR_UUID, make_packet(0x13, dimension_data), response=False)
    await asyncio.sleep(0.2)
    
    await client.write_gatt_char(CHAR_UUID, make_packet(0x15, struct.pack('>H', 1)), response=False)
    await asyncio.sleep(0.1)
    
    # Send image data (just first 50 rows for speed)
    print("Sending 50 rows...")
    for i in range(50):
        header = struct.pack('>H', i) + b'\x00\x00\x00' + b'\x01'
        pkt = make_packet(0x85, header + img_data[i])
        await client.write_gatt_char(CHAR_UUID, pkt, response=False)
        await asyncio.sleep(0.01)
    
    # Finish
    await asyncio.sleep(0.5)
    await client.write_gatt_char(CHAR_UUID, make_packet(0xE3, b'\x01'), response=False)
    await asyncio.sleep(0.3)
    await client.write_gatt_char(CHAR_UUID, make_packet(0xF3, b'\x01'), response=False)
    await asyncio.sleep(0.5)
    
    print(f"✅ {format_name} test sent!")

async def main():
    # Prepare image
    print("Preparing test image...")
    img = Image.open('label_G-20260130-TEST.png').convert('L')
    img = ImageOps.invert(img).convert('1')
    pixels = list(img.getdata())
    
    # Convert to rows
    rows = []
    for row in range(240):
        row_bytes = bytearray(48)
        for col_byte in range(48):
            byte_val = 0
            for bit in range(8):
                pixel_idx = row * 384 + col_byte * 8 + bit
                if pixels[pixel_idx] == 255:
                    byte_val |= (1 << (7 - bit))
            row_bytes[col_byte] = byte_val
        rows.append(bytes(row_bytes))
    
    # Find printer
    print("\nScanning for B1...")
    devices = await BleakScanner.discover(timeout=5.0)
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    if not target:
        print("❌ B1 Not Found")
        return
    
    print(f"Found: {target.name}")
    
    async with BleakClient(target.address, timeout=30.0) as client:
        print("Connected!")
        
        def notification_handler(sender, data):
            pass  # Silent
        
        await client.start_notify(CHAR_UUID, notification_handler)
        
        # Test different formats
        formats = [
            ("Format 1: width, height (NiimPrintX)", struct.pack('>HH', 384, 240)),
            ("Format 2: height, width", struct.pack('>HH', 240, 384)),
            ("Format 3: height only", struct.pack('>H', 240)),
            ("Format 4: width only", struct.pack('>H', 384)),
            ("Format 5: height, width, 1", struct.pack('>HHH', 240, 384, 1)),
        ]
        
        for i, (name, dim_data) in enumerate(formats):
            if i > 0:
                input(f"\nPress ENTER to test {name}...")
            await test_format(client, name, dim_data, rows)
        
        await client.stop_notify(CHAR_UUID)
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS COMPLETE")
        print("=" * 60)
        print("\nCheck which label printed correctly (if any)!")

if __name__ == "__main__":
    asyncio.run(main())

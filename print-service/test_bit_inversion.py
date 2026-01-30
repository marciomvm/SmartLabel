"""
Test if B1 expects inverted bits (1=white, 0=black instead of 1=black, 0=white)
"""
import asyncio
from bleak import BleakScanner, BleakClient
from PIL import Image
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

async def test_inverted_bits():
    print("Testing with INVERTED bits (1=white, 0=black)...")
    
    # Create simple image: white background with black rectangle
    img = Image.new('1', (384, 100), 1)  # 1 = white
    # Draw black rectangle in middle
    for y in range(30, 70):
        for x in range(100, 284):
            img.putpixel((x, y), 0)  # 0 = black
    
    # Convert to bytes WITH INVERTED LOGIC
    pixels = list(img.getdata())
    rows = []
    for row in range(100):
        row_bytes = bytearray(48)
        for col_byte in range(48):
            byte_val = 0
            for bit in range(8):
                pixel_idx = row * 384 + col_byte * 8 + bit
                # INVERTED: If pixel is WHITE (1), set bit to 1
                if pixels[pixel_idx] == 1:
                    byte_val |= (1 << (7 - bit))
            row_bytes[col_byte] = byte_val
        rows.append(bytes(row_bytes))
    
    print(f"Row 50 (middle of rectangle): {rows[50][:15].hex()}")
    print(f"Row 50 should have 0xFF in white areas, 0x00 in black rectangle")
    
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
        
        # Init sequence
        await client.write_gatt_char(CHAR_UUID, b'\x03' + make_packet(0xC1, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xDC, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x21, b'\x05'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x23, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x01, struct.pack('>H', 1) + b'\x00\x00\x00\x00\x00'), response=False)
        await asyncio.sleep(0.2)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x03, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x13, struct.pack('>HH', 384, 100)), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x15, struct.pack('>H', 1)), response=False)
        await asyncio.sleep(0.1)
        
        # Send rows
        print("Sending 100 rows with INVERTED bit logic...")
        for i, row_data in enumerate(rows):
            header = struct.pack('>H', i) + b'\x00\x00\x00' + b'\x01'
            pkt = make_packet(0x85, header + row_data)
            await client.write_gatt_char(CHAR_UUID, pkt, response=False)
            await asyncio.sleep(0.01)
        
        await asyncio.sleep(1.0)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xE3, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xF3, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        print("✅ Done! Check if black rectangle printed!")
        await client.stop_notify(CHAR_UUID)

if __name__ == "__main__":
    asyncio.run(test_inverted_bits())

"""
Replicate EXACTLY what niim.blue does
Based on the console log you provided
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

async def test_print():
    # Prepare image WITHOUT INVERSION
    print("Preparing image (no inversion, like niim.blue)...")
    img = Image.open('label_G-20260130-TEST.png').convert('L').convert('1')
    pixels = list(img.getdata())
    
    # Convert to rows
    rows = []
    for row in range(240):
        row_bytes = bytearray(48)
        for col_byte in range(48):
            byte_val = 0
            for bit in range(8):
                pixel_idx = row * 384 + col_byte * 8 + bit
                if pixels[pixel_idx] == 0:  # Black = bit 1
                    byte_val |= (1 << (7 - bit))
            row_bytes[col_byte] = byte_val
        rows.append(bytes(row_bytes))
    
    print(f"Image ready: 384x240")
    
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
            print(f"🔔 {data.hex()}")
        
        await client.start_notify(CHAR_UUID, notification_handler)
        
        print("\n🔧 Init sequence (niim.blue style)...")
        
        # Connect
        await client.write_gatt_char(CHAR_UUID, b'\x03' + make_packet(0xC1, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        # Heartbeat
        await client.write_gatt_char(CHAR_UUID, make_packet(0xDC, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        
        # Density
        await client.write_gatt_char(CHAR_UUID, make_packet(0x21, b'\x03'), response=False)
        await asyncio.sleep(0.1)
        
        # Label type
        await client.write_gatt_char(CHAR_UUID, make_packet(0x23, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        
        # Start print
        await client.write_gatt_char(CHAR_UUID, make_packet(0x01, struct.pack('>H', 1) + b'\x00\x00\x00\x00\x00'), response=False)
        await asyncio.sleep(0.2)
        
        # Start page
        await client.write_gatt_char(CHAR_UUID, make_packet(0x03, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        
        # SET_PAGE_SIZE (0x13) - NIIM.BLUE FORMAT!
        # Data: 00 f0 00 60 00 01
        # Which is: height=240 (0x00f0), width=96 (0x0060), something=1
        # Wait... width=96? That's 96 bytes = 768 pixels!
        # Actually looking closer: 00f0 = 240, 0060 = 96, 0001 = 1
        # Let me use 384 pixels = 48 bytes
        print("🔧 Setting page size (niim.blue format: height, width_bytes, 1)...")
        page_size_data = struct.pack('>HHH', 240, 48, 1)  # height, width_in_bytes, 1
        await client.write_gatt_char(CHAR_UUID, make_packet(0x13, page_size_data), response=False)
        await asyncio.sleep(0.2)
        
        # Send rows
        print("\n📤 Sending 240 rows (0x85 format - EXACT niim.blue)...")
        for i, row_data in enumerate(rows):
            # Count black pixels
            black_count = sum(bin(b).count('1') for b in row_data)
            
            # EXACT NIIM.BLUE FORMAT for 0x85:
            # Looking at their log: 55 55 85 12 00 6a 07 00 00 01 00 00 00 00 00 1f 00 06...
            # Breakdown: row(2) count(2) 00 00 repeat(1) then 48 bytes
            # But their count seems to be: 07 00 00 01 (not just pixel count)
            # Let me try: row(2) + count(1) + 00 00 01 + 48 bytes
            header = struct.pack('>HB', i, black_count & 0xFF) + b'\x00\x00\x01'
            pkt = make_packet(0x85, header + row_data)
            
            await client.write_gatt_char(CHAR_UUID, pkt, response=False)
            await asyncio.sleep(0.01)
            
            if (i+1) % 60 == 0:
                print(f"Progress: {i+1}/240")
        
        print("\n🏁 Finishing...")
        await asyncio.sleep(1.0)
        
        await client.write_gatt_char(CHAR_UUID, make_packet(0xE3, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        await client.write_gatt_char(CHAR_UUID, make_packet(0xF3, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        print("✅ Done!")
        await client.stop_notify(CHAR_UUID)

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TEST: NIIM.BLUE PROTOCOL")
    print("=" * 60)
    print("\nReplicating exactly what niim.blue does.\n")
    
    asyncio.run(test_print())

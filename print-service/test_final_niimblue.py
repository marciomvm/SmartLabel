"""
FINAL TEST - Exact niim.blue protocol
Analyzing their packet structure carefully
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
    print("Preparing image...")
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
                if pixels[pixel_idx] == 0:
                    byte_val |= (1 << (7 - bit))
            row_bytes[col_byte] = byte_val
        rows.append(bytes(row_bytes))
    
    print(f"Image ready: 384x240")
    print(f"Row 100 sample: {rows[100][:10].hex()}")
    
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
        
        print("\n🔧 Init...")
        await client.write_gatt_char(CHAR_UUID, b'\x03' + make_packet(0xC1, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        await client.write_gatt_char(CHAR_UUID, make_packet(0xDC, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x21, b'\x03'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x23, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x01, b'\x00\x01\x00\x00\x00\x00\x00'), response=False)
        await asyncio.sleep(0.2)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x03, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        
        # SET_PAGE_SIZE - EXACT niim.blue format: 00 f0 00 60 00 01
        # 00f0 = 240 (height), 0060 = 96 (??), 0001 = 1
        print("🔧 Setting page size (EXACT niim.blue: 00 f0 00 60 00 01)...")
        await client.write_gatt_char(CHAR_UUID, make_packet(0x13, b'\x00\xf0\x00\x60\x00\x01'), response=False)
        await asyncio.sleep(0.2)
        
        # Send rows
        print("\n📤 Sending rows...")
        for i, row_data in enumerate(rows):
            # Niim.blue packet analysis:
            # 55 55 85 12 00 6a 07 00 00 01 00 00 00 00 00 1f 00 06...
            #           ^^ ^^^^^ ^^^^^^^^^^  ^^^ [12 more bytes of data shown]
            #           18 row   ???         rep
            # Length 0x12 = 18 bytes of header/data after length byte
            # So: row(2) + something(10) + data(6 shown, but actually 48 total?)
            
            # Let me try simpler: row(2) + count(2) + 00 00 + repeat(1) + padding + data
            black_count = sum(bin(b).count('1') for b in row_data)
            
            # Try format: row(2) + count(1) + 00 00 01 + 00 00 00 00 + data(48)
            header = struct.pack('>HB', i, black_count & 0xFF) + b'\x00\x00\x01' + b'\x00\x00\x00\x00'
            full_data = header + row_data
            
            pkt = make_packet(0x85, full_data)
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
        
        print("✅ Done! Check the label!")
        await client.stop_notify(CHAR_UUID)

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 FINAL TEST - NIIM.BLUE EXACT PROTOCOL")
    print("=" * 60 + "\n")
    
    asyncio.run(test_print())

"""
Test with ALLOW_PRINT_CLEAR command (0x20)
This might be required for some B1 firmware versions
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
        
        print("\n🔧 Init sequence WITH ALLOW_PRINT_CLEAR...")
        
        # Connect
        await client.write_gatt_char(CHAR_UUID, b'\x03' + make_packet(0xC1, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        # Heartbeat
        await client.write_gatt_char(CHAR_UUID, make_packet(0xDC, b'\x01'), response=False)
        await asyncio.sleep(0.1)
        
        # ALLOW_PRINT_CLEAR (0x20) - MISSING COMMAND!
        print("🔧 Sending ALLOW_PRINT_CLEAR (0x20)...")
        await client.write_gatt_char(CHAR_UUID, make_packet(0x20, b'\x01'), response=False)
        await asyncio.sleep(0.2)
        
        # Density
        await client.write_gatt_char(CHAR_UUID, make_packet(0x21, b'\x05'), response=False)
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
        
        # Dimension (height only)
        await client.write_gatt_char(CHAR_UUID, make_packet(0x13, struct.pack('>H', 240)), response=False)
        await asyncio.sleep(0.2)
        
        # Quantity
        await client.write_gatt_char(CHAR_UUID, make_packet(0x15, struct.pack('>H', 1)), response=False)
        await asyncio.sleep(0.1)
        
        # Send rows
        print("\n📤 Sending 240 rows...")
        for i, row_data in enumerate(rows):
            header = struct.pack('>H', i) + b'\x00\x00\x00' + b'\x01'
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
    print("🧪 TEST: WITH ALLOW_PRINT_CLEAR (0x20)")
    print("=" * 60)
    print("\nThis command might be required for your B1 firmware.\n")
    
    asyncio.run(test_print())

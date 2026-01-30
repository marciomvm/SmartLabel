import asyncio
from bleak import BleakScanner, BleakClient
import struct

# NIIMBOT B1 BLE UUIDs
SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

PRINTHEAD_PIXELS = 384

def make_packet(command: int, data: bytes = b'') -> bytes:
    length = len(data)
    payload = bytes([command, length]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    return b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'

async def send_packet(client, packet, delay=0.0):
    await client.write_gatt_char(CHAR_UUID, packet, response=False)
    if delay > 0:
        await asyncio.sleep(delay)

def notification_handler(sender, data):
    print(f"   << {data.hex()}")

def generate_test_pattern_row(row_idx, width=384):
    """
    Generates a row of bytes.
    We will create 4 bands of 60 lines each.
    """
    row_bytes = bytearray(width // 8)
    
    # Band 1 (Lines 0-59): 0xFF (All 1s) - Should be BLACK if 1=Black
    if 0 <= row_idx < 60:
        for i in range(len(row_bytes)):
            row_bytes[i] = 0xFF
            
    # Band 2 (Lines 60-119): 0x00 (All 0s) - Should be BLACK if 0=Black
    elif 60 <= row_idx < 120:
        for i in range(len(row_bytes)):
            row_bytes[i] = 0x00
            
    # Band 3 (Lines 120-179): 0xAA (10101010) - Stripe pattern
    elif 120 <= row_idx < 180:
        for i in range(len(row_bytes)):
            row_bytes[i] = 0xAA
            
    # Band 4 (Lines 180-239): 0x55 (01010101) - Inverse stripe
    elif 180 <= row_idx < 240:
        for i in range(len(row_bytes)):
            row_bytes[i] = 0x55
            
    return bytes(row_bytes)

def count_pixels(row_data):
    """Count set bits (1s) in split mode"""
    chunk_size = PRINTHEAD_PIXELS // 8 // 3
    parts = [0, 0, 0]
    for byte_idx, byte_val in enumerate(row_data):
        chunk_idx = min(byte_idx // chunk_size, 2)
        parts[chunk_idx] += bin(byte_val).count('1')
    return parts

async def print_pattern_test():
    print("Scaning for B1...")
    devices = await BleakScanner.discover()
    target = None
    for d in devices:
        if d.name and "B1" in d.name:
            target = d
            break
            
    if not target:
        print("❌ B1 not found")
        return

    async with BleakClient(target.address, timeout=15.0) as client:
        print("Connected!")
        await client.start_notify(CHAR_UUID, notification_handler)
        await asyncio.sleep(0.5)
        
        # Init sequence
        print("Sending Init...")
        await send_packet(client, b'\x03' + make_packet(0xC1, bytes([1])), delay=0.2) # Connect
        await send_packet(client, make_packet(0x21, bytes([3])), delay=0.1) # Density
        await send_packet(client, make_packet(0x23, bytes([1])), delay=0.1) # LabelType
        await send_packet(client, make_packet(0x01, struct.pack('>H', 1) + bytes(5)), delay=0.2) # PrintStart
        await send_packet(client, make_packet(0x03, bytes([1])), delay=0.1) # PageStart
        
        height = 240
        await send_packet(client, make_packet(0x13, struct.pack('>HH', height, 384)), delay=0.1) # PageSize
        await send_packet(client, make_packet(0x15, struct.pack('>H', 1)), delay=0.1) # Quantity
        
        print("Sending 4 Test Bands...")
        print("1. All 1s (0xFF)")
        print("2. All 0s (0x00)")
        print("3. Stripe (0xAA)")
        print("4. Stripe (0x55)")
        
        for i in range(height):
            row = generate_test_pattern_row(i)
            
            row_num = struct.pack('>H', i)
            pixel_counts = bytes(count_pixels(row))
            repeat = bytes([1])
            
            packet = make_packet(0x85, row_num + pixel_counts + repeat + row)
            await client.write_gatt_char(CHAR_UUID, packet, response=False)
            await asyncio.sleep(0.005)
            
            if i % 60 == 0:
                print(f"   Band {i//60 + 1}...")

        await asyncio.sleep(0.5)
        await send_packet(client, make_packet(0xE3, bytes([1])), delay=0.5) # PageEnd
        await send_packet(client, make_packet(0xF3, bytes([1])), delay=0.5) # PrintEnd
        
        print("✅ Done!")

if __name__ == "__main__":
    asyncio.run(print_pattern_test())

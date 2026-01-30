"""
WORKING VERSION - Based on niim.blue protocol analysis
This should print correctly!
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

def process_image(image_path: str):
    """Process image for B1 printer - 96 pixels wide!"""
    img = Image.open(image_path).convert('L')
    
    # B1 actually uses 96 pixels width (12 bytes), not 384!
    TARGET_WIDTH = 96
    if img.width != TARGET_WIDTH:
        # Resize to 96 pixels
        ratio = TARGET_WIDTH / img.width
        new_height = int(img.height * ratio)
        img = img.resize((TARGET_WIDTH, new_height), Image.Resampling.LANCZOS)
    
    # Convert to 1-bit (NO INVERSION for B1)
    img = img.convert('1')
    pixels = list(img.getdata())
    
    width, height = img.size
    rows = []
    
    for row in range(height):
        row_bytes = bytearray(12)  # 96 / 8 = 12 bytes
        for col_byte in range(12):
            byte_val = 0
            for bit in range(8):
                pixel_idx = row * width + col_byte * 8 + bit
                # Black pixel (0) = bit 1
                if pixels[pixel_idx] == 0:
                    byte_val |= (1 << (7 - bit))
            row_bytes[col_byte] = byte_val
        rows.append(bytes(row_bytes))
    
    return rows, width, height

async def send_packet(client, packet, delay=0.0):
    await client.write_gatt_char(CHAR_UUID, packet, response=False)
    if delay > 0:
        await asyncio.sleep(delay)

async def print_label_ble(image_path: str, quantity: int = 1):
    rows, width, height = process_image(image_path)
    print(f"Printing: {width}x{height} pixels...")
    
    devices = await BleakScanner.discover(timeout=5.0)
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    if not target:
        return print("❌ B1 Not Found")
    
    try:
        async with BleakClient(target.address, timeout=30.0) as client:
            print(f"Connected to {target.name}")
            
            def notification_handler(sender, data):
                print(f"🔔 RX: {data.hex()}")
            
            await client.start_notify(CHAR_UUID, notification_handler)
            print("Listening for printer feedback...")
            
            # Init sequence
            await send_packet(client, b'\x03' + make_packet(0xC1, b'\x01'), 0.5)
            await send_packet(client, make_packet(0xDC, b'\x01'), 0.1)
            await send_packet(client, make_packet(0x21, b'\x03'), 0.1)  # Density 3
            await send_packet(client, make_packet(0x23, b'\x01'), 0.1)  # Label Type 1
            await send_packet(client, make_packet(0x01, b'\x00\x01\x00\x00\x00\x00\x00'), 0.2)
            await send_packet(client, make_packet(0x03, b'\x01'), 0.1)
            
            # SET_PAGE_SIZE - niim.blue format
            await send_packet(client, make_packet(0x13, b'\x00\xf0\x00\x60\x00\x01'), 0.1)
            
            # Send rows
            print("Sending rows...")
            for i, row_data in enumerate(rows):
                # Niim.blue format: 18-byte header + 12 bytes data
                black_count = sum(bin(b).count('1') for b in row_data)
                
                # Build 18-byte header
                header = struct.pack('>HB', i, black_count & 0xFF) + b'\x00\x00\x01'
                # Add 12 more bytes to complete 18-byte header
                header += b'\x00' * 12
                
                # Create packet: length=18 (header only), then header + 12 bytes data
                command = 0x85
                length = 18  # Only header length
                payload = bytes([command, length]) + header + row_data  # row_data is now 12 bytes
                checksum = 0
                for b in payload:
                    checksum ^= b
                pkt = b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'
                
                await client.write_gatt_char(CHAR_UUID, pkt, response=False)
                await asyncio.sleep(0.01)
                
                if (i+1) % 60 == 0:
                    print(f"Progress: {i+1}/{height} rows", end='\r')
            
            print("\nRow transmission done. Waiting for print head...")
            await asyncio.sleep(1.0)
            
            await send_packet(client, make_packet(0xE3, b'\x01'), 0.5)
            await send_packet(client, make_packet(0xF3, b'\x01'), 0.5)
            
            print("✅ Label finished!")
            await client.stop_notify(CHAR_UUID)
            return True
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    import sys
    img = sys.argv[1] if len(sys.argv) > 1 else "label_G-20260130-TEST.png"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    asyncio.run(print_label_ble(img, n))

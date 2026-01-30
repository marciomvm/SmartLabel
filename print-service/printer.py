import asyncio
from bleak import BleakScanner, BleakClient
from PIL import Image, ImageOps
import struct

# NIIMBOT B1 BLE UUIDs
SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

def make_packet(command: int, data: bytes = b'') -> bytes:
    length = len(data)
    payload = bytes([command, length]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    return b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'

def count_pixels_b1(total_count: int):
    # B1 protocol: Always send zeros for pixel count (verified from NiimPrintX)
    # The printer doesn't actually use these values
    return b'\x00\x00\x00'

def process_image(image_path: str):
    img = Image.open(image_path).convert('L')
    
    # FORCE 384 PIXELS WIDTH (Native B1 width)
    TARGET_WIDTH = 384
    if img.width != TARGET_WIDTH:
        # If image is not 384px wide, center it with white padding
        new_img = Image.new('L', (TARGET_WIDTH, img.height), 255)
        x_offset = (TARGET_WIDTH - img.width) // 2
        new_img.paste(img, (x_offset, 0))
        img = new_img
        print(f"⚠️  Image resized from {Image.open(image_path).width}px to {TARGET_WIDTH}px")

    width, height = img.size
    
    # CRITICAL: Invert image BEFORE converting to 1-bit (like NiimPrintX does)
    # This is necessary for the B1 thermal printer protocol
    img = ImageOps.invert(img).convert('1')
    
    rows = []
    pixels = list(img.getdata())
    
    for row in range(height):
        row_bytes = bytearray(width // 8)
        black_count = 0
        for col_byte in range(width // 8):
            byte_val = 0
            for bit in range(8):
                pixel_idx = row * width + col_byte * 8 + bit
                # NiimPrintX logic: "0" if pixel == 0, else "1"
                # After inversion: 0 = what was white (don't print), 255 = what was black (print)
                # So we set bit to 1 when pixel is 255 (was black in original)
                if pixels[pixel_idx] == 255:
                    byte_val |= (1 << (7 - bit))
                    black_count += 1
            row_bytes[col_byte] = byte_val
        rows.append((bytes(row_bytes), black_count))
        
    return rows, width, height

async def send_packet(client, packet, delay=0.0):
    # print(f"TX: {packet.hex()}") # Debug print
    await client.write_gatt_char(CHAR_UUID, packet, response=False)
    if delay > 0: await asyncio.sleep(delay)

async def print_label_ble(image_path: str, quantity: int = 1):
    rows, width, height = process_image(image_path)
    print(f"Printing: {width}x{height} pixels (Forced 384px)...")

    devices = await BleakScanner.discover(timeout=5.0)
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    if not target: return print("❌ B1 Not Found")
        
    try:
        async with BleakClient(target.address, timeout=30.0) as client:
            print(f"Connected to {target.name}")
            
            # --- NOTIFICATION HANDLER (SPY MODE) ---
            def notification_handler(sender, data):
                print(f"🔔 RX: {data.hex()}")
            
            await client.start_notify(CHAR_UUID, notification_handler)
            print("Listening for printer feedback...")

            # --- Handshake ---
            await send_packet(client, b'\x03' + make_packet(0xC1, b'\x01'), 0.5)
            await send_packet(client, make_packet(0xDC, b'\x01'), 0.1) # Heartbeat
            await send_packet(client, make_packet(0x21, b'\x03'), 0.1) # Density 3
            await send_packet(client, make_packet(0x23, b'\x01'), 0.1) # Label Type 1
            await send_packet(client, make_packet(0x01, struct.pack('>H', quantity) + b'\x00\x00\x00\x00\x00'), 0.2)
            await send_packet(client, make_packet(0x03, b'\x01'), 0.1)
            # SET_DIMENSION: width first, then height (corrected order)
            await send_packet(client, make_packet(0x13, struct.pack('>HH', width, height)), 0.1)
            await send_packet(client, make_packet(0x15, struct.pack('>H', quantity)), 0.1)
            
            # --- Data Transmission ---
            print("Sending rows (0x85 BITMAP with corrected format)...")
            
            for i, (row_data, black_count) in enumerate(rows):
                # ALWAYS use 0x85 (Bitmap Row) even for empty lines
                # Header format: [Row Number (2 bytes BE)] + [0,0,0] + [Repeat=1]
                # The pixel count is always zeros (verified from NiimPrintX)
                header = struct.pack('>H', i) + b'\x00\x00\x00' + b'\x01'
                pkt = make_packet(0x85, header + row_data)
                
                await client.write_gatt_char(CHAR_UUID, pkt, response=False)

                # Flow Control: 10ms per row (faster and more reliable)
                await asyncio.sleep(0.01)

                # Progress indicator every 50 rows
                if (i+1) % 50 == 0:
                    print(f"Progress: {i+1}/{height} rows", end='\r')

            print("\nRow transmission done. Waiting for print head...")
            await asyncio.sleep(1.0)
            
            await send_packet(client, make_packet(0xE3, b'\x01'), 0.5) # PageEnd
            await send_packet(client, make_packet(0xF3, b'\x01'), 0.5) # PrintEnd
            
            print("✅ Label finished!")
            await client.stop_notify(CHAR_UUID)
            return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    import sys
    img = sys.argv[1] if len(sys.argv) > 1 else "test_black.png"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    asyncio.run(print_label_ble(img, n))

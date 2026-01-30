"""
FIXED VERSION - Based on NiimPrintX working implementation
Key fixes:
1. SET_DIMENSION is (HEIGHT, WIDTH) not (width, height)!
2. Image inversion BEFORE 1-bit conversion
3. Bit encoding: 0=black (print), 1=white (don't print)
4. Proper header format with 3 zero bytes
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

def process_image(image_path: str):
    """
    Process image for B1 printer following NiimPrintX protocol
    Returns: (packets, width, height)
    """
    img = Image.open(image_path).convert('L')
    
    # B1 native width is 384 pixels
    TARGET_WIDTH = 384
    if img.width != TARGET_WIDTH:
        # Center image with white padding
        new_img = Image.new('L', (TARGET_WIDTH, img.height), 255)
        x_offset = (TARGET_WIDTH - img.width) // 2
        new_img.paste(img, (x_offset, 0))
        img = new_img
        print(f"⚠️  Image centered: {Image.open(image_path).width}px → {TARGET_WIDTH}px")
    
    width, height = img.size
    
    # CRITICAL: Invert BEFORE converting to 1-bit (like NiimPrintX does)
    # This makes black pixels = 0, white pixels = 255 in grayscale
    # Then 1-bit conversion: 0 = black (print), 1 = white (don't print)
    img = ImageOps.invert(img).convert('1')
    
    packets = []
    for y in range(height):
        # Get pixel data for this row
        line_data = [img.getpixel((x, y)) for x in range(width)]
        # Convert to binary string: "0" if pixel == 0 (black/print), "1" if pixel != 0 (white/don't print)
        line_data = "".join("0" if pix == 0 else "1" for pix in line_data)
        # Convert binary string to bytes
        line_bytes = int(line_data, 2).to_bytes(math.ceil(width / 8), "big")
        
        # Header: row_number (2 bytes) + 3 zero bytes + repeat count (1 byte)
        # This matches NiimPrintX exactly: struct.pack(">H3BB", y, 0, 0, 0, 1)
        header = struct.pack(">H", y) + b'\x00\x00\x00' + b'\x01'
        
        # Create packet for this row (command 0x85 = BITMAP_ROW)
        pkt = make_packet(0x85, header + line_bytes)
        packets.append(pkt)
    
    return packets, width, height

async def send_packet(client, packet, delay=0.0):
    """Send packet to printer with optional delay"""
    await client.write_gatt_char(CHAR_UUID, packet, response=False)
    if delay > 0:
        await asyncio.sleep(delay)

async def print_label_ble(image_path: str, quantity: int = 1):
    """Print label on Niimbot B1 using correct protocol"""
    packets, width, height = process_image(image_path)
    print(f"Printing: {width}x{height} pixels ({len(packets)} rows)...")
    
    devices = await BleakScanner.discover(timeout=5.0)
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    if not target:
        return print("❌ B1 Not Found")
    
    try:
        async with BleakClient(target.address, timeout=30.0) as client:
            print(f"Connected to {target.name}")
            
            # Optional: Listen for printer responses
            def notification_handler(sender, data):
                print(f"🔔 RX: {data.hex()}")
            
            await client.start_notify(CHAR_UUID, notification_handler)
            print("Listening for printer feedback...")
            
            # === INITIALIZATION SEQUENCE (from NiimPrintX) ===
            
            # Heartbeat
            await send_packet(client, make_packet(0xDC, b'\x01'), 0.1)
            
            # Set label density (1-5, default 3)
            await send_packet(client, make_packet(0x21, b'\x03'), 0.1)
            
            # Set label type (1=gap label, 2=black mark, 3=continuous)
            await send_packet(client, make_packet(0x23, b'\x01'), 0.1)
            
            # Start print job
            await send_packet(client, make_packet(0x01, b'\x01'), 0.2)
            
            # Start page
            await send_packet(client, make_packet(0x03, b'\x01'), 0.1)
            
            # CRITICAL: SET_DIMENSION is (HEIGHT, WIDTH) not (width, height)!
            # This is the opposite of what was "corrected" before
            await send_packet(client, make_packet(0x13, struct.pack('>HH', height, width)), 0.1)
            
            # Set quantity
            await send_packet(client, make_packet(0x15, struct.pack('>H', quantity)), 0.1)
            
            # === SEND IMAGE DATA ===
            print("Sending image data...")
            for i, pkt in enumerate(packets):
                await client.write_gatt_char(CHAR_UUID, pkt, response=False)
                # Small delay to avoid overwhelming the printer buffer
                await asyncio.sleep(0.01)
                
                if (i + 1) % 50 == 0:
                    print(f"Progress: {i+1}/{len(packets)} rows", end='\r')
            
            print(f"\n✅ All {len(packets)} rows sent!")
            
            # === FINALIZATION SEQUENCE ===
            await asyncio.sleep(0.5)
            
            # End page
            await send_packet(client, make_packet(0xE3, b'\x01'), 0.5)
            
            # End print job
            await send_packet(client, make_packet(0xF3, b'\x01'), 0.5)
            
            print("✅ Print job completed!")
            await client.stop_notify(CHAR_UUID)
            return True
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import sys
    img = sys.argv[1] if len(sys.argv) > 1 else "label_G-20260130-TEST.png"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    asyncio.run(print_label_ble(img, n))

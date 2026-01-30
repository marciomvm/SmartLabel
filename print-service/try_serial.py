import asyncio
from bleak import BleakScanner, BleakClient
from PIL import Image
import struct

# Try the alternative service (Serial over BLE)
# This one has separate write and notify characteristics
SERVICE_UUID = "49535343-fe7d-4ae5-8fa9-9fafd205e455"
CHAR_WRITE = "49535343-8841-43f4-a8d4-ecbe34729bb3"  # write
CHAR_NOTIFY = "49535343-1e4d-4bd9-ba61-23c647249616"  # notify

def make_packet(command: int, data: bytes = b'') -> bytes:
    length = len(data)
    payload = bytes([command, length]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    return b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'

def notification_handler(sender, data):
    print(f"   << {data.hex()}")

def image_to_rows(image_path: str, width: int = 384):
    img = Image.open(image_path).convert('L')
    ratio = width / img.width
    new_height = int(img.height * ratio)
    img = img.resize((width, new_height), Image.Resampling.LANCZOS)
    img = img.point(lambda x: 0 if x < 128 else 255, '1')
    
    rows = []
    pixels = list(img.getdata())
    for row in range(img.height):
        row_bytes = []
        for col_byte in range(img.width // 8):
            byte_val = 0
            for bit in range(8):
                pixel_idx = row * img.width + col_byte * 8 + bit
                if pixels[pixel_idx] == 0:
                    byte_val |= (1 << (7 - bit))
            row_bytes.append(byte_val)
        rows.append(bytes(row_bytes))
    return rows, img.height

async def print_via_serial(image_path: str):
    print("=== TRYING SERIAL SERVICE ===")
    print("Scanning...")
    
    devices = await BleakScanner.discover(timeout=5.0)
    target = None
    for d in devices:
        if d.name and "B1" in d.name:
            target = d
            break
    
    if not target:
        print("❌ B1 not found!")
        return
    
    print(f"✅ Found: {target.name}")
    
    try:
        async with BleakClient(target.address, timeout=20.0) as client:
            print("Connected!")
            
            # Enable notifications
            await client.start_notify(CHAR_NOTIFY, notification_handler)
            await asyncio.sleep(0.3)
            
            rows, height = image_to_rows(image_path, 384)
            print(f"Image: {len(rows)} rows")
            
            # Connect
            print("Connect...")
            await client.write_gatt_char(CHAR_WRITE, b'\x03' + make_packet(0xC1, bytes([1])))
            await asyncio.sleep(0.3)
            
            # SetDensity
            print("Density...")
            await client.write_gatt_char(CHAR_WRITE, make_packet(0x21, bytes([3])))
            await asyncio.sleep(0.1)
            
            # SetLabelType
            print("LabelType...")
            await client.write_gatt_char(CHAR_WRITE, make_packet(0x23, bytes([1])))
            await asyncio.sleep(0.1)
            
            # PrintStart
            print("PrintStart...")
            start_data = struct.pack('>H', 1) + bytes([0, 0, 0, 0, 0])
            await client.write_gatt_char(CHAR_WRITE, make_packet(0x01, start_data))
            await asyncio.sleep(0.2)
            
            # PageStart
            print("PageStart...")
            await client.write_gatt_char(CHAR_WRITE, make_packet(0x03, bytes([1])))
            await asyncio.sleep(0.1)
            
            # SetPageSize
            print("PageSize...")
            await client.write_gatt_char(CHAR_WRITE, make_packet(0x13, struct.pack('>HH', height, 384)))
            await asyncio.sleep(0.1)
            
            # Send rows
            print(f"Sending {len(rows)} rows...")
            for i, row in enumerate(rows):
                row_num = struct.pack('>H', i)
                row_data = row_num + bytes([0, 0, 0, 1]) + row
                await client.write_gatt_char(CHAR_WRITE, make_packet(0x85, row_data), response=False)
                await asyncio.sleep(0.01)
                if (i + 1) % 50 == 0:
                    print(f"   {i+1}/{len(rows)}")
            
            await asyncio.sleep(0.5)
            
            # PageEnd
            print("PageEnd...")
            await client.write_gatt_char(CHAR_WRITE, make_packet(0xE3, bytes([1])))
            await asyncio.sleep(0.3)
            
            # PrintEnd
            print("PrintEnd...")
            await client.write_gatt_char(CHAR_WRITE, make_packet(0xF3, bytes([1])))
            await asyncio.sleep(0.5)
            
            await client.stop_notify(CHAR_NOTIFY)
            print("✅ Done!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    img = sys.argv[1] if len(sys.argv) > 1 else "test_black.png"
    asyncio.run(print_via_serial(img))

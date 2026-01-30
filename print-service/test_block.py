import asyncio
from bleak import BleakScanner, BleakClient
import struct

# NIIMBOT B1 BLE UUIDs
SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

PRINTHEAD_PIXELS = 384
HEIGHT = 240

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

async def run_test():
    print("Scanning...")
    devices = await BleakScanner.discover()
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    if not target:
        print("❌ B1 Not Found")
        return

    async with BleakClient(target.address, timeout=15) as client:
        print("Connected!")
        await client.start_notify(CHAR_UUID, notification_handler)
        await asyncio.sleep(0.5)

        # Init
        print("Sending Init...")
        await send_packet(client, b'\x03' + make_packet(0xC1, bytes([1])), delay=0.2)
        await send_packet(client, make_packet(0x21, bytes([5])), delay=0.1)  # Max Density
        await send_packet(client, make_packet(0x23, bytes([1])), delay=0.1)  # Label Type 1
        
        # Start
        await send_packet(client, make_packet(0x01, struct.pack('>H', 1) + bytes(5)), delay=0.2)
        await send_packet(client, make_packet(0x03, bytes([1])), delay=0.1)

        # Page Size - TRYING WIDTH, HEIGHT instead of Height, Width
        print(f"Setting Size: {PRINTHEAD_PIXELS}x{HEIGHT}")
        # Trying width first? No, let's try just confirming the packet structure
        # Wiki: rows(u16), cols(u16). 
        # Let's try sending explicitly bytes to be sure of endianness
        # Height=240 (0x00F0), Width=384 (0x0180)
        # Packet should be: 13 04 00 F0 01 80
        size_payload = struct.pack('>HH', HEIGHT, PRINTHEAD_PIXELS)
        print(f"Size payload: {size_payload.hex()}")
        await send_packet(client, make_packet(0x13, size_payload), delay=0.1)
        
        await send_packet(client, make_packet(0x15, struct.pack('>H', 1)), delay=0.1)

        # Send Data
        print("Sending BLACK Block (0xFF)...")
        row_black = bytes([0xFF] * (PRINTHEAD_PIXELS // 8))
        
        for i in range(HEIGHT):
            # Packet 0x85
            # RowNum (2) + Count (3) + Repeat (1) + Data (48)
            # Count = 384 (0x180) -> 00 80 01 (Little Endian: 0, low, high)
            # Count split: [128, 128, 128] if split? 
            # Let's use TOTAL mode for simplicity: [0, 128, 1] for 384 pixels? 
            # 384 = 0x0180. Low=0x80, High=0x01.
            # Byte sequence: 00 80 01
            
            # Waait, count logic:
            # "Return total number of pixel in little-endian format: [0, LL, HH]"
            # If all black: 384 pixels.
            # 384 dec = 0180 hex.
            # LL = 80, HH = 01.
            # Bytes: 00 80 01.
            
            cnt_bytes = bytes([0, 0x80, 0x01]) 
            
            packet = make_packet(0x85, struct.pack('>H', i) + cnt_bytes + bytes([1]) + row_black)
            await client.write_gatt_char(CHAR_UUID, packet, response=False)
            await asyncio.sleep(0.005)

        # End
        await send_packet(client, make_packet(0xE3, bytes([1])), delay=0.5)
        await send_packet(client, make_packet(0xF3, bytes([1])), delay=0.5)
        
        print("Done")

if __name__ == "__main__":
    asyncio.run(run_test())

import asyncio
from bleak import BleakScanner, BleakClient
import struct

# NIIMBOT B1 Protocol Debug Script
SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

IMAGE_WIDTH = 384
IMAGE_HEIGHT = 100 # Short test

def make_packet(command, data=b''):
    payload = bytes([command, len(data)]) + data
    checksum = 0
    for b in payload: checksum ^= b
    return b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'

async def printer_test():
    print("Finding B1...")
    devices = await BleakScanner.discover()
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    if not target: return print("Not found")
    
    async with BleakClient(target.address) as client:
        print("Connected")
        
        # 1. Connect
        await client.write_gatt_char(CHAR_UUID, b'\x03' + make_packet(0xC1, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        # 2. Get Info (Density) - Just to verify communication
        await client.write_gatt_char(CHAR_UUID, make_packet(0x40, b'\x01'), response=False)
        await asyncio.sleep(0.2)
        
        # 3. Print Start
        # total_pages=1, 4 zeros, color=0
        await client.write_gatt_char(CHAR_UUID, make_packet(0x01, b'\x00\x01\x00\x00\x00\x00\x00'), response=False)
        await asyncio.sleep(0.2)
        
        # 4. Page Start
        await client.write_gatt_char(CHAR_UUID, make_packet(0x03, b'\x01'), response=False)
        await asyncio.sleep(0.2)
        
        # 5. Page Size (Trying ONLY Height per some B1 docs)
        print("Setting size (Height only)...")
        await client.write_gatt_char(CHAR_UUID, make_packet(0x13, struct.pack('>H', IMAGE_HEIGHT)), response=False)
        await asyncio.sleep(0.2)
        
        # 6. Density
        await client.write_gatt_char(CHAR_UUID, make_packet(0x21, b'\x03'), response=False)
        await asyncio.sleep(0.1)

        # 7. Data
        print("Sending 100 rows of SOLID BLACK...")
        row_data = b'\xFF' * (384 // 8)
        for i in range(IMAGE_HEIGHT):
            # Row n, counts 0,0,0, repeat 1
            payload = struct.pack('>H', i) + b'\x00\x00\x00\x01' + row_data
            await client.write_gatt_char(CHAR_UUID, make_packet(0x85, payload), response=False)
            await asyncio.sleep(0.01) # 10ms
            
        # 8. Page End
        await client.write_gatt_char(CHAR_UUID, make_packet(0xE3, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        # 9. Print End
        await client.write_gatt_char(CHAR_UUID, make_packet(0xF3, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        print("Test finished")

if __name__ == "__main__":
    asyncio.run(printer_test())

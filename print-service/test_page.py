import asyncio
from bleak import BleakScanner, BleakClient

SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

def make_packet(command: int, data: bytes = b'') -> bytes:
    length = len(data)
    payload = bytes([command, length]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    return b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'

def notification_handler(sender, data):
    print(f"   << Received: {data.hex()}")

async def test_print():
    print("=== NIIMBOT TEST PAGE ===")
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
    
    async with BleakClient(target.address, timeout=20.0) as client:
        print("Connected!")
        await client.start_notify(CHAR_UUID, notification_handler)
        await asyncio.sleep(0.3)
        
        # Connect
        print("Sending Connect...")
        await client.write_gatt_char(CHAR_UUID, b'\x03' + make_packet(0xC1, bytes([1])), response=False)
        await asyncio.sleep(0.5)
        
        # PrintTestPage (0x5A) - should print a built-in test pattern
        print("Sending PrintTestPage (0x5A)...")
        await client.write_gatt_char(CHAR_UUID, make_packet(0x5A, bytes([1])), response=False)
        await asyncio.sleep(3)
        
        await client.stop_notify(CHAR_UUID)
        print("Done!")

if __name__ == "__main__":
    asyncio.run(test_print())

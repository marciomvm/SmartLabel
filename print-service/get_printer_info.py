"""
Get detailed printer information to understand the firmware
"""
import asyncio
from bleak import BleakScanner, BleakClient
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

async def get_info():
    print("Scanning for B1...")
    devices = await BleakScanner.discover(timeout=5.0)
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    if not target:
        print("❌ B1 Not Found")
        return
    
    print(f"Found: {target.name}")
    
    async with BleakClient(target.address, timeout=30.0) as client:
        print("Connected!")
        
        responses = {}
        
        def notification_handler(sender, data):
            responses['last'] = data
        
        await client.start_notify(CHAR_UUID, notification_handler)
        
        # Connect
        await client.write_gatt_char(CHAR_UUID, b'\x03' + make_packet(0xC1, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        # Get various info
        info_types = {
            1: "Density",
            2: "Print Speed",
            3: "Label Type",
            6: "Language Type",
            7: "Auto Shutdown Time",
            8: "Device Type",
            9: "Software Version",
            10: "Battery",
            11: "Device Serial",
            12: "Hardware Version"
        }
        
        print("\n📊 PRINTER INFORMATION:")
        print("=" * 60)
        
        for info_id, info_name in info_types.items():
            responses['last'] = None
            await client.write_gatt_char(CHAR_UUID, make_packet(0x40, bytes([info_id])), response=False)
            await asyncio.sleep(0.3)
            
            if responses['last']:
                data = responses['last']
                print(f"\n{info_name} (0x{info_id:02x}):")
                print(f"   Raw: {data.hex()}")
                
                # Try to parse
                if len(data) > 4:
                    payload = data[4:-2]  # Skip header and footer
                    if info_id == 11:  # Serial
                        print(f"   Value: {payload.hex()}")
                    elif info_id in [9, 12]:  # Versions
                        if len(payload) >= 2:
                            val = struct.unpack('>H', payload[:2])[0]
                            print(f"   Value: {val / 100}")
                    else:
                        if len(payload) >= 1:
                            print(f"   Value: {payload[0]}")
        
        # Get RFID info
        print("\n\n📄 RFID/LABEL INFORMATION:")
        print("=" * 60)
        responses['last'] = None
        await client.write_gatt_char(CHAR_UUID, make_packet(0x1A, b'\x01'), response=False)
        await asyncio.sleep(0.5)
        
        if responses['last']:
            print(f"Raw: {responses['last'].hex()}")
        
        # Heartbeat
        print("\n\n💓 HEARTBEAT:")
        print("=" * 60)
        responses['last'] = None
        await client.write_gatt_char(CHAR_UUID, make_packet(0xDC, b'\x01'), response=False)
        await asyncio.sleep(0.3)
        
        if responses['last']:
            data = responses['last']
            print(f"Raw: {data.hex()}")
            print(f"Length: {len(data)} bytes")
        
        await client.stop_notify(CHAR_UUID)
        print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(get_info())

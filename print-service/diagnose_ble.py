import asyncio
from bleak import BleakScanner, BleakClient

async def run_diagnostics():
    print("--- NIIMBOT B1 DETAILED DIAGNOSTICS ---")
    print("1. Scanning...")
    
    target_device = None
    devices = await BleakScanner.discover()
    for d in devices:
        if d.name and "B1" in d.name:
            target_device = d
            break
            
    if not target_device:
        print("❌ B1 not found!")
        return

    print(f"✅ Found: {target_device.name} ({target_device.address})")
    
    print("\n2. Connecting and listing ALL characteristics...")
    try:
        async with BleakClient(target_device.address, timeout=20.0) as client:
            print(f"   Connected: {client.is_connected}")
            print("\n   ALL SERVICES AND CHARACTERISTICS:")
            for service in client.services:
                print(f"\n   SERVICE: {service.uuid}")
                print(f"            {service.description}")
                for char in service.characteristics:
                    props = ', '.join(char.properties)
                    print(f"      CHAR: {char.uuid}")
                    print(f"            Properties: [{props}]")
                    print(f"            Handle: {char.handle}")

            # Specifically look at the NIIMBOT service
            print("\n\n3. Testing NIIMBOT Service (e7810a71-73ae-499d-8c15-faa9aef0c3f2)...")
            niimbot_service = None
            for service in client.services:
                if "e7810a71" in service.uuid.lower():
                    niimbot_service = service
                    break
            
            if niimbot_service:
                print(f"   Found NIIMBOT service!")
                for char in niimbot_service.characteristics:
                    props = ', '.join(char.properties)
                    print(f"   - {char.uuid}: [{props}]")
            else:
                print("   ❌ NIIMBOT service not found!")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_diagnostics())

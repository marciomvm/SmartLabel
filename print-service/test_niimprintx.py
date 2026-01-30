"""
Test using the actual NiimPrintX library to see if it works on your B1
"""
import asyncio
import sys
sys.path.insert(0, '../NiimPrintX')

from NiimPrintX.nimmy.printer import PrinterClient
from bleak import BleakScanner
from PIL import Image

async def test_with_niimprintx():
    print("=" * 60)
    print("🧪 TESTING WITH NIIMPRINTX LIBRARY")
    print("=" * 60)
    
    # Find B1
    print("\nScanning for B1...")
    devices = await BleakScanner.discover(timeout=5.0)
    target = None
    for d in devices:
        if d.name and "B1" in d.name:
            target = d
            break
    
    if not target:
        print("❌ B1 not found")
        return
    
    print(f"✅ Found: {target.name} ({target.address})")
    
    # Create client
    client = PrinterClient(target)
    
    # Connect
    print("\nConnecting...")
    if not await client.connect():
        print("❌ Connection failed")
        return
    
    print("✅ Connected!")
    
    # Get printer info
    try:
        print("\n📊 Printer Information:")
        density = await client.get_info(1)  # DENSITY
        device_type = await client.get_info(8)  # DEVICETYPE
        soft_version = await client.get_info(9)  # SOFTVERSION
        battery = await client.get_info(10)  # BATTERY
        hard_version = await client.get_info(12)  # HARDVERSION
        
        print(f"   Device Type: {device_type}")
        print(f"   Software Version: {soft_version}")
        print(f"   Hardware Version: {hard_version}")
        print(f"   Battery: {battery}%")
        print(f"   Density: {density}")
    except Exception as e:
        print(f"   ⚠️  Could not get info: {e}")
    
    # Load test image
    print("\n🖼️  Loading test image...")
    img = Image.open("label_G-20260130-TEST.png")
    print(f"   Image size: {img.size}")
    
    # Print
    print("\n🖨️  Printing with NiimPrintX...")
    try:
        await client.print_image(img, density=5, quantity=1)
        print("✅ Print command completed!")
    except Exception as e:
        print(f"❌ Print failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Disconnect
    print("\n🔌 Disconnecting...")
    await client.disconnect()
    
    print("\n" + "=" * 60)
    print("✅ TEST COMPLETE")
    print("=" * 60)
    print("\n📝 Check the printed label:")
    print("   - If it printed correctly: Our code has a bug")
    print("   - If it's blank: Firmware/hardware issue")
    print("   - If it failed: Compatibility issue")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_with_niimprintx())

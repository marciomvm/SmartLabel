"""
Spy on Bluetooth communication to see what the official app sends
This will help us understand the correct protocol
"""
import asyncio
from bleak import BleakScanner, BleakClient

SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

packets_sent = []
packets_received = []

async def spy_mode():
    print("=" * 60)
    print("🕵️  BLUETOOTH SPY MODE")
    print("=" * 60)
    print("\nThis will monitor ALL communication with the printer.")
    print("After starting, use the OFFICIAL APP to print something.")
    print("We'll capture what it sends!\n")
    
    # Find printer
    print("Scanning for B1...")
    devices = await BleakScanner.discover(timeout=5.0)
    target = next((d for d in devices if d.name and "B1" in d.name), None)
    if not target:
        print("❌ B1 Not Found")
        return
    
    print(f"✅ Found: {target.name}")
    print("\n⚠️  IMPORTANT:")
    print("   1. Keep this script running")
    print("   2. Open the official Niimbot app on your phone")
    print("   3. Print a simple label (text or QR code)")
    print("   4. Come back here and press Ctrl+C when done")
    print("\n🎧 Listening for packets...\n")
    
    async with BleakClient(target.address, timeout=60.0) as client:
        print("✅ Connected! Monitoring...\n")
        
        packet_count = 0
        
        def notification_handler(sender, data):
            nonlocal packet_count
            packet_count += 1
            packets_received.append(data)
            print(f"📥 RX #{packet_count}: {data.hex()}")
        
        await client.start_notify(CHAR_UUID, notification_handler)
        
        try:
            # Keep listening for 5 minutes or until Ctrl+C
            await asyncio.sleep(300)
        except KeyboardInterrupt:
            print("\n\n🛑 Stopping spy mode...")
        
        await client.stop_notify(CHAR_UUID)
        
        print("\n" + "=" * 60)
        print(f"📊 CAPTURED {len(packets_received)} PACKETS")
        print("=" * 60)
        
        if packets_received:
            print("\n📝 Saving to spy_log.txt...")
            with open('spy_log.txt', 'w') as f:
                f.write("BLUETOOTH SPY LOG\n")
                f.write("=" * 60 + "\n\n")
                for i, pkt in enumerate(packets_received, 1):
                    f.write(f"Packet #{i}:\n")
                    f.write(f"  Hex: {pkt.hex()}\n")
                    f.write(f"  Bytes: {' '.join(f'{b:02x}' for b in pkt)}\n")
                    
                    # Try to parse
                    if len(pkt) >= 6 and pkt[0:2] == b'\x55\x55':
                        cmd = pkt[2]
                        length = pkt[3]
                        f.write(f"  Command: 0x{cmd:02x}\n")
                        f.write(f"  Length: {length}\n")
                        if length > 0 and len(pkt) > 4 + length:
                            data = pkt[4:4+length]
                            f.write(f"  Data: {data.hex()}\n")
                    f.write("\n")
            
            print("✅ Log saved to spy_log.txt")
        else:
            print("\n⚠️  No packets captured. Make sure you printed from the app!")

if __name__ == "__main__":
    print("\n⚠️  NOTE: This only captures RESPONSES from printer.")
    print("To capture what the APP SENDS, we need a different approach.\n")
    print("Instead, let's try REVERSE ENGINEERING by testing formats...\n")
    
    choice = input("Do you want to run spy mode anyway? (y/n): ")
    if choice.lower() == 'y':
        asyncio.run(spy_mode())
    else:
        print("\nLet's try the dimension format test instead!")
        print("Run: python test_dimension_formats.py")

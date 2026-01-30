"""
Find Niimbot B1 USB serial port
"""
import serial.tools.list_ports

print("="*60)
print("SCANNING FOR NIIMBOT B1 USB PORT")
print("="*60)

ports = serial.tools.list_ports.comports()

if not ports:
    print("\n❌ No COM ports found!")
    print("\nTroubleshooting:")
    print("1. Make sure B1 is connected via USB")
    print("2. Check Device Manager > Ports (COM & LPT)")
    print("3. Install Niimbot USB driver if needed")
else:
    print(f"\n✅ Found {len(ports)} COM port(s):\n")
    
    niimbot_port = None
    for port in ports:
        print(f"Port: {port.device}")
        print(f"  Description: {port.description}")
        print(f"  Manufacturer: {port.manufacturer}")
        print(f"  VID:PID: {port.vid}:{port.pid}")
        print(f"  Serial Number: {port.serial_number}")
        
        # Check if it's Niimbot
        if port.description and 'niimbot' in port.description.lower():
            niimbot_port = port.device
            print(f"  ⭐ THIS IS NIIMBOT!")
        elif port.manufacturer and 'niimbot' in port.manufacturer.lower():
            niimbot_port = port.device
            print(f"  ⭐ THIS IS NIIMBOT!")
        
        print()
    
    if niimbot_port:
        print("="*60)
        print(f"✅ NIIMBOT B1 FOUND ON: {niimbot_port}")
        print("="*60)
        print(f"\nUse this port in your code:")
        print(f'  ser = serial.Serial("{niimbot_port}", 115200)')
    else:
        print("="*60)
        print("⚠️  Could not auto-detect Niimbot")
        print("="*60)
        print("\nPlease check Device Manager and look for:")
        print("  - USB Serial Port")
        print("  - Niimbot Serial Port")
        print("  - CH340 or similar USB-to-Serial adapter")
        print("\nThen manually specify the COM port (e.g., COM3, COM4)")

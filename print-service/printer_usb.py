"""
Niimbot B1 USB Serial Printer
Uses same protocol as Bluetooth but over USB serial port
"""
import serial
import serial.tools.list_ports
from PIL import Image, ImageOps
import struct
import math
import time

def make_packet(command: int, data: bytes = b'') -> bytes:
    """Create Niimbot protocol packet with checksum"""
    length = len(data)
    payload = bytes([command, length]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    return b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'

def find_niimbot_port():
    """Auto-detect Niimbot USB port"""
    ports = serial.tools.list_ports.comports()
    
    for port in ports:
        desc = (port.description or '').lower()
        mfg = (port.manufacturer or '').lower()
        
        if 'niimbot' in desc or 'niimbot' in mfg:
            return port.device
    
    # If not found, return None
    return None

def process_image(image_path: str):
    """Process image for B1 printer"""
    img = Image.open(image_path).convert('L')
    
    # B1 native width is 384 pixels
    TARGET_WIDTH = 384
    if img.width != TARGET_WIDTH:
        new_img = Image.new('L', (TARGET_WIDTH, img.height), 255)
        x_offset = (TARGET_WIDTH - img.width) // 2
        new_img.paste(img, (x_offset, 0))
        img = new_img
        print(f"⚠️  Image centered: {Image.open(image_path).width}px → {TARGET_WIDTH}px")
    
    width, height = img.size
    print(f"📐 Image dimensions: {width}x{height}")
    
    # Invert BEFORE 1-bit conversion
    img = ImageOps.invert(img).convert('1')
    
    packets = []
    for y in range(height):
        line_data = [img.getpixel((x, y)) for x in range(width)]
        line_data = "".join("0" if pix == 0 else "1" for pix in line_data)
        line_bytes = int(line_data, 2).to_bytes(math.ceil(width / 8), "big")
        
        # Header: row_number (2 bytes) + 3 zeros + repeat (1 byte)
        header = struct.pack(">H", y) + b'\x00\x00\x00' + b'\x01'
        pkt = make_packet(0x85, header + line_bytes)
        packets.append(pkt)
    
    return packets, width, height

def send_packet(ser, packet, delay=0.0):
    """Send packet to printer via serial"""
    ser.write(packet)
    if delay > 0:
        time.sleep(delay)
    
    # Try to read response
    time.sleep(0.01)  # Small delay for response
    if ser.in_waiting > 0:
        response = ser.read(ser.in_waiting)
        print(f"🔔 RX: {response.hex()}")

def print_label_usb(image_path: str, port: str = None, quantity: int = 1):
    """Print label via USB serial"""
    
    # Find port if not specified
    if not port:
        print("🔍 Auto-detecting Niimbot USB port...")
        port = find_niimbot_port()
        if not port:
            print("❌ Could not find Niimbot USB port!")
            print("\nRun: python find_niimbot_usb.py")
            print("Then specify port manually: python printer_usb.py image.png COM3")
            return False
    
    print(f"📍 Using port: {port}")
    
    # Process image
    packets, width, height = process_image(image_path)
    print(f"🖨️  Printing: {width}x{height} pixels ({len(packets)} rows)...")
    
    try:
        # Open serial connection
        # Try common baud rates: 115200, 9600, 19200
        for baudrate in [115200, 9600, 19200]:
            try:
                print(f"🔌 Connecting at {baudrate} baud...")
                ser = serial.Serial(
                    port=port,
                    baudrate=baudrate,
                    bytesize=serial.EIGHTBITS,
                    parity=serial.PARITY_NONE,
                    stopbits=serial.STOPBITS_ONE,
                    timeout=1
                )
                print(f"✅ Connected at {baudrate} baud")
                break
            except Exception as e:
                if baudrate == 19200:  # Last attempt
                    raise
                continue
        
        # Clear any pending data
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        
        # === INITIALIZATION (Variant 3 - Working) ===
        print("\n🔧 Initializing printer...")
        
        # Heartbeat
        send_packet(ser, make_packet(0xDC, b'\x01'), 0.1)
        
        # Set label density (1-5, default 3)
        send_packet(ser, make_packet(0x21, b'\x03'), 0.1)
        
        # Set label type (1=gap label, 2=black mark, 3=continuous)
        send_packet(ser, make_packet(0x23, b'\x01'), 0.1)
        
        # Start print job
        send_packet(ser, make_packet(0x01, b'\x01'), 0.2)
        
        # Start page
        send_packet(ser, make_packet(0x03, b'\x01'), 0.1)
        
        # SET_DIMENSION: (height, width) - Variant 3 format
        print(f"📏 Setting dimensions: height={height}, width={width}")
        dim_packet = make_packet(0x13, struct.pack('>HH', height, width))
        print(f"   Packet: {dim_packet.hex()}")
        send_packet(ser, dim_packet, 0.1)
        
        # Set quantity
        send_packet(ser, make_packet(0x15, struct.pack('>H', quantity)), 0.1)
        
        # === SEND IMAGE DATA ===
        print(f"\n📤 Sending image data...")
        for i, pkt in enumerate(packets):
            ser.write(pkt)
            time.sleep(0.01)  # 10ms delay between rows
            
            # Read any responses
            if ser.in_waiting > 0:
                response = ser.read(ser.in_waiting)
                # Only print occasionally to avoid spam
                if i % 50 == 0:
                    print(f"   🔔 RX: {response.hex()}")
            
            if (i + 1) % 50 == 0:
                print(f"   Progress: {i+1}/{len(packets)} rows", end='\r')
        
        print(f"\n✅ All {len(packets)} rows sent!")
        
        # === FINALIZATION ===
        time.sleep(0.5)
        
        # End page
        send_packet(ser, make_packet(0xE3, b'\x01'), 0.5)
        
        # End print job
        send_packet(ser, make_packet(0xF3, b'\x01'), 0.5)
        
        print("✅ Print job completed!")
        
        # Close serial port
        ser.close()
        return True
        
    except serial.SerialException as e:
        print(f"\n❌ Serial Error: {e}")
        print("\nTroubleshooting:")
        print("1. Check if port is correct (run find_niimbot_usb.py)")
        print("2. Make sure no other program is using the port")
        print("3. Try unplugging and replugging the USB cable")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python printer_usb.py <image.png> [COM_PORT] [quantity]")
        print("\nExamples:")
        print("  python printer_usb.py label.png")
        print("  python printer_usb.py label.png COM3")
        print("  python printer_usb.py label.png COM3 2")
        print("\nTo find COM port:")
        print("  python find_niimbot_usb.py")
        sys.exit(1)
    
    img = sys.argv[1]
    port = sys.argv[2] if len(sys.argv) > 2 else None
    quantity = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    
    print_label_usb(img, port, quantity)

"""
Debug what we're actually sending to the printer
"""
from PIL import Image, ImageOps
import struct

def our_current_code():
    """What our printer.py is doing"""
    img = Image.open('label_G-20260130-TEST.png').convert('L')
    img = ImageOps.invert(img).convert('1')
    pixels = list(img.getdata())
    
    row = 100
    row_bytes = bytearray(48)
    for col_byte in range(48):
        byte_val = 0
        for bit in range(8):
            pixel_idx = row * 384 + col_byte * 8 + bit
            if pixels[pixel_idx] == 255:
                byte_val |= (1 << (7 - bit))
        row_bytes[col_byte] = byte_val
    
    return bytes(row_bytes)

def niimprintx_exact():
    """Exact NiimPrintX code"""
    import math
    img = Image.open('label_G-20260130-TEST.png').convert('L')
    img = ImageOps.invert(img).convert('1')
    
    line_data = [img.getpixel((x, 100)) for x in range(384)]
    line_data = "".join("0" if pix == 0 else "1" for pix in line_data)
    line_bytes = int(line_data, 2).to_bytes(math.ceil(384 / 8), "big")
    
    return line_bytes

def check_actual_packet():
    """Check what packet we're sending"""
    our = our_current_code()
    
    # Build packet like printer.py does
    row_num = 100
    header = struct.pack('>H', row_num) + b'\x00\x00\x00' + b'\x01'
    
    # Make packet
    command = 0x85
    data = header + our
    length = len(data)
    payload = bytes([command, length]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    packet = b'\x55\x55' + payload + bytes([checksum]) + b'\xAA\xAA'
    
    return packet, our

if __name__ == "__main__":
    print("=" * 60)
    print("🔍 DEBUG OUTPUT")
    print("=" * 60)
    
    our = our_current_code()
    niim = niimprintx_exact()
    
    print(f"\n📦 Row 100 data (first 20 bytes):")
    print(f"   Our code:  {our[:20].hex()}")
    print(f"   NiimPrintX: {niim[:20].hex()}")
    print(f"   Match: {our == niim}")
    
    packet, row_data = check_actual_packet()
    
    print(f"\n📡 Full packet being sent (first 50 bytes):")
    print(f"   {packet[:50].hex()}")
    
    print(f"\n🔢 Packet breakdown:")
    print(f"   Header: 55 55 (start)")
    print(f"   Command: 85 (bitmap row)")
    print(f"   Length: {packet[3]:02x} ({packet[3]} bytes)")
    print(f"   Row number: {struct.unpack('>H', packet[4:6])[0]}")
    print(f"   Pixel counts: {packet[6:9].hex()}")
    print(f"   Repeat: {packet[9]:02x}")
    print(f"   First 10 data bytes: {packet[10:20].hex()}")
    
    # Check if data is all zeros
    all_zero = all(b == 0 for b in row_data)
    all_ff = all(b == 0xFF for b in row_data)
    
    print(f"\n⚠️  Data check:")
    print(f"   All zeros: {all_zero}")
    print(f"   All 0xFF: {all_ff}")
    print(f"   Has mixed data: {not all_zero and not all_ff}")
    
    # Count set bits
    bit_count = sum(bin(b).count('1') for b in row_data)
    print(f"   Total bits set: {bit_count} / {384}")
    
    print("\n" + "=" * 60)

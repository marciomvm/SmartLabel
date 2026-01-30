from PIL import Image

image_path = "test_black.png"
width = 384

img = Image.open(image_path).convert('L')
ratio = width / img.width
new_height = int(img.height * ratio)
img = img.resize((width, new_height), Image.Resampling.LANCZOS)
img_1bit = img.point(lambda x: 0 if x < 128 else 255, '1')

pixels = list(img_1bit.getdata())

print(f"Image: {img_1bit.width}x{img_1bit.height}")

# Check row 20 (should be inside the black rectangle)
row_num = 20
row_start = row_num * img_1bit.width
row_pixels = pixels[row_start:row_start + img_1bit.width]
print(f"\nRow {row_num} pixels (first 50): {row_pixels[:50]}")

# Convert row 20 to bytes
row_bytes = []
for col_byte in range(img_1bit.width // 8):
    byte_val = 0
    for bit in range(8):
        pixel_idx = row_start + col_byte * 8 + bit
        if pixels[pixel_idx] == 0:  # Black
            byte_val |= (1 << (7 - bit))
    row_bytes.append(byte_val)

print(f"Row {row_num} bytes (first 20): {row_bytes[:20]}")
print(f"Hex: {bytes(row_bytes[:20]).hex()}")

# Also check what 0x85 packet would look like
packet_data = bytes(row_bytes)
print(f"\nFull row length: {len(packet_data)} bytes")
print(f"First 10 bytes of row: {packet_data[:10].hex()}")
print(f"Last 10 bytes of row: {packet_data[-10:].hex()}")

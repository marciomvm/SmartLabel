# Niimbot B1 Protocol Analysis - Critical Findings

## 🔍 Root Cause Analysis

After analyzing the **NiimPrintX** working implementation, I discovered that the "corrections" applied were actually **introducing bugs**, not fixing them!

## ❌ The Fatal Mistake

### Previous "Correction" (WRONG!)
```python
# This was changed from:
await send_packet(client, make_packet(0x13, struct.pack('>HHH', height, width, 1)), 0.1)

# To this (INCORRECT):
await send_packet(client, make_packet(0x13, struct.pack('>HH', width, height)), 0.1)
```

### ✅ Actual Correct Format (from NiimPrintX)
```python
# NiimPrintX line 237:
async def set_dimension(self, w, h):
    packet = await self.send_command(
        RequestCodeEnum.SET_DIMENSION, struct.pack(">HH", w, h)
    )
```

**BUT** in the `print_image` method (line 127), NiimPrintX calls it as:
```python
await self.set_dimension(image.height, image.width)
```

So the **correct order is: (HEIGHT, WIDTH)**, not (width, height)!

## 🎯 Complete Protocol Specification

### 1. Image Processing Pipeline

```python
# Step 1: Load and convert to grayscale
img = Image.open(image_path).convert('L')

# Step 2: Resize/pad to 384 pixels width (B1 native width)
if img.width != 384:
    new_img = Image.new('L', (384, img.height), 255)  # White background
    x_offset = (384 - img.width) // 2
    new_img.paste(img, (x_offset, 0))
    img = new_img

# Step 3: CRITICAL - Invert BEFORE 1-bit conversion
img = ImageOps.invert(img).convert('1')
# After inversion: 0 = black (print), 255 = white (don't print)
# After 1-bit: 0 = black (print), 1 = white (don't print)
```

### 2. Row Encoding

```python
for y in range(height):
    # Get pixels for this row
    line_data = [img.getpixel((x, y)) for x in range(width)]
    
    # Convert to binary string
    # "0" if pixel == 0 (black/print)
    # "1" if pixel != 0 (white/don't print)
    line_data = "".join("0" if pix == 0 else "1" for pix in line_data)
    
    # Convert binary string to bytes (big-endian)
    line_bytes = int(line_data, 2).to_bytes(math.ceil(width / 8), "big")
    
    # Build header: row_number (2 bytes BE) + 3 zeros + repeat (1 byte)
    header = struct.pack(">H", y) + b'\x00\x00\x00' + b'\x01'
    
    # Create packet (command 0x85)
    packet = make_packet(0x85, header + line_bytes)
```

### 3. Command Sequence

```python
# 1. Heartbeat
make_packet(0xDC, b'\x01')

# 2. Set density (1-5, default 3)
make_packet(0x21, b'\x03')

# 3. Set label type (1=gap, 2=black mark, 3=continuous)
make_packet(0x23, b'\x01')

# 4. Start print job
make_packet(0x01, b'\x01')

# 5. Start page
make_packet(0x03, b'\x01')

# 6. Set dimensions (HEIGHT first, then WIDTH!)
make_packet(0x13, struct.pack('>HH', height, width))

# 7. Set quantity
make_packet(0x15, struct.pack('>H', quantity))

# 8. Send all row packets (0x85)
# ... (see row encoding above)

# 9. End page
make_packet(0xE3, b'\x01')

# 10. End print job
make_packet(0xF3, b'\x01')
```

## 📊 Comparison: Wrong vs Right

### SET_DIMENSION Command (0x13)

For a 384x240 image:

| Implementation | Format | Bytes | Interpretation |
|---------------|--------|-------|----------------|
| **Wrong (previous)** | `width, height` | `01 80 00 F0` | 384, 240 |
| **Correct (NiimPrintX)** | `height, width` | `00 F0 01 80` | 240, 384 |

### Image Processing

| Step | Wrong Approach | Correct Approach |
|------|---------------|------------------|
| 1. Load | `convert('L')` | `convert('L')` ✅ |
| 2. Invert | After 1-bit ❌ | **Before 1-bit** ✅ |
| 3. Convert | `convert('1')` | `convert('1')` ✅ |
| 4. Bit logic | `pixel == 255` → 1 ❌ | `pixel == 0` → "0" ✅ |

### Row Header Format

| Field | Size | Value | Description |
|-------|------|-------|-------------|
| Row number | 2 bytes | `struct.pack(">H", y)` | Big-endian row index |
| Pixel count 1 | 1 byte | `0x00` | Always zero |
| Pixel count 2 | 1 byte | `0x00` | Always zero |
| Pixel count 3 | 1 byte | `0x00` | Always zero |
| Repeat count | 1 byte | `0x01` | Always 1 |
| **Total** | **6 bytes** | | |

## 🔬 Why Previous Attempts Failed

### Attempt 1: "Corrected" printer.py
- ❌ SET_DIMENSION in wrong order (width, height instead of height, width)
- ✅ Image inversion correct
- ✅ Pixel counts correct (zeros)
- **Result**: Blank prints (dimensions confused printer)

### Attempt 2: printer_working.py
- ❌ Used 96px width instead of 384px
- ❌ Wrong SET_PAGE_SIZE format
- ❌ Wrong header format (18 bytes instead of 6)
- **Result**: Blank or partial prints

### Attempt 3: Various test files
- Multiple variations of bit inversion
- Different dimension formats
- **Result**: All failed due to fundamental dimension order issue

## ✅ The Fix: printer_fixed.py

Based on **exact NiimPrintX implementation**:

1. ✅ SET_DIMENSION: `(height, width)` - **CORRECT ORDER**
2. ✅ Image inversion: **BEFORE** 1-bit conversion
3. ✅ Bit encoding: `0 = black (print)`, `1 = white (don't print)`
4. ✅ Pixel counts: Always `0x00 0x00 0x00`
5. ✅ Header format: 6 bytes total
6. ✅ Width: 384 pixels (native B1 width)

## 🧪 Testing Strategy

### Test 1: Simple Black Rectangle
```bash
python -c "from PIL import Image; img = Image.new('L', (384, 240), 0); img.save('test_black.png')"
python printer_fixed.py test_black.png
```
**Expected**: Solid black rectangle

### Test 2: Existing Label
```bash
python printer_fixed.py label_G-20260130-TEST.png
```
**Expected**: Complete QR code + text

### Test 3: Verify Dimensions
```bash
python -c "from PIL import Image; img = Image.open('label_G-20260130-TEST.png'); print(f'{img.size}')"
```
**Expected**: `(384, 240)` or will be padded

## 📚 Reference Sources

### NiimPrintX (Working Implementation)
- File: `NiimPrintX/NiimPrintX/nimmy/printer.py`
- Method: `_encode_image()` (line 147)
- Method: `set_dimension()` (line 237)
- Method: `print_image()` (line 127)

### Key Code Snippets

**Image encoding (line 147-165):**
```python
def _encode_image(self, image: Image, vertical_offset=0, horizontal_offset=0):
    # Convert the image to monochrome
    img = ImageOps.invert(image.convert("L")).convert("1")
    
    for y in range(img.height):
        line_data = [img.getpixel((x, y)) for x in range(img.width)]
        line_data = "".join("0" if pix == 0 else "1" for pix in line_data)
        line_data = int(line_data, 2).to_bytes(math.ceil(img.width / 8), "big")
        counts = (0, 0, 0)  # It seems like you can always send zeros
        header = struct.pack(">H3BB", y, *counts, 1)
        pkt = NiimbotPacket(0x85, header + line_data)
        yield pkt
```

**Dimension setting (line 127):**
```python
async def print_image(self, image: Image, density: int = 3, quantity: int = 1, ...):
    # ...
    await self.set_dimension(image.height, image.width)  # HEIGHT FIRST!
    # ...
```

## 🎯 Success Criteria

After running `printer_fixed.py`:

- [ ] QR code prints **completely** (100%)
- [ ] Text is **legible**
- [ ] No blank areas
- [ ] Proper alignment
- [ ] Scannable QR code

## 🚀 Next Steps

1. **Test printer_fixed.py** with existing label
2. **If successful**: Update `printer.py` with correct implementation
3. **If still issues**: Check firmware-specific quirks
4. **Document**: Create final protocol specification

---

**Analysis Date**: 2026-01-30  
**Based On**: NiimPrintX v1.0 (working implementation)  
**Status**: Ready for testing

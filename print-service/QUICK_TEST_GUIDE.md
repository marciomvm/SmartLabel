# 🚀 Quick Test Guide - Niimbot B1 Fix

## ⚡ TL;DR

```bash
# 1. Create test patterns
python test_fixed_protocol.py

# 2. Test with simple pattern
python printer_fixed.py test_solid_black.png

# 3. Test with real label
python printer_fixed.py label_G-20260130-TEST.png
```

## 🎯 What Was Fixed

**The Problem**: SET_DIMENSION was sending `(width, height)` but B1 expects `(height, width)`!

**The Solution**: `printer_fixed.py` uses the correct order from NiimPrintX

## 📋 Test Sequence

### Test 1: Solid Black (Simplest)
```bash
python printer_fixed.py test_solid_black.png
```
**Expected**: Solid black rectangle filling the entire label

**If this fails**: Protocol issue, not image processing

### Test 2: Stripes (Pattern Test)
```bash
python printer_fixed.py test_stripes.png
```
**Expected**: Vertical black and white stripes

**If this fails**: Bit encoding issue

### Test 3: Checkerboard (Alignment Test)
```bash
python printer_fixed.py test_checkerboard.png
```
**Expected**: Checkerboard pattern

**If this fails**: Dimension or alignment issue

### Test 4: Text (Readability Test)
```bash
python printer_fixed.py test_text.png
```
**Expected**: "NIIMBOT B1 TEST PRINT" text

**If this fails**: Resolution or scaling issue

### Test 5: Real Label (Final Test)
```bash
python printer_fixed.py label_G-20260130-TEST.png
```
**Expected**: Complete QR code + batch info

**If this fails**: Complex image processing issue

## 🔍 What to Look For

### ✅ Success Indicators
- Printer responds to all commands (🔔 RX messages)
- Progress counter reaches 100%
- Print completes without errors
- Output matches expected pattern
- QR code is scannable (for label test)

### ❌ Failure Indicators
- Blank output → Dimension or inversion issue
- Partial output → Buffer or timing issue
- Garbled output → Bit encoding issue
- No printer response → Connection issue

## 📊 Expected Output

```
Printing: 384x240 pixels (240 rows)...
Connected to B1-H914060067
Listening for printer feedback...
🔔 RX: 5555dd0d1e...  (responses from printer)
Sending image data...
Progress: 50/240 rows
Progress: 100/240 rows
Progress: 150/240 rows
Progress: 200/240 rows
✅ All 240 rows sent!
✅ Print job completed!
```

## 🐛 Troubleshooting

### Problem: Blank Print
**Possible causes**:
1. Dimension order still wrong
2. Image inversion incorrect
3. Bit encoding reversed

**Debug**:
```bash
# Check if test pattern was created correctly
python -c "from PIL import Image; img = Image.open('test_solid_black.png'); print(img.size, img.mode, img.getpixel((0,0)))"
# Expected: (384, 240) L 0
```

### Problem: Partial Print
**Possible causes**:
1. Buffer overflow (sending too fast)
2. Printer not ready
3. Bluetooth connection unstable

**Fix**: Increase delay in `printer_fixed.py`:
```python
await asyncio.sleep(0.02)  # Change from 0.01 to 0.02
```

### Problem: Garbled Print
**Possible causes**:
1. Bit order wrong
2. Byte order wrong
3. Width calculation wrong

**Debug**: Check row encoding in `printer_fixed.py`

### Problem: No Printer Response
**Possible causes**:
1. Printer not paired
2. Bluetooth off
3. Printer in use by another app

**Fix**:
1. Close official Niimbot app
2. Restart printer
3. Re-pair Bluetooth device

## 📝 Logging

To see detailed packet data, uncomment in `printer_fixed.py`:
```python
async def send_packet(client, packet, delay=0.0):
    print(f"TX: {packet.hex()}")  # Uncomment this line
    await client.write_gatt_char(CHAR_UUID, packet, response=False)
```

## 🎓 Understanding the Fix

### Before (Wrong)
```
SET_DIMENSION: 01 80 00 F0  (384 width, 240 height)
Printer thinks: "384 pixels tall, 240 pixels wide"
Result: Confused printer, blank output
```

### After (Correct)
```
SET_DIMENSION: 00 F0 01 80  (240 height, 384 width)
Printer thinks: "240 pixels tall, 384 pixels wide"
Result: Correct interpretation, proper output
```

## 📞 Next Steps After Testing

### If All Tests Pass ✅
1. Replace `printer.py` with `printer_fixed.py` code
2. Update `app.py` if needed
3. Test with production labels
4. Deploy to production

### If Tests Fail ❌
1. Note which test failed
2. Capture printer responses (🔔 RX messages)
3. Take photo of printed output
4. Share logs for further analysis

## 🔗 Related Files

- `printer_fixed.py` - The corrected implementation
- `PROTOCOL_ANALYSIS.md` - Technical details
- `SOLUTION_SUMMARY.md` - Portuguese summary
- `test_fixed_protocol.py` - Test pattern generator

---

**Quick Reference**: The fix is in `printer_fixed.py` - it uses `(height, width)` order like NiimPrintX does!

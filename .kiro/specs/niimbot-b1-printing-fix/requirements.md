# Niimbot B1 Printing Fix - Requirements

## 1. Overview

Fix the Niimbot B1 thermal printer integration to correctly print QR code labels for the mushroom farm batch tracking system. Currently, labels print blank or partially, while the official app and niim.blue website work correctly.

## 2. Problem Statement

### Current Situation
- **Working**: Official Niimbot app (mobile) prints correctly
- **Working**: niim.blue website prints correctly  
- **Not Working**: Our Python implementation prints blank or shows only fragments
- **Hardware**: Niimbot B1 (Firmware 5.22, Hardware 5.10)

### Evidence Collected
1. Printer responds to all commands correctly (no connection issues)
2. niim.blue console log captured showing successful print protocol
3. NiimPrintX library exists but connection fails on this specific B1 model
4. Multiple protocol variations tested (all unsuccessful)

## 3. User Stories

### 3.1 As a farm operator
**I want** to print QR code labels directly from the web app  
**So that** I can track batches without using my phone

**Acceptance Criteria:**
- [ ] QR code prints completely and is scannable
- [ ] Text (batch ID, strain, date) is legible
- [ ] Label dimensions match 40x30mm or 50x80mm standard
- [ ] Print quality matches official app output

### 3.2 As a developer
**I want** to understand the exact protocol differences  
**So that** I can implement a reliable printing solution

**Acceptance Criteria:**
- [ ] Document exact packet format from working implementations
- [ ] Identify differences between our implementation and working ones
- [ ] Create test suite to validate protocol compliance
- [ ] Document B1-specific quirks vs other Niimbot models

## 4. Technical Requirements

### 4.1 Protocol Analysis
**Must Have:**
- [ ] Analyze niimblue source code (TypeScript/JavaScript)
- [ ] Analyze libreniim source code (Rust)
- [ ] Compare with NiimPrintX implementation (Python)
- [ ] Document packet structure for commands: 0x13, 0x83, 0x84, 0x85
- [ ] Identify width/height encoding format

**Should Have:**
- [ ] Create protocol documentation with examples
- [ ] Build packet analyzer tool
- [ ] Create test image generator

### 4.2 Implementation
**Must Have:**
- [ ] Implement correct packet format for B1
- [ ] Handle image processing (resize, convert, encode)
- [ ] Support 384px or 96px width (TBD from analysis)
- [ ] Proper bit encoding (black=1 or black=0)

**Should Have:**
- [ ] Optimize transmission speed
- [ ] Add error handling and retry logic
- [ ] Support multiple label sizes

### 4.3 Testing
**Must Have:**
- [ ] Test with simple patterns (solid black, stripes)
- [ ] Test with QR codes
- [ ] Test with text
- [ ] Verify against official app output

**Should Have:**
- [ ] Automated test suite
- [ ] Visual comparison tool
- [ ] Performance benchmarks

## 5. Research Questions

### 5.1 Image Encoding
- [ ] What is the actual printhead width? (384px or 96px?)
- [ ] Does B1 require image inversion?
- [ ] What is the bit encoding? (1=black or 0=black?)
- [ ] How are rows encoded in 0x85 packets?

### 5.2 Protocol Commands
- [ ] What is the exact format of SET_PAGE_SIZE (0x13)?
- [ ] Why does niim.blue use 0x83, 0x84, 0x85 differently?
- [ ] What is the "indexed" format in 0x83?
- [ ] What are the 18 bytes in the 0x85 header?

### 5.3 B1-Specific Behavior
- [ ] Does B1 firmware 5.22 differ from other versions?
- [ ] Are there undocumented commands needed?
- [ ] What is the significance of `00 f0 00 60 00 01` in SET_PAGE_SIZE?

## 6. Success Criteria

### Minimum Viable Solution
1. ✅ Print a simple test pattern (solid rectangle)
2. ✅ Print text that is legible
3. ✅ Print QR code that is scannable
4. ✅ Match quality of official app

### Ideal Solution
1. ✅ All minimum criteria met
2. ✅ Print speed comparable to official app
3. ✅ Support multiple label sizes
4. ✅ Documented protocol for future reference
5. ✅ Reusable code for other Niimbot models

## 7. Out of Scope

- Support for non-B1 Niimbot models (can be added later)
- Color printing (B1 is monochrome only)
- Advanced features (multiple copies, density adjustment during print)
- USB connection (Bluetooth only for now)

## 8. Dependencies

### External Libraries
- `bleak` - Bluetooth LE communication
- `Pillow` - Image processing
- `qrcode` - QR code generation

### Reference Implementations
- niimblue (https://github.com/MultiMote/niimblue)
- libreniim (https://github.com/talaviram/libreniim)
- NiimPrintX (https://github.com/labbots/NiimPrintX)

## 9. Constraints

- Must work on Windows (current development environment)
- Must use Bluetooth LE (no USB driver available)
- Must not require firmware update
- Must work with existing label stock (40x30mm, 50x80mm)

## 10. Risks

### High Risk
- **Protocol incompatibility**: B1 firmware 5.22 may use different protocol than documented
- **Undocumented features**: Official app may use proprietary commands

### Medium Risk
- **Image encoding**: Wrong bit order or inversion breaks output
- **Timing issues**: Packets sent too fast may be dropped

### Low Risk
- **Label size**: Wrong dimensions cause misalignment
- **Density**: Print too light or too dark

## 11. Next Steps

### ✅ COMPLETED: Phase 1 - Deep Analysis
- ✅ Analyzed NiimPrintX source code (working Python implementation)
- ✅ Identified root cause: SET_DIMENSION parameter order was wrong
- ✅ Documented exact packet formats
- ✅ Created comparison matrix

### 🔄 IN PROGRESS: Phase 2 - Protocol Implementation
- ✅ Created `printer_fixed.py` with correct protocol
- ✅ Created test suite (`test_fixed_protocol.py`)
- ⏳ **NEXT**: Test with real printer
- ⏳ Validate against working implementation

### ⏳ PENDING: Phase 3 - Integration
- Integrate into existing print service
- Update label generator for correct dimensions
- Add error handling

### ⏳ PENDING: Phase 4 - Documentation
- ✅ Document protocol findings (PROTOCOL_ANALYSIS.md)
- ✅ Create troubleshooting guide (SOLUTION_SUMMARY.md)
- ⏳ Write developer documentation

## 12. Critical Discovery

### Root Cause Found! 🎯

The "corrections" applied were **introducing bugs**:

**WRONG (previous "correction"):**
```python
make_packet(0x13, struct.pack('>HH', width, height))  # 384, 240
```

**CORRECT (from NiimPrintX):**
```python
make_packet(0x13, struct.pack('>HH', height, width))  # 240, 384
```

### Key Findings from NiimPrintX Analysis

1. **SET_DIMENSION order**: `(height, width)` NOT `(width, height)`
2. **Image inversion**: Must happen BEFORE 1-bit conversion
3. **Bit encoding**: `0 = black (print)`, `1 = white (don't print)`
4. **Pixel counts**: Always zeros `(0, 0, 0)`
5. **Header format**: 6 bytes: `row_number (2) + zeros (3) + repeat (1)`

### Files Created

- `printer_fixed.py` - Corrected implementation
- `PROTOCOL_ANALYSIS.md` - Technical analysis
- `SOLUTION_SUMMARY.md` - User-friendly summary
- `test_fixed_protocol.py` - Test pattern generator

---

**Created**: 2026-01-30  
**Updated**: 2026-01-30  
**Status**: Solution Implemented - Ready for Testing  
**Priority**: P0 (Blocking production use)

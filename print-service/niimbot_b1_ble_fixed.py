"""
NIIMBOT B1 BLE - "definitive" print path based on:
- niimbluelib SetPageSize 11-byte variant (rows, cols, copies, 0x00000000, 0x01)
- niimbluelib/niimblue PrintStart 8-byte variant (totalPages + padding + 0x01)
- niimprint/NiimPrintX-style 0x85 bitmap rows (row + 3 pixel-count bytes + repeat + raw row bytes)

This script is designed to be drop-in for your label system:
- Takes any image, pads to 384px width, prints at original height
- Uses simple run-length encoding (repeat > 1) to reduce BLE traffic
- Includes verbose TX/RX logging optional

⚠️ You MUST use the correct BLE service/characteristic UUIDs for your B1.
The defaults below match your uploaded diagnostic scripts.
"""

import asyncio
import math
import struct
from dataclasses import dataclass
from typing import List, Optional, Tuple

from bleak import BleakClient, BleakScanner
from PIL import Image, ImageOps

# Your current scripts use these UUIDs:
SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

TARGET_WIDTH_DOTS = 384  # B1 printhead width in dots (48mm @ 203dpi)

# -----------------------------
# Packet helpers
# -----------------------------

def make_packet(command: int, data: bytes = b"") -> bytes:
    """
    Niimbot packet format:
    0x55 0x55 | cmd (1B) | len (1B) | data (len) | checksum XOR(cmd,len,data) (1B) | 0xAA 0xAA
    """
    if len(data) > 255:
        raise ValueError(f"Data too long for 1-byte length: {len(data)}")
    payload = bytes([command, len(data)]) + data
    checksum = 0
    for b in payload:
        checksum ^= b
    return b"\x55\x55" + payload + bytes([checksum]) + b"\xAA\xAA"


def _bitcount_bytes(b: bytes) -> int:
    return sum(byte.bit_count() for byte in b)


def pack_bitmap_row(row_index: int, row_bytes: bytes, repeat: int = 1) -> bytes:
    """
    0x85 PrintBitmapRow:
    [row u16 BE] + [pixelCountLeft u8] + [pixelCountMid u8] + [pixelCountRight u8] + [repeat u8] + [bitmap bytes]

    For B1 (384 dots): bitmap bytes = 384/8 = 48 bytes.
    Pixel counts are the number of '1' bits inside each third of the printhead (128 dots => 16 bytes).
    """
    if len(row_bytes) != TARGET_WIDTH_DOTS // 8:
        raise ValueError(f"Expected {TARGET_WIDTH_DOTS//8} bytes per row, got {len(row_bytes)}")

    # Split into 3 equal chunks (left/mid/right)
    chunk_len = len(row_bytes) // 3  # 48/3 = 16
    left = row_bytes[0:chunk_len]
    mid = row_bytes[chunk_len:2 * chunk_len]
    right = row_bytes[2 * chunk_len:3 * chunk_len]

    c_left = _bitcount_bytes(left) & 0xFF
    c_mid = _bitcount_bytes(mid) & 0xFF
    c_right = _bitcount_bytes(right) & 0xFF

    header = struct.pack(">HBBBB", row_index, c_left, c_mid, c_right, max(1, min(255, repeat)))
    return make_packet(0x85, header + row_bytes)


def rle_rows(rows: List[bytes]) -> List[Tuple[int, bytes, int]]:
    """
    Compress consecutive identical rows into (row_index, row_bytes, repeat).
    """
    out: List[Tuple[int, bytes, int]] = []
    i = 0
    while i < len(rows):
        row = rows[i]
        repeat = 1
        j = i + 1
        while j < len(rows) and rows[j] == row and repeat < 255:
            repeat += 1
            j += 1
        out.append((i, row, repeat))
        i += repeat
    return out


# -----------------------------
# Image encoding
# -----------------------------

def image_to_rows(image_path: str, *, target_width: int = TARGET_WIDTH_DOTS) -> Tuple[List[bytes], int, int]:
    """
    Returns (rows, width, height):
      - rows: list of packed bytes for each row (len=row_bytes = target_width/8)
      - width: target_width (dots)
      - height: image height in dots
    """
    img = Image.open(image_path).convert("L")

    # Force width to 384 dots by padding (don't rescale)
    if img.width != target_width:
        new_img = Image.new("L", (target_width, img.height), 255)  # white
        x_offset = (target_width - img.width) // 2
        new_img.paste(img, (x_offset, 0))
        img = new_img

    width, height = img.size

    # Critical: invert BEFORE converting to 1-bit (matches NiimPrintX/niimprint approach)
    img = ImageOps.invert(img).convert("1")

    pixels = list(img.getdata())  # 0 or 255
    rows: List[bytes] = []

    bytes_per_row = width // 8
    for y in range(height):
        row_bytes = bytearray(bytes_per_row)
        base = y * width
        for bx in range(bytes_per_row):
            v = 0
            for bit in range(8):
                px = pixels[base + bx * 8 + bit]
                # After invert+1bit: 255 means "print"
                if px == 255:
                    v |= (1 << (7 - bit))
            row_bytes[bx] = v
        rows.append(bytes(row_bytes))

    return rows, width, height


# -----------------------------
# Printer session
# -----------------------------

@dataclass
class B1Config:
    density: int = 3          # 0..?
    label_type: int = 1       # 1/2 depending on continuous vs gap labels
    copies: int = 1
    inter_packet_delay_s: float = 0.006  # data pacing (tune if needed)
    finalize_delay_s: float = 1.0
    verbose: bool = True
    # Some models drop the first packet after PrintStart when using BLE; sending SetPageSize twice is a safe workaround.
    send_pagesize_twice: bool = True


async def _send(client: BleakClient, packet: bytes, *, delay_s: float = 0.0, verbose: bool = False):
    if verbose:
        print(f"TX: {packet.hex()}")
    await client.write_gatt_char(CHAR_UUID, packet, response=False)
    if delay_s:
        await asyncio.sleep(delay_s)


async def print_image_ble(image_path: str, *, config: Optional[B1Config] = None, device_name_hint: str = "B1") -> bool:
    """
    Main entry point: prints a single image as one label.
    """
    config = config or B1Config()

    rows, width, height = image_to_rows(image_path)
    rle = rle_rows(rows)

    if config.verbose:
        print(f"Image prepared: {width}x{height} dots, rows={len(rows)}, rle_packets={len(rle)}")

    devices = await BleakScanner.discover(timeout=5.0)
    target = next((d for d in devices if d.name and device_name_hint in d.name), None)
    if not target:
        print("❌ Printer not found (scan).")
        return False

    rx_queue: asyncio.Queue[bytes] = asyncio.Queue()

    def on_notify(_: int, data: bytearray):
        # You can parse these later; for now just log + store
        if config.verbose:
            print(f"RX: {bytes(data).hex()}")
        try:
            rx_queue.put_nowait(bytes(data))
        except asyncio.QueueFull:
            pass

    try:
        async with BleakClient(target.address, timeout=30.0) as client:
            if config.verbose:
                print(f"✅ Connected: {target.name} ({target.address})")

            await client.start_notify(CHAR_UUID, on_notify)

            # ---- Init / handshake ----
            # Heartbeat
            await _send(client, make_packet(0xDC, b"\x01"), delay_s=0.10, verbose=config.verbose)

            # Density
            await _send(client, make_packet(0x21, bytes([config.density & 0xFF])), delay_s=0.10, verbose=config.verbose)

            # Label Type
            await _send(client, make_packet(0x23, bytes([config.label_type & 0xFF])), delay_s=0.10, verbose=config.verbose)

            # PrintStart (8 bytes): totalPages + padding + 0x01
            # (Matches niimblue/niimbluelib 8-byte variant)
            total_pages = 1
            printstart = struct.pack(">H", total_pages) + b"\x00\x00\x00\x00\x00\x01"
            await _send(client, make_packet(0x01, printstart), delay_s=0.20, verbose=config.verbose)

            # PageStart (many scripts use 0x03 0x01 before data)
            await _send(client, make_packet(0x03, b"\x01"), delay_s=0.10, verbose=config.verbose)

            # SetPageSize (11 bytes):
            # rows(u16), cols(u16), copiesCount(u16), 0x00000000, 0x01
            pagesize = struct.pack(">HHH", height, width, config.copies) + b"\x00\x00\x00\x00\x01"
            await _send(client, make_packet(0x13, pagesize), delay_s=0.10, verbose=config.verbose)
            if config.send_pagesize_twice:
                await _send(client, make_packet(0x13, pagesize), delay_s=0.10, verbose=config.verbose)

            # SetQuantity (u16) — keep, since your attempts used it
            await _send(client, make_packet(0x15, struct.pack(">H", config.copies)), delay_s=0.10, verbose=config.verbose)

            # ---- Data ----
            if config.verbose:
                print("📤 Sending bitmap rows...")

            for (row_index, row_bytes, repeat) in rle:
                pkt = pack_bitmap_row(row_index, row_bytes, repeat=repeat)
                await _send(client, pkt, delay_s=config.inter_packet_delay_s, verbose=False)

            if config.verbose:
                print("✅ Data sent. Finalizing...")

            await asyncio.sleep(config.finalize_delay_s)

            # PageEnd + PrintEnd
            await _send(client, make_packet(0xE3, b"\x01"), delay_s=0.40, verbose=config.verbose)
            await _send(client, make_packet(0xF3, b"\x01"), delay_s=0.40, verbose=config.verbose)

            await asyncio.sleep(0.5)
            await client.stop_notify(CHAR_UUID)

            if config.verbose:
                print("✅ Done.")
            return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    import sys

    image_path = sys.argv[1] if len(sys.argv) > 1 else "test_black.png"

    # Quick defaults for sticker labels:
    # - label_type=1 or 2 (try 2 if you're using die-cut labels with gaps)
    cfg = B1Config(
        density=3,
        label_type=1,
        copies=1,
        inter_packet_delay_s=0.006,
        verbose=True,
        send_pagesize_twice=True,
    )

    asyncio.run(print_image_ble(image_path, config=cfg))

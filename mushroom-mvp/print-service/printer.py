"""
NIIMBOT B1 Printer Interface using Bleak (Bluetooth Low Energy)
Based on NiimPrintX project: https://github.com/labbots/NiimPrintX
"""

import asyncio
from bleak import BleakClient, BleakScanner
from PIL import Image
import struct
from typing import Optional, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# NIIMBOT B1 Bluetooth UUIDs (from NiimPrintX)
NIIMBOT_SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
NIIMBOT_CHAR_UUID = "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f"

# Packet Types
PACKET_START = 0x03
PACKET_END = 0x04

class NiimbotPrinter:
    def __init__(self):
        self.client: Optional[BleakClient] = None
        self.device_address: Optional[str] = None
        
    async def scan_for_printers(self, timeout: float = 10.0) -> List[dict]:
        """Scan for NIIMBOT printers"""
        logger.info("Scanning for NIIMBOT printers...")
        devices = []
        
        discovered = await BleakScanner.discover(timeout=timeout)
        for device in discovered:
            name = device.name or ""
            if "niimbot" in name.lower() or "b1" in name.lower() or "d11" in name.lower():
                devices.append({
                    "name": device.name,
                    "address": device.address
                })
                logger.info(f"Found printer: {device.name} ({device.address})")
        
        return devices
    
    async def connect(self, address: str = None) -> bool:
        """Connect to NIIMBOT printer"""
        if address is None:
            # Auto-discover
            printers = await self.scan_for_printers()
            if not printers:
                logger.error("No NIIMBOT printers found")
                return False
            address = printers[0]["address"]
        
        self.device_address = address
        logger.info(f"Connecting to {address}...")
        
        try:
            self.client = BleakClient(address)
            await self.client.connect()
            logger.info("Connected!")
            return True
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from printer"""
        if self.client and self.client.is_connected:
            await self.client.disconnect()
            logger.info("Disconnected")
    
    def _create_packet(self, command: int, data: bytes = b'') -> bytes:
        """Create a command packet for NIIMBOT"""
        packet = bytes([PACKET_START, command, len(data)]) + data
        checksum = sum(packet) & 0xFF
        packet += bytes([checksum, PACKET_END])
        return packet
    
    def _image_to_print_data(self, img: Image.Image) -> bytes:
        """Convert PIL image to NIIMBOT print format"""
        # Ensure image is 1-bit (black/white)
        if img.mode != '1':
            img = img.convert('1')
        
        width, height = img.size
        pixels = list(img.getdata())
        
        # NIIMBOT expects rows of bytes, MSB first
        row_bytes = (width + 7) // 8
        data = bytearray()
        
        for y in range(height):
            row = bytearray(row_bytes)
            for x in range(width):
                if pixels[y * width + x] == 0:  # Black pixel
                    byte_idx = x // 8
                    bit_idx = 7 - (x % 8)
                    row[byte_idx] |= (1 << bit_idx)
            data.extend(row)
        
        return bytes(data)
    
    async def print_image(self, img: Image.Image, density: int = 3) -> bool:
        """Print an image to the NIIMBOT printer"""
        if not self.client or not self.client.is_connected:
            logger.error("Not connected to printer")
            return False
        
        try:
            width, height = img.size
            logger.info(f"Printing image: {width}x{height}")
            
            # Convert image to print data
            print_data = self._image_to_print_data(img)
            
            # Send print commands
            # Note: This is a simplified version. Full implementation would need
            # proper packet sequencing from NiimPrintX
            
            # For now, we'll save the image and use CLI
            logger.warning("Direct BLE printing not fully implemented yet.")
            logger.warning("Please use the CLI method or GUI app.")
            return False
            
        except Exception as e:
            logger.error(f"Print error: {e}")
            return False


class PrinterCLI:
    """Wrapper for using NiimPrintX CLI"""
    
    @staticmethod
    async def print_image(image_path: str, printer_address: str = None) -> bool:
        """Print using NiimPrintX CLI (if installed)"""
        import subprocess
        import shutil
        
        # Check if niimprintx is available
        niimprintx = shutil.which("niimprintx")
        
        if niimprintx:
            cmd = [niimprintx, "print", "-i", image_path]
            if printer_address:
                cmd.extend(["-a", printer_address])
            
            logger.info(f"Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("Print successful!")
                return True
            else:
                logger.error(f"Print failed: {result.stderr}")
                return False
        else:
            logger.warning("NiimPrintX CLI not found. Using fallback method.")
            return False
    
    @staticmethod
    def get_printer_status() -> dict:
        """Check printer connectivity"""
        return {
            "available": False,
            "message": "Use NIIMBOT app or pair printer first"
        }


# Singleton instance
_printer = None

def get_printer() -> NiimbotPrinter:
    global _printer
    if _printer is None:
        _printer = NiimbotPrinter()
    return _printer


async def test_scan():
    """Test scanning for printers"""
    printer = get_printer()
    devices = await printer.scan_for_printers()
    print(f"Found {len(devices)} printers:")
    for d in devices:
        print(f"  - {d['name']} ({d['address']})")


if __name__ == "__main__":
    asyncio.run(test_scan())

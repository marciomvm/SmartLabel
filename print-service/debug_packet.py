import sys
import os

# Add NiimPrintX to path
sys.path.append(os.path.join(os.getcwd(), 'NiimPrintX'))

from NiimPrintX.nimmy.packet import NiimbotPacket
from NiimPrintX.nimmy.printer import PrinterClient
from PIL import Image

# Mock image
img = Image.new('1', (384, 1), 0) # Black line (0=Black in PIL '1')

# Encode
class MockTransport:
    pass

class MockClient:
    def __init__(self):
        self.is_connected = False

pc = PrinterClient(None)
pc.transport = MockTransport()
pc.transport.client = MockClient()
generator = pc._encode_image(img)
packet = next(generator)

print(f"Packet: {packet.to_bytes().hex()}")

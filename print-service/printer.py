import asyncio
from bleak import BleakScanner
from niimprint import PrinterClient, BluetoothTransport
from PIL import Image

async def get_printer_address():
    print(f"Scanning for printers...")
    devices = await BleakScanner.discover()
    for d in devices:
        if d.name and "B1" in d.name: # Filter for B1
            print(f"Found B1: {d.name} ({d.address})")
            return d.address
    return None

def print_image(image_path):
    address = asyncio.run(get_printer_address())
    if not address:
        print("No Niimbot B1 printer found!")
        return

    print(f"Connecting to {address} using niimprint...")
    max_retries = 3
    for attempt in range(max_retries):
        try:
            transport = BluetoothTransport(address)
            client = PrinterClient(transport)
            
            image = Image.open(image_path)
            print(f"Printing {image_path} (Attempt {attempt+1}/{max_retries})...")
            client.print_image(image, density=3)
            print("Print command sent!")
            break # Success, exit loop
            
        except Exception as e:
            print(f"Print failed (Attempt {attempt+1}): {e}")
            if attempt < max_retries - 1:
                print("Retrying in 2 seconds...")
                asyncio.run(asyncio.sleep(2))
            else:
                print("Max retries reached. Check if printer is ON and not connected to phone app.")

if __name__ == "__main__":
    # Test
    # print_image("test_label.png")
    pass

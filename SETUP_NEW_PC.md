# New PC Setup Guide

Since you are running the Print Service on a **new computer**, you need to install one small helper tool that handles the printer connection. The `.exe` file I created takes care of the Python logic, but it relies on this external tool for the actual hardware communication.

## Step 1: Install Node.js
If not already installed:
1. Download **Node.js (LTS version)** from [nodejs.org](https://nodejs.org/).
2. Run the installer and click "Next" through the defaults.

## Step 2: Install the Printer Tool
1. Open a **Command Prompt** (search for `cmd` in Windows).
2. Type the following command and press Enter:
   ```bash
   npm install -g @mmotti/niimblue-cli
   ```
   *(This installs the driver that talks to the Niimbot B1)*

## Step 3: Test the Connection
1. Connect your Niimbot B1 via **USB** cable to the PC.
2. In the same Command Prompt window, type:
   ```bash
   niimblue-cli scan
   ```
3. If it lists a device (like `COM3` or `B1`), you are ready!

## Step 4: Run the Print Service
Now you just double-click the `MushroomPrintService.exe` file. It should now find the tool and print successfully via USB (or Bluetooth).

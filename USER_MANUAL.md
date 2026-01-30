# Mushroom MVP: User Manual 🍄

Welcome to your new Mushroom Production System! This guide will help the farm team use the app effectively.

## 📱 Getting Started
1. **Access the App**: Open the URL on your mobile browser (Chrome/Safari).
2. **Add to Home Screen**: For the best experience, tap "Share" -> "Add to Home Screen" to install it as an App.

## ⚙️ Initial Setup (Manager Only)
Before workers start, you must define the strains you grow.
1. Tap the **Menu Icon** (Top Right) -> **Settings**.
2. **Add Strain**:
   - Name: `Oyster - Blue`
   - Days: `14` (Colonization time)
3. Tap **Add**. Repeat for all varieties.

## 🔐 Logging In
1. **Security**: The system is password protected.
2. Enter the farm password: `0858902354`.
3. You will stay logged in for 30 days.

## 🏭 Core Workflow

### 1. 📦 Bulk Create (Recommended)
For creating **multiple batches at once** (e.g., 20 substrate blocks):
1. Tap the **Layers icon** in the header (or go to `/batches/bulk`).
2. Choose **Type**:
   - **🌾 Grain**: Select a Strain from dropdown. No parent.
   - **🧱 Substrate/Bulk**: Scan the Parent Grain ID. Strain is inherited.
3. Enter **Quantity** (e.g., `20`).
4. Tap **Generate Batches**.
5. Review the created IDs (e.g., `S-20260129-01` to `S-20260129-20`).
6. Tap **Print All Labels** to print everything at once.

### 2. 🌾 Creating Grain Spawn (Lab - Individual)
When inoculating a single grain bag:
1. Tap the big green **SCAN** button.
2. Scan the **new QR code** on the bag (or type `G-001`).
3. If it's new, the "Register Batch" page opens.
4. Select **Type**: `Grain Spawn`.
5. Select **Strain**: e.g., `Oyster - Blue`.
6. Tap **Register Batch**.

### 3. 🖨️ Printing Labels
Before printing from the computer, you must start the **Print Service**:
1. Open the project folder on your PC.
2. Double-click the file **`START_PRINTER.bat`**.
3. A black window will open. **Keep it open** while you work.
   - The system will **automatically try USB first**.
   - If not connected via USB, it will try Bluetooth.

After registering a batch in the app:
1. Tap the **Print Label** button.
2. Select the **Label Size** (Default is 40x30mm).
3. Tap **Print**.

### 4. 🧱 Creating Substrate Blocks (Individual)
When moving Grain to Substrate:
1. Tap **SCAN**.
2. Scan the **new QR code** for the substrate block (e.g., `S-001`).
3. Select **Type**: `Substrate Block`.
4. **Scan Parent**: Tap the "Parent Source ID" field and scan the **Grain Bag** (`G-001`) you are using.
   - *This links them together! If the grain was bad, we will know.*
5. Tap **Register Batch**.

### 5. ✅ Status Updates
As batches move through the farm:
1. **Scan** the batch to view details.
2. Tap the buttons to update status:
   - **Mark Ready**: When colonization is done.
   - **Mark Sold**: When shipped/sold to customer.
   - **Contaminated**: If you see mold/green. 
     - *⚠️ Warning: This flags the batch in RED.*

## 🚨 Handling Contamination
If you find a contaminated bag:
1. **Scan it** immediately.
2. Tap **Contaminated**.
3. **Check the Family**:
   - The system will allow you to see where it came from.
   - Check if other children of the same parent are at risk!
   - If a **Parent** is marked contaminated, all its children will show a **RED WARNING** when scanned.

## 📊 Dashboard
The Home page shows:
- **Ready Stock**: What can be sold right now.
- **Potential Revenue**: Value of ready stock (£20/kit).
- **Incubating**: What is currently growing.
- **Contam Rate**: Your success rate for the last 30 days.
- **Action Needed**: Batches older than 45 days that need harvest.

## 🏷️ NIIMBOT B1 Label Specs
| Setting | Recommended Value |
|---------|-------------------|
| **Label Width** | 40mm or 50mm |
| **Label Height** | 30mm to 80mm |
| **Best Size** | **40x30mm** (product tags) or **50x80mm** (shipping) |
| **Print DPI** | 203 DPI |

> 💡 **Tip**: Use 40x30mm labels for small bags, and 50x80mm for boxes or large containers.

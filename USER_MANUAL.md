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

### 1. 🌾 Creating Grain Spawn (Lab)
When you inoculate a new grain bag:
1. Tap the big green **SCAN** button.
2. Scan the **new QR code** on the bag (or type `G-001`).
3. If it's new, the "Register Batch" page opens.
4. Select **Type**: `Grain Spawn`.
5. Select **Strain**: e.g., `Oyster - Blue`.
6. Tap **Register Batch**.

### 2. 🖨️ Printing Labels (Optional)
After registering a batch:
1. Tap the **Print Label** button.
2. **If on PC**: The label prints automatically (if Print Service is running).
3. **If on Mobile**: 
   - The label image creates a popup.
   - Save the image to your phone.
   - Open the **NIIMBOT App** and print via Bluetooth.

### 3. 🧱 Creating Substrate Blocks (Production)
When moving Grain to Substrate:
1. Tap **SCAN**.
2. Scan the **new QR code** for the substrate block (e.g., `S-001`).
3. Select **Type**: `Substrate Block`.
4. **Scan Parent**: Tap the "Parent Source ID" field and scan the **Grain Bag** (`G-001`) you are using.
   - *This links them together! If the grain was bad, we will know.*
5. Tap **Register Batch**.

### 4. ✅ Status Updates
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
- **Incubating**: What is currently growing.
- **Contam Rate**: Your success rate for the last 30 days.

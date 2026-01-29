# Mushroom MVP 🍄

A production management system for mushroom farms. Includes batch tracking, genealogy lineage, and barcode printing.

## 🚀 Features
- **Batch Tracking**: Track Grain -> Substrate -> Bulk batches.
- **Traceability**: Link batches to parents (Grain-to-Grain transfers).
- **Dashboard**: Real-time stats on "Ready" and "Incubating" stock.
- **Scanning**: Optimized for barcode scanners (or manual entry).
- **Label Printing**: Integrates with NIIMBOT B1 thermal printers.

## 🛠️ Deployment on Vercel

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/mushroom-mvp.git
   git branch -M main
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [Vercel](https://vercel.com) -> "Add New Project".
   - Select your GitHub repo.
   - **Environment Variables**:
     Add the following variables in Vercel settings:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://wjixkrgakcjxtvhczwyf.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni... (Use your local .env key)
     ```
   - Click **Deploy**.

## 🖨️ Setting Up Printing (Hybrid Mode)

Since Vercel runs in the cloud, it cannot access your local USB/Bluetooth printer directly. We use a **Hybrid Approach**:

1. **On your PC**: Run the Python Print Service.
   ```powershell
   cd print-service
   pip install flask flask-cors pillow qrcode[pil] bleak
   python app.py
   ```
   *Keep this running whenever you want to print.*

2. **On the Web App (Vercel)**:
   - When you click "Print Label", the website talks directly to `localhost:5000` on your computer.
   - Chrome/Edge will allow this connection.
   
3. **From Mobile**:
   - If using the app on phone, the "Print" button will fail to connect to your PC's Python service (unless you own the network config).
   - **Fallback**: The button will error but provide the generated image. Save it and print using the NIIMBOT app.

## 📚 Documentation
- [User Manual](./USER_MANUAL.md) - How to use the app.
- [Print Service](./print-service/README.md) - Deep dive on the printer integration.

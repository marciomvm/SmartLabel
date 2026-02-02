import PyInstaller.__main__
import os

# Get absolute path to the current directory
dir_path = os.path.dirname(os.path.realpath(__file__))

PyInstaller.__main__.run([
    'app.py',
    '--name=MushroomPrintService',
    '--onefile',
    '--console',
    f'--add-data=label_generator.py;.',
    f'--add-data=auto_updater.py;.',
    f'--add-data=version.txt;.',
    '--hidden-import=flask',
    '--hidden-import=flask_cors',
    '--hidden-import=qrcode',
    '--hidden-import=PIL',
    '--hidden-import=bleak',
])

print("\\n✅ Build complete!")
print("📦 Output: dist/MushroomPrintService.exe")
print("\\n📋 Next steps:")
print("1. Create a GitHub Release with tag (e.g., v1.0.1)")
print("2. Upload dist/MushroomPrintService.exe as a release asset")
print("3. The app will auto-update when users run it!")

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
    '--hidden-import=flask',
    '--hidden-import=flask_cors',
    '--hidden-import=qrcode',
    '--hidden-import=PIL',
    '--hidden-import=bleak',
])

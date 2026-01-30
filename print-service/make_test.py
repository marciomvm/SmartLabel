from PIL import Image, ImageDraw

# Create a simple test label with black content
width, height = 384, 240
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img)

# Draw some black rectangles and lines
draw.rectangle([10, 10, 374, 50], fill='black')
draw.rectangle([10, 60, 374, 100], fill='black')
draw.text((50, 120), "TEST LABEL", fill='black')
draw.rectangle([10, 180, 374, 230], fill='black')

img.save('test_black.png')
print("Created test_black.png")
print("Run: python printer.py test_black.png")

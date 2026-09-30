from PIL import Image
import glob
import os

images = ["assets/beverages.jpg", "assets/food.jpg", "assets/salad.jpg"]

for img_path in images:
    if os.path.exists(img_path):
        img = Image.open(img_path)
        width, height = img.size
        
        # Crop the bottom 20% to remove text
        # crop tuple is (left, upper, right, lower)
        cropped_img = img.crop((0, 0, width, int(height * 0.8)))
        cropped_img.save(img_path)
        print(f"Cropped {img_path}")

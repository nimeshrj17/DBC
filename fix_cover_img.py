from PIL import Image
import os

img_path = "/Users/nimeshranjan/.gemini/antigravity/brain/43444c3d-0c44-4da2-83a9-6cccf50a473b/cafe_cover_illustration_1790494417566.jpg"
out_path = "assets/cover.jpg"

if os.path.exists(img_path):
    img = Image.open(img_path)
    width, height = img.size
    
    # Crop the middle 60% of the image (removing top 25% and bottom 20% approx to avoid text)
    cropped_img = img.crop((0, int(height * 0.22), width, int(height * 0.75)))
    cropped_img.save(out_path)
    print(f"Cropped and saved {out_path}")

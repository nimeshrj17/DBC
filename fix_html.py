import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# 1. Fix Hindi fonts by creating a specific class
style_to_add = """
        .hindi-font {
            font-family: 'Noto Sans Devanagari', sans-serif !important;
            line-height: 1.2;
            display: inline-block;
        }
"""
content = content.replace('.serif-font {', style_to_add + '\n        .serif-font {')

content = content.replace('<h2 class="category-title text-[#d97706] text-5xl mb-4 font-bold">चाय', '<h2 class="category-title text-[#d97706] text-5xl mb-4 font-bold"><span class="hindi-font">चाय</span>')
content = content.replace('<h2 class="category-title text-[#8b4513] text-5xl mb-4 font-bold">चाय के संग', '<h2 class="category-title text-[#8b4513] text-5xl mb-4 font-bold"><span class="hindi-font">चाय के संग</span>')
content = content.replace('राखा भाई की चाय', '<span class="hindi-font">राखा भाई की चाय</span>')

# 2. Add the images
# The first placeholder is in Page 1 (Beverages/Cold Stuff)
img1 = '<img src="./assets/beverages.jpg" alt="Beverages Illustration" class="w-full h-64 object-cover rounded-xl shadow-md border-2 border-dashed border-[#d2b48c] mb-6">'
# The second placeholder is in Page 2 (Left column top - Pizza) -> replaced with food.jpg
img2 = '<img src="./assets/food.jpg" alt="Food Illustration" class="w-full h-64 object-cover rounded-xl shadow-md border-2 border-dashed border-[#d2b48c] mb-6">'
# The third placeholder is in Page 2 (Left column bottom - Burger) -> replaced with salad.jpg
img3 = '<img src="./assets/salad.jpg" alt="Salad Illustration" class="w-full h-48 object-cover rounded-xl shadow-md border-2 border-dashed border-[#d2b48c] mt-auto">'

placeholders = re.findall(r'<div class="w-full h-48 border-2 border-dashed.*?</div>', content, flags=re.DOTALL)
if len(placeholders) >= 3:
    content = content.replace(placeholders[0], img1)
    content = content.replace(placeholders[1], img2)
    content = content.replace(placeholders[2], img3)

# Remove the rotate from category-title just to be safe with Hindi rendering alignment
content = content.replace('transform: rotate(-2deg);', '/* transform: rotate(-2deg); */')

with open('physical_menu.html', 'w') as f:
    f.write(content)

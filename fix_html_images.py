import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# Replace all beverages.jpg with a unique marker to avoid replacing all at once
content = content.replace('<img src="./assets/beverages.jpg" alt="Beverages Illustration" class="w-full h-64 object-cover rounded-xl shadow-md border-2 border-dashed border-[#d2b48c] mb-6">', '[[IMG_PLACEHOLDER]]')

# Now we have 3 placeholders. We will replace them sequentially.
img1 = '<img src="./assets/beverages.jpg" alt="Beverages Illustration" class="w-full h-auto object-cover mb-6" style="mix-blend-mode: multiply;">'
img2 = '<img src="./assets/food.jpg" alt="Food Illustration" class="w-full h-auto object-cover mb-6" style="mix-blend-mode: multiply;">'
img3 = '<img src="./assets/salad.jpg" alt="Salad Illustration" class="w-full h-auto object-cover mt-auto" style="mix-blend-mode: multiply;">'

content = content.replace('[[IMG_PLACEHOLDER]]', img1, 1)
content = content.replace('[[IMG_PLACEHOLDER]]', img2, 1)
content = content.replace('[[IMG_PLACEHOLDER]]', img3, 1)

with open('physical_menu.html', 'w') as f:
    f.write(content)


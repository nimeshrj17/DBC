import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# 1. Branding
branding_html = """
    <div class="text-center mb-8 border-b-2 border-dashed border-[#8b3a2b] pb-4">
        <h1 class="text-5xl text-[#2c1810] serif-font font-black tracking-wide">राखा भाई की चाय</h1>
        <p class="text-xl text-[#8b3a2b] font-bold tracking-widest mt-2 uppercase">&amp; Cafe</p>
    </div>
"""
# Insert branding at the top of Page 1 (Beverages page)
content = content.replace('<!-- PAGE 1: Beverages & Chai -->\n<div class="page flex gap-8">', '<!-- PAGE 1: Beverages & Chai -->\n<div class="page flex flex-col gap-4">\n' + branding_html + '\n<div class="flex gap-8 w-full">')
# Close the flex container at the end of page 1
content = content.replace('<!-- PAGE 1: Starters & Chinese -->', '</div>\n</div>\n\n<!-- PAGE 1: Starters & Chinese -->')

# 2. Hindi Headings
content = content.replace('<h2 class="category-title text-[#d97706] text-4xl mb-4">Chai</h2>', '<h2 class="category-title text-[#d97706] text-5xl mb-4 font-bold">चाय <span class="text-2xl text-gray-500 script-font">(Chai)</span></h2>')
content = content.replace('<h2 class="category-title text-[#8b4513] text-4xl mb-4">Chai Ke Sang</h2>', '<h2 class="category-title text-[#8b4513] text-5xl mb-4 font-bold">चाय के संग <span class="text-2xl text-gray-500 script-font">(Chai Ke Sang)</span></h2>')

# 3. Cold Stuff color
content = content.replace('<h2 class="category-title text-green-800 text-5xl mb-4 mt-8">Cold Stuff</h2>', '<h2 class="category-title text-[#0284c7] text-6xl mb-4 mt-8">Cold Stuff</h2>')

# 4. Remove Images, insert Illustration placeholders
# Find all <img ...> tags and replace them with a doodle placeholder
svg_doodle = """
        <div class="w-full h-48 border-2 border-dashed border-[#d2b48c] rounded-xl flex flex-col items-center justify-center text-[#d2b48c] bg-[#fdfbf7] mb-6">
            <svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            <span class="script-font text-2xl">[ Hand-drawn Illustration Here ]</span>
        </div>
"""
content = re.sub(r'<img[^>]+>', svg_doodle, content)

# 5. Price font
# In <style>, update .item-price
price_style_old = """        .item-price {
            font-weight: 700;
            font-size: 1.1rem;
            color: var(--brand-accent);
        }"""
price_style_new = """        .item-price {
            font-family: 'Caveat', cursive;
            font-weight: 700;
            font-size: 1.6rem;
            color: var(--brand-accent);
        }"""
content = content.replace(price_style_old, price_style_new)

# Add Noto Sans Devanagari to Google Fonts for Hindi rendering
content = content.replace('family=Caveat', 'family=Noto+Sans+Devanagari:wght@700&family=Caveat')

with open('physical_menu.html', 'w') as f:
    f.write(content)


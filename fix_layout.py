import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# 1. Move Chai Ke Sang to the right column
chai_ke_sang = """        <div class="section-break">
            <h2 class="category-title text-[#8b4513] text-5xl mb-4 font-bold"><span class="hindi-font">चाय के संग</span> <span class="text-2xl text-gray-500 script-font">(Chai Ke Sang)</span></h2>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Maska Bun</span><span class="item-price">₹35</span></div>
                <div class="item-desc">Soft toasted bun generously spread with creamy butter — a timeless chai-time classic.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Chocolate Bun</span><span class="item-price">₹50</span></div>
                <div class="item-desc">Soft toasted bun filled with rich, creamy chocolate for the perfect sweet chai companion.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Nutella Bun</span><span class="item-price">₹80</span></div>
                <div class="item-desc">Warm toasted bun generously filled with smooth, indulgent Nutella — simple, warm & delicious.</div>
            </div>
        </div>"""

# Remove it from the left column
content = content.replace(chai_ke_sang, '')

# Add it to the end of the right column (after KitKat Shake's div ending and the section-break div ending)
target = """            <div class="menu-item">
                <div class="menu-header"><span class="item-name">KitKat Shake</span><span class="item-price">₹129</span></div>
                <div class="item-desc">Rich chocolate shake blended with KitKat pieces for a creamy, crunchy indulgence.</div>
            </div>
        </div>"""
replacement = target + "\n\n" + chai_ke_sang
content = content.replace(target, replacement)


# 2. Add safe padding at the bottom of the page in print CSS so content doesn't hit footer
padding_css = """
            .page { 
                margin: 0; 
                box-shadow: none; 
                width: 210mm;
                height: 297mm;
                padding-bottom: 22mm !important; /* Huge bottom padding for footer safety */
                overflow: hidden;
                page-break-after: always;
                page-break-inside: avoid;
            }"""
content = re.sub(r'\.page \{\s*margin: 0;\s*box-shadow: none;\s*width: 210mm;\s*height: 297mm;\s*overflow: hidden;\s*page-break-after: always;\s*page-break-inside: avoid;\s*\}', padding_css, content)

# 3. Reduce image margins/heights slightly globally to buy space
content = content.replace('w-full h-auto object-cover mb-6', 'w-full h-auto object-cover mb-2 max-h-48')
content = content.replace('w-full h-auto object-cover mt-auto', 'w-full h-auto object-cover mt-2 max-h-40')


with open('physical_menu.html', 'w') as f:
    f.write(content)

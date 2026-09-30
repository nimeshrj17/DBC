import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# We need to extract the Beverages Side and put it as Page 1.
# The Beverages side is currently inside PAGE 3.
# Let's completely rewrite the HTML to make this page 1.

page3_beverages = """    <!-- Beverages Side -->
    <div class="w-1/2 bg-[#f9f4e8] p-6 rounded-2xl border-2 border-dashed border-[#d2b48c]">
        <div class="text-center mb-6">
            <h1 class="text-7xl text-[var(--brand-dark)] script-font mb-0">Beverages</h1>
            <p class="category-subtitle">HOT & COLD REFRESHMENTS</p>
        </div>

        <div class="section-break">
            <h2 class="category-title text-[#d97706] text-4xl mb-4">Chai</h2>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Adrak Chai</span><span class="item-price">₹25</span></div>
                <div class="item-desc">A strong, aromatic tea brewed with freshly pounded ginger — perfect for a refreshing kick.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Masala / Elaichi Chai</span><span class="item-price">₹30</span></div>
                <div class="item-desc">A soul-warming blend of premium tea leaves infused with fragrant cardamom and traditional Indian spices.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">No Sugar Chai</span><span class="item-price">₹30</span></div>
                <div class="item-desc">All the rich, bold flavours of our signature tea without the sweetness — pure and authentic.</div>
            </div>
        </div>

        <div class="section-break">
            <h2 class="category-title text-[var(--brand-dark)] text-4xl mb-4">Coffee</h2>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Hot Coffee</span><span class="item-price">₹50</span></div>
                <div class="item-desc">Smooth, comforting hot coffee prepared with rich coffee and creamy milk.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Black Coffee</span><span class="item-price">₹40</span></div>
                <div class="item-desc">Bold brewed coffee with a clean, rich finish — served without milk.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Cold Coffee</span><span class="item-price">₹110</span></div>
                <div class="item-desc">Chilled, creamy coffee blended with milk, sugar & ice for a smooth café-style treat.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Iced Americano</span><span class="item-price">₹99</span></div>
                <div class="item-desc">Bold espresso poured over ice and chilled water for a crisp, refreshing coffee.</div>
            </div>
        </div>

        <div class="section-break">
            <h2 class="category-title text-[#8b4513] text-4xl mb-4">Chai Ke Sang</h2>
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
        </div>
    </div>"""

# Let's construct a new page 1 out of Beverages and Cold stuff
new_page_1 = f"""
<!-- PAGE 1: Beverages & Chai -->
<div class="page flex gap-8">
{page3_beverages}
    
    <div class="w-1/2 p-4">
        <img src="https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80" alt="Beverages" class="rounded-xl shadow-md h-64 object-cover w-full mb-6">
        
        <div class="section-break">
            <h2 class="category-title text-green-800 text-5xl mb-4 mt-8">Cold Stuff</h2>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Iced Lemon Tea</span><span class="item-price">₹105</span></div>
                <div class="item-desc">Chilled brewed tea blended with fresh lemon, ice & a touch of sweetness.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Mint Mojito</span><span class="item-price">₹130</span></div>
                <div class="item-desc">A refreshing blend of fresh mint, lime, soda & a hint of sweetness.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Lemon Soda</span><span class="item-price">₹60</span></div>
                <div class="item-desc">Zesty fresh lemon with chilled soda and a touch of sweetness.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Watermelon Mojito</span><span class="item-price">₹130</span></div>
                <div class="item-desc">Juicy watermelon, fresh mint, lime & sparkling soda blended into a refreshing cooler.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Strawberry Shake</span><span class="item-price">₹110</span></div>
                <div class="item-desc">Creamy milkshake blended with sweet strawberries for a rich, fruity treat.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Mango Shake</span><span class="item-price">₹110</span></div>
                <div class="item-desc">Thick and creamy shake made with luscious mango, chilled milk & a touch of sweetness.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">Oreo Shake</span><span class="item-price">₹139</span></div>
                <div class="item-desc">Creamy vanilla shake blended with crunchy Oreo cookies for an indulgent treat.</div>
            </div>
            <div class="menu-item">
                <div class="menu-header"><span class="item-name">KitKat Shake</span><span class="item-price">₹129</span></div>
                <div class="item-desc">Rich chocolate shake blended with KitKat pieces for a creamy, crunchy indulgence.</div>
            </div>
        </div>
    </div>
</div>
"""

# Extract the body parts
body_start_idx = content.find('<body>') + len('<body>')
body_end_idx = content.find('</body>')
body_content = content[body_start_idx:body_end_idx]

# Remove the old Beverages Side from PAGE 3.
# The section starts with <!-- Beverages Side --> and goes to the end of the page (which is just before </body>).
beverages_idx = body_content.find('<!-- Beverages Side -->')
page3_without_beverages = body_content[:beverages_idx]

# If we remove Beverages from Page 3, it only has the left side (Sandwiches, Wraps, Burgers).
# We can expand them to two columns or just leave it. For now, let's just make it two columns.
page3_without_beverages = page3_without_beverages.replace('<div class="w-1/2">', '<div class="w-full two-col">')

# New body content
new_body_content = "\n" + new_page_1 + "\n" + page3_without_beverages

content = content[:body_start_idx] + new_body_content + content[body_end_idx:]

with open('physical_menu.html', 'w') as f:
    f.write(content)


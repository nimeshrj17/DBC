import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

cover_page = """
<!-- PAGE 0: COVER PAGE -->
<div class="page flex flex-col items-center justify-center text-center">
    <div class="border-2 border-dashed border-[#8b3a2b] rounded-3xl p-12 w-full h-full flex flex-col items-center justify-center bg-[#fdfbf7] bg-opacity-60 relative">
        <!-- Top Ornaments -->
        <div class="text-[#8b3a2b] text-3xl mb-8 opacity-80">✦ ✧ ✦</div>
        
        <!-- Main Branding -->
        <h1 class="text-7xl text-[#2c1810] serif-font font-black tracking-widest mb-2" style="font-family: 'Kalam', cursive;">राखा भाई की चाय</h1>
        <p class="text-3xl text-[#8b3a2b] font-bold tracking-[0.3em] uppercase mb-12">&amp; Cafe</p>
        
        <!-- Illustration -->
        <img src="./assets/cover.jpg" alt="Cover Art" class="w-full max-w-md h-auto object-cover mb-12" style="mix-blend-mode: multiply;">
        
        <!-- Menu Text -->
        <h2 class="text-6xl text-[#d97706] mb-4 script-font" style="font-family: 'Caveat', cursive;">Our Menu</h2>
        
        <!-- Bottom Ornaments -->
        <div class="text-[#8b3a2b] text-3xl mt-8 opacity-80">✦ ✧ ✦</div>
    </div>
</div>
"""

body_idx = content.find('<body>') + len('<body>')
content = content[:body_idx] + "\n" + cover_page + content[body_idx:]

with open('physical_menu.html', 'w') as f:
    f.write(content)

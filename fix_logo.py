import re
with open('src/app/order/[tableId]/page.tsx', 'r') as f:
    content = f.read()

# Fix the missing </span> around line 378
content = content.replace('<div className="w-8 h-8 rounded-full overflow-hidden bg-[#FDFBF7]"><CustomerLogo /></div>\n          <span className="text-xs tracking-wider uppercase font-bold text-stone-700">राखा भाई की चाय</span>', '<div className="w-8 h-8 rounded-full overflow-hidden bg-[#FDFBF7]"><CustomerLogo /></div></span>\n          <span className="text-xs tracking-wider uppercase font-bold text-stone-700">राखा भाई की चाय</span>')

with open('src/app/order/[tableId]/page.tsx', 'w') as f:
    f.write(content)

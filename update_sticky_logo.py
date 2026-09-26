import re
with open('src/app/order/[tableId]/page.tsx', 'r') as f:
    content = f.read()

pattern = r'<div className="w-10 h-10 rounded-none bg-white/20 border border-white/30 flex items-center justify-center text-amber-200">.*?</svg></div>'
content = re.sub(pattern, '<div className="w-10 h-10 rounded-full overflow-hidden bg-[#FDFBF7] shadow-sm"><CustomerLogo /></div>', content, flags=re.DOTALL)

with open('src/app/order/[tableId]/page.tsx', 'w') as f:
    f.write(content)

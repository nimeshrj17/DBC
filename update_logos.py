import re

with open('src/app/order/[tableId]/page.tsx', 'r') as f:
    content = f.read()

# Add import
if "import CustomerLogo" not in content:
    content = content.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\nimport CustomerLogo from '@/components/ui/CustomerLogo';")

# 1. Replace the top bar in the confirmation screen (lines ~300-308)
pattern1 = r'<svg className="w-6 h-6 text-\[\#d4a87a\]" fill="none".*?<span className="text-xs tracking-wider uppercase font-bold text-\[\#d4a87a\]">राखा भाई की चाय</span>'
content = re.sub(pattern1, '<div className="w-8 h-8 rounded-full overflow-hidden bg-white"><CustomerLogo /></div>\n            <span className="text-xs tracking-wider uppercase font-bold text-[#d4a87a]">राखा भाई की चाय</span>', content, flags=re.DOTALL)

# 2. Replace the top bar in the justPaid screen (lines ~380-386)
pattern2 = r'<svg className="w-7 h-7 text-\[\#2e1c14\]" fill="none".*?<span className="text-xs tracking-wider uppercase font-bold text-stone-700">राखा भाई की चाय</span>'
content = re.sub(pattern2, '<div className="w-8 h-8 rounded-full overflow-hidden bg-[#FDFBF7]"><CustomerLogo /></div>\n          <span className="text-xs tracking-wider uppercase font-bold text-stone-700">राखा भाई की चाय</span>', content, flags=re.DOTALL)

# 3. Replace the main header (lines ~867-877)
pattern3 = r'<div className="w-14 h-14 rounded-none bg-gradient-to-tr.*?<span className="text-\[10px\] text-amber-300 font-normal">Authentic Sips</span>\s*</p>\s*</div>'
content = re.sub(pattern3, '<div className="w-16 h-16 rounded-full overflow-hidden bg-[#FDFBF7] shadow-lg border-2 border-[#FDFBF7]"><CustomerLogo /></div>\n<div>\n<h1 className="text-2xl font-extrabold tracking-tight text-white font-[\'Mukta\'] leading-tight">राखा भाई की चाय</h1>\n<p className="text-xs uppercase tracking-[0.25em] font-bold text-amber-200/90 flex items-center gap-1.5">\n<span>And Café</span>\n<span className="inline-block w-1 h-1 rounded-full bg-amber-400"></span>\n<span className="text-[10px] text-amber-300 font-normal">Authentic Sips</span>\n</p>\n</div>', content, flags=re.DOTALL)

with open('src/app/order/[tableId]/page.tsx', 'w') as f:
    f.write(content)

import re
with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Fix NewTableCard button text size on mobile
content = content.replace('text-xs font-bold text-slate-700 hover:bg-slate-100', 'text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-slate-100')
content = content.replace('text-xs font-bold text-rose-600 hover:bg-rose-50', 'text-[11px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50')
content = content.replace('className="flex bg-slate-50 border-t border-slate-100"', 'className="flex flex-col xl:flex-row bg-slate-50 border-t border-slate-100"')
content = content.replace('border-r border-slate-200', 'border-b xl:border-b-0 xl:border-r border-slate-200')

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

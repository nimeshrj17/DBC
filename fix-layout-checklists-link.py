import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add link to Desktop Nav
old_nav = """            <Link href="/dashboard" className={pathname === '/dashboard' ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Dashboard
            </Link>"""

new_nav = """            <Link href="/dashboard" className={pathname === '/dashboard' ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Dashboard
            </Link>
            <Link href="/dashboard/checklists" className={pathname.startsWith('/dashboard/checklists') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Checklists
            </Link>"""

content = content.replace(old_nav, new_nav)

with open(filepath, "w") as f:
    f.write(content)


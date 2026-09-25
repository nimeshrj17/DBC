import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update Active Nav Classes
old_active = "bg-slate-100 text-slate-900 font-bold"
new_active = "bg-slate-900 text-[#D9F927] font-bold"
content = content.replace(old_active, new_active)

# 2. Update User Badge & Logout Button
old_user_section = """        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{user?.name}</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-none">{user?.role}</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <button 
            onClick={() => window.confirm("Are you sure you want to log out?") && logout()}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 transition-colors rounded-none"
          >
            LOGOUT
          </button>
        </div>"""

new_user_section = """        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{user?.name}</span>
            <span className="px-1.5 py-0.5 bg-slate-200/50 text-slate-600 text-[9px] font-bold tracking-widest uppercase rounded-none border border-slate-300/50">{user?.role}</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <button 
            onClick={() => window.confirm("Are you sure you want to log out?") && logout()}
            className="text-slate-400 hover:text-slate-800 transition-colors rounded-none"
            title="Log Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" x2="9" y1="12" y2="12"></line>
            </svg>
          </button>
        </div>"""

content = content.replace(old_user_section, new_user_section)

with open(filepath, "w") as f:
    f.write(content)

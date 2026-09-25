import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# State injection
state_injection = "  const [pin, setPin] = useState('');\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);"
if "const [isSidebarOpen" not in content:
    content = re.sub(r"  const \[pin, setPin\] = useState\(''\);", state_injection, content)

# 1. Sidebar Replacement
aside_pattern = r"      \{/\* Desktop Sidebar \(hidden on mobile\) \*/\}.*?      </aside>"
new_aside = """      {/* Desktop Sidebar Drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm transition-opacity hidden md:block"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={`fixed md:inset-y-0 md:left-0 z-50 w-72 bg-[#0F172A] text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800/80 select-none transition-transform duration-300 ease-in-out hidden md:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col">
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/60">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-[#D9F927]/30 flex items-center justify-center text-[#D9F927] shadow-inner shadow-[#D9F927]/10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
                  <line x1="6" x2="6" y1="2" y2="4"></line>
                  <line x1="10" x2="10" y1="2" y2="4"></line>
                  <line x1="14" x2="14" y1="2" y2="4"></line>
                </svg>
              </div>
              <div className="leading-tight">
                <h1 className="text-white font-bold text-base tracking-tight font-display">राखा भाई की चाय</h1>
                <p className="text-xs text-[#D9F927] font-medium tracking-wide">and Cafe • POS</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-md transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <nav aria-label="Sidebar Navigation" className="p-4 space-y-1.5">
            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard" className={getLinkClass('/dashboard')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <rect height="7" rx="1.5" width="7" x="3" y="3"></rect>
                  <rect height="7" rx="1.5" width="7" x="14" y="3"></rect>
                  <rect height="7" rx="1.5" width="7" x="14" y="14"></rect>
                  <rect height="7" rx="1.5" width="7" x="3" y="14"></rect>
                </svg>
                <span className="text-sm">Dashboard (Tables)</span>
              </div>
            </Link>
            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard/orders" className={getLinkClass('/dashboard/orders')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" x2="8" y1="13" y2="13"></line>
                  <line x1="16" x2="8" y1="17" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span className="text-sm">Live Kitchen (KDS)</span>
              </div>
            </Link>
            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard/takeaway" className={getLinkClass('/dashboard/takeaway')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="text-sm">Takeaway / POS</span>
              </div>
            </Link>
            
            {hasPermission('view_revenue') && (
            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard/analytics" className={getLinkClass('/dashboard/analytics')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span className="text-sm">Revenue Ledger</span>
              </div>
            </Link>
            )}

            {hasPermission('manage_menu') && (
            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard/menu" className={getLinkClass('/dashboard/menu')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span className="text-sm">Menu / Recipes</span>
              </div>
            </Link>
            )}
            
            {hasPermission('manage_inventory') && (
            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard/inventory" className={getLinkClass('/dashboard/inventory')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span className="text-sm">Stock & Inventory</span>
              </div>
            </Link>
            )}

            {hasPermission('manage_staff') && (
            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard/staff" className={getLinkClass('/dashboard/staff')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="text-sm">Staff Profiles</span>
              </div>
            </Link>
            )}

            {hasPermission('manage_settings') && (
            <Link onClick={() => setIsSidebarOpen(false)} href="/dashboard/settings" className={getLinkClass('/dashboard/settings')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span className="text-sm">App Settings</span>
              </div>
            </Link>
            )}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[#D9F927] text-slate-900 font-extrabold flex items-center justify-center text-base shadow-sm uppercase">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-semibold text-white tracking-wide truncate">{user?.name}</h4>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider truncate">{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) {
                  logout();
                }
              }}
              className="mt-2 w-full py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 hover:border-rose-900/50"
            >
              Log Out
            </button>
          </div>
        </div>
      </aside>"""
      
content = re.sub(aside_pattern, new_aside, content, flags=re.DOTALL)

# Header replacement
bad_header = """        {/* Desktop Header */}
        <header className="hidden md:flex px-8 pt-8 pb-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Good morning, {user?.name}!</h2>"""
              
good_header = """        {/* Desktop Header */}
        <header className="hidden md:flex px-8 pt-6 pb-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Good morning, {user?.name}!</h2>"""
                
content = content.replace(bad_header, good_header)

with open(filepath, "w") as f:
    f.write(content)


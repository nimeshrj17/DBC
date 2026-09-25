import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Replace Desktop Sidebar & Desktop Header with the new Top Navbar
# 1. Identify the block from '{/* Desktop Sidebar Drawer */}' down to '{/* Mobile Header (from mobile_dashboard.html) */}'
pattern = r"\{/\* Desktop Sidebar Drawer \*/\}.*?\{/\* Mobile Header \(from mobile_dashboard\.html\) \*/\}"

# Ensure we use re.DOTALL to match across newlines
match = re.search(pattern, content, flags=re.DOTALL)
if match:
    new_header_code = """{/* Desktop Top Navigation Bar */}
      <header className="hidden md:flex px-6 h-16 border-b border-slate-200 bg-white sticky top-0 z-50 items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-8 h-8 rounded-none bg-slate-900 text-[#D9F927] flex items-center justify-center shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
                <line x1="6" x2="6" y1="2" y2="4"></line>
                <line x1="10" x2="10" y1="2" y2="4"></line>
                <line x1="14" x2="14" y1="2" y2="4"></line>
              </svg>
            </div>
            <div className="leading-tight flex flex-col">
              <span className="font-bold text-slate-900 text-sm tracking-tight font-display">राखा भाई की चाय</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">POS System</span>
            </div>
          </div>
          
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className={pathname === '/dashboard' ? 'flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-900 font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Dashboard
            </Link>
            <Link href="/dashboard/orders" className={pathname.startsWith('/dashboard/orders') ? 'flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-900 font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Live Orders
              {liveOrdersCount > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-none text-[10px] font-bold">{liveOrdersCount}</span>}
            </Link>
            <Link href="/dashboard/takeaway" className={pathname.startsWith('/dashboard/takeaway') ? 'flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-900 font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Takeaway
            </Link>
            {hasPermission('view_revenue') && (
              <Link href="/dashboard/analytics" className={pathname.startsWith('/dashboard/analytics') ? 'flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-900 font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                Analytics
              </Link>
            )}
            {hasPermission('manage_menu') && (
              <Link href="/dashboard/menu" className={pathname.startsWith('/dashboard/menu') ? 'flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-900 font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                Menu
              </Link>
            )}
            {hasPermission('manage_inventory') && (
              <Link href="/dashboard/inventory" className={pathname.startsWith('/dashboard/inventory') ? 'flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-900 font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                Inventory
              </Link>
            )}
            {hasPermission('manage_staff') && (
              <Link href="/dashboard/staff" className={pathname.startsWith('/dashboard/staff') ? 'flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-900 font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                Staff
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
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
        </div>
      </header>

      {/* Mobile Header (from mobile_dashboard.html) */}"""
    content = content[:match.start()] + new_header_code + content[match.end():]
else:
    print("Pattern not found!")

# Optional: Cleanup unused state 'isSidebarOpen' to avoid lint warnings
if "const [isSidebarOpen, setIsSidebarOpen] = useState(false);" in content:
    content = content.replace("const [isSidebarOpen, setIsSidebarOpen] = useState(false);", "// Desktop sidebar replaced by top nav")

with open(filepath, "w") as f:
    f.write(content)

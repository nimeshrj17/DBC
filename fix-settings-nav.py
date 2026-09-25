filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Desktop Navigation Addition
old_desktop = """            {hasPermission('manage_staff') && (
              <Link href="/dashboard/staff" className={pathname.startsWith('/dashboard/staff') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                Staff
              </Link>
            )}
          </nav>"""

new_desktop = """            {hasPermission('manage_staff') && (
              <>
                <Link href="/dashboard/staff" className={pathname.startsWith('/dashboard/staff') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Staff
                </Link>
                <Link href="/dashboard/settings" className={pathname.startsWith('/dashboard/settings') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Settings
                </Link>
              </>
            )}
          </nav>"""

content = content.replace(old_desktop, new_desktop)

# 2. Mobile Navigation Addition
old_mobile = """            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) {
                  logout();
                }
              }}
              className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-none text-xs font-bold border border-rose-100"
            >
              Logout
            </button>"""

new_mobile = """            <div className="flex items-center gap-2">
              {hasPermission('manage_staff') && (
                <Link 
                  href="/dashboard/settings"
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-none text-xs font-bold border border-slate-200"
                >
                  Settings
                </Link>
              )}
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to log out?")) {
                    logout();
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-none text-xs font-bold border border-rose-100"
              >
                Logout
              </button>
            </div>"""

content = content.replace(old_mobile, new_mobile)

with open(filepath, "w") as f:
    f.write(content)

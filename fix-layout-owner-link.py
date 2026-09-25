import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add link to Desktop Nav
old_nav = """            {hasPermission('manage_staff') && (
              <>
                <Link href="/dashboard/staff" className={pathname.startsWith('/dashboard/staff') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Staff
                </Link>
                <Link href="/dashboard/settings" className={pathname.startsWith('/dashboard/settings') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Settings
                </Link>
              </>
            )}"""

new_nav = """            {hasPermission('manage_staff') && (
              <>
                <Link href="/dashboard/owner" className={pathname.startsWith('/dashboard/owner') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Owner
                </Link>
                <Link href="/dashboard/staff" className={pathname.startsWith('/dashboard/staff') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Staff
                </Link>
                <Link href="/dashboard/settings" className={pathname.startsWith('/dashboard/settings') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Settings
                </Link>
              </>
            )}"""

content = content.replace(old_nav, new_nav)

# Add to mobile nav (it's tightly packed, but let's add it carefully or skip since mobile nav is overflowing already?)
# Let's replace the Settings link in mobile header with a direct "Owner" button if they have permission, since mobile bottom nav is crowded.
old_mobile = """              {hasPermission('manage_staff') && (
                <Link 
                  href="/dashboard/settings"
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-none text-xs font-bold border border-slate-200"
                >
                  Settings
                </Link>
              )}"""

new_mobile = """              {hasPermission('manage_staff') && (
                <>
                  <Link 
                    href="/dashboard/owner"
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-none text-xs font-bold border border-indigo-200 shadow-sm"
                  >
                    Owner Module
                  </Link>
                  <Link 
                    href="/dashboard/settings"
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-none text-xs font-bold border border-slate-200"
                  >
                    Settings
                  </Link>
                </>
              )}"""
content = content.replace(old_mobile, new_mobile)

with open(filepath, "w") as f:
    f.write(content)


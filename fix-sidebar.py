import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add isSidebarOpen state
state_injection = "  const [pin, setPin] = useState('');\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);"
content = re.sub(r"  const \[pin, setPin\] = useState\(''\);", state_injection, content)

# Modify Sidebar
bad_sidebar = """      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-72 bg-[#0F172A] text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800/80 select-none">
        <div className="flex flex-col">
          <div className="h-20 flex items-center px-6 gap-3.5 border-b border-slate-800/60">"""

good_sidebar = """      {/* Desktop Sidebar Drawer */}
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
          </div>"""

content = content.replace(bad_sidebar, good_sidebar)

# Add Hamburger button to Desktop Header
bad_desktop_header = """        {/* Desktop Header */}
        <header className="hidden md:flex px-8 pt-8 pb-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Good morning, {user?.name}!</h2>"""

good_desktop_header = """        {/* Desktop Header */}
        <header className="hidden md:flex px-8 pt-6 pb-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Good morning, {user?.name}!</h2>"""

content = content.replace(bad_desktop_header, good_desktop_header)

with open(filepath, "w") as f:
    f.write(content)

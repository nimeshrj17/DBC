import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add Floor Map button for desktop
desktop_view_toggles = """              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700'}`} title="List View" type="button">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>"""
desktop_view_toggles_new = desktop_view_toggles + """
              <button onClick={() => setViewMode('floor')} className={`p-1.5 rounded-lg ${viewMode === 'floor' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700'}`} title="Floor Map" type="button">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4z"></path>
                  <path d="M9 4v16M15 4v16M4 9h16M4 15h16" opacity="0.3"></path>
                </svg>
              </button>"""
content = content.replace(desktop_view_toggles, desktop_view_toggles_new, 1)

# Add Floor Map button for mobile
mobile_view_toggles = """              <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-white text-slate-900 rounded-lg shadow-xs' : 'text-slate-400 hover:text-slate-600 rounded-lg'}`} title="List View">
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>"""
mobile_view_toggles_new = mobile_view_toggles + """
              <button onClick={() => setViewMode('floor')} className={`p-1.5 ${viewMode === 'floor' ? 'bg-white text-slate-900 rounded-lg shadow-xs' : 'text-slate-400 hover:text-slate-600 rounded-lg'}`} title="Floor Map">
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4z"></path>
                  <path d="M9 4v16M15 4v16M4 9h16M4 15h16" opacity="0.3"></path>
                </svg>
              </button>"""
content = content.replace(mobile_view_toggles, mobile_view_toggles_new, 1)

# Now, conditionally render FloorMap instead of lists
# The lists start after: `      <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-32 space-y-8 md:space-y-12">`
# Let's search for the start of active tables logic
bad_list_block_start = """      <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-32 space-y-8 md:space-y-12">
        {activeTables.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">"""

good_list_block_start = """      <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-32 space-y-8 md:space-y-12">
        {viewMode === 'floor' ? (
          <FloorMap 
            tables={tables} 
            activeZone={activeZone} 
            onSelectTable={(id) => setSelectedTableId(id)} 
            onUpdatePosition={updateTablePosition} 
          />
        ) : (
          <>
        {activeTables.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">"""

content = content.replace(bad_list_block_start, good_list_block_start)

bad_list_block_end = """        {tables.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-muted-foreground mb-4">No tables found.</p>
            <Button onClick={() => setIsAddTableOpen(true)}>Create your first table</Button>
          </div>
        )}
      </div>"""

good_list_block_end = """        {tables.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-muted-foreground mb-4">No tables found.</p>
            <Button onClick={() => setIsAddTableOpen(true)}>Create your first table</Button>
          </div>
        )}
        </>
        )}
      </div>"""

content = content.replace(bad_list_block_end, good_list_block_end)

with open(filepath, "w") as f:
    f.write(content)


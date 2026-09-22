import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add useSettings hook
content = content.replace(
    "const [assignCustomerModalOpen, setAssignCustomerModalOpen] = useState(false);",
    "const [assignCustomerModalOpen, setAssignCustomerModalOpen] = useState(false);\n  const { settings, updateSettings } = useSettings();\n  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);\n  const [newSectionName, setNewSectionName] = useState('');"
)

# Replace the text input for section with a select
bad_section_input = """                <div>
                  <label className="block text-sm font-medium mb-1">Section / Zone</label>
                  <input 
                    type="text" 
                    value={newTableSection}
                    onChange={(e) => setNewTableSection(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Main Hall"
                  />
                </div>"""

good_section_input = """                <div>
                  <label className="block text-sm font-medium mb-1">Section / Zone</label>
                  <select
                    value={newTableSection}
                    onChange={(e) => setNewTableSection(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {settings.tableSections?.map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>"""

content = content.replace(bad_section_input, good_section_input)

# Add "Manage Sections" button to Dashboard top right
bad_add_table_btn = """              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs">"""

good_add_table_btn = """              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <button onClick={() => setIsManageSectionsOpen(true)} className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm shadow-sm transition" type="button">
              <span>Manage Sections</span>
            </button>
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs">"""

content = content.replace(bad_add_table_btn, good_add_table_btn, 1)

# And also for mobile view
bad_add_table_btn_mobile = """            <button onClick={() => setIsAddTableOpen(true)} className="bg-[#D9F927] hover:bg-[#c9e81f] text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all">
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[3]" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">"""

good_add_table_btn_mobile = """            <button onClick={() => setIsAddTableOpen(true)} className="bg-[#D9F927] hover:bg-[#c9e81f] text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all">
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[3]" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <button onClick={() => setIsManageSectionsOpen(true)} className="bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs shadow-sm" type="button">
              Sections
            </button>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">"""

content = content.replace(bad_add_table_btn_mobile, good_add_table_btn_mobile, 1)

# Now inject the Manage Sections Modal at the bottom
manage_sections_modal = """
      {/* Manage Sections Modal */}
      {isManageSectionsOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-background rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-xl font-bold">Manage Sections</h3>
              <button onClick={() => setIsManageSectionsOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <ul className="space-y-2">
                {(settings.tableSections || []).map(section => (
                  <li key={section} className="flex justify-between items-center bg-muted p-2 rounded-lg text-sm">
                    <span className="font-medium text-foreground">{section}</span>
                    <button 
                      onClick={async () => {
                        const newSections = settings.tableSections.filter(s => s !== section);
                        await updateSettings({ tableSections: newSections });
                        toast.success("Section removed");
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              
              <div className="flex gap-2 pt-2">
                <input 
                  type="text"
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  placeholder="New section name"
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newSectionName.trim()) {
                      e.preventDefault();
                      const val = newSectionName.trim();
                      if ((settings.tableSections || []).includes(val)) {
                         toast.error("Section already exists");
                         return;
                      }
                      await updateSettings({ tableSections: [...(settings.tableSections || []), val] });
                      setNewSectionName('');
                      toast.success("Section added");
                    }
                  }}
                />
                <Button 
                  onClick={async () => {
                    if (!newSectionName.trim()) return;
                    const val = newSectionName.trim();
                    if ((settings.tableSections || []).includes(val)) {
                       toast.error("Section already exists");
                       return;
                    }
                    await updateSettings({ tableSections: [...(settings.tableSections || []), val] });
                    setNewSectionName('');
                    toast.success("Section added");
                  }}
                  variant="primary"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
"""

# inject before the last closing div of the page
content = content.replace("    </div>\n  );\n}", manage_sections_modal + "    </div>\n  );\n}")

with open(filepath, "w") as f:
    f.write(content)


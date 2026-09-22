import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/menu/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add useSettings hook
content = content.replace(
    "import { useInventory } from '@/lib/hooks/useInventory';",
    "import { useInventory } from '@/lib/hooks/useInventory';\nimport { useSettings } from '@/lib/hooks/useSettings';"
)

content = content.replace(
    "const [searchQuery, setSearchQuery] = useState('');",
    "const [searchQuery, setSearchQuery] = useState('');\n  const { settings, updateSettings } = useSettings();\n  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);\n  const [newCategoryName, setNewCategoryName] = useState('');"
)

# Update categories array to use settings if they exist (or fallback to existing items)
content = content.replace(
    "const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];",
    "const categories = ['All', ...(settings.menuCategories?.length ? settings.menuCategories : Array.from(new Set(menuItems.map(item => item.category))))];"
)

# Replace the Add Item text input with a select
bad_category_input = """                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input 
                    type="text" 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Beverages"
                  />
                </div>"""

good_category_input = """                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="" disabled>Select a category</option>
                    {settings.menuCategories?.map((cat: string) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>"""

content = content.replace(bad_category_input, good_category_input)

# Add "Manage Categories" button
bad_add_btn = """              <Button onClick={handleOpenAdd} className="gap-2">
                <Plus className="w-4 h-4" /> Add Item
              </Button>"""

good_add_btn = """              <Button variant="outline" onClick={() => setIsManageCategoriesOpen(true)} className="gap-2 hidden md:flex">
                Manage Categories
              </Button>
              <Button onClick={handleOpenAdd} className="gap-2">
                <Plus className="w-4 h-4" /> Add Item
              </Button>"""

content = content.replace(bad_add_btn, good_add_btn)

# Also mobile button
bad_add_btn_mobile = """            <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>"""

good_add_btn_mobile = """            <Button variant="outline" onClick={() => setIsManageCategoriesOpen(true)} size="sm" className="gap-1.5 whitespace-nowrap hidden md:flex">
              Cats
            </Button>
            <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>"""
content = content.replace(bad_add_btn_mobile, good_add_btn_mobile)

# Now inject the Manage Categories Modal at the bottom
manage_categories_modal = """
      {/* Manage Categories Modal */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-background rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-xl font-bold">Manage Categories</h3>
              <button type="button" onClick={() => setIsManageCategoriesOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {(settings.menuCategories || []).map((cat: string) => (
                  <li key={cat} className="flex justify-between items-center bg-muted p-2 rounded-lg text-sm">
                    <span className="font-medium text-foreground">{cat}</span>
                    <button 
                      type="button"
                      onClick={async () => {
                        const newCats = settings.menuCategories.filter((c: string) => c !== cat);
                        await updateSettings({ menuCategories: newCats });
                        toast.success("Category removed");
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              
              <div className="flex gap-2 pt-2 border-t border-border">
                <input 
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category..."
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      e.preventDefault();
                      const val = newCategoryName.trim();
                      if ((settings.menuCategories || []).includes(val)) {
                         toast.error("Category already exists");
                         return;
                      }
                      await updateSettings({ menuCategories: [...(settings.menuCategories || []), val] });
                      setNewCategoryName('');
                      toast.success("Category added");
                    }
                  }}
                />
                <Button 
                  type="button"
                  onClick={async () => {
                    if (!newCategoryName.trim()) return;
                    const val = newCategoryName.trim();
                    if ((settings.menuCategories || []).includes(val)) {
                       toast.error("Category already exists");
                       return;
                    }
                    await updateSettings({ menuCategories: [...(settings.menuCategories || []), val] });
                    setNewCategoryName('');
                    toast.success("Category added");
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

content = content.replace("  import { Trash2", "import { Trash2")
# Wait, Trash2 might not be imported in menu/page.tsx. Let's check imports
if "Trash2" not in content[:500]:
    content = content.replace("Edit2 } from 'lucide-react';", "Edit2, Trash2 } from 'lucide-react';")

parts = content.rsplit("    </div>\n  );\n}", 1)
content = parts[0] + manage_categories_modal + "    </div>\n  );\n}"

with open(filepath, "w") as f:
    f.write(content)


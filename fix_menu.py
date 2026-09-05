with open('src/app/dashboard/menu/page.tsx', 'r') as f:
    content = f.read()

# 1. Update filter logic
filter_find = """  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });"""

filter_replace = """  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.itemNumber && item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });"""
content = content.replace(filter_find, filter_replace)

# 2. Update rendering from grid to list view
render_find = """      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredItems.map(item => (
          <Card key={item.id} className={`overflow-hidden flex flex-col border-border shadow-sm group ${!item.available && 'opacity-70'}`}>
            <div className="h-32 bg-muted relative">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gray-100">
                <span className="text-sm font-medium">{item.category}</span>
              </div>
              <div className="absolute top-2 left-2">
                {(!item.recipe || item.recipe.length === 0) && (
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm bg-amber-100 text-amber-800 border border-amber-200" title="This item has no ingredients linked for auto-deduction">
                    No Recipe
                  </span>
                )}
              </div>
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.available ? 'Available' : 'Out of Stock'}
                </span>
              </div>
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this item?')) {
                      deleteMenuItem(item.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                  title="Delete item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4 flex-1 line-clamp-3">{item.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                <span className="font-bold text-lg tabular-nums">₹ {item.price}</span>
                <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => handleOpenEdit(item)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground mb-2">No menu items found.</p>
            <Button onClick={handleOpenAdd}>Add an item</Button>
          </div>
        )}
      </div>"""

render_replace = """      <div className="flex flex-col gap-3">
        {filteredItems.map(item => (
          <Card key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center border-border shadow-sm group p-4 ${!item.available && 'opacity-70'}`}>
             <div className="flex items-center w-full sm:w-auto flex-1 min-w-0 pr-4 mb-4 sm:mb-0">
               <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mr-4 flex-shrink-0">
                 <span className="text-[10px] font-medium text-center leading-tight">{item.category.split(' ').map(w => w[0]).join('')}</span>
               </div>
               
               <div className="flex-1 min-w-0">
                 <div className="flex items-center flex-wrap gap-2 mb-1">
                   <h3 className="font-bold text-lg leading-tight truncate">{item.name}</h3>
                   {item.itemNumber && <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">#{item.itemNumber}</span>}
                   {(!item.recipe || item.recipe.length === 0) && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        No Recipe
                      </span>
                   )}
                 </div>
                 <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
               </div>
             </div>
             
             <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-border pt-3 sm:pt-0">
               <div className="flex items-center gap-3">
                 <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {item.available ? 'Available' : 'Out of Stock'}
                 </span>
                 <div className="font-black text-xl w-24 text-right tabular-nums">₹{item.price}</div>
               </div>
               <div className="flex items-center gap-2">
                 <Button size="icon" variant="outline" className="h-9 w-9 rounded-lg" onClick={() => handleOpenEdit(item)} title="Edit item">
                   <Edit2 className="w-4 h-4" />
                 </Button>
                 <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this item?')) {
                        deleteMenuItem(item.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <X className="w-4 h-4" />
                 </button>
               </div>
             </div>
          </Card>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl bg-card">
            <p className="text-muted-foreground mb-2">No menu items found.</p>
            <Button onClick={handleOpenAdd}>Add an item</Button>
          </div>
        )}
      </div>"""

content = content.replace(render_find, render_replace)

with open('src/app/dashboard/menu/page.tsx', 'w') as f:
    f.write(content)

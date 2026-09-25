import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/MenuPickerModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Replace the top search and categories bar with just the search bar
bad_search_categories = """        {/* Search & Categories */}
        <div className="px-5 pt-3 pb-2.5 space-y-3 flex-shrink-0 border-b border-gray-100 bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="search" 
              placeholder="Search menu items or codes (#G1)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full pb-1">
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs transition-all ${
                  activeCategory === category 
                    ? 'font-semibold bg-[#D2F801] text-gray-900 shadow-xs border border-lime-400' 
                    : 'font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>"""

good_search = """        {/* Search Header */}
        <div className="px-5 pt-3 pb-3 flex-shrink-0 border-b border-gray-100 bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="search" 
              placeholder="Search menu items or codes (#G1)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
        </div>"""
content = content.replace(bad_search_categories, good_search)

# 2. Replace the main grid and article layout
bad_main_area_start = """        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
          {menuLoading || invLoading ? (
            <div className="flex justify-center items-center h-full text-gray-500">Loading menu...</div>
          ) : (
            <div className="flex flex-col gap-3">"""

good_main_area_start = """        {/* Menu Layout */}
        <div className="flex flex-1 overflow-hidden bg-gray-50/50">
          
          {/* Left Sidebar - Categories */}
          <div className="w-[110px] md:w-[140px] bg-white border-r border-gray-200 overflow-y-auto hide-scrollbar flex-shrink-0">
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`w-full text-left px-3 py-3.5 border-b border-gray-100 text-xs md:text-sm transition-all ${
                  activeCategory === category 
                    ? 'font-bold bg-blue-50/50 text-blue-700 border-l-4 border-l-blue-600' 
                    : 'font-medium text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Right Area - Grid View */}
          <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-4">
            {menuLoading || invLoading ? (
              <div className="flex justify-center items-center h-full text-gray-500">Loading menu...</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">"""

content = content.replace(bad_main_area_start, good_main_area_start)

# 3. Replace the article element (the item card)
bad_article = """  const totalCost = currentDraftItems.reduce((sum, draftItem) => {
    const mItem = menuItems.find(m => m.id === draftItem.menuItemId);
    return sum + (mItem ? mItem.price * draftItem.qty : 0);
  }, 0);
  const totalItemsCount = currentDraftItems.reduce((sum, d) => sum + d.qty, 0);

  return (
                  <article key={item.id} className={`flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-xs hover:border-gray-200 transition-colors ${outOfStock ? 'opacity-70' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-sm flex-shrink-0 uppercase">
                        {item.name.substring(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-semibold text-gray-900 leading-tight">{item.name}</h2>
                          {item.itemNumber && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">#{item.itemNumber}</span>}
                          {(!item.available || outOfStock) && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">OOS</span>}
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-1">₹ {item.price}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {qty > 0 && (
                        <span className="text-xs font-bold bg-[#D2F801]/30 text-gray-900 px-2 py-1 rounded-full">
                          {qty}
                        </span>
                      )}
                      <button 
                        onClick={() => onAddItem(item)}
                        disabled={!item.available || outOfStock}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                          (!item.available || outOfStock) ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 active:bg-blue-700 text-white shadow-sm shadow-blue-200 active:scale-90'
                        }`}
                      >
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </article>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                  No items found.
                </div>
              )}
            </div>
          )}
        </div>"""

good_article = """  const totalCost = currentDraftItems.reduce((sum, draftItem) => {
    const mItem = menuItems.find(m => m.id === draftItem.menuItemId);
    return sum + (mItem ? mItem.price * draftItem.qty : 0);
  }, 0);
  const totalItemsCount = currentDraftItems.reduce((sum, d) => sum + d.qty, 0);

  return (
                  <article 
                    key={item.id} 
                    onClick={() => { if(item.available && !outOfStock) onAddItem(item); }}
                    className={`flex flex-col justify-between p-3.5 bg-white rounded-2xl border ${qty > 0 ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-200' : 'border-gray-200'} shadow-sm hover:shadow-md hover:border-black/20 transition-all cursor-pointer ${outOfStock ? 'opacity-50 grayscale cursor-not-allowed' : ''} min-h-[110px] relative`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h2 className="text-sm md:text-[15px] font-bold text-gray-900 leading-tight line-clamp-2 pr-6">{item.name}</h2>
                        {item.itemNumber && <span className="absolute top-3 right-3 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 flex-shrink-0">#{item.itemNumber}</span>}
                      </div>
                      {(!item.available || outOfStock) && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 inline-block mt-1.5">OOS</span>}
                    </div>
                    
                    <div className="flex items-end justify-between mt-3">
                      <p className="text-base md:text-lg font-black text-emerald-600 leading-none">₹{item.price}</p>
                      
                      <div className="flex items-center">
                        {qty > 0 ? (
                          <div className="flex items-center gap-1.5 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                            <span className="text-xs font-bold text-blue-800">{qty} in cart</span>
                          </div>
                        ) : (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                            (!item.available || outOfStock) ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white'
                          }`}>
                            <Plus className="w-4 h-4" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                  No items found.
                </div>
              )}
            </div>
          )}
          </div>
        </div>"""

content = content.replace(bad_article, good_article)

with open(filepath, "w") as f:
    f.write(content)


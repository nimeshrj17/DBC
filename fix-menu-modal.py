import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/MenuPickerModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update state to default to "Popular"
content = content.replace("useState<string>('All');", "useState<string>('Popular');")

# 2. Re-order categories: Popular, Chai, Cold Coffee, Hot Coffee, Biscuits, then rest alphabetically
bad_cats = "const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];"
good_cats = """
  const rawCats = Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean);
  
  // Custom sort: Put high-frequency categories first
  const priorityOrder = ['Chai', 'Cold Coffee', 'Hot Coffee', 'Biscuits', 'Burger', 'Fast Food', 'Chai Ke Sang'];
  rawCats.sort((a, b) => {
    const idxA = priorityOrder.indexOf(a);
    const idxB = priorityOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
  
  const categories = ['Popular', ...rawCats];
"""
content = content.replace(bad_cats, good_cats)

# 3. Filter items logic for Popular
bad_filter = """  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.itemNumber && item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });"""

good_filter = """
  const popularItemKeywords = ['chai', 'cappuccino', 'cold coffee', 'oreo', 'good day', 'crack jack', 'coconut', 'burger', 'maggi'];
  
  const filteredItems = menuItems.filter(item => {
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (item.itemNumber && item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (activeCategory === 'Popular') {
       // Show high frequency items in Popular tab
       return popularItemKeywords.some(kw => item.name.toLowerCase().includes(kw));
    }
    
    return item.category === activeCategory;
  });
"""
content = content.replace(bad_filter, good_filter)

# 4. Remove letter avatars (div containing initial letter)
bad_item_render = """              <div className="flex items-center gap-3 md:gap-4 mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-sm md:text-lg border-2 border-gray-100/50 group-hover:border-black/10 transition-colors shadow-xs">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight group-hover:text-black transition-colors line-clamp-2">{item.name}</h3>"""

good_item_render = """              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight group-hover:text-black transition-colors line-clamp-2">{item.name}</h3>"""
content = content.replace(bad_item_render, good_item_render)

# 5. Make grid denser (add another column)
content = content.replace("className=\"grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 p-2\"", "className=\"grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 p-2\"")

# 6. Add Sticky Running Total Bar
# First, calculate total cost in component
calc_total = """
  const totalCost = currentDraftItems.reduce((sum, draftItem) => {
    const mItem = menuItems.find(m => m.id === draftItem.menuItemId);
    return sum + (mItem ? mItem.price * draftItem.qty : 0);
  }, 0);
  const totalItemsCount = currentDraftItems.reduce((sum, d) => sum + d.qty, 0);
"""

# inject right before `return (`
content = content.replace("  return (", calc_total + "\n  return (")

# Then inject sticky footer
sticky_footer = """
        {/* Sticky Footer */}
        <div className="bg-white border-t border-gray-200 p-3 flex justify-between items-center shrink-0">
          <div>
            <span className="text-gray-500 text-sm font-medium">{totalItemsCount} items</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-gray-900 font-bold text-lg">₹{totalCost.toFixed(2)}</span>
          </div>
          <Button onClick={onClose} className="px-8 font-bold bg-[#D2F801] text-black hover:bg-[#c2e600]">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}"""

content = re.sub(r"      </div>\n    </div>\n  \);\n}", sticky_footer, content)

with open(filepath, "w") as f:
    f.write(content)


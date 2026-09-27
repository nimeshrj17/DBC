import re
with open('src/components/dashboard/MenuPickerModal.tsx', 'r') as f:
    content = f.read()

# Change flex flex-1 to flex flex-col md:flex-row flex-1
content = content.replace('<div className="flex flex-1 overflow-hidden bg-gray-50/50">', '<div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-gray-50/50">')

# Change Left Sidebar - Categories
old_sidebar = r'\{/\* Left Sidebar - Categories \*/\}.*?\{/\* Right Area - Grid View \*/\}'
new_sidebar = '''{/* Categories Row (Mobile) / Sidebar (Desktop) */}
          <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto hide-scrollbar bg-white border-b md:border-b-0 md:border-r border-gray-200 w-full md:w-[140px] flex-shrink-0 md:h-full">
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 whitespace-nowrap text-center md:text-left px-4 py-3 md:py-3.5 border-b-2 md:border-b md:border-b-gray-100 md:border-l-4 text-xs md:text-sm transition-all ${
                  activeCategory === category 
                    ? 'font-bold bg-slate-900 text-white border-b-slate-900 md:border-l-[#10B981]' 
                    : 'font-medium text-gray-600 hover:bg-gray-50 border-b-transparent md:border-l-transparent'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Right Area - Grid View */}'''

content = re.sub(old_sidebar, new_sidebar, content, flags=re.DOTALL)

with open('src/components/dashboard/MenuPickerModal.tsx', 'w') as f:
    f.write(content)

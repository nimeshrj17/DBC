import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Remove the stray null at line 849
content = content.replace("""            </div>
            null
          </div>
        </section>""", """            </div>
          </div>
        </section>""")

# 2. Rewrite the nav and main elements for Zomato style
old_layout = """      <nav className="pt-5 pb-2">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar px-4">
          <button onClick={() => setActiveCategory('All')} className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${activeCategory === 'All' ? 'bg-[#26150e] text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>All</button>
          {categories.map((cat, i) => (
            <button key={i} onClick={() => setActiveCategory(cat as string)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-xs ${activeCategory === cat ? 'bg-[#26150e] text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>{cat as string}</button>
          ))}
        </div>
      </nav>

      <main className="px-4 pt-3 flex-1 flex flex-col gap-4">
        <div className="relative w-full mb-2">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white text-stone-800 placeholder-stone-400 text-sm rounded-xl py-3 px-4 border border-stone-200 shadow-xs focus:ring-2 outline-none" placeholder="Search by name..." type="text"/>
        </div>
        <section className="flex flex-col gap-3.5">
          {menuItems.filter(i => {
            if (!i.available) return false;
            if (activeCategory !== 'All' && i.category !== activeCategory) return false;
            if (searchQuery) return i.name.toLowerCase().includes(searchQuery.toLowerCase());
            return true;
          }).map(item => {
            const cartItem = cart.find(i => i.id === item.id);
            return (
              <article key={item.id} className="bg-white rounded-none p-4 shadow-sm border border-stone-100 flex justify-between gap-3 relative transition hover:shadow-md">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border border-emerald-600 rounded-[3px] flex items-center justify-center" title="Pure Vegetarian"><span className="w-2 h-2 rounded-full bg-emerald-600"></span></span><span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest ml-1">VEG</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-base leading-snug">{item.name}</h3>
                  {item.description && item.description !== 'null' && <p className="text-xs text-stone-700 leading-relaxed">{item.description}</p>}
                  <div className="pt-1"><span className="text-base font-extrabold text-stone-900">₹{item.price}</span></div>
                </div>
                <div className="flex items-end shrink-0 pl-2">
                  {cartItem ? (
                    <div className="flex items-center bg-[#26150e] text-white rounded-none shadow-md overflow-hidden">
                      <button onClick={() => updateQty(item.id, -1)} className="px-2.5 py-1.5 text-amber-200 hover:bg-black/30 font-bold active:scale-95">−</button>
                      <span className="px-2 py-1 text-xs font-bold">{cartItem.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="px-2.5 py-1.5 text-amber-200 hover:bg-black/30 font-bold active:scale-95">+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} className="bg-[#26150e] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#3c2217] active:scale-95 shadow transition">+ Add</button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>"""

new_layout = """      <nav className="sticky top-0 z-40 bg-[#FAF7F2] pt-4 pb-0 border-b border-stone-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]">
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FAF7F2] to-transparent pointer-events-none z-10"></div>
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar px-4 pr-16">
          {categories.map((cat, i) => {
            const count = menuItems.filter(item => item.category === cat && item.available).length;
            if (count === 0) return null;
            return (
              <button 
                key={i} 
                onClick={() => {
                  setActiveCategory(cat as string);
                  const el = document.getElementById(`category-${cat}`);
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }} 
                className={`flex-shrink-0 px-1 py-3 text-[15px] font-bold transition-all border-b-[3px] whitespace-nowrap ${activeCategory === cat || (activeCategory === 'All' && i === 0) ? 'border-[#2b1a13] text-[#2b1a13]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
              >
                {cat as string} <span className="text-[11px] opacity-70 ml-0.5">({count})</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="px-4 pt-4 flex-1 flex flex-col gap-6 pb-28">
        <div className="relative w-full sticky top-[68px] z-30">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white text-stone-800 placeholder-stone-400 text-sm rounded-xl py-3.5 px-4 border border-stone-200 shadow-sm focus:ring-2 outline-none" placeholder="Search by name..." type="text"/>
        </div>
        
        {searchQuery ? (
          <section className="flex flex-col gap-3.5 mt-2">
            {menuItems.filter(i => i.available && i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => {
              const cartItem = cart.find(i => i.id === item.id);
              return (
                <article key={item.id} className="bg-white rounded-none p-4 shadow-sm border border-stone-100 flex justify-between gap-3 relative transition hover:shadow-md">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border border-emerald-600 rounded-[3px] flex items-center justify-center" title="Pure Vegetarian"><span className="w-2 h-2 rounded-full bg-emerald-600"></span></span><span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest ml-1">VEG</span>
                    </div>
                    <h3 className="font-bold text-stone-900 text-base leading-snug">{item.name}</h3>
                    {item.description && item.description !== 'null' && <p className="text-xs text-stone-700 leading-relaxed">{item.description}</p>}
                    <div className="pt-1"><span className="text-base font-extrabold text-stone-900">₹{item.price}</span></div>
                  </div>
                  <div className="flex items-end shrink-0 pl-2">
                    {cartItem ? (
                      <div className="flex items-center bg-[#26150e] text-white rounded-full p-1 border border-[#e5dcd2] shadow-sm">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-full bg-[#3c2217] flex items-center justify-center text-white font-bold active:scale-95">−</button>
                        <span className="w-6 text-center text-xs font-bold">{cartItem.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-full bg-[#1c110b] flex items-center justify-center text-white font-bold active:scale-95">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="bg-[#26150e] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#3c2217] active:scale-95 shadow-sm transition">+ Add</button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="flex flex-col gap-10">
            {categories.map(cat => {
               const items = menuItems.filter(i => i.category === cat && i.available);
               if (items.length === 0) return null;
               return (
                 <section key={cat as string} id={`category-${cat}`} className="flex flex-col gap-3.5 scroll-mt-[130px]">
                   <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2 mb-1">
                      {cat as string}
                   </h2>
                   {items.map(item => {
                      const cartItem = cart.find(i => i.id === item.id);
                      return (
                        <article key={item.id} className="bg-white rounded-none p-4 shadow-sm border border-stone-100 flex justify-between gap-3 relative transition hover:shadow-md">
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 border border-emerald-600 rounded-[3px] flex items-center justify-center" title="Pure Vegetarian"><span className="w-2 h-2 rounded-full bg-emerald-600"></span></span><span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest ml-1">VEG</span>
                            </div>
                            <h3 className="font-bold text-stone-900 text-base leading-snug">{item.name}</h3>
                            {item.description && item.description !== 'null' && <p className="text-xs text-stone-700 leading-relaxed">{item.description}</p>}
                            <div className="pt-1"><span className="text-base font-extrabold text-stone-900">₹{item.price}</span></div>
                          </div>
                          <div className="flex items-end shrink-0 pl-2">
                            {cartItem ? (
                              <div className="flex items-center bg-[#F3ECE5] text-[#2b1a13] rounded-full p-1 shadow-sm">
                                <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-full bg-white border border-[#e5dcd2] flex items-center justify-center font-bold active:scale-95">−</button>
                                <span className="w-6 text-center text-xs font-bold">{cartItem.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-full bg-[#26150e] text-white flex items-center justify-center font-bold active:scale-95">+</button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(item)} className="bg-[#2b1a13] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#1c110b] active:scale-95 shadow-sm transition">+ Add</button>
                            )}
                          </div>
                        </article>
                      );
                   })}
                 </section>
               );
            })}
          </div>
        )}
      </main>"""

content = content.replace(old_layout, new_layout)

with open(filepath, "w") as f:
    f.write(content)

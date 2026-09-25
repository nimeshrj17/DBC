import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/orders/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update filtering to allow cancelled orders
bad_filter = "    if (order.status === 'completed' || order.status === 'cancelled') return false;"
good_filter = "    if (order.status === 'completed') return false;"
content = content.replace(bad_filter, good_filter)

# 2. Add Cancelled Count and Tab (Desktop and Mobile)
bad_counts = """  const readyCount = activeOrders.filter(o => o.status === 'prepared').length;
  const servedCount = activeOrders.filter(o => o.status === 'served').length;
  const billedCount = activeOrders.filter(o => o.status === 'billed').length;"""

good_counts = """  const readyCount = activeOrders.filter(o => o.status === 'prepared').length;
  const servedCount = activeOrders.filter(o => o.status === 'served').length;
  const billedCount = activeOrders.filter(o => o.status === 'billed').length;
  const cancelledCount = activeOrders.filter(o => o.status === 'cancelled').length;"""
content = content.replace(bad_counts, good_counts)

bad_tabs = """            <button onClick={() => setStatusFilter('billed')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${statusFilter === 'billed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Billed ({billedCount})</button>
          </div>"""
good_tabs = """            <button onClick={() => setStatusFilter('billed')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${statusFilter === 'billed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Billed ({billedCount})</button>
            <button onClick={() => setStatusFilter('cancelled')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${statusFilter === 'cancelled' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-red-600'}`}>Cancelled ({cancelledCount})</button>
          </div>"""
content = content.replace(bad_tabs, good_tabs)

bad_select = """            <option value="billed">Billed ({billedCount})</option>
          </select>"""
good_select = """            <option value="billed">Billed ({billedCount})</option>
            <option value="cancelled">Cancelled ({cancelledCount})</option>
          </select>"""
content = content.replace(bad_select, good_select)

# Update All count to include cancelled
bad_all_count = "All ({activeOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length})"
good_all_count = "All ({activeOrders.filter(o => o.status !== 'completed').length})"
content = content.replace(bad_all_count, good_all_count)

# 3. Add cancelled style handling
bad_style = """              } else if (order.status === 'served') {
                statusBg = 'bg-blue-50';
                statusText = 'text-blue-700';
                statusBorder = 'border-blue-200';
                Icon = Check;
              } else if (order.status === 'billed') {
                statusBg = 'bg-green-50';
                statusText = 'text-green-700';
                statusBorder = 'border-green-200';
                Icon = Banknote;
              }"""
good_style = """              } else if (order.status === 'served') {
                statusBg = 'bg-blue-50';
                statusText = 'text-blue-700';
                statusBorder = 'border-blue-200';
                Icon = Check;
              } else if (order.status === 'billed') {
                statusBg = 'bg-green-50';
                statusText = 'text-green-700';
                statusBorder = 'border-green-200';
                Icon = Banknote;
              } else if (order.status === 'cancelled') {
                statusBg = 'bg-red-50';
                statusText = 'text-red-700';
                statusBorder = 'border-red-200';
                Icon = X;
              }"""
content = content.replace(bad_style, good_style)

# Add opacity and strikethrough for cancelled items
bad_article = """                <article key={order.id} className={`bg-white rounded-2xl border ${statusBorder} flex flex-col overflow-hidden shadow-xs hover:shadow-md transition duration-200 relative`}>"""
good_article = """                <article key={order.id} className={`bg-white rounded-2xl border ${statusBorder} ${order.status === 'cancelled' ? 'opacity-70 grayscale-[0.2]' : ''} flex flex-col overflow-hidden shadow-xs hover:shadow-md transition duration-200 relative`}>"""
content = content.replace(bad_article, good_article)

bad_item = """                          <div key={idx} className="py-2 flex items-center justify-between font-medium">
                            <span className="text-slate-800 truncate pr-2">{item.name}</span>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="w-6 text-center text-slate-500 bg-slate-100 rounded text-[11px] font-semibold">{item.qty}</span>
                              <span className="w-14 text-right tabular-nums text-slate-900 font-semibold">₹{(item.price * item.qty).toFixed(0)}</span>
                            </div>"""
good_item = """                          <div key={idx} className={`py-2 flex items-center justify-between font-medium ${order.status === 'cancelled' ? 'text-slate-400 line-through' : ''}`}>
                            <span className={`truncate pr-2 ${order.status === 'cancelled' ? 'text-slate-500' : 'text-slate-800'}`}>{item.name}</span>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className={`w-6 text-center rounded text-[11px] font-semibold ${order.status === 'cancelled' ? 'text-slate-400 bg-slate-50' : 'text-slate-500 bg-slate-100'}`}>{item.qty}</span>
                              <span className={`w-14 text-right tabular-nums font-semibold ${order.status === 'cancelled' ? 'text-slate-400' : 'text-slate-900'}`}>₹{(item.price * item.qty).toFixed(0)}</span>
                            </div>"""
content = content.replace(bad_item, good_item)

with open(filepath, "w") as f:
    f.write(content)


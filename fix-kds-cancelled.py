import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/orders/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Filter activeOrders to ONLY be today's orders
bad_active_orders = """  const activeOrders = orders.filter(o => {
    return true; 
  }).sort((a, b) => {"""
good_active_orders = """  const activeOrders = orders.filter(o => {
    // Only show today's orders
    if (!o.createdAt) return false;
    const createdTime = typeof o.createdAt.toMillis === 'function' ? o.createdAt.toMillis() : (o.createdAt.seconds * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return createdTime >= today.getTime();
  }).sort((a, b) => {"""
content = content.replace(bad_active_orders, good_active_orders)

# 2. Add Dismiss logic to filteredOrders
bad_filtered = """  const filteredOrders = activeOrders.filter(order => {
    if (order.status === 'completed') return false;
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;"""
good_filtered = """  const filteredOrders = activeOrders.filter(order => {
    if (order.status === 'completed') return false;
    // Hide dismissed cancelled orders from 'all' tab, but keep them in 'cancelled' tab
    if (order.status === 'cancelled' && order.kdsDismissed && statusFilter !== 'cancelled') return false;
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;"""
content = content.replace(bad_filtered, good_filtered)

# 3. Add Dismiss Button
bad_actions = """                        {(order.status === 'pending' || order.status === 'preparing') && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'cancelled') }} className="w-full py-1.5 px-4 bg-transparent text-slate-400 hover:text-red-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95">
                            Cancel
                          </button>
                        )}
                      </div>"""
good_actions = """                        {(order.status === 'pending' || order.status === 'preparing') && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'cancelled') }} className="w-full py-1.5 px-4 bg-transparent text-slate-400 hover:text-red-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95">
                            Cancel
                          </button>
                        )}
                        {(order.status === 'cancelled' && !order.kdsDismissed) && (
                          <button onClick={(e) => { e.stopPropagation(); updateOrder(order.id, { kdsDismissed: true }); }} className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95">
                            Dismiss
                          </button>
                        )}
                      </div>"""
content = content.replace(bad_actions, good_actions)

with open(filepath, "w") as f:
    f.write(content)

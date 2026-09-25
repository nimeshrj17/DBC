import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/orders/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

old_block = """                        {order.items.map((item, idx) => (
                          <div key={idx} className={`py-2 flex items-center justify-between font-medium ${order.status === 'cancelled' ? 'text-slate-400 line-through' : ''}`}>
                            <span className={`truncate pr-2 ${order.status === 'cancelled' ? 'text-slate-500' : 'text-slate-800'}`}>{item.name}</span>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className={`w-6 text-center rounded text-[11px] font-semibold ${order.status === 'cancelled' ? 'text-slate-400 bg-slate-50' : 'text-slate-500 bg-slate-100'}`}>{item.qty}</span>
                              <span className={`w-14 text-right tabular-nums font-semibold ${order.status === 'cancelled' ? 'text-slate-400' : 'text-slate-900'}`}>₹{(item.price * item.qty).toFixed(0)}</span>
                            </div>
                          </div>
                        ))}"""

new_block = """                        {order.items.map((item, idx) => (
                          <div key={idx} className={`py-2 flex flex-col font-medium ${order.status === 'cancelled' ? 'text-slate-400 line-through' : ''}`}>
                            <div className="flex items-center justify-between">
                              <span className={`truncate pr-2 ${order.status === 'cancelled' ? 'text-slate-500' : 'text-slate-800'}`}>{item.name}</span>
                              <div className="flex items-center gap-4 shrink-0">
                                <span className={`w-6 text-center rounded text-[11px] font-semibold ${order.status === 'cancelled' ? 'text-slate-400 bg-slate-50' : 'text-slate-500 bg-slate-100'}`}>{item.qty}</span>
                                <span className={`w-14 text-right tabular-nums font-semibold ${order.status === 'cancelled' ? 'text-slate-400' : 'text-slate-900'}`}>₹{(item.price * item.qty).toFixed(0)}</span>
                              </div>
                            </div>
                            {item.notes && <p className="text-[11px] text-amber-600 font-bold italic mt-0.5 leading-snug break-words">Note: {item.notes}</p>}
                          </div>
                        ))}"""

content = content.replace(old_block, new_block)

with open(filepath, "w") as f:
    f.write(content)


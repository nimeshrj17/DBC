filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/analytics/page.tsx"

with open(filepath, "r") as f:
    content = f.read()

# 1. Add orders to destructuring
content = content.replace("const { analytics, loading } = useAnalytics(30);", "const { analytics, loading, orders } = useAnalytics(30);")

# 2. Add the History tab button
tab_buttons_old = "            <button onClick={() => setActiveTab('splits')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'splits' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Payments & Types</button>"
tab_buttons_new = tab_buttons_old + "\n            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Order History</button>"
content = content.replace(tab_buttons_old, tab_buttons_new)

# 3. Add History tab content at the end
# Find the end of the splits block:
#           </div>
#         )}
#       </div>
#     </div>
#   );
# }

history_block = """

        {/* 5. ORDER HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-none border border-slate-200 shadow-xs overflow-hidden mt-6">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">30-Day Order History</h3>
                <p className="text-sm text-slate-500">Raw ledger of all processed orders</p>
              </div>
              <div className="text-sm font-bold text-slate-700 bg-slate-200 px-3 py-1 rounded-none">
                {orders.length} Orders
              </div>
            </div>
            <div className="overflow-x-auto max-h-[600px] custom-scroll">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-white sticky top-0 border-b border-slate-100 uppercase z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 font-bold">Date & Time</th>
                    <th className="px-6 py-3 font-bold">Order ID</th>
                    <th className="px-6 py-3 font-bold">Type</th>
                    <th className="px-6 py-3 font-bold">Items</th>
                    <th className="px-6 py-3 font-bold">Total</th>
                    <th className="px-6 py-3 font-bold">Payment</th>
                    <th className="px-6 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order, idx) => {
                    const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || Date.now());
                    const itemCount = order.items ? order.items.reduce((sum: number, i: any) => sum + i.quantity, 0) : 0;
                    
                    return (
                      <tr key={order.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="font-bold text-slate-900">{date.toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500 font-medium uppercase">{date.toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-3 font-mono text-xs font-bold text-slate-600">
                          {order.displayId || order.id?.substring(0, 6)}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-600 capitalize">
                          {order.orderType || 'Dine-in'}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded-none text-xs">{itemCount}</span>
                        </td>
                        <td className="px-6 py-3 font-black text-emerald-600">
                          ₹{order.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            order.paymentStatus === 'refunded' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {order.paymentMethod || 'Unknown'} {order.paymentStatus === 'paid' ? '' : `(${order.paymentStatus})`}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}"""

end_marker = "      </div>\n    </div>\n  );\n}"
content = content.replace(end_marker, history_block + "\n" + end_marker)

with open(filepath, "w") as f:
    f.write(content)

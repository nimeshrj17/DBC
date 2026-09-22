import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/inventory/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add log function and imports
if "function logActivity" not in content:
    content = content.replace(
        "import { toast } from 'sonner';",
        "import { toast } from 'sonner';\nimport { useAuth } from '@/lib/context/AuthContext';\nimport { db } from '@/lib/firebase';\nimport { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';\nimport { useEffect } from 'react';"
    )

    # Note: I already imported useAuth earlier in the patch, so this might duplicate it. Let's fix duplicate.
    content = re.sub(r"import { useAuth } from '@/lib/context/AuthContext';\n+", "import { useAuth } from '@/lib/context/AuthContext';\n", content)

    # Update state to include 'activity'
    content = content.replace(
        "const [activeTab, setActiveTab] = useState<'raw' | 'retail'>('raw');",
        "const [activeTab, setActiveTab] = useState<'raw' | 'retail' | 'activity'>('raw');\n  const [activities, setActivities] = useState<any[]>([]);\n  const { user } = useAuth();\n\n  useEffect(() => {\n    const q = query(collection(db, 'inventory_logs'), orderBy('timestamp', 'desc'), limit(50));\n    return onSnapshot(q, (snap) => setActivities(snap.docs.map(d => ({id: d.id, ...d.data()}))));\n  }, []);\n\n  const logActivity = async (action: string, item: string, details: string) => {\n    if (!user) return;\n    await addDoc(collection(db, 'inventory_logs'), {\n      action,\n      item,\n      details,\n      user: user.name,\n      role: user.role,\n      timestamp: serverTimestamp()\n    });\n  };"
    )
    
    # Fix tab buttons
    tab_buttons_old = """          <button 
            onClick={() => setActiveTab('raw')}
            className={`flex-1 py-3 px-4 font-bold text-sm text-center border-b-2 transition-colors ${activeTab === 'raw' ? 'border-[#D9F927] text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            Raw Materials (Kitchen)
          </button>
          <button 
            onClick={() => setActiveTab('retail')}
            className={`flex-1 py-3 px-4 font-bold text-sm text-center border-b-2 transition-colors ${activeTab === 'retail' ? 'border-[#D9F927] text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            Retail Items (Selling)
          </button>"""
          
    tab_buttons_new = """          <button 
            onClick={() => setActiveTab('raw')}
            className={`flex-1 py-3 px-4 font-bold text-sm text-center border-b-2 transition-colors ${activeTab === 'raw' ? 'border-[#D9F927] text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            Raw Materials
          </button>
          <button 
            onClick={() => setActiveTab('retail')}
            className={`flex-1 py-3 px-4 font-bold text-sm text-center border-b-2 transition-colors ${activeTab === 'retail' ? 'border-[#D9F927] text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            Retail Items
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-3 px-4 font-bold text-sm text-center border-b-2 transition-colors ${activeTab === 'activity' ? 'border-[#D9F927] text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            Activity Log
          </button>"""
          
    content = content.replace(tab_buttons_old, tab_buttons_new)

    # Activity Tab Render
    activity_render = """        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Time</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Item</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap">{act.timestamp ? new Date(act.timestamp.toDate()).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Just now'}</td>
                    <td className="p-4 font-bold text-slate-900">{act.user} <span className="text-[10px] font-normal uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{act.role}</span></td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${act.action === 'ADD_STOCK' ? 'bg-emerald-100 text-emerald-700' : act.action === 'DEDUCT_STOCK' ? 'bg-rose-100 text-rose-700' : act.action === 'NEW_ITEM' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {act.action}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{act.item}</td>
                    <td className="p-4 text-sm text-slate-500">{act.details}</td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No activity recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}"""
        
    content = content.replace("</div>\n    </div>\n  );\n}", f"  {activity_render}\n      </div>\n    </div>\n  );\n}}")
    
    # Inject log calls on update/add
    content = content.replace(
        "updateInventoryItem(item.id, { quantity: item.quantity + 1 });",
        "updateInventoryItem(item.id, { quantity: item.quantity + 1 });\n                            logActivity('ADD_STOCK', item.name, 'Added 1 unit manually');"
    )
    content = content.replace(
        "updateInventoryItem(item.id, { quantity: item.quantity - 1 });",
        "updateInventoryItem(item.id, { quantity: item.quantity - 1 });\n                            logActivity('DEDUCT_STOCK', item.name, 'Deducted 1 unit manually');"
    )
    content = content.replace(
        "await addInventoryItem(itemData as any);",
        "await addInventoryItem(itemData as any);\n        logActivity('NEW_ITEM', itemData.name, `Created with ${itemData.quantity} ${itemData.unit}`);"
    )

    with open(filepath, "w") as f:
        f.write(content)

print("Inventory Tabs and Logs Added")

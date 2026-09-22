import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/staff/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Update initial form data
content = content.replace(
    "canViewRevenue: false",
    "canViewRevenue: false,\n    customPermissions: {\n      manage_menu: false,\n      manage_inventory: false,\n      deduct_inventory: false,\n      view_revenue: false,\n      takeaway_billing: false,\n      edit_placed_orders: false\n    }"
)

# Update handleOpenAdd
content = content.replace(
    "setFormData({ name: '', pin: '', role: 'cashier', isActive: true, canViewRevenue: false });",
    "setFormData({ name: '', pin: '', role: 'cashier', isActive: true, canViewRevenue: false, customPermissions: { manage_menu: false, manage_inventory: false, deduct_inventory: false, view_revenue: false, takeaway_billing: true, edit_placed_orders: false } });"
)

# Update handleOpenEdit
content = content.replace(
    "canViewRevenue: member.canViewRevenue || false",
    "canViewRevenue: member.canViewRevenue || false,\n      customPermissions: member.customPermissions || {\n        manage_menu: member.role === 'manager',\n        manage_inventory: member.role === 'manager',\n        deduct_inventory: false,\n        view_revenue: member.role === 'manager' && member.canViewRevenue,\n        takeaway_billing: member.role === 'manager' || member.role === 'cashier',\n        edit_placed_orders: false\n      }"
)

# Replace the "canViewRevenue" block with the full permissions UI
bad_revenue_block = """              {formData.role === 'manager' && (
                <div className="flex items-center space-x-2 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <input 
                    type="checkbox" 
                    id="canViewRevenue"
                    checked={formData.canViewRevenue}
                    onChange={(e) => setFormData({...formData, canViewRevenue: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                  <label htmlFor="canViewRevenue" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Allow Manager to view Revenue/Analytics
                  </label>
                </div>
              )}"""

good_permissions_block = """              {formData.role !== 'admin' && (
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-2">Custom Permissions</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {[
                      { id: 'view_revenue', label: 'View Revenue & Analytics' },
                      { id: 'manage_menu', label: 'Add/Edit Menu Items' },
                      { id: 'manage_inventory', label: 'Add Inventory Stock' },
                      { id: 'deduct_inventory', label: 'Deduct Inventory Stock' },
                      { id: 'takeaway_billing', label: 'Process Takeaway Billing' },
                      { id: 'edit_placed_orders', label: 'Delete Placed Order Items' }
                    ].map(perm => (
                      <div key={perm.id} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id={`perm-${perm.id}`}
                          checked={formData.customPermissions[perm.id as keyof typeof formData.customPermissions] || false}
                          onChange={(e) => {
                            setFormData({
                              ...formData, 
                              customPermissions: {
                                ...formData.customPermissions,
                                [perm.id]: e.target.checked
                              }
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <label htmlFor={`perm-${perm.id}`} className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}"""

content = content.replace(bad_revenue_block, good_permissions_block)

# Add role select onChange to auto-populate defaults
bad_role_select = """                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >"""

good_role_select = """                <select 
                  value={formData.role}
                  onChange={e => {
                    const newRole = e.target.value;
                    const defaultPerms = {
                      manage_menu: newRole === 'manager',
                      manage_inventory: newRole === 'manager',
                      deduct_inventory: false,
                      view_revenue: newRole === 'manager',
                      takeaway_billing: newRole === 'manager' || newRole === 'cashier',
                      edit_placed_orders: false
                    };
                    setFormData({...formData, role: newRole, customPermissions: defaultPerms});
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >"""

content = content.replace(bad_role_select, good_role_select)

with open(filepath, "w") as f:
    f.write(content)

print("Staff UI Patched")

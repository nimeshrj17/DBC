import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/staff/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace(
    "customPermissions: member.customPermissions || {",
    "customPermissions: { manage_menu: !!member.customPermissions?.manage_menu, manage_inventory: !!member.customPermissions?.manage_inventory, deduct_inventory: !!member.customPermissions?.deduct_inventory, view_revenue: !!member.customPermissions?.view_revenue, takeaway_billing: !!member.customPermissions?.takeaway_billing, edit_placed_orders: !!member.customPermissions?.edit_placed_orders } || {"
)
# wait, the || { won't work well if I just did that. Let's do it better.

bad_custom_perms = """      customPermissions: member.customPermissions || {
        manage_menu: member.role === 'manager',
        manage_inventory: member.role === 'manager',
        deduct_inventory: false,
        view_revenue: member.role === 'manager' && member.canViewRevenue,
        takeaway_billing: member.role === 'manager' || member.role === 'cashier',
        edit_placed_orders: false
      }"""
      
good_custom_perms = """      customPermissions: {
        manage_menu: member.customPermissions?.manage_menu ?? (member.role === 'manager'),
        manage_inventory: member.customPermissions?.manage_inventory ?? (member.role === 'manager'),
        deduct_inventory: member.customPermissions?.deduct_inventory ?? false,
        view_revenue: member.customPermissions?.view_revenue ?? (member.role === 'manager' && !!member.canViewRevenue),
        takeaway_billing: member.customPermissions?.takeaway_billing ?? (member.role === 'manager' || member.role === 'cashier'),
        edit_placed_orders: member.customPermissions?.edit_placed_orders ?? false
      }"""
      
content = content.replace(bad_custom_perms, good_custom_perms)

with open(filepath, "w") as f:
    f.write(content)


import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/staff/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

content = re.sub(
    r"customPermissions:\s*\{ manage_menu.*?\|\| \{[\s\S]*?\}",
    """customPermissions: {
        manage_menu: member.customPermissions?.manage_menu ?? (member.role === 'manager'),
        manage_inventory: member.customPermissions?.manage_inventory ?? (member.role === 'manager'),
        deduct_inventory: member.customPermissions?.deduct_inventory ?? false,
        view_revenue: member.customPermissions?.view_revenue ?? (member.role === 'manager' && !!member.canViewRevenue),
        takeaway_billing: member.customPermissions?.takeaway_billing ?? (member.role === 'manager' || member.role === 'cashier'),
        edit_placed_orders: member.customPermissions?.edit_placed_orders ?? false
      }""",
    content
)

with open(filepath, "w") as f:
    f.write(content)

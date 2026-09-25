import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/owner/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

old_nav = """    { name: 'Staff Management', path: '/dashboard/owner/staff' },
    { name: 'SOPs & Rules', path: '/dashboard/owner/sops' },
  ];"""

new_nav = """    { name: 'Staff Management', path: '/dashboard/owner/staff' },
    { name: 'SOPs & Rules', path: '/dashboard/owner/sops' },
    { name: 'Monthly P&L', path: '/dashboard/owner/reports' },
  ];"""

content = content.replace(old_nav, new_nav)

with open(filepath, "w") as f:
    f.write(content)

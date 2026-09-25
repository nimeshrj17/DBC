import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/analytics/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Fix NaN in itemCount
content = content.replace(
    "const itemCount = order.items ? order.items.reduce((sum: number, i: any) => sum + i.quantity, 0) : 0;",
    "const itemCount = order.items ? order.items.reduce((sum: number, i: any) => sum + (i.qty || 0), 0) : 0;"
)

# Fix max-h-[600px]
content = content.replace(
    '<div className="overflow-x-auto max-h-[600px] custom-scroll">',
    '<div className="overflow-auto h-[calc(100vh-220px)] custom-scroll">'
)

with open(filepath, "w") as f:
    f.write(content)

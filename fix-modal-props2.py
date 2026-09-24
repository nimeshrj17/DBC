import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/QuickSaleModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace("type: 'takeaway'", "tableNumber: 0,\n        subtotal: selectedItem.price,\n        tax: 0")

with open(filepath, "w") as f:
    f.write(content)


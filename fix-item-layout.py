import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Fix dead space in item cards
old_layout = """<div className="flex flex-col justify-end items-end">"""
new_layout = """<div className="flex items-end shrink-0 pl-2">"""
content = content.replace(old_layout, new_layout)

with open(filepath, "w") as f:
    f.write(content)

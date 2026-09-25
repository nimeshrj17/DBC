import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/lib/hooks/useOrders.ts"
with open(filepath, "r") as f:
    content = f.read()

bad_type = "  kitchenNotes?: string;\n}"
good_type = "  kitchenNotes?: string;\n  kdsDismissed?: boolean;\n}"
content = content.replace(bad_type, good_type)

with open(filepath, "w") as f:
    f.write(content)

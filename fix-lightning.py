import re

# 1. page.tsx
filepath_page = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath_page, "r") as f:
    content = f.read()

content = content.replace("<span>⚡ Quick Sale</span>", "<span>Quick Sale</span>")
content = content.replace("⚡ Sale", "Sale")

with open(filepath_page, "w") as f:
    f.write(content)

# 2. QuickSaleModal.tsx
filepath_modal = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/QuickSaleModal.tsx"
with open(filepath_modal, "r") as f:
    content = f.read()

content = content.replace("⚡ Quick Retail Sale", "Quick Retail Sale")

with open(filepath_modal, "w") as f:
    f.write(content)


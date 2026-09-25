import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/analytics/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Fix Tooltip formatter types
content = content.replace("formatter={(value: number)", "formatter={(value: any)")

# Fix PieChart label percent types
bad_label = "label={({ name, percent }) =>"
good_label = "label={({ name, percent }: any) =>"
content = content.replace(bad_label, good_label)

with open(filepath, "w") as f:
    f.write(content)


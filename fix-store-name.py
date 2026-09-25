filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_line = "const targetUpiName = encodeURIComponent(settings?.storeName || 'Rakha Bhai Ki Chai');"
good_line = "const targetUpiName = encodeURIComponent('Rakha Bhai Ki Chai');"
content = content.replace(bad_line, good_line)

with open(filepath, "w") as f:
    f.write(content)

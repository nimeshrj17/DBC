filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_toast = "toast.success(`Added ${item.name} to cart`);"
good_toast = "toast.success(`Added ${item.name} to cart`, { duration: 1000 });"
content = content.replace(bad_toast, good_toast)

with open(filepath, "w") as f:
    f.write(content)

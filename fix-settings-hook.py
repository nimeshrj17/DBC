import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Inject the settings hook right after the menu hook
old_hook = "const { menuItems: rawMenuItems, loading: menuLoading } = useMenu();"
new_hook = "const { menuItems: rawMenuItems, loading: menuLoading } = useMenu();\n  const { settings } = useSettings();"
content = content.replace(old_hook, new_hook)

# Fix the ternary issue (replacing `{/* Pay Bill Button Temporarily Removed */}` with `null`)
content = content.replace("{/* Pay Bill Button Temporarily Removed */}", "null")

with open(filepath, "w") as f:
    f.write(content)

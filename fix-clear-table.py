import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_clear = """    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    }"""
good_clear = """    if (selectedTableId === tableId) {
      setSelectedTableId(null);
      setIsMenuOpen(false);
    }"""

content = content.replace(bad_clear, good_clear)

with open(filepath, "w") as f:
    f.write(content)

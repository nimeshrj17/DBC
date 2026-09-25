import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_onclose = "        onClose={() => setIsMenuOpen(false)}"
good_onclose = "        onClose={() => { setIsMenuOpen(false); setSelectedTableId(null); }}"

content = content.replace(bad_onclose, good_onclose)

with open(filepath, "w") as f:
    f.write(content)


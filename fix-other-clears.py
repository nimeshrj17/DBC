import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_1 = "      setSelectedTableId(null);\n      toast.success"
good_1 = "      setSelectedTableId(null);\n      setIsMenuOpen(false);\n      toast.success"

bad_2 = "                          setEditingTableId(null);\n                          setSelectedTableId(null);\n                        } catch"
good_2 = "                          setEditingTableId(null);\n                          setSelectedTableId(null);\n                          setIsMenuOpen(false);\n                        } catch"

content = content.replace(bad_1, good_1)
content = content.replace(bad_2, good_2)

with open(filepath, "w") as f:
    f.write(content)

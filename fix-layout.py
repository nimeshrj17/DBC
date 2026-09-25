import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. We will find the entire return statement. 
# It starts with "  return (\n    <div" and ends with "    </div>\n  );\n}"
start_str = "  return (\n    <div \n      className=\"flex h-screen bg-[#F8FAFC] overflow-hidden font-sans\""
# Actually the regex might be easier. Let's find "return (\n" and just dump the whole new structure.
# But wait, let's just fetch everything before "return (" and append the rest.

# Let's extract the part before `return (`
match = re.search(r"(\s*return \(\s*<div.*?)(?=export default|\Z)", content, flags=re.DOTALL)
if not match:
    # try another match
    pass

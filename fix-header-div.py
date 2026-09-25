import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/layout.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_snippet = """            <p className="text-sm text-slate-500">Here's what's happening at your cafe today.</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">"""

good_snippet = """            <p className="text-sm text-slate-500">Here's what's happening at your cafe today.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">"""

content = content.replace(bad_snippet, good_snippet)

with open(filepath, "w") as f:
    f.write(content)


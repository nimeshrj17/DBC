filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/analytics/page.tsx"

with open(filepath, "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "{/* FULL MENU ASSESSMENT */}" in line:
        skip = True
    
    if not skip:
        new_lines.append(line)
        
    if skip and "</table>" in line:
        # We need to skip 2 more </div> lines after </table>
        pass
    
# Wait, this is still brittle. Let's just find exactly what to delete using Python's string find.
with open(filepath, "r") as f:
    content = f.read()

import re
# The block starts with:             {/* FULL MENU ASSESSMENT */}
# and ends with:               </div>\n            </div>
# Let's match it using a precise regex that doesn't rely on dotall ambiguity
pattern = r"[ \t]*\{/\* FULL MENU ASSESSMENT \*/\}.*?</table>[ \t\n]*</div>[ \t\n]*</div>"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open(filepath, "w") as f:
    f.write(content)

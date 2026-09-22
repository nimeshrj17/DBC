import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/inventory/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace(
    "setFormData({ ...initialForm, type: activeTab });",
    "setFormData({ ...initialForm, type: activeTab === 'activity' ? 'raw' : activeTab });"
)
content = content.replace(
    "setFormData(prev => ({ ...prev, type: activeTab }));",
    "setFormData(prev => ({ ...prev, type: activeTab === 'activity' ? 'raw' : activeTab }));"
)

with open(filepath, "w") as f:
    f.write(content)


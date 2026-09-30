import re

with open('src/app/dashboard/kiosk/page.tsx', 'r') as f:
    content = f.read()

content = content.replace("const kitchenItems = [];", "const kitchenItems: any[] = [];")
content = content.replace("const retailItems = [];", "const retailItems: any[] = [];")

with open('src/app/dashboard/kiosk/page.tsx', 'w') as f:
    f.write(content)

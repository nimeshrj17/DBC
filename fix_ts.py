import re

with open('src/app/dashboard/analytics/page.tsx', 'r') as f:
    content = f.read()

content = content.replace("onClick={(data) => {", "onClick={(data: any) => {")

with open('src/app/dashboard/analytics/page.tsx', 'w') as f:
    f.write(content)

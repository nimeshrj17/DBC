import re
with open('src/app/globals.css', 'r') as f:
    content = f.read()

content = content.replace('var(--font-outfit)', 'var(--font-karla)')

with open('src/app/globals.css', 'w') as f:
    f.write(content)

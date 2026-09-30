import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# 1. Update the Google Fonts URL
# Current URL contains: family=Noto+Sans+Devanagari:wght@700
# We want to replace it with: family=Kalam:wght@400;700
content = re.sub(r'family=Noto\+Sans\+Devanagari:wght@700', 'family=Kalam:wght@400;700', content)

# 2. Update the CSS class for .hindi-font
# Current: font-family: 'Noto Sans Devanagari', sans-serif !important;
# New: font-family: 'Kalam', cursive !important;
content = content.replace("font-family: 'Noto Sans Devanagari', sans-serif !important;", "font-family: 'Kalam', cursive !important;")

with open('physical_menu.html', 'w') as f:
    f.write(content)

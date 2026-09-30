import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

broken_block = """            opacity: 0.85;
        @media print {"""

fixed_block = """            opacity: 0.85;
        }

        @media print {"""

content = content.replace(broken_block, fixed_block)

with open('physical_menu.html', 'w') as f:
    f.write(content)

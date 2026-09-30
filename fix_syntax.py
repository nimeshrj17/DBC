import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# Replace the broken bracket block
broken_css = """
        }

                
        }

        
        @media print {"""

fixed_css = """
        @media print {"""

content = content.replace(broken_css, fixed_css)

with open('physical_menu.html', 'w') as f:
    f.write(content)

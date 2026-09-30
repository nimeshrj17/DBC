import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# Let's adjust the global CSS instead of just @media print so it looks good on screen too
content = content.replace('padding: 15mm;', 'padding: 10mm;')
content = content.replace('margin-bottom: 1rem;', 'margin-bottom: 0.5rem;') # .menu-item
content = content.replace('margin-bottom: 2rem;', 'margin-bottom: 1rem;') # .section-break

# Also remove the zoom from print CSS and rely on smaller margins
new_media_print = """        @media print {
            body { 
                background-color: #f4ecd8 !important;
                background-image: url('https://www.transparenttextures.com/patterns/cream-paper.png') !important;
            }
            .page { 
                margin: 0; 
                box-shadow: none; 
                width: 210mm;
                height: 297mm;
                overflow: hidden;
                page-break-after: always;
                page-break-inside: avoid;
            }
        }"""
content = re.sub(r'@media print \{.*?\}', new_media_print, content, flags=re.DOTALL)

with open('physical_menu.html', 'w') as f:
    f.write(content)

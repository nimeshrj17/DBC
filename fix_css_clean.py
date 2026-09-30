import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# Replace the ENTIRE @media print block
new_print_css = """        @media print {
            body { 
                background-color: #f4ecd8 !important;
                background-image: url('https://www.transparenttextures.com/patterns/cream-paper.png') !important;
            }
            .page { 
                margin: 0; 
                box-shadow: none; 
                width: 210mm;
                height: 297mm;
                padding-bottom: 25mm !important; /* Safety margin for footer */
                overflow: hidden;
                page-break-after: always;
                page-break-inside: avoid;
            }
        }"""

content = re.sub(r'@media print \{.*?\}\s*\}\s*\.page \{.*?\/\* Scale down slightly.*?\n            \}', '', content, flags=re.DOTALL) # Clean up old messy duplicate stuff
content = re.sub(r'@media print \{.*?\}', new_print_css, content, flags=re.DOTALL)

with open('physical_menu.html', 'w') as f:
    f.write(content)

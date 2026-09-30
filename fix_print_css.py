import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

# Replace the @media print block
old_media_print = """        @media print {
            body { background: none; }
            .page { 
                margin: 0; 
                box-shadow: none; 
                width: 100%;
                height: 100%;
            }
        }"""

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
                overflow: hidden; /* Force it to cut off rather than spill to next page */
                page-break-after: always;
                page-break-inside: avoid;
            }
            /* Scale down slightly to ensure it fits A4 without overflow */
            .page > * {
                zoom: 0.82;
            }
        }"""

if old_media_print in content:
    content = content.replace(old_media_print, new_media_print)
else:
    print("Could not find exact old_media_print match. Using regex...")
    content = re.sub(r'@media print \{.*?\}', new_media_print, content, flags=re.DOTALL)

with open('physical_menu.html', 'w') as f:
    f.write(content)

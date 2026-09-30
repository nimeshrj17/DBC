with open('physical_menu.html', 'r') as f:
    content = f.read()

# I need to insert @media print just before .menu-item
if '@media print' not in content:
    new_print_css = """
        @media print {
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
        }
"""
    content = content.replace('.menu-item {', new_print_css + '        .menu-item {')

with open('physical_menu.html', 'w') as f:
    f.write(content)

import re

with open('physical_menu.html', 'r') as f:
    content = f.read()

footer_css = """
        .page::after {
            content: "✦ You can place an order from the QR code attached on your table ✦";
            position: absolute;
            bottom: 6mm;
            left: 0;
            width: 100%;
            text-align: center;
            font-family: 'Caveat', cursive;
            font-size: 1.3rem;
            color: var(--brand-accent);
            font-weight: 700;
            letter-spacing: 0.5px;
            opacity: 0.85;
        }
"""

content = content.replace('page-break-after: always;\n        }', 'page-break-after: always;\n        }\n' + footer_css)

with open('physical_menu.html', 'w') as f:
    f.write(content)

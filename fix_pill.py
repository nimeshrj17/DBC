import re

with open('src/components/dashboard/QRCodeGenerator.tsx', 'r') as f:
    content = f.read()

find_style = """          padding: '12px 32px',
          borderRadius: '9999px',
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.5px'
        }}"""

replace_style = """          padding: '12px 32px',
          borderRadius: '9999px',
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}"""

content = content.replace(find_style, replace_style)

with open('src/components/dashboard/QRCodeGenerator.tsx', 'w') as f:
    f.write(content)

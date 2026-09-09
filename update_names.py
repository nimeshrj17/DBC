with open('src/app/order/[tableId]/page.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    '<h1 className="text-2xl font-black tracking-tight leading-none text-white">Dream Bean</h1>\n              <p className="text-sm font-medium opacity-80 tracking-widest uppercase mt-1">Café</p>',
    '<h1 className="text-xl md:text-2xl font-black tracking-tight leading-none text-white">राखा भाई की चाय</h1>\n              <p className="text-sm font-medium opacity-80 tracking-widest uppercase mt-1">and Café</p>'
)
with open('src/app/order/[tableId]/page.tsx', 'w') as f:
    f.write(content)

with open('src/app/dashboard/layout.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    '<span className="text-xl font-bold tracking-tight">Dream Bean Cafe</span>',
    '<span className="text-xl font-bold tracking-tight">राखा भाई की चाय and Cafe</span>'
)
with open('src/app/dashboard/layout.tsx', 'w') as f:
    f.write(content)

with open('src/app/layout.tsx', 'r') as f:
    content = f.read()
content = content.replace('Dream Bean Cafe', 'राखा भाई की चाय and Cafe')
with open('src/app/layout.tsx', 'w') as f:
    f.write(content)

with open('src/app/page.tsx', 'r') as f:
    content = f.read()
content = content.replace('Dream Bean Cafe', 'राखा भाई की चाय and Cafe')
with open('src/app/page.tsx', 'w') as f:
    f.write(content)

with open('src/components/dashboard/QRCodeGenerator.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    "fontSize: '28px',",
    "fontSize: '22px',"
)
content = content.replace(
    'Dream Bean<br />Café',
    'राखा भाई की चाय<br />and Café'
)
with open('src/components/dashboard/QRCodeGenerator.tsx', 'w') as f:
    f.write(content)


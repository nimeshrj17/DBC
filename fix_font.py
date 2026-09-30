import re
with open('src/app/layout.tsx', 'r') as f:
    content = f.read()

# Change Outfit to Karla
content = content.replace('import { Outfit } from "next/font/google";', 'import { Karla } from "next/font/google";')
content = content.replace('const outfit = Outfit({', 'const karla = Karla({')
content = content.replace('variable: "--font-outfit"', 'variable: "--font-karla"')
content = content.replace('className={`${outfit.variable} h-full antialiased`}', 'className={`${karla.variable} font-sans h-full antialiased`}')

with open('src/app/layout.tsx', 'w') as f:
    f.write(content)

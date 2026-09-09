with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    'text-xs font-bold text-primary mt-1 bg-primary/10 inline-block px-2 py-0.5 rounded-full',
    'text-xs font-bold text-black mt-1 bg-primary/10 inline-block px-2 py-0.5 rounded-full'
)
with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

with open('src/components/dashboard/MenuPickerModal.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    'text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded-full',
    'text-xs font-bold bg-primary/20 text-black px-2 py-1 rounded-full'
)
with open('src/components/dashboard/MenuPickerModal.tsx', 'w') as f:
    f.write(content)


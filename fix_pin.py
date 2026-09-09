with open('src/app/dashboard/layout.tsx', 'r') as f:
    content = f.read()

content = content.replace("pin === '1234'", "pin === '895518'")
content = content.replace("disabled={pin.length < 4}", "disabled={pin.length < 6}")
content = content.replace("maxLength={4}", "maxLength={6}")

with open('src/app/dashboard/layout.tsx', 'w') as f:
    f.write(content)

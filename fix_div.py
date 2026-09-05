with open('src/app/dashboard/inventory/page.tsx', 'r') as f:
    content = f.read()

content = content.replace("    </div>\n      {isRestockModalOpen", "      {isRestockModalOpen")
content = content.replace("      )}\n  );\n}", "      )}\n    </div>\n  );\n}")

with open('src/app/dashboard/inventory/page.tsx', 'w') as f:
    f.write(content)

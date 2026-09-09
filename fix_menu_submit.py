with open('src/app/dashboard/menu/page.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [isAddModalOpen, setIsAddModalOpen] = useState(false);", "const [isAddModalOpen, setIsAddModalOpen] = useState(false);\n  const [isSubmitting, setIsSubmitting] = useState(false);")

with open('src/app/dashboard/menu/page.tsx', 'w') as f:
    f.write(content)


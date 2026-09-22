import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace(
    "import PaymentModal from '@/components/dashboard/PaymentModal';",
    "import PaymentModal from '@/components/dashboard/PaymentModal';\nimport { FloorMap } from '@/components/dashboard/FloorMap';"
)

with open(filepath, "w") as f:
    f.write(content)


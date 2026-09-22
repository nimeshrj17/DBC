import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

if "import { FloorMap }" not in content:
    content = content.replace(
        "import { QuickCart } from '@/components/dashboard/QuickCart';",
        "import { QuickCart } from '@/components/dashboard/QuickCart';\nimport { FloorMap } from '@/components/dashboard/FloorMap';"
    )

content = content.replace(
    "onSelectTable={(id) => setSelectedTableId(id)}",
    "onSelectTable={(id: string) => setSelectedTableId(id)}"
)

with open(filepath, "w") as f:
    f.write(content)


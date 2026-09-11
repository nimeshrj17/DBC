with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const { tables, loading, updateTableStatus, addTable, updateTableDetails, deleteTable } = useTables();",
    "const { tables, loading, updateTableStatus, addTable, updateTableDetails, deleteTable, transferTable } = useTables();"
)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)


with open('src/lib/hooks/useTables.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';",
    "import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';"
)

with open('src/lib/hooks/useTables.ts', 'w') as f:
    f.write(content)

with open('src/lib/hooks/useTables.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "return { tables, loading, updateTableStatus, addTable, updateTableDetails, deleteTable };",
    "return { tables, loading, updateTableStatus, addTable, updateTableDetails, deleteTable, transferTable };"
)

content = content.replace(
    "import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';",
    "import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';"
)

with open('src/lib/hooks/useTables.ts', 'w') as f:
    f.write(content)

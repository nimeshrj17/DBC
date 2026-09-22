import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/lib/hooks/useTables.ts"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace(
    "seats: number;",
    "seats: number;\n  x?: number;\n  y?: number;"
)
content = content.replace(
    "  const updateTableDetails = async (id: string, name: string, section: string, number: number, seats: number) => {",
    "  const updateTableDetails = async (id: string, name: string, section: string, number: number, seats: number, x?: number, y?: number) => {"
)
content = content.replace(
    "await updateDoc(doc(db, 'tables', id), { name, section, number, seats });",
    "const updateData: any = { name, section, number, seats };\n      if (x !== undefined) updateData.x = x;\n      if (y !== undefined) updateData.y = y;\n      await updateDoc(doc(db, 'tables', id), updateData);"
)
# also expose updateTablePosition specifically
new_pos_func = """  const updateTablePosition = async (id: string, x: number, y: number) => {
    try {
      await updateDoc(doc(db, 'tables', id), { x, y });
    } catch (error) {
      console.error("Error updating position:", error);
    }
  };

  return { tables, loading, updateTableStatus, addTable, updateTableDetails, deleteTable, transferTable, updateTablePosition };"""

content = content.replace("return { tables, loading, updateTableStatus, addTable, updateTableDetails, deleteTable, transferTable };", new_pos_func)

with open(filepath, "w") as f:
    f.write(content)


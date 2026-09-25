filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_block = """      setDraftOrders(prev => {
        const next = { ...prev };
        delete next[selectedTable.id];
        return next;
      });
      setIsMenuOpen(false);
      setSelectedTableId(null);

        return next;
      });"""

good_block = """      setDraftOrders(prev => {
        const next = { ...prev };
        delete next[selectedTable.id];
        return next;
      });
      setIsMenuOpen(false);
      setSelectedTableId(null);"""

content = content.replace(bad_block, good_block)

with open(filepath, "w") as f:
    f.write(content)

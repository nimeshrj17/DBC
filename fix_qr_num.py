import re

with open('src/components/dashboard/QRCodeGenerator.tsx', 'r') as f:
    content = f.read()

find_pill = "{tableName || `Table ${tableNumber}`}"
replace_pill = "Table {tableNumber}"
content = content.replace(find_pill, replace_pill)

find_save = "pdf.save(`${tableName ? tableName.replace(/\\s+/g, '_') : `Table_${tableNumber}`}_QR_Menu.pdf`);"
replace_save = "pdf.save(`Table_${tableNumber}_QR_Menu.pdf`);"
content = content.replace(find_save, replace_save)

with open('src/components/dashboard/QRCodeGenerator.tsx', 'w') as f:
    f.write(content)

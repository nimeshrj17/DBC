import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/QuickSaleModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace("status: 'served', // Instantly served since it's a quick retail sale", "")
content = content.replace("handleProcessPayment('Cash')", "handleProcessPayment('cash')")
content = content.replace("handleProcessPayment('UPI')", "handleProcessPayment('upi')")
content = content.replace("method: 'Cash' | 'UPI'", "method: 'cash' | 'upi'")

with open(filepath, "w") as f:
    f.write(content)


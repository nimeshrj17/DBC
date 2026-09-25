filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/analytics/page.tsx"

with open(filepath, "r") as f:
    content = f.read()

# Fix useState
content = content.replace("useState<'overview' | 'menu' | 'customers' | 'splits'>", "useState<'overview' | 'menu' | 'customers' | 'splits' | 'history'>")

# Fix orderType
content = content.replace("{order.orderType || 'Dine-in'}", "{order.tableNumber === 999999 ? 'Takeaway' : 'Dine-in'}")

# Fix paymentStatus refunded
content = content.replace("order.paymentStatus === 'refunded' ? 'bg-rose-100 text-rose-700' :", "")

with open(filepath, "w") as f:
    f.write(content)

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const { orders, loading: ordersLoading, updateOrder, updateOrderStatus, createOrder } = useOrders();",
    "const { orders, loading: ordersLoading, updateOrder, updateOrderStatus, createOrder, removeSentItemTransaction } = useOrders();"
)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)


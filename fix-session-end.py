import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Add prevOrdersRef
content = content.replace("const prevAwaitingRef = useRef(false);", "const prevAwaitingRef = useRef(false);\n  const prevOrdersRef = useRef(0);")

# 2. Update the useEffect logic
old_effect = """  useEffect(() => {
    if (tableOrders.length > 0) {
      setFinalReceiptData({
        total: tableOrders.reduce((sum, order) => sum + order.total, 0),
        count: tableOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0),
        ref: table?.id?.substring(0,6).toUpperCase() || ''
      });
    }
    
    const isAwaiting = tableOrders.some(o => o.paymentStatus === 'awaiting_confirmation');
    if (prevAwaitingRef.current && !isAwaiting && tableOrders.length === 0) {
      setJustPaid(true);
    }
    prevAwaitingRef.current = isAwaiting;
  }, [tableOrders, table]);"""

new_effect = """  useEffect(() => {
    if (tableOrders.length > 0) {
      setFinalReceiptData({
        total: tableOrders.reduce((sum, order) => sum + order.total, 0),
        count: tableOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0),
        ref: table?.id?.substring(0,6).toUpperCase() || ''
      });
    }
    
    const isAwaiting = tableOrders.some(o => o.paymentStatus === 'awaiting_confirmation');
    
    const userPaid = prevAwaitingRef.current && !isAwaiting && tableOrders.length === 0;
    const staffCleared = prevOrdersRef.current > 0 && tableOrders.length === 0 && table?.status === 'empty';
    
    if (userPaid || staffCleared) {
      setJustPaid(true);
    }
    
    prevAwaitingRef.current = isAwaiting;
    prevOrdersRef.current = tableOrders.length;
  }, [tableOrders, table]);"""

content = content.replace(old_effect, new_effect)

with open(filepath, "w") as f:
    f.write(content)

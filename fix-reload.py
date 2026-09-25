import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update the mount useEffect
old_mount = """  useEffect(() => {
    let stored = localStorage.getItem('deviceId');
    if (!stored) {
      stored = 'dev_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('deviceId', stored);
    }
    setDeviceId(stored);
  }, []);"""

new_mount = """  useEffect(() => {
    let stored = localStorage.getItem('deviceId');
    if (!stored) {
      stored = 'dev_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('deviceId', stored);
    }
    setDeviceId(stored);
    
    if (sessionStorage.getItem(`closed_table_${tableId}`)) {
      setJustPaid(true);
    }
  }, [tableId]);"""

content = content.replace(old_mount, new_mount)

# 2. Update the justPaid trigger
old_trigger = """    if (userPaid || staffCleared) {
      setJustPaid(true);
    }"""
new_trigger = """    if (userPaid || staffCleared) {
      setJustPaid(true);
      setCart([]);
      sessionStorage.setItem(`closed_table_${tableId}`, 'true');
    }"""
content = content.replace(old_trigger, new_trigger)

with open(filepath, "w") as f:
    f.write(content)

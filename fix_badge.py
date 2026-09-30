import re
with open('src/app/dashboard/layout.tsx', 'r') as f:
    content = f.read()

# Replace the liveOrdersCount line
pattern = r"const liveOrdersCount = orders\.filter\(o => o\.status !== 'completed' && o\.status !== 'cancelled'\)\.length;"
replacement = """const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const liveOrdersCount = orders.filter(o => {
    if (o.status === 'completed' || o.status === 'cancelled') return false;
    if (!o.createdAt) return false;
    const createdTime = typeof o.createdAt.toMillis === 'function' ? o.createdAt.toMillis() : (o.createdAt.seconds * 1000);
    return createdTime >= todayStart.getTime();
  }).length;"""

content = re.sub(pattern, replacement, content)

with open('src/app/dashboard/layout.tsx', 'w') as f:
    f.write(content)

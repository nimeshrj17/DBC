import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_drawer = 'className="fixed md:absolute inset-x-0 bottom-0 md:inset-y-0 md:right-0 h-[85vh] md:h-full w-full md:w-[430px] max-w-full flex-shrink-0 bg-white md:border-l border-slate-200 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 z-[50] slideover-shadow rounded-t-[28px] md:rounded-none"'
good_drawer = 'className="fixed md:absolute inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 h-[85vh] md:h-full w-full md:w-[430px] max-w-full flex-shrink-0 bg-white md:border-l border-slate-200 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 z-[50] slideover-shadow rounded-t-[28px] md:rounded-none"'

content = content.replace(bad_drawer, good_drawer)

with open(filepath, "w") as f:
    f.write(content)

import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/MenuPickerModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_outer = 'className="fixed inset-0 bg-black/60 backdrop-blur-xs flex md:items-center items-end justify-center z-[60] md:p-4 transition-opacity"'
good_outer = 'className="fixed md:absolute inset-0 md:inset-y-0 md:left-0 md:right-[430px] bg-black/60 md:bg-[#F8FAFC] md:backdrop-blur-none backdrop-blur-xs flex md:items-stretch items-end justify-center z-[60] md:z-[45] md:p-0 transition-opacity"'

bad_inner = 'className="bg-white md:rounded-2xl rounded-t-3xl w-full max-w-4xl h-[94vh] md:h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 md:animate-none"'
good_inner = 'className="bg-white rounded-t-3xl md:rounded-none w-full md:max-w-none h-[94vh] md:h-full flex flex-col shadow-2xl md:shadow-none overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-left md:border-r border-slate-200 duration-300"'

content = content.replace(bad_outer, good_outer)
content = content.replace(bad_inner, good_inner)

with open(filepath, "w") as f:
    f.write(content)

import re

# 1. Update MenuPickerModal.tsx (Hide X on desktop)
filepath_menu = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/MenuPickerModal.tsx"
with open(filepath_menu, "r") as f:
    content_menu = f.read()

bad_menu_btn = '<button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">'
good_menu_btn = '<button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors md:hidden">'
content_menu = content_menu.replace(bad_menu_btn, good_menu_btn)

with open(filepath_menu, "w") as f:
    f.write(content_menu)


# 2. Update page.tsx (Table Drawer X button closes both)
filepath_page = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath_page, "r") as f:
    content_page = f.read()

bad_drawer_btn = '<button onClick={() => setSelectedTableId(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Close Drawer">'
good_drawer_btn = '<button onClick={() => { setSelectedTableId(null); setIsMenuOpen(false); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Close Drawer">'

# There's also the mobile backdrop that closes the drawer. Let's make it close both.
bad_backdrop = '<div className="md:hidden fixed inset-0 bg-black/40 z-[40] backdrop-blur-[2px]" onClick={() => setSelectedTableId(null)}></div>'
good_backdrop = '<div className="md:hidden fixed inset-0 bg-black/40 z-[40] backdrop-blur-[2px]" onClick={() => { setSelectedTableId(null); setIsMenuOpen(false); }}></div>'

content_page = content_page.replace(bad_drawer_btn, good_drawer_btn)
content_page = content_page.replace(bad_backdrop, good_backdrop)

with open(filepath_page, "w") as f:
    f.write(content_page)


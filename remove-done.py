import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/MenuPickerModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_done = """          <Button onClick={onClose} className="px-8 font-bold bg-[#D2F801] text-black hover:bg-[#c2e600]">
            Done
          </Button>"""

content = content.replace(bad_done, "")

with open(filepath, "w") as f:
    f.write(content)


filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/globals.css"

with open(filepath, "r") as f:
    content = f.read()

content = content.replace(
    "* {\n  border-radius: 0 !important;\n}",
    "*:not(.rounded-full) {\n  border-radius: 0 !important;\n}"
)

with open(filepath, "w") as f:
    f.write(content)

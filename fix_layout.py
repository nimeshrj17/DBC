import re

with open('src/app/layout.tsx', 'r') as f:
    content = f.read()

head_content = """      <head>
        <link rel="stylesheet" href="https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css" />
      </head>
      <body"""

content = content.replace('      <body', head_content)

with open('src/app/layout.tsx', 'w') as f:
    f.write(content)

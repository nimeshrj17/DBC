filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/DownloadAllQRsButton.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_block = """        // Text: Table Number
        pdf.setFontSize(subtitleFontSize);
        pdf.text(`Table ${table.number}`, x + cellWidth / 2, qrY + qrSize + (cellHeight * 0.12), { align: "center" });
        if (table.name) {
          pdf.setFontSize(titleFontSize * 0.8);
          pdf.text(`(${table.name})`, x + cellWidth / 2, qrY + qrSize + (cellHeight * 0.12) + (titleFontSize * 0.4), { align: "center" });
        }"""

good_block = """        // Text: Table Number
        pdf.setFontSize(subtitleFontSize);
        pdf.text(`Table ${table.number}`, x + cellWidth / 2, qrY + qrSize + (cellHeight * 0.12), { align: "center" });"""

content = content.replace(bad_block, good_block)

with open(filepath, "w") as f:
    f.write(content)

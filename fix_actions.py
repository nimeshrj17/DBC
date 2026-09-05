with open('src/app/dashboard/inventory/page.tsx', 'r') as f:
    content = f.read()

find_str = """                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-red-500 hover:text-red-700 p-1 md:p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </td>"""

replace_str = """                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right space-x-1">
                    <button 
                      onClick={() => handleRestockClick(item)}
                      className="text-green-600 hover:text-green-800 p-1 md:p-2 rounded-full hover:bg-green-50 transition-colors"
                      title="Add Stock (Restock)"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEditClick(item)}
                      className="text-blue-500 hover:text-blue-700 p-1 md:p-2 rounded-full hover:bg-blue-50 transition-colors"
                      title="Edit Item Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-red-500 hover:text-red-700 p-1 md:p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>"""

content = content.replace(find_str, replace_str)

with open('src/app/dashboard/inventory/page.tsx', 'w') as f:
    f.write(content)


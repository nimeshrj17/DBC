import re

def update_dashboard():
    with open('src/app/dashboard/page.tsx', 'r') as f:
        content = f.read()

    # Add states
    content = content.replace(
        "const [isSubmitting, setIsSubmitting] = useState(false);",
        "const [isSubmitting, setIsSubmitting] = useState(false);\n  const [isAssigning, setIsAssigning] = useState(false);\n  const [isClearing, setIsClearing] = useState(false);"
    )
    
    # Handle handleSendToKitchen
    content = content.replace(
        """<Button 
                    variant="primary" 
                    className="col-span-2 shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                    onClick={handleSendToKitchen}
                  >
                    Send New Ticket to Kitchen
                  </Button>""",
        """<Button 
                    variant="primary" 
                    className="col-span-2 shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                    onClick={handleSendToKitchen}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send New Ticket to Kitchen'}
                  </Button>"""
    )
    
    # Handle handleQuickAssign
    content = content.replace(
        "const handleQuickAssign = async () => {",
        "const handleQuickAssign = async () => {\n    setIsAssigning(true);"
    )
    content = content.replace(
        """toast.success("Table marked as occupied");
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign table");
    }
  };""",
        """toast.success("Table marked as occupied");
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign table");
    } finally {
      setIsAssigning(false);
    }
  };"""
    )
    
    # Quick assign buttons
    content = content.replace(
        """<Button variant="primary" className="w-full" onClick={handleQuickAssign}>Quick Assign (Skip Details)</Button>
                  <Button variant="outline" className="w-full" onClick={() => setAssignCustomerModalOpen(true)}>Add Customer Details</Button>""",
        """<Button variant="primary" className="w-full" disabled={isAssigning} onClick={handleQuickAssign}>{isAssigning ? 'Assigning...' : 'Quick Assign (Skip Details)'}</Button>
                  <Button variant="outline" className="w-full" disabled={isAssigning} onClick={() => setAssignCustomerModalOpen(true)}>Add Customer Details</Button>"""
    )
    
    # Assign customer form
    content = content.replace(
        """<form onSubmit={async (e) => {
              e.preventDefault();
              const finalName = cName.trim() || 'Assigned by Admin';
              const finalPhone = cPhone.trim() || '9999999999';
              try {""",
        """<form onSubmit={async (e) => {
              e.preventDefault();
              setIsAssigning(true);
              const finalName = cName.trim() || 'Assigned by Admin';
              const finalPhone = cPhone.trim() || '9999999999';
              try {"""
    )
    content = content.replace(
        """setCPhone('');
              } catch (err) {
                console.error(err);
              }
            }} className="space-y-4">""",
        """setCPhone('');
              } catch (err) {
                console.error(err);
              } finally {
                setIsAssigning(false);
              }
            }} className="space-y-4">"""
    )
    content = content.replace(
        """<Button variant="primary" type="submit" className="flex-1 py-6">Assign & Mark Occupied</Button>""",
        """<Button variant="primary" type="submit" disabled={isAssigning} className="flex-1 py-6">{isAssigning ? 'Assigning...' : 'Assign & Mark Occupied'}</Button>"""
    )

    # confirmClearTable
    content = content.replace(
        "const confirmClearTable = async (forceClear: boolean = false) => {",
        "const confirmClearTable = async (forceClear: boolean = false) => {\n    setIsClearing(true);\n    try {"
    )
    content = content.replace(
        """setClearTablePrompt(null);
  };""",
        """setClearTablePrompt(null);
    } finally {
      setIsClearing(false);
    }
  };"""
    )

    # Clear Table Buttons
    content = content.replace(
        """<Button 
                    variant="outline" 
                    className="w-full py-6 text-base text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => confirmClearTable(true)}
                  >
                    Force Clear (Cancel Orders)
                  </Button>""",
        """<Button 
                    variant="outline" 
                    className="w-full py-6 text-base text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => confirmClearTable(true)}
                    disabled={isClearing}
                  >
                    {isClearing ? 'Clearing...' : 'Force Clear (Cancel Orders)'}
                  </Button>"""
    )
    content = content.replace(
        """<Button 
                  variant="primary" 
                  className="w-full py-6 text-base shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                  onClick={() => confirmClearTable(false)}
                >
                  Yes, Clear Table
                </Button>""",
        """<Button 
                  variant="primary" 
                  className="w-full py-6 text-base shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                  onClick={() => confirmClearTable(false)}
                  disabled={isClearing}
                >
                  {isClearing ? 'Clearing...' : 'Yes, Clear Table'}
                </Button>"""
    )
    content = content.replace(
        """<Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setClearTablePrompt(null)}
              >
                Cancel
              </Button>""",
        """<Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setClearTablePrompt(null)}
                disabled={isClearing}
              >
                Cancel
              </Button>"""
    )
    
    with open('src/app/dashboard/page.tsx', 'w') as f:
        f.write(content)

def update_kiosk():
    with open('src/app/dashboard/kiosk/page.tsx', 'r') as f:
        content = f.read()
    
    content = content.replace(
        """<button 
                disabled={!tableNumber}
                onClick={handlePlaceOrder}
                className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all disabled:opacity-50 flex justify-center items-center"
              >
                Place Order
              </button>""",
        """<button 
                disabled={!tableNumber || isSubmitting}
                onClick={handlePlaceOrder}
                className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all disabled:opacity-50 flex justify-center items-center"
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </button>"""
    )
    
    with open('src/app/dashboard/kiosk/page.tsx', 'w') as f:
        f.write(content)

def update_inventory():
    with open('src/app/dashboard/inventory/page.tsx', 'r') as f:
        content = f.read()

    # Add state
    content = content.replace(
        "const [editingItemId, setEditingItemId] = useState<string | null>(null);",
        "const [editingItemId, setEditingItemId] = useState<string | null>(null);\n  const [isSubmitting, setIsSubmitting] = useState(false);"
    )
    
    # Handle handleSubmit (add/edit)
    content = content.replace(
        """const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.totalCost) return;""",
        """const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.totalCost || isSubmitting) return;
    setIsSubmitting(true);"""
    )
    
    content = content.replace(
        """toast.error(editingItemId ? "Failed to update item" : "Failed to add item");
    }
  };""",
        """toast.error(editingItemId ? "Failed to update item" : "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };"""
    )
    
    # Handle handleRestockSubmit
    content = content.replace(
        """const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockData.itemId || !restockData.addedQuantity || !restockData.addedCost) return;""",
        """const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockData.itemId || !restockData.addedQuantity || !restockData.addedCost || isSubmitting) return;
    setIsSubmitting(true);"""
    )
    content = content.replace(
        """toast.error("Failed to restock item");
    }
  };""",
        """toast.error("Failed to restock item");
    } finally {
      setIsSubmitting(false);
    }
  };"""
    )

    # Buttons
    content = content.replace(
        """<Button type="submit">{editingItemId ? 'Save Changes' : 'Add Item'}</Button>""",
        """<Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editingItemId ? 'Save Changes' : 'Add Item')}</Button>"""
    )
    content = content.replace(
        """<Button type="submit">Complete Restock</Button>""",
        """<Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Complete Restock'}</Button>"""
    )
    
    with open('src/app/dashboard/inventory/page.tsx', 'w') as f:
        f.write(content)

def update_menu():
    with open('src/app/dashboard/menu/page.tsx', 'r') as f:
        content = f.read()

    # Add state
    content = content.replace(
        "const [isAddModalOpen, setIsAddModalOpen] = useState(false);",
        "const [isAddModalOpen, setIsAddModalOpen] = useState(false);\n  const [isSubmitting, setIsSubmitting] = useState(false);"
    )
    
    # Handle handleSubmit
    content = content.replace(
        """const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) return;""",
        """const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category || isSubmitting) return;
    setIsSubmitting(true);"""
    )
    content = content.replace(
        """toast.error(editingItemId ? "Failed to update menu item" : "Failed to add menu item");
    }
  };""",
        """toast.error(editingItemId ? "Failed to update menu item" : "Failed to add menu item");
    } finally {
      setIsSubmitting(false);
    }
  };"""
    )
    
    content = content.replace(
        """<Button type="submit">{editingItemId ? 'Save Changes' : 'Add Item'}</Button>""",
        """<Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editingItemId ? 'Save Changes' : 'Add Item')}</Button>"""
    )
    
    with open('src/app/dashboard/menu/page.tsx', 'w') as f:
        f.write(content)

try:
    update_dashboard()
except Exception as e:
    print('Failed dashboard', e)
try:
    update_kiosk()
except Exception as e:
    print('Failed kiosk', e)
try:
    update_inventory()
except Exception as e:
    print('Failed inventory', e)
try:
    update_menu()
except Exception as e:
    print('Failed menu', e)


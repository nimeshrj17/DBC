with open('src/app/dashboard/inventory/page.tsx', 'r') as f:
    content = f.read()

# Fix handleSubmit
find_submit_end = """      setIsAddModalOpen(false);
      setEditingItemId(null);
      setFormData({ ...initialForm, type: activeTab });
    } catch (error) {
      console.error(error);
      toast.error("Failed to add inventory item.");
    }
  };"""

replace_submit_end = """      setIsAddModalOpen(false);
      setEditingItemId(null);
      setFormData({ ...initialForm, type: activeTab });
    } catch (error) {
      console.error(error);
      toast.error("Failed to add inventory item.");
    } finally {
      setIsSubmitting(false);
    }
  };"""

content = content.replace(find_submit_end, replace_submit_end)

# Fix handleRestockSubmit
find_restock_start = """  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || !restockQty) return;
    
    try {"""

replace_restock_start = """  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || !restockQty || isSubmitting) return;
    setIsSubmitting(true);
    
    try {"""

find_restock_end = """      toast.success("Stock added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to restock");
    }
  };"""

replace_restock_end = """      toast.success("Stock added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to restock");
    } finally {
      setIsSubmitting(false);
      setRestockQty('');
      setRestockCost('');
    }
  };"""

content = content.replace(find_restock_start, replace_restock_start)
content = content.replace(find_restock_end, replace_restock_end)

with open('src/app/dashboard/inventory/page.tsx', 'w') as f:
    f.write(content)

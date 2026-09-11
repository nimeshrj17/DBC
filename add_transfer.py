with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# 1. Add useTables import destructuring (transferTable is missing)
content = content.replace(
    "const { tables, loading: tablesLoading, addTable, updateTableStatus, assignCustomer } = useTables();",
    "const { tables, loading: tablesLoading, addTable, updateTableStatus, assignCustomer, transferTable } = useTables();"
)

# 2. Add Modal States
content = content.replace(
    "const [isRemoving, setIsRemoving] = useState(false);",
    "const [isRemoving, setIsRemoving] = useState(false);\n  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);\n  const [isTransferring, setIsTransferring] = useState(false);\n  const [transferTargetId, setTransferTargetId] = useState('');"
)

# 3. Add handleTransfer function
transfer_func = """
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !transferTargetId || isTransferring) return;
    
    setIsTransferring(true);
    try {
      await transferTable(selectedTable.id, transferTargetId, selectedTable.activeOrderIds || []);
      toast.success("Table transferred successfully");
      setIsTransferModalOpen(false);
      setSelectedTableId(transferTargetId);
      setTransferTargetId('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to transfer table");
    } finally {
      setIsTransferring(false);
    }
  };
"""
# insert before useEffect
content = content.replace("  useEffect(() => {", transfer_func + "\n  useEffect(() => {")

# 4. Add Button in UI
find_clear_btn = """              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => handleClearTable()}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                Clear Table
              </Button>
            </div>"""

replace_clear_btn = """              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  onClick={() => setIsTransferModalOpen(true)}
                >
                  Transfer Table
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => handleClearTable()}
                >
                  Clear Table
                </Button>
              </div>
            </div>"""

content = content.replace(find_clear_btn, replace_clear_btn)

# 5. Add Modal UI
modal_ui = """
      {/* Transfer Table Modal */}
      {isTransferModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card/50">
              <h2 className="text-xl font-bold">Transfer Table</h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Move all active orders and customer details from <strong className="text-foreground">Table {selectedTable.number} {selectedTable.name ? `(${selectedTable.name})` : ''}</strong> to a new empty table.
              </p>
              
              <div>
                <label className="block text-sm font-medium mb-1">Select Destination Table</label>
                <select 
                  required
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="" disabled>-- Select Empty Table --</option>
                  {tables.filter(t => t.status === 'empty' && t.id !== selectedTable.id).map(t => (
                    <option key={t.id} value={t.id}>
                      Table {t.number} {t.name ? `(${t.name})` : ''} - {t.section || 'Main'}
                    </option>
                  ))}
                </select>
                {tables.filter(t => t.status === 'empty' && t.id !== selectedTable.id).length === 0 && (
                  <p className="text-red-500 text-xs mt-2">No empty tables available to transfer to.</p>
                )}
              </div>
              
              <div className="flex space-x-3 pt-4 mt-6 border-t border-border/50">
                <Button variant="outline" type="button" className="flex-1 py-6" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={isTransferring || !transferTargetId} className="flex-1 py-6">{isTransferring ? 'Transferring...' : 'Transfer Now'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
"""

content = content.replace("{/* Custom Clear Table Dialog */}", modal_ui + "\n      {/* Custom Clear Table Dialog */}")

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

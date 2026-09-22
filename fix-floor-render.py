import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_start = """      {/* Tables Display Section */}
      <div className="px-5 md:px-8 pb-12 space-y-6 md:space-y-9 mt-2 md:mt-0">
        {(() => {"""

good_start = """      {/* Tables Display Section */}
      <div className="px-5 md:px-8 pb-12 space-y-6 md:space-y-9 mt-2 md:mt-0">
        {viewMode === 'floor' ? (
          <FloorMap 
            tables={tables} 
            activeZone={activeZone} 
            onSelectTable={(id) => setSelectedTableId(id)} 
            onUpdatePosition={updateTablePosition} 
          />
        ) : (
          <>
        {(() => {"""

content = content.replace(bad_start, good_start)

bad_end = """        {tables.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-muted-foreground mb-4">No tables found.</p>
            <Button onClick={() => setIsAddTableOpen(true)}>Create your first table</Button>
          </div>
        )}
      </div>"""

good_end = """        {tables.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-muted-foreground mb-4">No tables found.</p>
            <Button onClick={() => setIsAddTableOpen(true)}>Create your first table</Button>
          </div>
        )}
        </>
        )}
      </div>"""

content = content.replace(bad_end, good_end)

with open(filepath, "w") as f:
    f.write(content)


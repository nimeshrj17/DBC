import React, { useState, useRef, useEffect } from 'react';
import { Table } from '@/lib/hooks/useTables';
import { Edit3, CheckCircle2, Lock } from 'lucide-react';

interface FloorMapProps {
  tables: Table[];
  activeZone: string;
  onSelectTable: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
}

export function FloorMap({ tables, activeZone, onSelectTable, onUpdatePosition }: FloorMapProps) {
  const [editMode, setEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const GRID_SIZE = 20;

  // Filter tables by active zone (unless 'All' is selected)
  const displayTables = activeZone === 'All' 
    ? tables 
    : tables.filter(t => (t.section || 'Main Hall') === activeZone);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!editMode) {
      onSelectTable(id);
      return;
    }
    setDraggingId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!editMode || !draggingId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Snap to grid
    const x = Math.max(0, Math.round(rawX / GRID_SIZE) * GRID_SIZE);
    const y = Math.max(0, Math.round(rawY / GRID_SIZE) * GRID_SIZE);
    
    // Temporarily apply style to DOM element for performance (vs React state per frame)
    const el = document.getElementById(`table-node-${draggingId}`);
    if (el) {
      el.style.transform = `translate(${x}px, ${y}px)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!editMode || !draggingId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    const x = Math.max(0, Math.round(rawX / GRID_SIZE) * GRID_SIZE);
    const y = Math.max(0, Math.round(rawY / GRID_SIZE) * GRID_SIZE);
    
    onUpdatePosition(draggingId, x, y);
    setDraggingId(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty': return 'bg-slate-200 border-slate-300 text-slate-500';
      case 'occupied': return 'bg-sky-100 border-sky-300 text-sky-700 shadow-[0_0_15px_rgba(14,165,233,0.3)]';
      case 'order_placed': return 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-[0_0_15px_rgba(99,102,241,0.3)]';
      case 'preparing': return 'bg-amber-100 border-amber-300 text-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'prepared': return 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
      case 'served': return 'bg-teal-100 border-teal-300 text-teal-700 shadow-[0_0_15px_rgba(20,184,166,0.3)]';
      case 'awaiting_payment': return 'bg-rose-100 border-rose-300 text-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse';
      default: return 'bg-slate-200 border-slate-300 text-slate-500';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
      <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-900">Floor Layout <span className="text-slate-400 font-normal">({activeZone})</span></h3>
          <p className="text-xs text-slate-500">
            {editMode ? 'Drag tables to arrange them.' : 'Click a table to manage it.'}
          </p>
        </div>
        <button 
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editMode ? 'bg-[#D9F927] text-slate-900 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {editMode ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> <span>Done Editing</span></>
          ) : (
            <><Edit3 className="w-3.5 h-3.5" /> <span>Edit Layout</span></>
          )}
        </button>
      </div>
      
      <div 
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="flex-1 relative overflow-auto touch-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]"
        style={{ backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`, backgroundPosition: `-${GRID_SIZE/2}px -${GRID_SIZE/2}px` }}
      >
        {displayTables.map((table, i) => {
          // Default positions if missing, staggered a bit
          const x = table.x ?? (i % 6) * 120 + 20;
          const y = table.y ?? Math.floor(i / 6) * 100 + 20;
          const isDragging = draggingId === table.id;
          
          return (
            <div
              key={table.id}
              id={`table-node-${table.id}`}
              onPointerDown={(e) => handlePointerDown(e, table.id)}
              className={`absolute w-[100px] h-[80px] rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-colors select-none ${getStatusColor(table.status)} ${editMode ? 'hover:brightness-95 hover:scale-105' : 'hover:scale-105'} ${isDragging ? 'opacity-70 scale-110 shadow-xl z-50' : 'z-10'}`}
              style={{
                transform: `translate(${x}px, ${y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
              }}
            >
              <span className="font-black text-lg">T{table.number}</span>
              {table.seats > 0 && (
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1 mt-1">
                  <Lock className="w-2.5 h-2.5" /> {table.seats} seats
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';
import React, { useState, useRef, useEffect } from 'react';

export const SwipeToConfirm = ({ onConfirm, text, isLoading }: { onConfirm: () => void, text: string, isLoading: boolean }) => {
  const [sliderWidth, setSliderWidth] = useState(56);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFired = useRef(false);

  const handleDrag = (clientX: number) => {
    if (!isDragging || isConfirmed || isLoading || hasFired.current) return;
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    
    const minWidth = 56;
    const maxWidth = rect.width;
    
    let newWidth = Math.max(minWidth, Math.min(x, maxWidth));
    setSliderWidth(newWidth);
    
    if (newWidth >= maxWidth * 0.95) {
      hasFired.current = true;
      setIsConfirmed(true);
      setSliderWidth(maxWidth);
      setIsDragging(false);
      onConfirm();
    }
  };

  const handleDragEnd = () => {
    if (isConfirmed || isLoading) return;
    setIsDragging(false);
    setSliderWidth(56); // reset
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseUp = () => handleDragEnd();
    const handleMouseMove = (e: MouseEvent) => handleDrag(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleDrag(e.touches[0].clientX);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isConfirmed, isLoading]);

  // Reset if loading finishes but they didn't navigate away (e.g. error)
  useEffect(() => {
    if (!isLoading && isConfirmed) {
      const t = setTimeout(() => {
        setIsConfirmed(false);
        setSliderWidth(56);
        hasFired.current = false;
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [isLoading, isConfirmed]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-[56px] rounded-xl overflow-hidden transition-colors shadow-sm select-none ${isLoading || isConfirmed ? 'bg-[#059669]' : 'bg-[#10B981]'}`}
    >
      <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-950 text-[15px] pointer-events-none z-10 opacity-70">
        {isLoading ? 'Sending...' : text}
      </div>
      
      {/* Sliding Fill */}
      <div 
        className={`absolute left-0 top-0 bottom-0 bg-[#34d399] z-20 flex items-center shadow-inner ${!isDragging && !isConfirmed ? 'transition-all duration-300' : ''}`}
        style={{ width: isConfirmed ? '100%' : `${sliderWidth}px` }}
      >
        {/* Draggable Knob */}
        <div 
          onMouseDown={() => { if(!isLoading && !isConfirmed) setIsDragging(true); }}
          onTouchStart={() => { if(!isLoading && !isConfirmed) setIsDragging(true); }}
          className="absolute right-1 w-[48px] h-[48px] rounded-lg bg-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {isConfirmed || isLoading ? (
            <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
          )}
        </div>
      </div>
    </div>
  );
};

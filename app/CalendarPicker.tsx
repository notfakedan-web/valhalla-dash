'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CalendarPicker({ date, setDate }: { date: any, setDate: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const formatDate = (d: Date | undefined) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select';

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateClick = (day: number) => {
    const newDate = new Date(year, month, day);
    if (!date?.from || (date.from && date.to)) {
      setDate({ from: newDate, to: undefined });
    } else {
      if (newDate < date.from) setDate({ from: newDate, to: date.from });
      else setDate({ from: date.from, to: newDate });
    }
  };

  const isSelected = (day: number) => {
    const target = new Date(year, month, day);
    return (date?.from && target.getTime() === date.from.getTime()) || (date?.to && target.getTime() === date.to.getTime());
  };

  const isInRange = (day: number) => {
    if (!date?.from || !date?.to) return false;
    const target = new Date(year, month, day);
    return target > date.from && target < date.to;
  };

  const handleQuickSelect = (daysAgo: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - daysAgo);
    setDate({ from, to });
    setIsOpen(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <>
      {/* TRIGGER BUTTON: This stays in the bar */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-all"
      >
        <CalendarIcon size={14} className="text-zinc-500" />
        <span className="whitespace-nowrap">{formatDate(date?.from)} - {formatDate(date?.to)}</span>
      </button>

      {/* THE MODAL: Uses !fixed and !inset-0 to ignore the bar's position */}
      {isOpen && (
        <div className="!fixed !inset-0 !z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          
          {/* Invisible click layer to close when tapping outside */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* THE CONTENT BOX: Centered relative to the screen, not the button */}
          <div className="relative bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0c0c0e]">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Timeline Selector</span>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400">
                <X size={16} />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="overflow-y-auto p-5 custom-scrollbar flex-1 bg-[#09090b]">
              
              {/* QUICK SELECT GRID */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                    { l: 'Today', d: 0 },
                    { l: 'Yesterday', d: 1 },
                    { l: '7 Days', d: 7 },
                    { l: '30 Days', d: 30 },
                    { l: '90 Days', d: 90 },
                    { l: 'Year', d: 365 }
                ].map(item => (
                  <button 
                    key={item.l} 
                    onClick={() => handleQuickSelect(item.d)} 
                    className="py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                  >
                    {item.l}
                  </button>
                ))}
              </div>

              {/* CALENDAR SECTION */}
              <div className="bg-zinc-900/40 rounded-2xl p-4 border border-zinc-800/50 w-full">
                <div className="flex justify-between items-center mb-6 px-1">
                   <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 text-zinc-500 hover:text-white"><ChevronLeft size={18}/></button>
                   <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                   <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 text-zinc-500 hover:text-white"><ChevronRight size={18}/></button>
                </div>
                
                <div className="grid grid-cols-7 gap-1.5 text-center mb-2 w-full">
                  {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] font-black text-zinc-600">{d}</span>)}
                </div>
                
                <div className="grid grid-cols-7 gap-1.5 w-full">
                  {blanks.map((_, i) => <div key={`b-${i}`} className="aspect-square" />)}
                  {days.map(d => {
                    const selected = isSelected(d);
                    const inRange = isInRange(d);
                    return (
                      <button 
                        key={d} 
                        onClick={() => handleDateClick(d)} 
                        className={`aspect-square w-full text-xs rounded-lg flex items-center justify-center transition-all ${selected ? 'bg-white text-black font-black shadow-lg shadow-white/10' : inRange ? 'bg-zinc-800 text-zinc-300 rounded-none' : 'text-zinc-500 hover:text-white'}`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* APPLY BUTTON (STICKY) */}
            <div className="p-5 border-t border-zinc-800 bg-[#0c0c0e]">
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl text-[10px] shadow-xl active:scale-[0.98] transition-transform"
              >
                Apply Selection
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

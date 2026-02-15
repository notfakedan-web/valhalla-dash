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
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-all relative z-10"
      >
        <CalendarIcon size={14} className="text-zinc-500" />
        <span>{formatDate(date?.from)} - {formatDate(date?.to)}</span>
      </button>

      {/* THE MODAL - Centered on screen */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          
          {/* Background click area to close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-[#09090b] border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* HEADER */}
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-[#09090b]">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Select Dates</span>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                  <X size={18} />
                </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="overflow-y-auto p-5 custom-scrollbar flex-1 bg-[#09090b]">
              
              {/* QUICK SELECT */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[0, 1, 7, 30, 90, 365].map(d => (
                  <button 
                    key={d} 
                    onClick={() => handleQuickSelect(d)} 
                    className="py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                  >
                    {d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} Days`}
                  </button>
                ))}
              </div>

              {/* CALENDAR GRID */}
              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
                <div className="flex justify-between items-center mb-4">
                   <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronLeft size={16}/></button>
                   <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                   <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronRight size={16}/></button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="text-[10px] font-bold text-zinc-600 uppercase">{d}</span>)}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {blanks.map((_, i) => <div key={`b-${i}`} />)}
                  {days.map(d => {
                    const selected = isSelected(d);
                    const inRange = isInRange(d);
                    return (
                      <button 
                        key={d} 
                        onClick={() => handleDateClick(d)} 
                        className={`h-8 w-full text-xs rounded flex items-center justify-center transition-colors ${selected ? 'bg-white text-black font-bold' : inRange ? 'bg-zinc-800 text-zinc-300 rounded-none' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-zinc-800 bg-[#09090b]">
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest rounded-lg text-xs hover:bg-zinc-200 transition-colors"
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

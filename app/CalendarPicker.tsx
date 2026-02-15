'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CalendarPicker({ date, setDate }: { date: any, setDate: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Block background scroll to keep position fixed
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
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
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 transition-all"
      >
        <CalendarIcon size={14} className="text-zinc-500" />
        <span>{formatDate(date?.from)} - {formatDate(date?.to)}</span>
      </button>

      {isOpen && (
        <div className="!fixed !inset-0 !z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
          {/* FIX: We set a fixed height (h-[580px]) and h-max to prevent 
             the modal from recalculating its center point when you click.
          */}
          <div className="relative bg-[#09090b] border border-zinc-800 w-full max-w-[340px] h-[580px] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* HEADER */}
            <div className="flex justify-between items-center p-5 border-b border-zinc-800 bg-[#09090b]">
                <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">Select Timeline</span>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-zinc-900 rounded-full text-zinc-400">
                  <X size={16} />
                </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#09090b]">
              
              {/* QUICK SELECT */}
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 7, 30, 90, 365].map(d => (
                  <button 
                    key={d} 
                    onClick={() => handleQuickSelect(d)} 
                    className="py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-all active:scale-95"
                  >
                    {d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}D`}
                  </button>
                ))}
              </div>

              {/* CALENDAR GRID */}
              <div className="bg-zinc-900/30 rounded-2xl p-4 border border-zinc-800/50">
                <div className="flex justify-between items-center mb-6">
                   <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 text-zinc-500 hover:text-white"><ChevronLeft size={18}/></button>
                   <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                   <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 text-zinc-500 hover:text-white"><ChevronRight size={18}/></button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center mb-3">
                  {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] font-black text-zinc-600">{d}</span>)}
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
                        className={`h-9 w-full text-xs rounded-lg flex items-center justify-center transition-all ${selected ? 'bg-white text-black font-black shadow-lg shadow-white/10' : inRange ? 'bg-zinc-800 text-zinc-300 rounded-none' : 'text-zinc-500 hover:text-white'}`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-5 border-t border-zinc-800 bg-[#09090b] pb-8">
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

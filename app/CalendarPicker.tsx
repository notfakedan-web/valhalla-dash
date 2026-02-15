'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CalendarPicker({ date, setDate }: { date: any, setDate: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper to format dates
  const formatDate = (d: Date | undefined) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select';

  // Generate days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateClick = (day: number) => {
    const newDate = new Date(year, month, day);
    
    // Range Logic
    if (!date?.from || (date.from && date.to)) {
      setDate({ from: newDate, to: undefined });
    } else {
      if (newDate < date.from) {
        setDate({ from: newDate, to: date.from });
      } else {
        setDate({ from: date.from, to: newDate });
      }
    }
  };

  const isSelected = (day: number) => {
    const target = new Date(year, month, day);
    if (date?.from && target.getTime() === date.from.getTime()) return true;
    if (date?.to && target.getTime() === date.to.getTime()) return true;
    return false;
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
    setIsOpen(false); // Close immediately on quick select
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="relative">
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-all"
      >
        <CalendarIcon size={14} className="text-zinc-500" />
        <span>{formatDate(date?.from)} - {formatDate(date?.to)}</span>
      </button>

      {/* OVERLAY & POPUP */}
      {isOpen && (
        <>
          {/* MOBILE BACKDROP & POSITIONING CONTAINER 
              - 'flex items-center justify-center' centers the modal safely.
              - 'z-[999]' ensures it's on top of everything.
          */}
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 lg:p-0 lg:block lg:static">
            
            {/* BACKDROP CLICK TARGET */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* MODAL ITSELF */}
            <div className={`
              relative z-[1000] w-full max-w-[340px] bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl p-5
              max-h-[85vh] overflow-y-auto custom-scrollbar
              lg:absolute lg:top-full lg:right-0 lg:left-auto lg:mt-2 lg:w-[320px] lg:max-h-none lg:overflow-visible
            `}>
              
              {/* QUICK SELECT LIST (Optional, assuming you want it) */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                 <button onClick={() => handleQuickSelect(0)} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium">Today</button>
                 <button onClick={() => handleQuickSelect(1)} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium">Yesterday</button>
                 <button onClick={() => handleQuickSelect(7)} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium">Last 7 Days</button>
                 <button onClick={() => handleQuickSelect(30)} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium">Last 30 Days</button>
              </div>

              {/* HEADER */}
              <div className="flex items-center justify-between mb-4 pt-2 border-t border-zinc-900">
                <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ChevronLeft size={16} /></button>
                  <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* DAYS GRID */}
              <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[10px] font-bold text-zinc-600 uppercase">{d}</div>
                ))}
                
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                
                {days.map(day => {
                  const selected = isSelected(day);
                  const inRange = isInRange(day);
                  
                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`
                        h-8 w-8 text-xs rounded-full flex items-center justify-center transition-all
                        ${selected ? 'bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-900/50' : ''}
                        ${inRange ? 'bg-cyan-900/20 text-cyan-200 rounded-none' : ''}
                        ${!selected && !inRange ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800 sticky bottom-0 bg-[#09090b]">
                 <button 
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-300"
                 >
                   Cancel
                 </button>
                 <button 
                    onClick={() => setIsOpen(false)} 
                    className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                 >
                   Apply Dates
                 </button>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

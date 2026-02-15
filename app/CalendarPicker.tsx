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
  }, [isOpen]);

  const formatDate = (d: Date | undefined) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select';

  // --- CALENDAR DATA LOGIC ---
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDateClick = (day: number) => {
    const newDate = new Date(year, month, day);
    if (!date?.from || (date.from && date.to)) {
      setDate({ from: newDate, to: undefined });
    } else {
      if (newDate < date.from) setDate({ from: newDate, to: date.from });
      else setDate({ from: date.from, to: newDate });
    }
  };

  const handleQuickSelect = (daysAgo: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - daysAgo);
    setDate({ from, to });
    setIsOpen(false);
  };

  return (
    <>
      {/* SECTION 1: THE TRIGGER BUTTON 
          This stays inside your filter bar. It's just a button.
      */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-sm"
      >
        <CalendarIcon size={14} className="text-zinc-500" />
        <span className="whitespace-nowrap">{formatDate(date?.from)} - {formatDate(date?.to)}</span>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1"></div>
      </button>


      {/* SECTION 2: THE FLOATING MODAL 
          This is wrapped in a !fixed div that covers the WHOLE screen.
          It is completely disconnected from the button's position.
      */}
      {isOpen && (
        <div className="!fixed !inset-0 !z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          
          {/* Backdrop click area to close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* THE ACTUAL CALENDAR BOX */}
          <div className="relative bg-[#09090b] border border-zinc-800 w-full max-w-[340px] md:max-w-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* MOBILE HEADER (Visible only on small screens) */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0c0c0e] md:hidden">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Timeline Selector</span>
                <button onClick={() => setIsOpen(false)} className="p-1.5 bg-zinc-900 rounded-full text-zinc-400">
                    <X size={18} />
                </button>
            </div>

            {/* LEFT SIDE: QUICK SELECT */}
            <div className="bg-[#0c0c0e] border-b md:border-b-0 md:border-r border-zinc-800 p-5 md:w-48 flex-shrink-0 flex flex-col gap-1.5">
              <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 ml-2">Quick Select</span>
              <div className="grid grid-cols-3 md:flex md:flex-col gap-1.5">
                {[
                    { label: 'Today', val: 0 },
                    { label: '7 Days', val: 7 },
                    { label: '30 Days', val: 30 },
                    { label: '90 Days', val: 90 },
                    { label: 'Year', val: 365 }
                ].map(item => (
                  <button 
                    key={item.label}
                    onClick={() => handleQuickSelect(item.val)}
                    className="text-center md:text-left px-3 py-2 text-[10px] md:text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-zinc-800/50 md:border-none rounded-lg transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE: CALENDAR GRID */}
            <div className="p-6 flex-1 bg-[#09090b] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-500">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-500">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                  <span key={d} className="text-[10px] font-black text-zinc-700 uppercase">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`bl-${i}`} />)}
                {days.map(day => {
                  const target = new Date(year, month, day);
                  const isSel = (date?.from && target.getTime() === date.from.getTime()) || (date?.to && target.getTime() === date.to.getTime());
                  const inRange = date?.from && date?.to && target > date.from && target < date.to;

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`
                        w-8 h-8 text-xs rounded-full flex items-center justify-center transition-all mx-auto
                        ${isSel ? 'bg-white text-black font-black shadow-lg shadow-white/10' : inRange ? 'bg-zinc-800 text-zinc-300 rounded-none' : 'text-zinc-500 hover:text-white'}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* ACTION FOOTER */}
              <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-between items-center">
                 <button onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Cancel</button>
                 <button 
                   onClick={() => setIsOpen(false)} 
                   className="px-6 py-2.5 bg-white text-black font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-md"
                 >
                   Apply Dates
                 </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

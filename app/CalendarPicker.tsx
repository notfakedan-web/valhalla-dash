'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CalendarPicker({ date, setDate }: { date: any, setDate: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
        <div className="fixed inset-0 z-[9999] lg:absolute lg:inset-auto lg:top-full lg:right-0 lg:left-auto lg:z-50">
          
          {/* MOBILE BACKDROP (Darkens screen) */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* MODAL WINDOW
              Mobile: Fixed at BOTTOM (bottom-0), Width 100%, Rounded Top only.
              Desktop: Absolute Dropdown, Rounded Full.
          */}
          <div className={`
            fixed bottom-0 left-0 right-0 w-full bg-[#09090b] border-t border-zinc-800 rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]
            lg:static lg:w-[320px] lg:border lg:rounded-2xl lg:mt-2
          `}>
            
            {/* MOBILE DRAG HANDLE (Visual Cue) */}
            <div className="w-full flex justify-center pt-3 pb-1 lg:hidden">
                <div className="w-12 h-1 bg-zinc-800 rounded-full" />
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="overflow-y-auto p-5 custom-scrollbar">
              
              {/* COMPACT QUICK SELECT GRID */}
              <div className="grid grid-cols-3 gap-2 mb-6 pb-4 border-b border-zinc-800">
                 <button onClick={() => handleQuickSelect(0)} className="px-2 py-2 bg-zinc-800/50 rounded text-[10px] text-zinc-300 font-medium hover:bg-zinc-800">Today</button>
                 <button onClick={() => handleQuickSelect(1)} className="px-2 py-2 bg-zinc-800/50 rounded text-[10px] text-zinc-300 font-medium hover:bg-zinc-800">Yesterday</button>
                 <button onClick={() => handleQuickSelect(7)} className="px-2 py-2 bg-zinc-800/50 rounded text-[10px] text-zinc-300 font-medium hover:bg-zinc-800">7 Days</button>
                 <button onClick={() => handleQuickSelect(30)} className="px-2 py-2 bg-zinc-800/50 rounded text-[10px] text-zinc-300 font-medium hover:bg-zinc-800">30 Days</button>
                 <button onClick={() => handleQuickSelect(90)} className="px-2 py-2 bg-zinc-800/50 rounded text-[10px] text-zinc-300 font-medium hover:bg-zinc-800">90 Days</button>
                 <button onClick={() => handleQuickSelect(365)} className="px-2 py-2 bg-zinc-800/50 rounded text-[10px] text-zinc-300 font-medium hover:bg-zinc-800">Year</button>
              </div>

              {/* CALENDAR HEADER */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ChevronLeft size={16} /></button>
                  <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* DAYS GRID */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[10px] font-bold text-zinc-600 uppercase mb-2">{d}</div>
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
                        h-8 w-full text-xs rounded-lg flex items-center justify-center transition-all relative
                        ${selected ? 'bg-cyan-600 text-white font-bold' : ''}
                        ${inRange ? 'bg-cyan-900/20 text-cyan-200 rounded-none' : ''}
                        ${!selected && !inRange ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-4 border-t border-zinc-800 bg-[#09090b] flex justify-between items-center pb-8 lg:pb-4">
               <button 
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wide px-2"
               >
                 Cancel
               </button>
               <button 
                  onClick={() => setIsOpen(false)} 
                  className="px-6 py-3 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition-colors uppercase tracking-wide w-1/2 text-center"
               >
                 Apply Dates
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

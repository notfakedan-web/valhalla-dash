'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

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

      {/* MODAL WRAPPER */}
      {isOpen && (
        <>
          {/* MOBILE OVERLAY (Fixed, Centers Content) */}
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 lg:p-0 lg:block lg:static">
            
            {/* BACKDROP */}
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* MODAL WINDOW */}
            <div className={`
              relative z-[1000] w-full max-w-[320px] bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col
              max-h-[85vh] lg:max-h-none lg:absolute lg:top-full lg:right-0 lg:left-auto lg:mt-2 lg:w-[320px]
            `}>
              
              {/* SCROLLABLE CONTENT AREA */}
              <div className="overflow-y-auto p-5 custom-scrollbar">
                
                {/* QUICK SELECT */}
                <div className="grid grid-cols-2 gap-2 mb-6 border-b border-zinc-800/50 pb-4">
                   <button onClick={() => handleQuickSelect(0)} className="px-3 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium transition-colors">Today</button>
                   <button onClick={() => handleQuickSelect(1)} className="px-3 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium transition-colors">Yesterday</button>
                   <button onClick={() => handleQuickSelect(7)} className="px-3 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium transition-colors">Last 7 Days</button>
                   <button onClick={() => handleQuickSelect(30)} className="px-3 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium transition-colors">Last 30 Days</button>
                   <button onClick={() => handleQuickSelect(90)} className="px-3 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium transition-colors">Last 90 Days</button>
                   <button onClick={() => handleQuickSelect(365)} className="px-3 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium transition-colors">Last 365 Days</button>
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
                          h-8 w-8 text-xs rounded-full flex items-center justify-center transition-all relative z-10
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

              {/* FOOTER (Always Sticky at Bottom of Modal) */}
              <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-[#09090b]">
                 <button 
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wide"
                 >
                   Reset
                 </button>
                 <div className="flex gap-2">
                   <button 
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs font-bold rounded hover:bg-zinc-700 transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                      onClick={() => setIsOpen(false)} 
                      className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-zinc-200 transition-colors uppercase tracking-wide"
                   >
                     Apply Dates
                   </button>
                 </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

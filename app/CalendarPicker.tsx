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
    <>
      {/* 1. THE TRIGGER BUTTON (This stays in your filter bar) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-all"
      >
        <CalendarIcon size={14} className="text-zinc-500" />
        <span>{formatDate(date?.from)} - {formatDate(date?.to)}</span>
      </button>

      {/* 2. THE MODAL (Portal-style fixed overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-4">
          
          {/* DARK BACKDROP */}
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* POPUP WINDOW */}
          <div className="relative w-full max-w-sm bg-[#09090b] border-t sm:border border-zinc-800 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-5 fade-in duration-200">
            
            {/* MOBILE HANDLE (Visual cue) */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden bg-[#09090b]">
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="overflow-y-auto p-5 custom-scrollbar bg-[#09090b]">
              
              {/* QUICK SELECT GRID */}
              <div className="grid grid-cols-3 gap-2 mb-6 pb-4 border-b border-zinc-800">
                 {[
                   { label: 'Today', days: 0 },
                   { label: 'Yesterday', days: 1 },
                   { label: '7 Days', days: 7 },
                   { label: '30 Days', days: 30 },
                   { label: '90 Days', days: 90 },
                   { label: 'Year', days: 365 }
                 ].map((qs) => (
                   <button 
                     key={qs.label}
                     onClick={() => handleQuickSelect(qs.days)} 
                     className="px-2 py-2 bg-zinc-800/40 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium hover:bg-zinc-800 hover:text-white transition-colors"
                   >
                     {qs.label}
                   </button>
                 ))}
              </div>

              {/* CALENDAR CONTROLS */}
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
                        h-9 w-full text-xs rounded-lg flex items-center justify-center transition-all relative
                        ${selected ? 'bg-white text-black font-bold shadow-lg' : ''}
                        ${inRange ? 'bg-zinc-800 text-white rounded-none mx-[-2px]' : ''}
                        ${!selected && !inRange ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="p-4 border-t border-zinc-800 bg-[#09090b] flex justify-between items-center pb-8 sm:pb-4">
               <button 
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wide px-2"
               >
                 Cancel
               </button>
               <button 
                  onClick={() => setIsOpen(false)} 
                  className="px-6 py-3 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition-colors uppercase tracking-wide w-1/2 text-center shadow-lg shadow-white/5"
               >
                 Apply
               </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

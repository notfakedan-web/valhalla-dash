'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CalendarPicker({ date, setDate }: { date: any, setDate: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Block body scroll when calendar is open
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

  const handleQuickSelect = (daysAgo: number | string) => {
    const to = new Date();
    const from = new Date();
    if (daysAgo === 'all') {
        from.setFullYear(2020);
    } else {
        from.setDate(to.getDate() - (daysAgo as number));
    }
    setDate({ from, to });
    setIsOpen(false);
  };

  return (
    <>
      {/* 1. TRIGGER BUTTON (This stays in the bar) */}
      <div className="relative">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-sm"
        >
          <CalendarIcon size={14} className="text-zinc-500" />
          <span>{formatDate(date?.from)} - {formatDate(date?.to)}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1"></div>
        </button>
      </div>

      {/* 2. THE FLOATING MODAL (Disconnected from the bar) */}
      {isOpen && (
        <div className="!fixed !inset-0 !z-[99999] flex items-center justify-center p-4">
          
          {/* Backdrop (Darken the background) */}
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container: Disconnected, Centered, and Floating */}
          <div className="relative bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-[340px] md:max-w-[640px] max-h-[90vh]">
            
            {/* QUICK SELECT SIDEBAR */}
            <div className="bg-[#0c0c0e] border-b md:border-b-0 md:border-r border-zinc-800 p-4 md:w-48 flex-shrink-0 flex flex-col gap-1 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 ml-2">Quick Select</span>
              {[
                  { l: 'Today', v: 0 },
                  { l: 'Yesterday', v: 1 },
                  { l: 'Last 7 Days', v: 7 },
                  { l: 'Last 30 Days', v: 30 },
                  { l: 'Last 90 Days', v: 90 },
                  { l: 'Last 365 Days', v: 365 },
                  { l: 'All Time', v: 'all' }
              ].map((item) => (
                <button 
                  key={item.l}
                  onClick={() => handleQuickSelect(item.v)}
                  className="text-left px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  {item.l}
                </button>
              ))}
            </div>

            {/* CALENDAR SECTION */}
            <div className="p-6 flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <span key={d} className="text-[10px] font-bold text-zinc-600 uppercase">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 overflow-y-auto">
                {blanks.map((_, i) => <div key={`b-${i}`} />)}
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
                        ${isSel ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50' : ''}
                        ${inRange ? 'bg-blue-900/20 text-blue-300 rounded-none' : ''}
                        ${!isSel && !inRange ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* MODAL FOOTER */}
              <div className="mt-auto pt-6 flex items-center justify-between border-t border-zinc-800">
                <button 
                  onClick={() => setDate({ from: undefined, to: undefined })}
                  className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider"
                >
                  Reset
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 rounded-lg border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-lg uppercase tracking-wider shadow-md"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

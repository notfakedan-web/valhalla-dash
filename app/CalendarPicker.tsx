'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CalendarPicker({ date, setDate }: { date: any, setDate: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Wait for mount to use Portals safely in Next.js
  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const formatDate = (d: Date | undefined) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select';

  // --- CALENDAR LOGIC ---
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDateClick = (day: number) => {
    const target = new Date(year, month, day);
    if (!date?.from || (date.from && date.to)) {
      setDate({ from: target, to: undefined });
    } else {
      if (target < date.from) setDate({ from: target, to: date.from });
      else setDate({ from: date.from, to: target });
    }
  };

  const handleQuickSelect = (daysAgo: number | string) => {
    const to = new Date();
    const from = new Date();
    if (daysAgo === 'all') from.setFullYear(2020);
    else from.setDate(to.getDate() - (daysAgo as number));
    setDate({ from, to });
    setIsOpen(false);
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

  // --- SECTION 1: THE TRIGGER (STAYS IN FILTER BAR) ---
  const Trigger = (
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
  );

  // --- SECTION 2: THE DROPDOWN (FLOATS CENTERED ON SCREEN) ---
  const Dropdown = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsOpen(false)} />
      
      {/* Centered Modal Content */}
      <div className="relative bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-[340px] md:max-w-[640px] max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Quick Select Sidebar */}
        <div className="bg-[#0c0c0e] border-b md:border-b-0 md:border-r border-zinc-800 p-5 md:w-48 flex-shrink-0 flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3 ml-2">Quick Select</span>
          <div className="grid grid-cols-3 md:flex md:flex-col gap-1.5">
            {[
              { l: 'Today', v: 0 }, { l: 'Yesterday', v: 1 }, { l: '7 Days', v: 7 }, 
              { l: '30 Days', v: 30 }, { l: '90 Days', v: 90 }, { l: '365 Days', v: 365 }, { l: 'All Time', v: 'all' }
            ].map((item) => (
              <button 
                key={item.l}
                onClick={() => handleQuickSelect(item.v)}
                className="text-center md:text-left px-3 py-2 text-[10px] md:text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 md:bg-transparent border border-zinc-800 md:border-none rounded-lg transition-colors"
              >
                {item.l}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6 flex-1 flex flex-col bg-[#09090b] min-h-0">
          <div className="flex justify-between items-center mb-6 px-1">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-white tracking-wide">{monthNames[month]} {year}</span>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <span key={d} className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 overflow-y-auto">
            {blanks.map((_, i) => <div key={`b-${i}`} />)}
            {days.map(day => (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`
                  w-8 h-8 text-xs rounded-full flex items-center justify-center transition-all mx-auto
                  ${isSelected(day) ? 'bg-white text-black font-black shadow-lg shadow-white/10' : isInRange(day) ? 'bg-zinc-800 text-zinc-200 rounded-none' : 'text-zinc-500 hover:text-white'}
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-between">
            <button 
              onClick={() => setDate({ from: undefined, to: undefined })}
              className="text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-[0.2em] transition-colors"
            >
              Reset
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-white text-black font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg active:scale-95"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {Trigger}
      {isOpen && mounted && createPortal(Dropdown, document.body)}
    </>
  );
}

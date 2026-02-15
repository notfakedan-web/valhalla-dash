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
    return () => setMounted(false);
  }, []);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isOpen]);

  const formatDate = (d: Date | undefined) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select';

  const handleQuickSelect = (daysAgo: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - daysAgo);
    setDate({ from, to });
    setIsOpen(false);
  };

  const handleDateClick = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const newDate = new Date(year, month, day);
    if (!date?.from || (date.from && date.to)) {
      setDate({ from: newDate, to: undefined });
    } else {
      if (newDate < date.from) setDate({ from: newDate, to: date.from });
      else setDate({ from: date.from, to: newDate });
    }
  };

  const isSelected = (day: number) => {
    const target = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (date?.from && target.getTime() === date.from.getTime()) || (date?.to && target.getTime() === date.to.getTime());
  };

  const isInRange = (day: number) => {
    if (!date?.from || !date?.to) return false;
    const target = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return target > date.from && target < date.to;
  };

  // --- COMPONENT UI SECTIONS ---

  // SECTION 1: TRIGGER (Stays in your Filter Bar)
  const Trigger = (
    <button 
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-sm"
    >
      <CalendarIcon size={14} className="text-zinc-500" />
      <span className="whitespace-nowrap">{formatDate(date?.from)} - {formatDate(date?.to)}</span>
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1"></div>
    </button>
  );

  // SECTION 2: THE DROPDOWN (Teleported to Body)
  const Modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsOpen(false)} />
      
      {/* Centered Content Box */}
      <div className="relative bg-[#09090b] border border-zinc-800 w-full max-w-[340px] md:max-w-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Quick Select Sidebar */}
        <div className="bg-[#0c0c0e] border-b md:border-b-0 md:border-r border-zinc-800 p-5 md:w-48 flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Quick Select</span>
          <div className="grid grid-cols-3 md:flex md:flex-col gap-2">
            {[0, 7, 30, 90, 365].map(d => (
              <button key={d} onClick={() => handleQuickSelect(d)} className="text-center md:text-left px-3 py-2 text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-900 md:bg-transparent rounded-lg">
                {d === 0 ? 'Today' : `${d}D`}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6 flex-1 bg-[#09090b]">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-500"><ChevronLeft size={16} /></button>
            <span className="text-sm font-bold text-white">
                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentMonth)}
            </span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] font-black text-zinc-700">{d}</span>)}
            {Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()).fill(null).map((_, i) => <div key={`b-${i}`} />)}
            {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
              <button 
                key={day} 
                onClick={() => handleDateClick(day)}
                className={`w-8 h-8 text-xs rounded-full flex items-center justify-center mx-auto transition-all ${isSelected(day) ? 'bg-white text-black font-black shadow-lg' : isInRange(day) ? 'bg-zinc-800 text-zinc-300 rounded-none' : 'text-zinc-500 hover:text-white'}`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end">
             <button onClick={() => setIsOpen(false)} className="px-6 py-2 bg-white text-black font-black text-[10px] rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
               Confirm
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {Trigger}
      {/* Only render the Modal in the Portal if open and mounted */}
      {isOpen && mounted && createPortal(Modal, document.body)}
    </>
  );
}

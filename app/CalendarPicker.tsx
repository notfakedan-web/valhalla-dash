'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export default function CalendarPicker({ date, setDate }: { date: any, setDate: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Prevent scrolling on the body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // --- DATE LOGIC ---
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

  const isSelected = (day: number) => {
    const target = new Date(year, month, day);
    return (date?.from && target.getTime() === date.from.getTime()) || (date?.to && target.getTime() === date.to.getTime());
  };

  const isInRange = (day: number) => {
    if (!date?.from || !date?.to) return false;
    const target = new Date(year, month, day);
    return target > date.from && target < date.to;
  };

  const formatDate = (d: Date | undefined) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select';

  // --- RENDER COMPONENT ---
  return (
    <>
      {/* 1. TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-all"
      >
        <CalendarIcon size={14} className="text-zinc-500" />
        <span>{formatDate(date?.from)} - {formatDate(date?.to)}</span>
      </button>

      {/* 2. THE MODAL (Only renders when open) */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex justify-center items-end lg:items-start">
          
          {/* BLACK BACKDROP */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* 3. MOBILE: BOTTOM SHEET (lg:hidden) */}
          <div className="lg:hidden relative w-full bg-[#09090b] border-t border-zinc-800 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Select Dates</span>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-zinc-800 rounded-full text-zinc-400"><X size={18} /></button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4 custom-scrollbar space-y-6">
              
              {/* Quick Select Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 7, 30, 90, 365].map(d => (
                  <button key={d} onClick={() => handleQuickSelect(d)} className="py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-600">
                    {d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} Days`}
                  </button>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                <div className="flex justify-between items-center mb-4">
                   <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 bg-zinc-800 rounded text-zinc-400"><ChevronLeft size={16}/></button>
                   <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                   <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 bg-zinc-800 rounded text-zinc-400"><ChevronRight size={16}/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] font-bold text-zinc-600 uppercase mb-2">{d}</span>)}
                  {blanks.map((_, i) => <div key={`mb-${i}`} />)}
                  {days.map(d => (
                    <button key={d} onClick={() => handleDateClick(d)} className={`h-9 w-full text-xs rounded-md flex items-center justify-center ${isSelected(d) ? 'bg-cyan-500 text-black font-bold' : isInRange(d) ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-400'}`}>{d}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Button */}
            <div className="p-4 border-t border-zinc-800 bg-[#09090b] pb-8">
              <button onClick={() => setIsOpen(false)} className="w-full py-3.5 bg-white text-black font-bold uppercase tracking-wider rounded-xl text-sm shadow-lg flex items-center justify-center gap-2">
                <Check size={18} /> Confirm Selection
              </button>
            </div>
          </div>

          {/* 4. DESKTOP: DROPDOWN (hidden lg:flex) */}
          <div className="hidden lg:flex absolute top-12 right-0 mt-2 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden w-[600px]">
             {/* ... Desktop Layout (Quick Select Sidebar + Calendar) ... */}
             <div className="bg-zinc-900/50 w-48 border-r border-zinc-800 p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Quick Select</span>
                {[0, 1, 7, 30, 90, 365].map(d => (
                    <button key={d} onClick={() => handleQuickSelect(d)} className="text-left px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">{d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `Last ${d} Days`}</button>
                ))}
             </div>
             <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronLeft size={16}/></button>
                    <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                    <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronRight size={16}/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d} className="text-[10px] font-bold text-zinc-600 uppercase">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {blanks.map((_, i) => <div key={`db-${i}`} />)}
                    {days.map(d => (
                        <button key={d} onClick={() => handleDateClick(d)} className={`w-8 h-8 text-xs rounded-full flex items-center justify-center ${isSelected(d) ? 'bg-white text-black font-bold' : isInRange(d) ? 'bg-zinc-800 text-white rounded-none' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>{d}</button>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end gap-2">
                    <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white">Cancel</button>
                    <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-xs font-bold text-black bg-white rounded-lg hover:bg-zinc-200">Apply</button>
                </div>
             </div>
          </div>

        </div>
      )}
    </>
  );
}

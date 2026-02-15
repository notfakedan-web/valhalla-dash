'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPicker({ date, setDate }: { date: any, setDate: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- DESKTOP HELPERS ---
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatDate = (d: Date | undefined) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select';
  
  // Format for Native Input (YYYY-MM-DD)
  const toNativeDate = (d: Date | undefined) => d ? d.toISOString().split('T')[0] : '';
  
  // Handle Native Input Change
  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'from' | 'to') => {
    if (!e.target.value) return;
    const newDate = new Date(e.target.value);
    // Adjust for timezone offset so it doesn't shift days
    const adjustedDate = new Date( newDate.getTime() + newDate.getTimezoneOffset() * 60000 );
    
    setDate((prev: any) => ({
      ...prev,
      [type]: adjustedDate
    }));
  };

  return (
    <div className="relative">
      
      {/* --- MOBILE VERSION (Native Inputs) --- */}
      {/* This shows ONLY on mobile (lg:hidden). It uses the phone's native UI. */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="relative">
            <input 
                type="date" 
                value={toNativeDate(date?.from)}
                onChange={(e) => handleNativeChange(e, 'from')}
                className="w-[110px] bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-2 py-2 uppercase font-bold tracking-wider focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute top-[-8px] left-2 text-[8px] bg-zinc-900 px-1 text-zinc-500 uppercase font-bold">Start</span>
        </div>
        <span className="text-zinc-600">-</span>
        <div className="relative">
            <input 
                type="date" 
                value={toNativeDate(date?.to)}
                onChange={(e) => handleNativeChange(e, 'to')}
                className="w-[110px] bg-zinc-900 border border-zinc-800 text-white text-xs rounded-lg px-2 py-2 uppercase font-bold tracking-wider focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute top-[-8px] left-2 text-[8px] bg-zinc-900 px-1 text-zinc-500 uppercase font-bold">End</span>
        </div>
      </div>


      {/* --- DESKTOP VERSION (Custom Popup) --- */}
      {/* This shows ONLY on Desktop (hidden lg:block). */}
      <div className="hidden lg:block relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-all"
          >
            <CalendarIcon size={14} className="text-zinc-500" />
            <span>{formatDate(date?.from)} - {formatDate(date?.to)}</span>
          </button>

          {isOpen && (
            <div className="absolute top-full right-0 mt-2 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl p-5 w-[300px] z-50">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronLeft size={16}/></button>
                    <span className="text-sm font-bold text-white">{monthNames[month]} {year}</span>
                    <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronRight size={16}/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] font-bold text-zinc-600 uppercase">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {blanks.map((_, i) => <div key={`b-${i}`} />)}
                    {days.map(d => {
                        const dayDate = new Date(year, month, d);
                        const isSel = (date?.from && dayDate.getTime() === date.from.getTime()) || (date?.to && dayDate.getTime() === date.to.getTime());
                        return (
                            <button 
                                key={d} 
                                onClick={() => {
                                    if (!date?.from || (date.from && date.to)) setDate({ from: dayDate, to: undefined });
                                    else if (dayDate < date.from) setDate({ from: dayDate, to: date.from });
                                    else setDate({ from: date.from, to: dayDate });
                                }} 
                                className={`w-8 h-8 text-xs rounded-full flex items-center justify-center ${isSel ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                            >
                                {d}
                            </button>
                        )
                    })}
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
                    <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-xs font-bold text-black bg-white rounded-lg hover:bg-zinc-200">Apply</button>
                </div>
            </div>
          )}
      </div>

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CalendarModal({ isOpen, onClose, date, setDate }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleDateClick = (day: number) => {
    const target = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!date?.from || (date.from && date.to)) {
      setDate({ from: target, to: undefined });
    } else {
      if (target < date.from) setDate({ from: target, to: date.from });
      else setDate({ from: date.from, to: target });
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

  const modalHtml = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#09090b] border border-zinc-800 w-full max-w-[340px] md:max-w-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#0c0c0e] border-b md:border-b-0 md:border-r border-zinc-800 p-5 md:w-48 flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Quick Select</span>
          {[0, 7, 30, 365].map(d => (
            <button key={d} onClick={() => {
              const to = new Date();
              const from = new Date();
              from.setDate(to.getDate() - d);
              setDate({ from, to });
              onClose();
            }} className="px-3 py-2 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors text-left">
              {d === 0 ? 'Today' : `${d} Days`}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 bg-[#09090b]">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-500"><ChevronLeft size={16} /></button>
            <span className="text-sm font-bold text-white">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentMonth)}</span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-[10px] font-black text-zinc-700">{d}</span>)}
            {Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()).fill(null).map((_, i) => <div key={i} />)}
            {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
              <button key={day} onClick={() => handleDateClick(day)} className={`w-8 h-8 text-xs rounded-full flex items-center justify-center mx-auto transition-all ${isSelected(day) ? 'bg-white text-black font-black' : isInRange(day) ? 'bg-zinc-800 text-zinc-300 rounded-none' : 'text-zinc-500 hover:text-white'}`}>{day}</button>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-2 bg-white text-black font-black text-[10px] rounded-xl uppercase tracking-widest shadow-lg">Apply</button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalHtml, document.body);
}

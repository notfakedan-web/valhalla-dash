'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import CalendarModal from './components/CalendarModal'; // Importing the other file

export default function CalendarPicker({ date, setDate }: { date: any, setDate: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (d: Date | undefined) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select';

  return (
    <>
      {/* TRIGGER BUTTON - STAYS IN BAR */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-sm"
      >
        <CalendarIcon size={14} className="text-zinc-500" />
        <span className="whitespace-nowrap">{formatDate(date?.from)} - {formatDate(date?.to)}</span>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1"></div>
      </button>

      {/* MODAL - DISCONNECTED FROM BAR */}
      <CalendarModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        date={date} 
        setDate={setDate} 
      />
    </>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  const toDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const fromDateString = (str: string) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  useEffect(() => {
    const s = searchParams.get('start');
    const e = searchParams.get('end');
    if (s) setStart(fromDateString(s));
    if (e) setEnd(fromDateString(e));
  }, [searchParams]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    if (!start || (start && end)) {
      setStart(clickedDate);
      setEnd(null);
    } else {
      let finalStart = start;
      let finalEnd = clickedDate;

      if (clickedDate < start) {
        finalStart = clickedDate;
        finalEnd = start;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set('start', toDateString(finalStart));
      params.set('end', toDateString(finalEnd));
      router.push(`?${params.toString()}`);
      setIsOpen(false);
    }
  };

  const isInRange = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (start && !end) return d.getTime() === start.getTime();
    if (start && end) return d >= start && d <= end;
    return false;
  };

  return (
    <div className="relative inline-block" ref={containerRef} style={{ zIndex: 100 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-3 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 px-4 py-3 rounded-xl hover:border-cyan-500/50 transition-all text-xs font-bold uppercase tracking-widest text-zinc-400 min-w-[240px]"
      >
        <CalendarIcon size={14} className={start ? "text-cyan-400" : "text-zinc-600"} />
        {start ? (
            <span className="text-zinc-200">
                {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {end ? ` - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ' ...'}
            </span>
        ) : "Select Date Range"}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-3 left-0 bg-[#0d0d0d] border border-zinc-800 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[320px] z-[110]">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="flex gap-1">
              <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white">
                <ChevronLeft size={16}/>
              </button>
              <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white">
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-[9px] font-black text-zinc-700 uppercase">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth(viewDate) }).map((_, i) => <div key={i} />)}
            
            {Array.from({ length: daysInMonth(viewDate) }).map((_, i) => {
              const day = i + 1;
              const active = isInRange(day);
              const isBoundary = (start && new Date(viewDate.getFullYear(), viewDate.getMonth(), day).getTime() === start.getTime()) || (end && new Date(viewDate.getFullYear(), viewDate.getMonth(), day).getTime() === end.getTime());
              
              return (
                <button 
                  key={day} 
                  onClick={() => handleDateClick(day)} 
                  className={`
                    aspect-square flex items-center justify-center text-[11px] font-black rounded-lg transition-all
                    ${active ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'}
                    ${active && !isBoundary ? 'bg-cyan-500/20 text-cyan-400 shadow-none' : ''}
                  `}
                >
                    {day}
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
             <button onClick={() => setIsOpen(false)} className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

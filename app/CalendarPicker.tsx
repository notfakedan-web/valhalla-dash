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
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-4 bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 px-5 py-3.5 rounded-xl hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all text-sm font-bold text-zinc-300 min-w-[240px]"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <CalendarIcon size={16} className="text-zinc-500" />
        {start ? (
            <span>
                {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {end ? ` - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ' ...'}
            </span>
        ) : "Select Date Range"}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-3 left-0 z-[100] bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-8 rounded-2xl shadow-2xl min-w-[360px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-200" style={{ fontFamily: "'Space Mono', monospace" }}>
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="flex gap-2">
              <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white">
                <ChevronLeft size={16}/>
              </button>
              <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white">
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-[10px] font-black text-zinc-600 uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
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
                    aspect-square flex items-center justify-center text-sm font-bold rounded-lg transition-all
                    ${active ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'}
                    ${active && !isBoundary ? 'bg-cyan-500/50 text-white' : ''}
                  `}
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                    {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

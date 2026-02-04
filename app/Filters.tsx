'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export default function Filters({ platforms = [], closers = [], setters = [] }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // -- STATE --
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); // For navigating the calendar
  
  // Get active dates from URL
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  
  const [tempStart, setTempStart] = useState<string>(startParam || '');
  const [tempEnd, setTempEnd] = useState<string>(endParam || '');
  const [activePreset, setActivePreset] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  // -- PRESETS LOGIC --
  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1, offset: 1 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last 365 Days', days: 365 },
    { label: 'All Time', days: -1 },
  ];

  const applyPreset = (preset: any) => {
    setActivePreset(preset.label);
    if (preset.label === 'All Time') {
        setTempStart('');
        setTempEnd('');
        return;
    }

    const end = new Date();
    const start = new Date();
    
    if (preset.label === 'Yesterday') {
        start.setDate(end.getDate() - 1);
        end.setDate(end.getDate() - 1);
    } else {
        start.setDate(end.getDate() - (preset.days - 1)); // -1 to include today
    }

    setTempStart(start.toISOString().split('T')[0]);
    setTempEnd(end.toISOString().split('T')[0]);
    // Sync view with start date
    setViewDate(new Date(start));
  };

  // -- CALENDAR GENERATION --
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = dateStr === tempStart || dateStr === tempEnd;
      const isInRange = tempStart && tempEnd && dateStr > tempStart && dateStr < tempEnd;
      
      days.push(
        <button
          key={d}
          onClick={(e) => {
            e.preventDefault();
            if (!tempStart || (tempStart && tempEnd)) {
                setTempStart(dateStr);
                setTempEnd('');
            } else {
                if (dateStr < tempStart) {
                    setTempEnd(tempStart);
                    setTempStart(dateStr);
                } else {
                    setTempEnd(dateStr);
                }
            }
            setActivePreset('');
          }}
          className={`h-8 w-8 text-[10px] font-bold rounded-md flex items-center justify-center transition-all
            ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : ''}
            ${isInRange ? 'bg-blue-500/20 text-blue-200' : ''}
            ${!isSelected && !isInRange ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : ''}
          `}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  // -- APPLY TO URL --
  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (tempStart) params.set('start', tempStart); else params.delete('start');
    if (tempEnd) params.set('end', tempEnd); else params.delete('end');
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const handleReset = () => {
      setTempStart('');
      setTempEnd('');
      setActivePreset('');
      router.push(pathname);
      setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync state when URL changes
  useEffect(() => {
      if (startParam) setTempStart(startParam);
      if (endParam) setTempEnd(endParam);
  }, [startParam, endParam]);


  return (
    <div className="relative z-50" ref={containerRef}>
      
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`px-4 py-2.5 rounded-xl flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider transition-all border shadow-sm
            ${startParam || endParam 
                ? 'bg-zinc-100 text-black border-white hover:bg-white' 
                : 'bg-[#09090b] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
      >
        <CalendarIcon size={14} className={startParam ? 'text-blue-600' : 'text-zinc-500'}/>
        <span>
            {startParam ? (
                `${new Date(startParam).toLocaleDateString('en-US', {month:'short', day:'numeric'})} - ${endParam ? new Date(endParam).toLocaleDateString('en-US', {month:'short', day:'numeric'}) : '...'}`
            ) : (
                'Select Dates'
            )}
        </span>
        {(startParam || endParam) && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 animate-pulse" />}
      </button>

      {/* DROPDOWN PANEL */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-3 p-0 bg-[#0c0c0c] border border-zinc-800 rounded-2xl shadow-2xl z-[100] w-[600px] flex overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* LEFT: PRESETS SIDEBAR */}
            <div className="w-40 bg-zinc-900/50 border-r border-zinc-800 p-3 flex flex-col gap-1">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 py-2 mb-1">Quick Select</span>
                {presets.map((p) => (
                    <button
                        key={p.label}
                        onClick={() => applyPreset(p)}
                        className={`text-left px-3 py-2.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-between
                            ${activePreset === p.label 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                            }`}
                    >
                        {p.label}
                        {activePreset === p.label && <Check size={12} />}
                    </button>
                ))}
            </div>

            {/* RIGHT: CALENDAR AREA */}
            <div className="flex-1 p-5">
                {/* Header: Month Nav & Inputs */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400"><ChevronLeft size={14}/></button>
                        <span className="text-sm font-bold text-white w-32 text-center">
                            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400"><ChevronRight size={14}/></button>
                    </div>
                    
                    {/* Read-only Inputs */}
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                        <span className="text-[10px] font-mono text-zinc-300">{tempStart || 'Start'}</span>
                        <span className="text-zinc-600">-</span>
                        <span className="text-[10px] font-mono text-zinc-300">{tempEnd || 'End'}</span>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="mb-6">
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <span key={d} className="text-[9px] font-bold text-zinc-600 uppercase">{d}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {renderCalendar()}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <button onClick={handleReset} className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-wider px-2">
                        Reset Filter
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleApply} className="px-6 py-2 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
                            Apply Dates
                        </button>
                    </div>
                </div>
            </div>

        </div>
      )}
    </div>
  );
}

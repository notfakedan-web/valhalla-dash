"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react';

// --- TIMEZONE HELPERS (STRICT EST) ---
const toEST = (date: Date) => {
    // Force conversion to New York time strings to avoid UTC shifts
    return new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
};

const getStartOfDayEST = (date: Date) => {
    const d = toEST(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getEndOfDayEST = (date: Date) => {
    const d = toEST(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

// --- PRESETS ---
const PRESETS = [
    { 
        label: 'Today', 
        getValue: () => {
            const now = new Date();
            return { start: getStartOfDayEST(now), end: getEndOfDayEST(now) };
        }
    },
    { 
        label: 'Yesterday', 
        getValue: () => {
            const d = new Date();
            d.setDate(d.getDate() - 1); // Subtract 1 day first
            return { start: getStartOfDayEST(d), end: getEndOfDayEST(d) };
        }
    },
    { 
        label: 'Last 7 Days', 
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 7);
            return { start: getStartOfDayEST(start), end: getEndOfDayEST(end) };
        }
    },
    { 
        label: 'Last 30 Days', 
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            return { start: getStartOfDayEST(start), end: getEndOfDayEST(end) };
        }
    },
    { 
        label: 'Last 90 Days', 
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 90);
            return { start: getStartOfDayEST(start), end: getEndOfDayEST(end) };
        }
    },
    { 
        label: 'Last 365 Days', 
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 365);
            return { start: getStartOfDayEST(start), end: getEndOfDayEST(end) };
        }
    },
    { 
        label: 'All Time', 
        getValue: () => ({ start: null, end: null }) 
    }
];

export default function Filters({ platforms = [], closers = [], setters = [] }: any) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [isOpen, setIsOpen] = useState(false);
    const [tempStart, setTempStart] = useState<Date | null>(null);
    const [tempEnd, setTempEnd] = useState<Date | null>(null);
    const [viewDate, setViewDate] = useState(new Date()); // For navigating the calendar

    const containerRef = useRef<HTMLDivElement>(null);

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

    // Initialize from URL
    useEffect(() => {
        const startParam = searchParams.get('start');
        const endParam = searchParams.get('end');
        if (startParam) setTempStart(new Date(startParam));
        if (endParam) setTempEnd(new Date(endParam));
    }, [searchParams]);

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (tempStart) params.set('start', tempStart.toISOString());
        else params.delete('start');

        if (tempEnd) params.set('end', tempEnd.toISOString());
        else params.delete('end');

        router.push(`${pathname}?${params.toString()}`);
        setIsOpen(false);
    };

    const handlePreset = (preset: any) => {
        const { start, end } = preset.getValue();
        setTempStart(start);
        setTempEnd(end);
        // We do NOT close automatically, allows user to see what was picked
    };

    // Calendar Helpers
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            
            // Highlight logic
            let isSelected = false;
            let isRange = false;
            
            if (tempStart && tempEnd) {
                if (date >= getStartOfDayEST(tempStart) && date <= getEndOfDayEST(tempEnd)) isRange = true;
            }
            // Strict equality check for start/end visual
            const isStart = tempStart && date.toDateString() === tempStart.toDateString();
            const isEnd = tempEnd && date.toDateString() === tempEnd.toDateString();

            if (isStart || isEnd) isSelected = true;

            days.push(
                <button
                    key={day}
                    onClick={() => {
                        if (!tempStart || (tempStart && tempEnd)) {
                            setTempStart(getStartOfDayEST(date));
                            setTempEnd(null);
                        } else {
                            // If clicking before start, reset start
                            if (date < tempStart) {
                                setTempStart(getStartOfDayEST(date));
                            } else {
                                setTempEnd(getEndOfDayEST(date));
                            }
                        }
                    }}
                    className={`
                        w-8 h-8 text-xs rounded-full flex items-center justify-center transition-all
                        ${isSelected ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50' : ''}
                        ${isRange && !isSelected ? 'bg-blue-900/30 text-blue-200' : ''}
                        ${!isSelected && !isRange ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const formatDateDisplay = () => {
        if (tempStart && tempEnd) {
            return `${tempStart.toLocaleDateString()} - ${tempEnd.toLocaleDateString()}`;
        }
        if (tempStart) return `${tempStart.toLocaleDateString()} - ...`;
        return 'Select Dates';
    };

    return (
        <div className="relative z-50" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-sm"
            >
                <CalendarIcon size={14} className="text-zinc-500" />
                <span>{formatDateDisplay()}</span>
                {tempStart && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1" />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl p-0 flex flex-col md:flex-row overflow-hidden w-[320px] md:w-[600px] z-[100]">
                    
                    {/* SIDEBAR PRESETS */}
                    <div className="bg-[#0c0c0e] border-b md:border-b-0 md:border-r border-zinc-800 p-4 md:w-48 flex-shrink-0 flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 ml-2">Quick Select</span>
                        {PRESETS.map((p) => (
                            <button
                                key={p.label}
                                onClick={() => handlePreset(p)}
                                className="text-left px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* CALENDAR */}
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-bold text-white">
                                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                                <span key={d} className="text-[10px] font-bold text-zinc-600 uppercase">{d}</span>
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                            {renderCalendar()}
                        </div>

                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800">
                            <button 
                                onClick={() => { setTempStart(null); setTempEnd(null); }}
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
                                    onClick={applyFilters}
                                    className="px-4 py-2 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-lg uppercase tracking-wider"
                                >
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

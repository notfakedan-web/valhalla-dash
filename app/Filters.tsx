'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

interface FiltersProps {
  platforms?: string[];
  closers?: string[];
  setters?: string[];
}

export default function Filters({ platforms = [], closers = [], setters = [] }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname(); // <--- THIS FIXES THE RESET BUTTON
  const searchParams = useSearchParams();

  // State for internal logic
  const [isOpen, setIsOpen] = useState(false);
  
  // Get active params
  const start = searchParams.get('start') || '';
  const end = searchParams.get('end') || '';
  const activePlatform = searchParams.get('platform') || '';
  const activeCloser = searchParams.get('closer') || '';
  const activeSetter = searchParams.get('setter') || '';

  // Apply a new filter
  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Date Range Handler
  const handleDateApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const s = formData.get('start') as string;
    const e_date = formData.get('end') as string;
    
    const params = new URLSearchParams(searchParams.toString());
    if (s) params.set('start', s); else params.delete('start');
    if (e_date) params.set('end', e_date); else params.delete('end');
    
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  // RESET HANDLER (Fixed)
  const handleReset = () => {
      // Pushes to the CURRENT pathname with NO params
      router.push(pathname);
      setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      
      {/* 1. DATE PICKER */}
      <div className="relative">
        <button 
            onClick={() => setIsOpen(!isOpen)} 
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all border ${start && end ? 'bg-zinc-100 text-black border-white' : 'bg-[#121214] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
        >
            <Calendar size={12} className={start && end ? 'text-black' : ''}/>
            <span>{start && end ? `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}` : 'Date Range'}</span>
        </button>

        {isOpen && (
            <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                <div className="absolute top-full left-0 mt-2 p-4 bg-[#121214] border border-zinc-800 rounded-xl shadow-2xl z-50 w-72 animate-in fade-in zoom-in-95 duration-200">
                    <form onSubmit={handleDateApply} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Start</label>
                                <input name="start" type="date" defaultValue={start} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-blue-500/50" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">End</label>
                                <input name="end" type="date" defaultValue={end} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-blue-500/50" />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest text-[10px] py-2.5 rounded-lg hover:bg-zinc-200">Apply Dates</button>
                    </form>
                </div>
            </>
        )}
      </div>

      <div className="h-4 w-px bg-zinc-800" />

      {/* 2. PLATFORM SELECT */}
      {platforms.length > 0 && (
          <div className="relative group">
            <select 
                value={activePlatform} 
                onChange={(e) => applyFilter('platform', e.target.value)}
                className="appearance-none bg-[#121214] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 px-3 py-2 pr-8 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer transition-all"
            >
                <option value="">Select Platform</option>
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
          </div>
      )}

      {/* 3. CLOSER SELECT */}
      {closers.length > 0 && (
          <div className="relative group">
            <select 
                value={activeCloser} 
                onChange={(e) => applyFilter('closer', e.target.value)}
                className="appearance-none bg-[#121214] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 px-3 py-2 pr-8 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer transition-all"
            >
                <option value="">Select Closer</option>
                {closers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
          </div>
      )}

      {/* 4. SETTER SELECT */}
      {setters.length > 0 && (
          <div className="relative group">
            <select 
                value={activeSetter} 
                onChange={(e) => applyFilter('setter', e.target.value)}
                className="appearance-none bg-[#121214] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 px-3 py-2 pr-8 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer transition-all"
            >
                <option value="">Select Setter</option>
                {setters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
          </div>
      )}

      {/* 5. RESET BUTTON */}
      {(start || end || activePlatform || activeCloser || activeSetter) && (
          <button 
            onClick={handleReset}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
              <X size={12} />
              Reset
          </button>
      )}

    </div>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import CalendarPicker from './CalendarPicker';

// This interface fixes the "Type Error" by telling the component what props to expect
interface FiltersProps {
  platforms: string[];
  closers: string[];
  setters: string[];
  resetPath?: string; // This is the new optional property causing the error
}

export default function Filters({ 
  platforms, 
  closers, 
  setters,
  resetPath = '/' // Defaults to home if not specified
}: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`?${params.toString()}`);
  };

  const Select = ({ label, options, param }: { label: string, options: string[], param: string }) => (
    <div className="relative group">
      <select 
        onChange={(e) => update(param, e.target.value)}
        value={searchParams.get(param) || ''}
        className="appearance-none bg-zinc-900/50 backdrop-blur-md border border-zinc-800 text-[11px] font-black uppercase tracking-widest text-zinc-300 pl-4 pr-10 py-3 rounded-xl focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer min-w-[140px] hover:border-zinc-700"
      >
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={14} />
    </div>
  );

  return (
    <div className="flex flex-wrap gap-3 items-center relative z-[50]">
      <CalendarPicker />
      {platforms.length > 0 && <Select label="Platform" options={platforms} param="platform" />}
      {closers.length > 0 && <Select label="Closer" options={closers} param="closer" />}
      {setters.length > 0 && <Select label="Setter" options={setters} param="setter" />}
      
      <button 
        onClick={() => router.push(resetPath)} 
        className="px-4 py-3 text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors hover:bg-zinc-800 rounded-xl"
      >
        Reset
      </button>
    </div>
  );
}

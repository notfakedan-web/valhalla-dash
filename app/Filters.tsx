'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import CalendarPicker from './CalendarPicker';

export default function Filters({ platforms, closers, setters }: { platforms: string[], closers: string[], setters: string[] }) {
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
        className="appearance-none bg-zinc-900/50 backdrop-blur-md border border-zinc-800 text-[11px] font-black uppercase tracking-widest text-zinc-300 pl-4 pr-10 py-3 rounded-xl focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer min-w-[160px] hover:border-zinc-700"
      >
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={14} />
    </div>
  );

  return (
    // THE Z-[50] HERE IS CRITICAL TO STAY ABOVE THE GRAPHS
    <div className="flex flex-wrap gap-4 items-center mb-10 relative z-[50]">
      <CalendarPicker />
      <Select label="Platform" options={platforms} param="platform" />
      <Select label="Closer" options={closers} param="closer" />
      <Select label="Setter" options={setters} param="setter" />
      <button 
        onClick={() => router.push('/')} 
        className="px-4 py-3 text-[10px] font-black text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-all"
      >
        Reset
      </button>
    </div>
  );
}

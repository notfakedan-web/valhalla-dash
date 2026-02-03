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
        className="appearance-none bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 text-sm font-bold text-zinc-300 pl-5 pr-12 py-3.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:shadow-lg focus:shadow-cyan-500/20 transition-all cursor-pointer min-w-[160px] hover:border-zinc-600"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-zinc-400 pointer-events-none transition-colors" size={16} />
    </div>
  );

  return (
    <div className="flex flex-wrap gap-4 items-center mb-12 p-6 bg-gradient-to-r from-zinc-900/50 to-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-2xl">
      <CalendarPicker />
      <Select label="Platform" options={platforms} param="platform" />
      <Select label="Closer" options={closers} param="closer" />
      <Select label="Setter" options={setters} param="setter" />
      <button 
        onClick={() => router.push('/')} 
        className="px-6 py-3.5 text-xs font-black text-zinc-500 hover:text-cyan-400 uppercase tracking-widest transition-all hover:bg-zinc-800/50 rounded-xl border border-transparent hover:border-zinc-700"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        Reset
      </button>
    </div>
  );
}

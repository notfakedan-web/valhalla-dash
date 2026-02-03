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
        className="appearance-none bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-300 pl-4 pr-10 py-3 rounded-lg focus:outline-none focus:border-green-500/50 transition-all cursor-pointer min-w-[150px] hover:border-zinc-700"
      >
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={14} />
    </div>
  );

  return (
    <div className="flex flex-wrap gap-3 items-center mb-8">
      <CalendarPicker />
      <Select label="Platform" options={platforms} param="platform" />
      <Select label="Closer" options={closers} param="closer" />
      <Select label="Setter" options={setters} param="setter" />
      <button 
        onClick={() => router.push('/')} 
        className="px-4 py-3 text-xs font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-wide transition-all"
      >
        Reset
      </button>
    </div>
  );
}

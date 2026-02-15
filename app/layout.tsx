"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Youtube, Menu, X } from 'lucide-react';
import Logo from './Logo';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    // Z-Index lowered to 50 so Modals (Z-100+) can cover it
    <div className="lg:hidden sticky top-0 z-50 bg-[#050505] border-b border-zinc-900/50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
           <Logo className="w-8 h-8" />
           <span className="text-sm font-black tracking-widest text-white uppercase">VALHALLA OS</span>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-400 hover:text-white bg-zinc-900/50 rounded-lg border border-zinc-800"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#050505] border-b border-zinc-800 shadow-2xl p-4 flex flex-col gap-2 h-screen animate-in slide-in-from-top-5">
            <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={pathname === '/'} onClick={() => setIsOpen(false)} />
            <NavItem href="/leads" icon={<Users size={18} />} label="Lead Flow" active={pathname === '/leads'} onClick={() => setIsOpen(false)} />
            <NavItem href="/youtube" icon={<Youtube size={18} />} label="YouTube ROI" active={pathname === '/youtube'} onClick={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}

function NavItem({ href, icon, label, active, onClick }: any) {
    return (
        <Link 
            href={href} 
            onClick={onClick}
            className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all border ${
                active ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-transparent text-zinc-500 hover:bg-zinc-900/30'
            }`}
        >
            <div className={active ? 'text-cyan-400' : 'text-zinc-600'}>{icon}</div>
            <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
        </Link>
    );
}

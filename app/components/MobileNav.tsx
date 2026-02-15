"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Youtube, Menu, X } from 'lucide-react';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when a link is clicked
  const handleLinkClick = () => setIsOpen(false);

  return (
    <div className="lg:hidden sticky top-0 z-[999] bg-[#050505] border-b border-zinc-800">
      
      {/* MOBILE HEADER */}
      <div className="flex items-center justify-between p-4">
        {/* LOGO (Small) */}
        <div className="flex items-center gap-2">
           <svg width="24" height="24" viewBox="0 0 921 830" fill="none" className="text-white">
                <path d="M0 0 C15 6 30 16 43 26 C46 28 48 29 50 31 C51 31 52 32 53 33 ..." fill="currentColor" /> 
                {/* Simplified Path for Icon - Using a generic shape for code brevity, 
                    the real logo will load if you use the full SVG code from layout or an <img> tag. 
                    For now, let's just use the text to keep it clean. */}
           </svg>
           <span className="text-sm font-black tracking-widest text-white uppercase">VALHALLA OS</span>
        </div>

        {/* HAMBURGER BUTTON */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-lg border border-zinc-800"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* DROPDOWN MENU (Overlay) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#050505] border-b border-zinc-800 shadow-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-5 duration-200">
            <NavItem 
                href="/" 
                icon={<LayoutDashboard size={16} />} 
                label="Dashboard" 
                active={pathname === '/'} 
                onClick={handleLinkClick}
            />
            <NavItem 
                href="/leads" 
                icon={<Users size={16} />} 
                label="Lead Flow" 
                active={pathname === '/leads'} 
                onClick={handleLinkClick}
            />
            <NavItem 
                href="/youtube" 
                icon={<Youtube size={16} />} 
                label="YouTube ROI" 
                active={pathname === '/youtube'} 
                onClick={handleLinkClick}
            />
            
            {/* Status Indicator */}
            <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center gap-2 px-4">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">System Online v2.4</span>
            </div>
        </div>
      )}
    </div>
  );
}

// Helper Component for Links
function NavItem({ href, icon, label, active, onClick }: any) {
    return (
        <Link 
            href={href} 
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all border ${
                active 
                ? 'bg-zinc-900 border-zinc-700 text-white shadow-sm' 
                : 'border-transparent text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
            }`}
        >
            <div className={active ? 'text-cyan-400' : 'text-zinc-600'}>{icon}</div>
            <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        </Link>
    );
}

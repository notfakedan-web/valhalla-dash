import './globals.css'
import Link from 'next/link';
import { LayoutDashboard, Users, Youtube } from 'lucide-react';
import MobileNav from './components/MobileNav'; 
import Logo from './components/Logo'; // Updated to point to the components folder

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-zinc-100 flex flex-col lg:flex-row min-h-screen font-sans selection:bg-cyan-500/30">
        
        {/* MOBILE NAVIGATION */}
        <MobileNav />

        {/* DESKTOP SIDEBAR */}
        <aside className="w-64 border-r border-zinc-900/50 flex-col justify-between hidden lg:flex shrink-0 bg-[#050505] fixed h-full z-50">
          
          <div className="p-6">
            {/* LOGO SECTION */}
            <div className="flex flex-col items-center gap-4 mb-10 mt-6">
              <div className="text-white hover:text-cyan-400 transition-colors duration-300">
                <Logo className="w-20 h-20 opacity-90 hover:opacity-100 transition-opacity" />
              </div>
              
              <h1 className="text-sm font-bold tracking-[0.25em] text-white uppercase text-center">
                VALHALLA OS
              </h1>
            </div>
            
            {/* NAVIGATION */}
            <nav className="flex flex-col gap-2">
              <p className="px-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 mt-4">Main Terminal</p>
              
              <SidebarLink href="/" icon={<LayoutDashboard size={16} />} label="Dashboard" />
              <SidebarLink href="/leads" icon={<Users size={16} />} label="Lead Flow" />
              <SidebarLink href="/youtube" icon={<Youtube size={16} />} label="YouTube ROI" />
            </nav>
          </div>

          {/* SYSTEM STATUS */}
          <div className="p-8 border-t border-zinc-900/50">
             <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">System Online</span>
                </div>
                <p className="text-[9px] text-zinc-600 font-mono">v2.4.0-stable</p>
             </div>
          </div>

        </aside>

        {/* MAIN CONTENT WRAPPER */}
        <main className="flex-1 lg:ml-64 relative z-0">
          {children}
        </main>
      </body>
    </html>
  )
}

// Sidebar Link Helper
function SidebarLink({ href, icon, label }: any) {
    return (
        <Link href={href} className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900/40 transition-all border border-transparent hover:border-zinc-800/50">
            <div className="text-zinc-600 group-hover:text-cyan-400 transition-colors">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">{label}</span>
        </Link>
    );
}

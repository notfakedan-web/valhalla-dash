import './globals.css'
import Link from 'next/link';
import { LayoutDashboard, Users, Youtube } from 'lucide-react'; // Assuming you have lucide-react

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-zinc-100 flex min-h-screen font-sans selection:bg-cyan-500/30">
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-zinc-900/50 p-8 flex-col gap-10 hidden lg:flex shrink-0 bg-[#050505] fixed h-full z-50">
          <div className="flex items-center gap-3 mb-4 pl-2">
             <div className="w-8 h-8 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
             <span className="font-black uppercase tracking-tighter text-xl italic">Valhalla</span>
          </div>
          
          <nav className="flex flex-col gap-4">
            <Link href="/" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900/50 transition-all border border-transparent hover:border-zinc-800/50">
                <LayoutDashboard size={16} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Dashboard</span>
            </Link>
            
            <Link href="/leads" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900/50 transition-all border border-transparent hover:border-zinc-800/50">
                <Users size={16} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Lead Flow</span>
            </Link>

            <Link href="/youtube" className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900/50 transition-all border border-transparent hover:border-zinc-800/50">
                <Youtube size={16} className="text-zinc-500 group-hover:text-red-500 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">YouTube ROI</span>
            </Link>
          </nav>
        </aside>

        {/* MAIN CONTENT WRAPPER */}
        <main className="flex-1 lg:ml-64 relative">
          {children}
        </main>
      </body>
    </html>
  )
}

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      {/* Spinning Icon */}
      <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      
      {/* Text */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-white uppercase tracking-widest animate-pulse">
          Loading Data...
        </h3>
        <p className="text-xs text-zinc-500 font-mono">
          Syncing with database
        </p>
      </div>
    </div>
  );
}

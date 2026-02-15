import Image from 'next/image';

export default function Logo({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Image 
        src="/valhalla-logo.png" 
        alt="Logo" 
        fill 
        className="object-contain" 
        unoptimized 
      />
    </div>
  );
}

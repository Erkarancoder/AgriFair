import { useState } from 'react';
import { Sprout, X, ArrowRight } from 'lucide-react';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Platform Announcement"
      className="bg-[#123826] text-[#e8f5e9] border-b border-[#1b4e37] text-xs sm:text-sm font-medium py-2.5 px-4 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#205e44] text-[#a7f3d0] shrink-0">
            <Sprout className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <p className="text-center sm:text-left leading-tight text-white/95">
           <marquee behavior="scroll" direction="" loop="infinite"> <span className="font-semibold text-emerald-300">AgriFair Mission:</span>{' '}
            Bridging rural agricultural producers directly with bulk buyers, wholesalers & retailers across India.</marquee>
          </p>
          <a
            href="#how-it-works"
            className="hidden md:inline-flex items-center gap-1 text-emerald-300 hover:text-white underline underline-offset-2 ml-1 text-xs transition-colors"
          >
            Learn How It Works <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-emerald-200/70 hover:text-white hover:bg-[#1f5940] p-1 rounded-md transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          aria-label="Dismiss announcement banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

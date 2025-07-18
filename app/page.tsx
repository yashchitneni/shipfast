import Link from 'next/link';
import { Globe, Anchor, Compass } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#001122] flex flex-col items-center justify-center overflow-hidden relative">
      {/* Animated Background Layers */}
      <div className="absolute inset-0">
        {/* Base ocean layer with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#001122] via-[#001f3f] to-[#002244]"></div>
        
        {/* World map layer */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 animate-pan-slow"
          style={{ backgroundImage: "url('/world-map.png')" }}
        ></div>
        
        {/* Shipping lanes overlay */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-sky-blue/30 to-transparent animate-pulse-lane"></div>
          <div className="absolute top-1/2 left-1/6 w-2/3 h-px bg-gradient-to-r from-transparent via-sky-blue/20 to-transparent animate-pulse-lane-delayed"></div>
          <div className="absolute top-2/3 left-1/3 w-1/3 h-px bg-gradient-to-r from-transparent via-sky-blue/25 to-transparent animate-pulse-lane-slow"></div>
        </div>
        
        {/* Enhanced pulsing port indicators with throb effect */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-gold-yellow rounded-full animate-port-throb"></div>
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-gold-yellow rounded-full animate-port-throb-delayed"></div>
        <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-gold-yellow rounded-full animate-port-throb-slow"></div>
        
        {/* Additional smaller ports */}
        <div className="absolute top-1/6 right-1/3 w-2 h-2 bg-gold-yellow rounded-full animate-port-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-gold-yellow rounded-full animate-port-pulse-delayed"></div>
        <div className="absolute top-3/4 right-1/6 w-2 h-2 bg-gold-yellow rounded-full animate-port-pulse-slow"></div>
        
        {/* Water shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-sky-blue/5 to-transparent animate-shimmer"></div>
      </div>

      {/* Main Content */}
      <div className="text-center text-white z-10 animate-fade-in-up">
        {/* Logo and Title */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="relative">
            <Compass className="w-16 h-16 text-gold-yellow animate-spin-very-slow" />
            <div className="absolute inset-0 w-16 h-16 bg-gold-yellow/20 rounded-full animate-ping"></div>
          </div>
          <h1 className="text-7xl font-bold tracking-wider bg-gradient-to-r from-white via-sky-blue to-white bg-clip-text text-transparent">
            Flexport
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-2xl text-sky-blue/90 mb-12 font-light tracking-wide">
          Build Your Global Shipping Empire
        </p>

        {/* Call to Action Button */}
        <Link
          href="/game"
          className="
            group relative inline-block px-16 py-5
            bg-gradient-to-r from-gold-yellow to-yellow-400
            text-black font-bold text-xl rounded-xl
            shadow-[0_0_30px_rgba(255,215,0,0.4)]
            hover:shadow-[0_0_50px_rgba(255,215,0,0.8)]
            transition-all duration-500 ease-out
            transform hover:scale-110 hover:-translate-y-1
            border-2 border-gold-yellow/50 hover:border-gold-yellow
            overflow-hidden
          "
        >
          {/* Button background shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          {/* Button content */}
          <div className="relative flex items-center gap-3">
            <Anchor className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            <span>Launch Empire</span>
          </div>
        </Link>
        
        {/* Subtitle hint */}
        <p className="text-neutral-gray/60 text-sm mt-6 animate-fade-in-delayed">
          Navigate global trade routes • Manage ports • Build your fleet
        </p>
      </div>

      {/* Animated orbital rings */}
      <div className="absolute top-1/2 left-1/2 w-[120vw] h-[120vw] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="absolute w-full h-full border border-sky-blue/10 rounded-full animate-orbit-slow"></div>
        <div className="absolute w-[75%] h-[75%] top-[12.5%] left-[12.5%] border border-sky-blue/8 rounded-full animate-orbit-medium"></div>
        <div className="absolute w-[50%] h-[50%] top-[25%] left-[25%] border border-sky-blue/6 rounded-full animate-orbit-fast"></div>
      </div>
    </main>
  );
}
"use client";

import { useState, useRef } from "react";
import { VolumeX, Volume2 } from "lucide-react";

interface HeroVideoProps {
  src: string;
  showControlOnly?: boolean;
}

export default function HeroVideo({ src, showControlOnly = false }: HeroVideoProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div 
      className="absolute inset-0 w-full h-full cursor-pointer group/hero"
      onClick={toggle}
    >
      {!showControlOnly && (
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover transition-all duration-700"
        />
      )}
      
      {/* Absolute minimal mute icon */}
      <button
        className="absolute bottom-6 right-6 z-50 flex items-center justify-center p-2 text-white/40 hover:text-white active:scale-90 transition-all drop-shadow-lg"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX className="w-3 h-3" />
        ) : (
          <Volume2 className="w-3 h-3" />
        )}
      </button>

      {/* Visual Indicator Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-active/hero:opacity-100 transition-opacity">
        <div className="p-4 rounded-full bg-black/10 backdrop-blur-sm border border-white/5">
          {isMuted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-white/70" />}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { X, Volume2, VolumeX } from "lucide-react";

interface HeroVideoProps {
  src: string;
}

export default function HeroVideo({ src }: HeroVideoProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div 
      className="absolute inset-0 w-full h-full cursor-pointer"
      onClick={toggleMute}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover transition-all duration-1000"
      />
      
      {/* Visual Audio Indicator */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center justify-center p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-all active:scale-95">
        {isMuted ? (
          <VolumeX className="w-3.5 h-3.5 text-white/70" />
        ) : (
          <div className="flex items-center gap-0.5">
            <div className="w-[1.2px] h-2 bg-white/80 animate-pulse" />
            <div className="w-[1.2px] h-3 bg-white/80 animate-pulse" style={{ animationDelay: '0.1s' }} />
            <div className="w-[1.2px] h-2 bg-white/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
      </div>
    </div>
  );
}

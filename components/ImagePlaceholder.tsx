"use client";

/**
 * ImagePlaceholder — Shows the ZB logo as a centered, subtle placeholder
 * whenever product images are loading or unavailable.
 */
export default function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center w-full h-full bg-foreground/[0.03] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/zb-logo-220px.png"
        alt="Zica Bella"
        draggable={false}
        className="w-12 h-12 opacity-30 select-none animate-pulse object-contain"
      />
    </div>
  );
}

/**
 * handleImageError — Replaces a broken image with the ZB logo placeholder.
 * Use as: onError={handleImageError} on any <img> or Next <Image>.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.currentTarget;
  // Prevent infinite loop if the logo itself fails
  if (target.src.includes("zb-logo-220px.png")) return;
  target.srcset = ""; // Essential: Clear Next.js srcset so it doesn't override src
  target.src = "/zb-logo-220px.png";
  target.style.objectFit = "scale-down";
  // Creating a massive padding forces object-fit to shrink the image into a tiny central icon.
  // 40% padding means it only occupies the central 20% area down to its nominal 220px size limit.
  target.style.padding = "40%"; 
  target.style.opacity = "0.3";
  target.style.filter = "grayscale(100%) brightness(1.5)";
}

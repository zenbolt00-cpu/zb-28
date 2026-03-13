"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShopifyProduct } from "@/lib/shopify-admin";

interface NeuralProductMeshProps {
  products: ShopifyProduct[];
}

interface Orb {
  id: string;
  product: ShopifyProduct;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vr: number;
  delay: number;
}

const RADIUS = 50; 
const SPEED_LIMIT = 10; // Increased from 6 for v4.0

export default function NeuralProductMesh({ products }: NeuralProductMeshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const displayProducts = products.slice(0, 8); 

  // Initialize Orbs
  useEffect(() => {
    if (displayProducts.length === 0) return;
    
    const initialOrbs: Orb[] = displayProducts.map((p, i) => ({
      id: p.id.toString(),
      product: p,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
      vx: (Math.random() - 0.5) * 10, // Increased initial speed
      vy: (Math.random() - 0.5) * 10,
      radius: RADIUS,
      rotation: 0,
      vr: 0,
      delay: i * 0.1
    }));
    
    setOrbs(initialOrbs);
  }, [products]);

  // Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    
    const update = () => {
      if (!containerRef.current) return;
      
      const bounds = containerRef.current.getBoundingClientRect();
      const wallX = bounds.width / 2 - RADIUS;
      const floorY = bounds.height / 2 - RADIUS;
      const roofY = -bounds.height / 2 + RADIUS;

      setOrbs(prevOrbs => {
        const nextOrbs = prevOrbs.map(orb => {
          let { x, y, vx, vy, rotation, vr } = orb;

          // Perpetual Motion
          x += vx;
          y += vy;
          // Rotation removed as per request

          // Wall Collisions (Perfect Bounce)
          if (x > wallX) { x = wallX; vx = -Math.abs(vx); }
          else if (x < -wallX) { x = -wallX; vx = Math.abs(vx); }

          if (y > floorY) { y = floorY; vy = -Math.abs(vy); }
          else if (y < roofY) { y = roofY; vy = Math.abs(vy); }

          // Subtle Speed Clamping to maintain "Non-stop" energy
          const speed = Math.sqrt(vx * vx + vy * vy);
          if (speed < 2) { vx *= 1.05; vy *= 1.05; }
          else if (speed > SPEED_LIMIT + 2) { vx *= 0.95; vy *= 0.95; }

          return { ...orb, x, y, vx, vy, rotation };
        });

        // Circle-Circle Collision Detection & Resolution
        for (let i = 0; i < nextOrbs.length; i++) {
          for (let j = i + 1; j < nextOrbs.length; j++) {
            const o1 = nextOrbs[i];
            const o2 = nextOrbs[j];
            
            const dx = o2.x - o1.x;
            const dy = o2.y - o1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = RADIUS * 2;

            if (distance < minDistance) {
              // Collision resolve (Elastic Impulse)
              const angle = Math.atan2(dy, dx);
              const tx = o1.x + Math.cos(angle) * minDistance;
              const ty = o1.y + Math.sin(angle) * minDistance;
              
              const ax = (tx - o2.x) * 0.1;
              const ay = (ty - o2.y) * 0.1;

              o1.vx -= ax;
              o1.vy -= ay;
              o2.vx += ax;
              o2.vy += ay;
              
              // Rotation impact removed
              
              // Position correction (Prevent overlapping)
              const overlap = minDistance - distance;
              const nx = dx / distance;
              const ny = dy / distance;
              
              o1.x -= nx * overlap / 2;
              o1.y -= ny * overlap / 2;
              o2.x += nx * overlap / 2;
              o2.y += ny * overlap / 2;
            }
          }
        }

        return [...nextOrbs];
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[600px] flex items-center justify-center overflow-hidden py-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"
    >
      {/* MINIMALIST BACKGROUND - PREMIUM TYPOGRAPHY */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center select-none">
        <div className="absolute w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-20" />
        
        <div className="relative text-center px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 0.8, 
              y: 0,
              color: ["#ffffff", "#a1a1a1", "#000000", "#a1a1a1", "#ffffff"],
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity,
              opacity: { duration: 1, delay: 0.5 },
              y: { duration: 1, delay: 0.5 }
            }}
            className="text-[9px] md:text-[11px] font-light uppercase tracking-[0.8em] leading-none text-nowrap drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
            style={{ fontFamily: "'HeadingPro', sans-serif" }}
          >
            ARCHIVE EDITION
          </motion.h2>
        </div>
      </div>

      {/* RENDER ORBS */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        {orbs.map((orb) => (
          <div
            key={orb.id}
            className="absolute top-1/2 left-1/2 pointer-events-auto"
            style={{
              transform: `translate(calc(-50% + ${orb.x}px), calc(-50% + ${orb.y}px))`,
              width: RADIUS * 2,
              height: RADIUS * 2,
            }}
          >
            <Link href={`/products/${orb.product.handle}`} className="block w-full h-full">
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className="relative w-full h-full rounded-full overflow-hidden"
                style={{
                  boxShadow: "0 20px 50px rgba(0,0,0,0.15), inset 0 0 40px rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {/* GLASS LENS LAYER */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {/* Outer Shine */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                  {/* Main Highlight */}
                  <div className="absolute top-[8%] left-[12%] w-[45%] h-[35%] bg-gradient-to-br from-white/50 to-transparent rounded-full blur-[3px] opacity-70" />
                  {/* Specular Point */}
                  <div className="absolute top-[15%] left-[20%] w-[10%] h-[10%] bg-white rounded-full blur-[1px] opacity-80" />
                  {/* Lens Distortion Simulation */}
                  <div className="absolute inset-0 border-[0.5px] border-white/20 rounded-full shadow-[inset_0_0_30px_rgba(255,255,255,0.1)]" />
                  {/* Edge Distortion */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5 opacity-50" />
                </div>

                {/* PRODUCT IMAGE - LENS MAGNIFICATION EFFECT */}
                <div 
                  className="absolute inset-0 z-10 p-2 transition-transform duration-300"
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden scale-[1.3]"> {/* Magnified look */}
                     <Image
                      src={orb.product.image?.src || orb.product.images[0]?.src || "/placeholder.png"}
                      alt={orb.product.title}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* INNER DEPTH */}
                <div className="absolute inset-0 z-5 bg-gradient-to-b from-primary/10 to-transparent rounded-full shadow-[inset_0_10px_20px_rgba(0,0,0,0.1)]" />
              </motion.div>
            </Link>
          </div>
        ))}
      </div>

      {/* FLOOR LINE */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-foreground/5 to-transparent z-10" />
    </div>
  );
}

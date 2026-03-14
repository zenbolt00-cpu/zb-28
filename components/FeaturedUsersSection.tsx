"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Star, MessageCircle, Heart } from "lucide-react";

interface FeaturedUser {
  id: string;
  name: string;
  imageUrl: string;
  styleDescription: string | null;
  reviews: { id: string; rating: number }[];
}

export default function FeaturedUsersSection({ 
  showCommunity = true, 
  title = "FEATURED LOOKS", 
  subtitle = "COMMUNITY" 
}: { 
  showCommunity?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const [users, setUsers] = useState<FeaturedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showCommunity) {
      setLoading(false);
      return;
    }
    fetch("/api/featured-users?isTopFeatured=true")
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
      })
      .finally(() => setLoading(false));
  }, [showCommunity]);

  if (!showCommunity) return null;
  if (loading) return null;
  if (users.length === 0) return null;

  return (
    <section className="mt-24 mb-40 px-4 overflow-hidden">
      <div className="text-center mb-12">
        <h2 className="font-heading text-[10px] tracking-[0.5em] text-muted-foreground/30 mb-2 uppercase">{subtitle}</h2>
        <p className="font-heading text-[28px] tracking-tight text-foreground uppercase opacity-90">{title}</p>
      </div>

      <div className="relative group/carousel">
        <div className="flex gap-5 overflow-x-auto pb-12 hide-scrollbar snap-x px-4 -mx-4">
          {users.map((user) => {
            const avgRating = user.reviews.length > 0 
              ? user.reviews.reduce((acc: any, r: any) => acc + r.rating, 0) / user.reviews.length 
              : 5;

            return (
              <div key={user.id} className="min-w-[300px] snap-center group/card">
                <div className="relative aspect-[3/4.5] rounded-[2.5rem] overflow-hidden bg-foreground/[0.02] border border-foreground/[0.08] shadow-2xl transition-all duration-700 group-hover/card:scale-[1.02] group-hover/card:shadow-emerald-500/10 active:scale-95">
                  <NextImage 
                    src={user.imageUrl} 
                    alt={user.name} 
                    fill 
                    className="object-cover transition-transform duration-[2000ms] ease-out group-hover/card:scale-110"
                  />
                  
                  {/* Glass overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity duration-700" />
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-1000" />
                  
                  <div className="absolute inset-x-0 bottom-0 p-8 transform translate-y-2 group-hover/card:translate-y-0 transition-transform duration-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white tracking-[0.2em] uppercase mb-0.5">{user.name}</span>
                        <div className="flex p-0.5 bg-white/10 backdrop-blur-md rounded-full w-fit px-2 border border-white/10">
                           <Star className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400 mr-1" />
                           <span className="text-[9px] font-bold text-white/90">{avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/50 font-medium leading-relaxed line-clamp-2 italic tracking-wide">
                      "{user.styleDescription}"
                    </p>
                  </div>

                  {/* Quick look buttons */}
                  <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover/card:opacity-100 transition-all duration-700 transform translate-x-4 group-hover/card:translate-x-0">
                    <button className="w-11 h-11 rounded-full glass-vibrancy flex items-center justify-center text-white active:scale-75 transition-all hover:bg-emerald-500/20 border border-white/10">
                      <Heart className="w-4.5 h-4.5" />
                    </button>
                    <button className="w-11 h-11 rounded-full glass-vibrancy flex items-center justify-center text-white active:scale-75 transition-all hover:bg-emerald-500/20 border border-white/10">
                      <MessageCircle className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Subtle scroll indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 opacity-40">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="w-1 h-1 rounded-full bg-foreground/30" />
           ))}
        </div>
      </div>
    </section>
  );
}

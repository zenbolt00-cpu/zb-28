"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Star, MessageCircle, Heart } from "lucide-react";

interface FeaturedUser {
  id: string;
  name: string;
  imageUrl: string;
  instagramUrl?: string | null;
  styleDescription: string | null;
  reviews: { id: string; rating: number }[];
}

export default function FeaturedUsersSection({ 
  showCommunity = true, 
  title = "FEATURED LOOKS", 
  subtitle = "COMMUNITY",
  allFeatured = false
}: { 
  showCommunity?: boolean;
  title?: string;
  subtitle?: string;
  allFeatured?: boolean;
}) {
  const [users, setUsers] = useState<FeaturedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showCommunity) {
      setLoading(false);
      return;
    }
    const url = allFeatured ? "/api/featured-users" : "/api/featured-users?isTopFeatured=true";
    fetch(url, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
      })
      .finally(() => setLoading(false));
  }, [showCommunity, allFeatured]);

  if (!showCommunity) return null;
  if (loading) {
    return (
      <section className="py-4 px-4">
        <div className="flex gap-5 overflow-x-hidden pb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[260px] shrink-0 aspect-[3/4.2] rounded-[2rem] bg-foreground/[0.03] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }
  if (users.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <section className="py-4 px-4 text-center opacity-20">
          <p className="text-[10px] uppercase tracking-widest">Featured Looks Standby</p>
          <p className="text-[8px] mt-1">Add approved looks in Admin Dashboard</p>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="mt-4 mb-4 px-4 overflow-hidden">
      <div className="text-center mb-10">
        <h2 className="font-heading text-[8.5px] tracking-[0.45em] text-muted-foreground/30 mb-3 uppercase" style={{ fontFamily: "'HeadingPro', sans-serif" }}>{subtitle}</h2>
        <p className="font-heading text-[22px] tracking-[0.05em] text-foreground uppercase opacity-85" style={{ fontFamily: "'HeadingPro', sans-serif" }}>{title}</p>
      </div>

      <div className="relative group">
        <div className="flex gap-5 overflow-x-auto pb-8 hide-scrollbar snap-x px-4 -mx-4">
          {users.map((user) => {
            const avgRating = user.reviews.length > 0 
              ? user.reviews.reduce((acc: any, r: any) => acc + r.rating, 0) / user.reviews.length 
              : 5;

            return (
              <div 
                key={user.id} 
                className={`min-w-[260px] snap-center group ${user.instagramUrl ? 'cursor-pointer' : ''}`}
                onClick={() => {
                   if (user.instagramUrl) {
                      window.open(user.instagramUrl, '_blank', 'noopener,noreferrer');
                   }
                }}
              >
                <div className="relative aspect-[3/4.2] rounded-[2rem] overflow-hidden bg-foreground/[0.02] border border-foreground/[0.06] shadow-xl transition-all duration-700 active:scale-95">
                  <NextImage 
                    src={user.imageUrl || "/placeholder.png"} 
                    alt={user.name} 
                    fill 
                    className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110"
                  />
                  
                   {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="flex flex-col mb-2">
                       <span className="text-[10px] font-bold text-white tracking-[0.1em] uppercase mb-1">{user.name}</span>
                    </div>
                    <p className="text-[9px] text-white/50 font-normal leading-relaxed line-clamp-2 tracking-wide">
                      {user.styleDescription}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
}

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

export default function FeaturedUsersSection() {
  const [users, setUsers] = useState<FeaturedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/featured-users")
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (users.length === 0) return null;

  return (
    <section className="mt-20 mb-32 px-4">
      <div className="text-center mb-10">
        <h2 className="font-heading text-[10px] tracking-[0.4em] text-muted-foreground/40 mb-2 uppercase">COMMUNITY</h2>
        <p className="font-heading text-[24px] tracking-tight text-foreground uppercase">FEATURED LOOKS</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-8 hide-scrollbar snap-x">
        {users.map((user) => {
          const avgRating = user.reviews.length > 0 
            ? user.reviews.reduce((acc, r) => acc + r.rating, 0) / user.reviews.length 
            : 5;

          return (
            <div key={user.id} className="min-w-[280px] snap-center group">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden glass-card border border-foreground/[0.05] shadow-2xl">
                <NextImage 
                  src={user.imageUrl} 
                  alt={user.name} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">{user.name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-[9px] font-bold text-white">{avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/60 font-extralight leading-relaxed line-clamp-2 italic">
                    "{user.styleDescription}"
                  </p>
                </div>

                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                  <button className="w-9 h-9 rounded-full glass-vibrancy flex items-center justify-center text-white active:scale-75 transition-transform">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 rounded-full glass-vibrancy flex items-center justify-center text-white active:scale-75 transition-transform">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

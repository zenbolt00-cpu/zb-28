"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Star, MessageCircle, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface FeaturedUser {
  id: string;
  name: string;
  imageUrl: string;
  styleDescription: string | null;
  reviews: { id: string; rating: number }[];
}

export default function CommunityPage() {
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

  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] uppercase tracking-widest font-medium">Back to Home</span>
        </Link>
        
        <div className="mb-16">
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-tight text-foreground mb-4">Community</h1>
          <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
            Discover how the Zica Bella community styles their favorite pieces. Curated looks from around the world.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] rounded-[2.5rem] bg-foreground/5 animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-40 border border-dashed border-foreground/10 rounded-[3rem]">
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium">No community looks yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {users.map((user) => {
              const avgRating = user.reviews.length > 0 
                ? user.reviews.reduce((acc: any, r: any) => acc + r.rating, 0) / user.reviews.length 
                : 5;

              return (
                <div key={user.id} className="group">
                  <div className="relative aspect-[3/4.5] rounded-[2.5rem] overflow-hidden bg-foreground/[0.02] border border-foreground/[0.08] shadow-2xl transition-all duration-700 hover:scale-[1.02] active:scale-95">
                    <NextImage 
                      src={user.imageUrl || "/placeholder.png"} 
                      alt={user.name} 
                      fill 
                      className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-white tracking-[0.2em] uppercase mb-0.5">{user.name}</span>
                          <div className="flex p-0.5 bg-white/10 backdrop-blur-md rounded-full w-fit px-2 border border-white/10">
                             <Star className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400 mr-1" />
                             <span className="text-[9px] font-bold text-white/90">{avgRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/50 font-medium leading-relaxed line-clamp-3 italic tracking-wide">
                        "{user.styleDescription}"
                      </p>
                    </div>

                    <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-4 group-hover:translate-x-0">
                      <button className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-75 transition-all hover:bg-emerald-500/20 border border-white/10">
                        <Heart className="w-4.5 h-4.5" />
                      </button>
                      <button className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-75 transition-all hover:bg-emerald-500/20 border border-white/10">
                        <MessageCircle className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* JOIN COMMUNITY BOX */}
            <Link href="/login" className="group">
              <div className="relative aspect-[3/4.5] rounded-[2.5rem] overflow-hidden bg-foreground/5 border-2 border-dashed border-foreground/10 flex flex-col items-center justify-center p-12 text-center transition-all hover:bg-foreground/[0.07] hover:border-foreground/20">
                <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Star className="w-8 h-8 text-secondary/40" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Become Featured</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-tighter">
                  Upload your look from your order history and get featured on our homepage.
                </p>
                <div className="mt-8 px-6 py-2 bg-foreground text-background text-[9px] font-black uppercase tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Get Started
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

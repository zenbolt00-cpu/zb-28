import prisma from "@/lib/db";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlogsPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-transparent text-foreground selection:bg-foreground selection:text-background flex flex-col">
      
      <main className="flex-1 pt-32 pb-24 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        {/* Header text */}
        <div className="mb-24 space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl uppercase tracking-tighter">
            The Journal.
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed max-w-lg">
            Thoughts, design philosophies, and cultural commentary from the Zica Bella archives. Dive into our latest editorials.
          </p>
        </div>

        {/* Blogs Grid */}
        {posts.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground font-light tracking-widest uppercase text-xs">
            No journal entries published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <Link 
                key={post.id} 
                href={`/blogs/${post.slug}`}
                className="group flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${index * 150}ms`, animationFillMode: "both" }}
              >
                {/* Image Handle */}
                <div className="w-full aspect-[4/5] bg-foreground/[0.02] border border-foreground/10 rounded-3xl overflow-hidden relative glass">
                  {post.coverImage ? (
                    <img 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-8 text-center transition-transform duration-700 group-hover:scale-105">
                      <p className="font-heading text-xl uppercase tracking-widest text-foreground/20">
                        Z.B. ARTICLE
                      </p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-4 px-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-foreground/60">
                      {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="font-rocaston text-2xl uppercase tracking-[0.1em] leading-tight group-hover:text-foreground/80 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Read Article <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface BlogPostProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post || !post.published) {
    notFound();
  }

  // Basic styling for the HTML content to match Apple design
  const contentStyles = `
    .prose h1, .prose h2, .prose h3 {
      font-family: 'Rocaston', serif;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 3rem;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }
    .prose h2 { font-size: 1.5rem; }
    .prose p {
      margin-bottom: 1.5rem;
      line-height: 1.8;
      font-weight: 300;
      color: hsl(var(--muted-foreground));
    }
    .prose img {
      width: 100%;
      border-radius: 1.5rem;
      margin: 3rem 0;
      border: 1px solid hsl(var(--foreground) / 0.1);
    }
    .prose strong {
      font-weight: 600;
      color: hsl(var(--foreground));
    }
    .prose blockquote {
      border-left: 2px solid hsl(var(--foreground) / 0.2);
      padding-left: 1.5rem;
      font-style: italic;
      color: hsl(var(--foreground) / 0.8);
      margin: 2rem 0;
    }
  `;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-32">
        <article className="max-w-3xl mx-auto px-6 sm:px-12 w-full">
          {/* Back Link */}
          <Link 
            href="/blogs" 
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors mb-16"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Journal
          </Link>

          {/* Header */}
          <header className="space-y-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="w-1 h-1 rounded-full bg-foreground/30" />
              <span>{post.author}</span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="w-full aspect-video mb-16 rounded-[2rem] overflow-hidden border border-foreground/10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 relative bg-foreground/[0.02] glass">
              <img 
                src={post.coverImage} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Post Content */}
          <style dangerouslySetInnerHTML={{ __html: contentStyles }} />
          <div 
            className="prose prose-lg max-w-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-24 pt-8 border-t border-foreground/10 text-center animate-in fade-in">
             <div className="w-12 h-px bg-foreground/20 mx-auto mb-8" />
             <p className="font-heading text-xl uppercase tracking-widest text-foreground/40">Zica Bella Archive</p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

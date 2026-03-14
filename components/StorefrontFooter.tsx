import NextImage from "next/image";
import { Instagram, Youtube, Music2, Disc } from "lucide-react";
import prisma from "@/lib/db";
import { fetchPolicies } from "@/lib/shopify-admin";

export default async function StorefrontFooter() {
  let shop = null;
  let policies = [];

  try {
    const [shopData, policiesData] = await Promise.all([
      prisma.shop.findFirst().catch(e => {
        console.error("Footer: prisma failed:", e.message);
        return null;
      }),
      fetchPolicies().catch(e => {
        console.error("Footer: fetchPolicies failed:", e.message);
        return [];
      }),
    ]);
    shop = shopData;
    policies = policiesData as any[];
  } catch (error) {
    console.error("Critical Footer Error:", error);
  }

  const s = shop as any;
  const footerVideo = s?.footerVideo;

  const socialLinks = [
    { url: s?.instagramUrl, icon: Instagram, label: "Instagram" },
    { url: s?.appleUrl,     icon: Disc,      label: "Apple Music" },
    { url: s?.spotifyUrl,   icon: Music2,    label: "Spotify" },
    { url: s?.youtubeUrl,   icon: Youtube,   label: "YouTube" },
  ].filter((item) => item.url);

  return (
    <footer className="w-full pb-10 pt-16 px-4 text-center mt-20 relative z-10 glass rounded-t-[3rem] border-t-0">
      <div className="max-w-md mx-auto px-4">
        {/* 3D GLB Logo */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24">
            {/* @ts-expect-error model-viewer web component */}
            <model-viewer
              src="https://cdn.shopify.com/3d/models/e024b09e83a75c03/Zicabella-silver-logo.glb"
              alt="Zica Bella 3D Logo"
              auto-rotate
              camera-controls={false}
              shadow-intensity="0.5"
              loading="lazy"
              style={{ width: "100%", height: "100%", background: "transparent" }}
            />
          </div>
        </div>

        {/* Brand name */}
        <h2 className="font-rocaston text-base tracking-[0.05em] text-foreground font-light mb-0.5 uppercase">ZICA BELLA</h2>
        <p className="text-[7px] font-extralight uppercase tracking-[0.4em] text-muted-foreground/25 mb-8">Est. 2024</p>

        {/* Footer video */}
        {footerVideo && (
          <div className="mb-8 relative w-full aspect-video rounded-[2rem] overflow-hidden bg-muted shadow-xl border border-foreground/5">
            <video src={footerVideo} autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-55 hover:opacity-80 transition-opacity duration-1000"
            />
          </div>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="flex justify-center gap-7 mb-8">
            {socialLinks.map(({ url, icon: Icon, label }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="text-foreground/30 hover:text-foreground transition-all duration-300 hover:scale-110 active:scale-90">
                <Icon className="w-[18px] h-[18px]" />
              </a>
            ))}
          </div>
        )}

        {/* Policy links */}
        {policies.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-6">
            {policies.map((policy: any) => (
              <a
                key={policy.handle}
                href={`https://8tiahf-bk.myshopify.com/policies/${policy.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[7px] font-extralight uppercase tracking-[0.4em] text-muted-foreground/30 hover:text-foreground/60 transition-colors"
              >
                {policy.title}
              </a>
            ))}
          </div>
        )}

        <p className="text-[7px] font-extralight uppercase tracking-[0.35em] text-muted-foreground/20 mb-1">
          © 2026 ZICA BELLA
        </p>
        <p className="text-[6px] font-extralight tracking-[0.12em] text-muted-foreground/12 uppercase">
          REDEFINING THE STANDARD OF LUXURY STREETWEAR
        </p>
      </div>
    </footer>
  );
}

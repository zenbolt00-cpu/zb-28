"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function SEOContentSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="mt-16 mb-24 px-4 w-full max-w-[410px] mx-auto">
      <div className="glass-card rounded-[2rem] overflow-hidden border border-foreground/5 shadow-2xl relative">
        {/* Dynamic Content Container */}
        <motion.div 
          animate={{ height: isExpanded ? "auto" : "280px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden"
        >
          <div className="p-8 pb-12 space-y-6">
            <h2 className="font-heading text-lg uppercase tracking-[0.1em] text-foreground leading-snug">
              Feel the Power of Premium Streetwear with Zica Bella – A Leading Unisex Streetwear Brand
            </h2>

            <div className="space-y-4 text-[11px] leading-relaxed text-muted-foreground/70 font-light font-sans text-justify uppercase tracking-wider">
              <p>
                Streetwear has evolved from underground culture into one of the most influential fashion movements in the world, and India is no exception. What once began as loose denim, graphic T-shirts, and sneakers has now transformed into a bold expression of individuality, creativity, and luxury.
              </p>
              <p>
                Embodying the spirit of modern street fashion, Zica Bella is an emerging premium unisex streetwear brand in India. Inspired by global street culture and modern aesthetics, Zica Bella combines high-quality fabrics, oversized silhouettes, and fearless design to create clothing that stands out.
              </p>
              <p>
                Streetwear today is more than just fashion — it is a statement of personality and confidence. With carefully designed collections, Zica Bella is shaping the future of Indian streetwear by blending comfort, luxury, and bold design language.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                What is Gender Neutral Streetwear Fashion?
              </h3>
              <p>
                Streetwear is a vibrant reflection of urban culture, music, art, and individuality. Gender-neutral streetwear embraces inclusivity and creativity, allowing people to wear what represents their personality without restrictions.
              </p>
              <p>
                Modern streetwear appeals strongly to Gen Z and young urban audiences who follow hip-hop culture, skate fashion, and contemporary street style.
              </p>
              <p>
                If you enjoy oversized T-shirts, graphic tees, relaxed fits, and expressive fashion, Zica Bella’s unisex streetwear collection is designed for you.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                A Strong Focus on Unisex Streetwear
              </h3>
              <p>
                Unlike traditional fashion brands that separate clothing by gender, Zica Bella designs fashion without boundaries.
              </p>
              <p>
                Our collections are built around comfort, versatility, and bold aesthetics, allowing anyone to wear them confidently.
              </p>
              <p>
                From oversized T-shirts and relaxed joggers to premium hoodies and cargo pants, Zica Bella clothing is designed for individuals who appreciate style without limitations.
              </p>
              <p>
                At Zica Bella, we believe fashion should reflect freedom, identity, and creativity, not restrictions.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                What Makes Zica Bella One of the Best Streetwear Brands in India?
              </h3>
              <p>
                Zica Bella stands out by merging luxury streetwear aesthetics with contemporary design philosophy.
              </p>
              <p className="font-medium text-foreground/80">
                Our collections feature:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Oversized graphic T-shirts</li>
                <li>Premium streetwear hoodies</li>
                <li>Designer polo T-shirts</li>
                <li>Relaxed cargo pants</li>
                <li>Modern denim and streetwear bottoms</li>
              </ul>
              <p>
                Every Zica Bella piece is crafted with attention to detail and premium fabrics, ensuring comfort, durability, and style in every design.
              </p>
              <p>
                By combining high-quality materials with modern streetwear aesthetics, Zica Bella continues to redefine the future of premium streetwear clothing in India.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Explore Zica Bella’s Premium Streetwear Collection
              </h3>
              <p>
                At Zica Bella, we combine global street fashion inspiration with modern Indian design sensibilities.
              </p>
              <p>
                Streetwear is more than clothing — it is self-expression. Every piece in our collection helps individuals showcase their unique identity.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Oversized Sweatshirts – The Core of Streetwear Fashion
              </h3>
              <p>
                Zica Bella’s oversized sweatshirts are designed to be the ultimate streetwear staple.
              </p>
              <p>
                What makes them unique is the way we elevate a simple sweatshirt into a premium fashion statement.
              </p>
              <p>
                Available in various designs, graphics, and colors, these sweatshirts are perfect for layering and can be styled throughout the year.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Designer Jackets for Bold Street Style
              </h3>
              <p>
                For those who want to elevate their outfit, Zica Bella designer jackets add both comfort and statement appeal.
              </p>
              <p>
                Crafted using premium fabrics and detailed finishing, these jackets represent a balance of streetwear attitude and luxury design.
              </p>
              <p>
                Zica Bella jackets are not just outerwear — they are statement pieces built to stand out.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Premium Unisex Hoodies – Comfort Meets Streetwear Attitude
              </h3>
              <p>
                Zica Bella’s premium hoodies combine comfort, relaxed silhouettes, and bold graphics.
              </p>
              <p>
                Designed with oversized fits and high-quality materials, these hoodies are perfect for casual wear or layered street outfits.
              </p>
              <p>
                Whether you prefer minimal designs or bold graphic prints, Zica Bella hoodies deliver both comfort and style.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Statement Oversized T-Shirts – Streetwear Essentials
              </h3>
              <p>
                Oversized T-shirts are the backbone of modern streetwear, and Zica Bella oversized T-shirts are designed to deliver both comfort and visual impact.
              </p>
              <p>
                These premium T-shirts are breathable, stylish, and easy to style with cargo pants, denim, or shorts.
              </p>
              <p>
                Whether worn alone or layered with jackets, Zica Bella graphic T-shirts are designed to turn heads.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Designer Polo T-Shirts – Classic Style with a Streetwear Edge
              </h3>
              <p>
                Zica Bella has reinvented the classic polo T-shirt with a modern streetwear twist.
              </p>
              <p>
                Crafted with premium fabrics and refined silhouettes, our polo T-shirts offer a balance between smart casual and streetwear aesthetics.
              </p>
              <p>
                Available in versatile designs and bold unisex colors, Zica Bella polo T-shirts combine sophistication with urban attitude.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Unisex Cargo Pants and Shorts – Function Meets Fashion
              </h3>
              <p>
                Zica Bella’s bottomwear collection focuses on utility, comfort, and modern streetwear style.
              </p>
              <p className="font-medium text-foreground/80">
                Our range includes:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Premium cargo pants</li>
                <li>Relaxed streetwear shorts</li>
                <li>Designer denim</li>
                <li>Modern streetwear trousers</li>
              </ul>
              <p>
                Each piece is designed for versatility, allowing you to style it for casual days, streetwear outfits, or modern fashion looks.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Latest Colour Trends in Streetwear Fashion
              </h3>
              <p>
                <strong>Black T-Shirts</strong> – The Icon of Streetwear. Zica Bella’s black T-shirts represent bold minimalism and timeless street style. Perfect for layering or standalone outfits, they define modern monochrome fashion.
              </p>
              <p>
                <strong>White T-Shirts</strong> – Clean and Versatile. Our white T-shirts bring a fresh and modern aesthetic to everyday streetwear. Easy to style with denim, cargos, or jackets, they are a must-have wardrobe essential.
              </p>
              <p>
                <strong>Blue T-Shirts</strong> – Cool and Effortless. From soft tones to bold shades, Zica Bella blue T-shirts create a relaxed yet confident streetwear vibe perfect for everyday styling.
              </p>
              <p>
                <strong>Red T-Shirts</strong> – Bold and Expressive. Red T-shirts in the Zica Bella collection bring energy and attention to any outfit. These pieces create powerful streetwear statements.
              </p>
              <p>
                <strong>Black Hoodies</strong> – The Streetwear Foundation. Zica Bella black hoodies represent the essence of modern streetwear. With oversized silhouettes and premium materials, they deliver comfort, style, and versatility.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Streetwear Clothing for Every Season by Zica Bella
              </h3>
              <p>
                <strong>Winter Collection</strong> – Warm Streetwear Energy. The Zica Bella winter collection features layered silhouettes, cozy fabrics, and bold outerwear pieces designed to keep you warm while maintaining strong street style aesthetics.
              </p>
              <p>
                <strong>Spring Collection</strong> – Fresh Fits. Our spring collection focuses on breathable fabrics, relaxed silhouettes, and lightweight layering designed for transitional weather.
              </p>
              <p>
                <strong>Summer Collection</strong> – Lightweight Streetwear. Zica Bella’s summer streetwear collection includes graphic T-shirts, oversized fits, and breathable fabrics designed for all-day comfort and standout style.
              </p>
              <p>
                <strong>Autumn Collection</strong> – Transitional Street Style. With earthy tones and layered designs, our autumn collection balances comfort and style for cooler days and evenings.
              </p>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Why Zica Bella is Becoming a Leading Streetwear Brand in India
              </h3>
              <p>
                Zica Bella represents a new wave of premium streetwear fashion in India.
              </p>
              <p className="font-medium text-foreground/80">
                Our collections stand out because of:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Unique Designs:</strong> Every Zica Bella piece is designed in-house with bold graphics and distinctive aesthetics.</li>
                <li><strong>Premium Quality:</strong> We use high-quality fabrics to ensure durability, comfort, and long-lasting style.</li>
                <li><strong>Unisex Fashion:</strong> Our collections are designed for everyone, promoting inclusive fashion.</li>
                <li><strong>Trendsetting Streetwear:</strong> Zica Bella designs follow modern streetwear culture while setting new trends.</li>
              </ul>

              <h3 className="text-foreground font-semibold mt-8 text-[12px] tracking-[0.2em] mb-2 uppercase">
                Final Thoughts: Zica Bella and the Future of Indian Streetwear
              </h3>
              <p>
                Zica Bella is redefining modern streetwear in India by combining premium quality, bold design, and unisex fashion philosophy. From oversized graphic T-shirts to premium hoodies and statement streetwear pieces, Zica Bella is designed for individuals who want their fashion to stand out.
              </p>
              <p>
                If you are looking to elevate your streetwear style, Zica Bella is built for those who refuse to blend in.
              </p>

              <div className="pt-8 border-t border-foreground/5 space-y-4">
                <h3 className="text-foreground font-bold text-[13px] tracking-[0.2em] uppercase">
                  FAQs
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-foreground font-semibold uppercase tracking-wide">Is Zica Bella an Indian brand?</p>
                    <p>Yes, Zica Bella is an emerging Indian streetwear brand focused on premium unisex fashion inspired by global streetwear culture.</p>
                  </div>
                  <div>
                    <p className="text-foreground font-semibold uppercase tracking-wide">How does Zica Bella compare to other streetwear brands?</p>
                    <p>Zica Bella stands out through premium fabrics, bold designs, oversized silhouettes, and unisex styling, making it one of the most promising streetwear brands in India.</p>
                  </div>
                  <div>
                    <p className="text-foreground font-semibold uppercase tracking-wide">Why is Zica Bella popular with Gen Z?</p>
                    <p>Zica Bella’s oversized fits, bold graphics, and unisex fashion approach resonate strongly with Gen Z audiences who value individuality and comfort.</p>
                  </div>
                  <div>
                    <p className="text-foreground font-semibold uppercase tracking-wide">What defines Indian streetwear?</p>
                    <p>Indian streetwear is a modern fashion movement inspired by global urban culture such as hip-hop, skateboarding, and street art. Brands like Zica Bella combine these influences with local creativity to shape the future of street fashion in India.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {!isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent flex items-end justify-center pb-4 pointer-events-none"
              >
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-4 flex items-center justify-center gap-2 border-t border-foreground/5 hover:bg-foreground/[0.02] transition-colors group"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground group-hover:text-foreground transition-colors">
            {isExpanded ? "Read Less" : "Read More"}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>
      </div>

      {/* Popular Searches */}
      <div className="mt-12 px-4 space-y-6">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.5em] text-foreground text-center">
          Popular searches
        </h4>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          <Link href="/collections" className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-foreground transition-colors">
            Shop by category
          </Link>
          <Link href="/collections" className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-foreground transition-colors">
            Shop by style
          </Link>
          <Link href="/collections" className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-foreground transition-colors">
            Shop by color
          </Link>
        </div>
      </div>
    </section>
  );
}

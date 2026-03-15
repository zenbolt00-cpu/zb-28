"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function SEOContentSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="mt-12 mb-20 px-4 w-full max-w-[400px] mx-auto">
      <div className="glass-vibrancy rounded-[1.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
        {/* Dynamic Content Container */}
        <motion.div 
          animate={{ height: isExpanded ? "auto" : "160px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden"
        >
          <div className="p-5 pb-8 space-y-4 text-center">
            <h2 className="font-heading text-[10px] uppercase tracking-[0.2em] text-white leading-tight">
              Feel the Power of Premium Streetwear with Zica Bella – A Leading Unisex Streetwear Brand
            </h2>

            <div className="space-y-2 text-[6px] leading-[1.8] text-white/40 font-light font-sans text-center uppercase tracking-[0.05em]">
              <p>
                Streetwear has evolved from underground culture into one of the most influential fashion movements in the world, and India is no exception. What once began as loose denim, graphic T-shirts, and sneakers has now transformed into a bold expression of individuality, creativity, and luxury.
              </p>
              <p>
                Embodying the spirit of modern street fashion, Zica Bella is an emerging premium unisex streetwear brand in India. Inspired by global street culture and modern aesthetics, Zica Bella combines high-quality fabrics, oversized silhouettes, and fearless design to create clothing that stands out.
              </p>
              <p>
                Streetwear today is more than just fashion — it is a statement of personality and confidence. With carefully designed collections, Zica Bella is shaping the future of Indian streetwear by blending comfort, luxury, and bold design language.
              </p>

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
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

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
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

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
                What Makes Zica Bella One of the Best Streetwear Brands in India?
              </h3>
              <p>
                Zica Bella stands out by merging luxury streetwear aesthetics with contemporary design philosophy.
              </p>
              <p className="font-medium text-white/60">
                Our collections feature:
              </p>
              <ul className="pl-0 space-y-0.5 list-none">
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

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
                Explore Zica Bella’s Premium Streetwear Collection
              </h3>
              <p>
                At Zica Bella, we combine global street fashion inspiration with modern Indian design sensibilities.
              </p>
              <p>
                Streetwear is more than clothing — it is self-expression. Every piece in our collection helps individuals showcase their unique identity.
              </p>

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
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

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
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

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
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

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
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

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
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

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
                Unisex Cargo Pants and Shorts – Function Meets Fashion
              </h3>
              <p>
                Zica Bella’s bottomwear collection focuses on utility, comfort, and modern streetwear style.
              </p>
              <p className="font-medium text-white/60">
                Our range includes:
              </p>
              <ul className="pl-0 space-y-0.5 list-none">
                <li>Premium cargo pants</li>
                <li>Relaxed streetwear shorts</li>
                <li>Designer denim</li>
                <li>Modern streetwear trousers</li>
              </ul>
              <p>
                Each piece is designed for versatility, allowing you to style it for casual days, streetwear outfits, or modern fashion looks.
              </p>

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
                Latest Colour Trends in Streetwear Fashion
              </h3>
              <p>
                <strong>Black T-Shirts</strong> – The Icon of Streetwear. Zica Bella’s black T-shirts represent bold minimalism and timeless street style.
              </p>
              <p>
                <strong>White T-Shirts</strong> – Clean and Versatile. Our white T-shirts bring a fresh and modern aesthetic to everyday streetwear.
              </p>
              <p>
                <strong>Blue T-Shirts</strong> – Cool and Effortless. From soft tones to bold shades, Zica Bella blue T-shirts create a relaxed yet confident vibe.
              </p>
              <p>
                <strong>Red T-Shirts</strong> – Bold and Expressive. Red T-shirts in the Zica Bella collection bring energy and attention to any outfit.
              </p>
              <p>
                <strong>Black Hoodies</strong> – The Streetwear Foundation. Zica Bella black hoodies represent the essence of modern streetwear.
              </p>

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
                Streetwear Clothing for Every Season by Zica Bella
              </h3>
              <p>
                <strong>Winter Collection</strong> – Warm Streetwear Energy. Layered silhouettes, cozy fabrics, and bold outerwear pieces.
              </p>
              <p>
                <strong>Spring Collection</strong> – Fresh Fits. Breathable fabrics, relaxed silhouettes, and lightweight layering.
              </p>
              <p>
                <strong>Summer Collection</strong> – Lightweight Streetwear. Graphic T-shirts, oversized fits, and breathable fabrics.
              </p>
              <p>
                <strong>Autumn Collection</strong> – Transitional Street Style. Earthy tones and layered designs.
              </p>

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
                Why Zica Bella is Becoming a Leading Streetwear Brand in India
              </h3>
              <p>
                Zica Bella represents a new wave of premium streetwear fashion in India.
              </p>
              <p className="font-medium text-white/60">
                Our collections stand out because of:
              </p>
              <ul className="pl-0 space-y-0.5 list-none">
                <li><strong>Unique Designs:</strong> In-house graphics and distinctive aesthetics.</li>
                <li><strong>Premium Quality:</strong> High-quality fabrics for durability.</li>
                <li><strong>Unisex Fashion:</strong> Designed for everyone, promoting inclusivity.</li>
                <li><strong>Trendsetting Streetwear:</strong> Setting new trends in urban culture.</li>
              </ul>

              <h3 className="text-white font-semibold mt-4 text-[8px] tracking-[0.1em] mb-1 uppercase">
                Final Thoughts: Zica Bella and the Future of Indian Streetwear
              </h3>
              <p>
                Zica Bella is redefining modern streetwear in India by combining premium quality, bold design, and unisex fashion philosophy. From oversized graphic T-shirts to premium hoodies and statement streetwear pieces.
              </p>

              <div className="pt-4 border-t border-white/5 space-y-2">
                <h3 className="text-white font-bold text-[9px] tracking-[0.3em] uppercase">
                  FAQs
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-white font-medium uppercase tracking-[0.05em]">Is Zica Bella an Indian brand?</p>
                    <p>Yes, Zica Bella is an emerging Indian streetwear brand focused on premium unisex fashion.</p>
                  </div>
                  <div>
                    <p className="text-white font-medium uppercase tracking-[0.05em]">Comparison to other brands?</p>
                    <p>Zica Bella stands out through premium fabrics, bold designs, and oversized silhouettes.</p>
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
          className="w-full py-3 flex items-center justify-center gap-2 border-t border-white/5 hover:bg-white/[0.02] transition-colors group"
        >
          <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-white/40 group-hover:text-white transition-colors">
            {isExpanded ? "Read Less" : "Read More"}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-2.5 h-2.5 text-white/40 group-hover:text-white transition-colors" />
          ) : (
            <ChevronDown className="w-2.5 h-2.5 text-white/40 group-hover:text-white transition-colors" />
          )}
        </button>
      </div>

      {/* Popular Searches */}
      <div className="mt-8 px-4 space-y-4">
        <h4 className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/80 text-center">
          Popular searches
        </h4>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/collections" className="text-[7px] uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors font-medium">
            Shop by category
          </Link>
          <Link href="/collections" className="text-[7px] uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors font-medium">
            Shop by style
          </Link>
          <Link href="/collections" className="text-[7px] uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors font-medium">
            Shop by color
          </Link>
        </div>
      </div>
    </section>
  );
}

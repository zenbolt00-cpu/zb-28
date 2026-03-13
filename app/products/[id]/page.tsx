import { fetchProductByHandle, fetchProducts, resolveShopifyGid, ShopifyProduct, fetchCollections } from "@/lib/shopify-admin";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ShoppingBag, Heart, Share2 } from "lucide-react";
import prisma from "@/lib/db";
import ProductDetailsClient from "./ProductDetailsClient";

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const [product, shop, allProducts, collections] = await Promise.all([
    fetchProductByHandle(params.id).catch(() => null),
    prisma.shop.findFirst().catch(() => null),
    fetchProducts(8).catch(() => []),
    fetchCollections().catch(() => [])
  ]);

  const recommendedProducts = allProducts.filter((p: ShopifyProduct) => p.id.toString() !== params.id);

  // Resolve metafield GIDs to URLs
  if (product?.metafields) {
    for (const meta of product.metafields) {
      if (meta.value && typeof meta.value === 'string' && meta.value.startsWith('gid://shopify/')) {
        const resolvedUrl = await resolveShopifyGid(meta.value);
        if (resolvedUrl) {
          meta.value = resolvedUrl;
        }
      }
    }
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/" className="px-6 py-3 bg-foreground text-background font-bold rounded-xl">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [{ src: "/placeholder.png" }];
  const initialPrice = product.variants?.[0]?.price || "0.00";
  const comparePrice = product.variants?.[0]?.compare_at_price;

  return (
    <>
      <ProductDetailsClient 
        product={product} 
        shopSettings={shop as any} 
        recommendedProducts={recommendedProducts}
        allImages={images}
      />
    </>
  );
}

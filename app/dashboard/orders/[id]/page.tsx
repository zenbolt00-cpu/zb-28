"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  MapPin,
  Mail,
  Phone,
  Tag,
} from "lucide-react";

interface LineItem {
  id: number;
  title: string;
  name?: string;
  quantity: number;
  price: string;
  sku: string | null;
  variant_title?: string | null;
}

interface ShopifyOrderDetail {
  id: number;
  name: string;
  order_number: number;
  created_at: string;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  note: string | null;
  tags: string;
  email: string | null;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
  line_items: LineItem[];
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string | null;
  };
  billing_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<ShopifyOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/shopify/orders/${id}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load order");
        }
        setOrder(data.order);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load order";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-300 hover:text-white mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <div className="glass-card rounded-2xl p-6 text-red-400 text-sm">
          {error || "Order not found"}
        </div>
      </div>
    );
  }

  const customerName = order.customer
    ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim()
    : "";

  const displayCustomerName = customerName || (order.customer ? "Name Redacted by Shopify" : "Anonymous");

  const tags = order.tags
    ? order.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center text-sm text-gray-300 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              Order {order.name}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Placed on{" "}
              {new Date(order.created_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-gray-100 capitalize">
            Payment: {order.financial_status || "pending"}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-gray-100 capitalize">
            Fulfillment: {order.fulfillment_status || "unfulfilled"}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-gray-100">
            Total: ₹{parseFloat(order.total_price).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer & tags */}
        <div className="glass-card rounded-2xl p-5 space-y-3 lg:col-span-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Customer
          </p>
          <p className="text-sm font-semibold text-white">{displayCustomerName}</p>
          <div className="space-y-1 text-xs text-gray-300">
            {order.customer?.email && (
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {order.customer.email}
              </p>
            )}
            {order.customer?.phone && (
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {order.customer.phone}
              </p>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] text-gray-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {order.note && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Note
              </p>
              <p className="text-xs text-gray-200 mt-1">{order.note}</p>
            </div>
          )}
        </div>

        {/* Addresses */}
        <div className="space-y-4 lg:col-span-2">
          {order.shipping_address && (
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Shipping Address
              </p>
              <address className="not-italic text-xs text-gray-200 space-y-0.5">
                {order.shipping_address.first_name || order.shipping_address.last_name ? (
                  <div className="font-medium text-white">
                    {order.shipping_address.first_name}{" "}
                    {order.shipping_address.last_name}
                  </div>
                ) : (
                  <div className="font-medium text-white/50 italic mb-1">Name Redacted</div>
                )}
                {order.shipping_address.address1 ? (
                  <div>{order.shipping_address.address1}</div>
                ) : (
                  <div className="text-white/50 italic mb-1">Street Address Redacted</div>
                )}
                {order.shipping_address.address2 && (
                  <div>{order.shipping_address.address2}</div>
                )}
                <div>
                  {order.shipping_address.city},{" "}
                  {order.shipping_address.province}{" "}
                  {order.shipping_address.zip}
                </div>
                <div>{order.shipping_address.country}</div>
                {order.shipping_address.phone && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {order.shipping_address.phone}
                  </div>
                )}
              </address>
            </div>
          )}

          {order.billing_address && (
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Billing Address
              </p>
              <address className="not-italic text-xs text-gray-200 space-y-0.5">
                {order.billing_address.first_name || order.billing_address.last_name ? (
                   <div className="font-medium text-white">
                     {order.billing_address.first_name}{" "}
                     {order.billing_address.last_name}
                   </div>
                ) : (
                   <div className="font-medium text-white/50 italic mb-1">Name Redacted</div>
                )}
                {order.billing_address.address1 ? (
                   <div>{order.billing_address.address1}</div>
                ) : (
                   <div className="text-white/50 italic mb-1">Street Address Redacted</div>
                )}
                {order.billing_address.address2 && (
                  <div>{order.billing_address.address2}</div>
                )}
                <div>
                  {order.billing_address.city},{" "}
                  {order.billing_address.province} {order.billing_address.zip}
                </div>
                <div>{order.billing_address.country}</div>
              </address>
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Line items</h2>
          <p className="text-xs text-gray-400">
            {order.line_items.length} item
            {order.line_items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {order.line_items.map((item) => (
            <div
              key={item.id}
              className="px-5 py-3 flex items-center justify-between text-sm"
            >
              <div>
                <p className="text-white">{item.name || item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.variant_title && <span className="text-gray-300 font-medium mr-2">Size: {item.variant_title}</span>}
                  {item.sku && <>SKU: {item.sku} · </>}
                  Qty: {item.quantity}
                </p>
              </div>
              <div className="text-right text-gray-200">
                ₹
                {parseFloat(item.price).toLocaleString("en-IN")}{" "}
                <span className="text-xs text-gray-500">
                  ({order.currency})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


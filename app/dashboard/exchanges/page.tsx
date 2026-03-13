"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type ExchangeRequest = {
  id: string;
  order: { shopifyOrderId: string };
  originalProduct: { title: string };
  newProduct: { title: string };
  status: string;
  priceDifference: number;
};

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const res = await fetch("/api/admin/exchanges"); // Mock or to be built
        if (res.ok) {
          const data = await res.json();
          setExchanges(data.exchanges || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExchanges();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/exchanges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setExchanges(exchanges.map(e => e.id === id ? { ...e, status } : e));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Exchanges</h1>
          <p className="text-gray-400 text-sm">Review size or variant exchange requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : exchanges.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <ArrowLeftRight className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">No exchange requests</h3>
            <p className="text-gray-400 mt-2">Everything looks good.</p>
          </div>
        ) : (
          exchanges.map(req => (
            <div key={req.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">Order #{req.order.shopifyOrderId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    req.status === 'requested' ? 'bg-yellow-500/20 text-yellow-400' :
                    req.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                    req.status === 'payment_pending' ? 'bg-orange-500/20 text-orange-400' :
                    req.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {req.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm mt-3">
                  <div className="text-gray-400">
                    <span className="block text-xs uppercase mb-1">Original</span>
                    <span className="text-red-400 line-through decoration-red-900/50">{req.originalProduct.title}</span>
                  </div>
                  <ArrowLeftRight className="w-4 h-4 text-gray-600 mx-2" />
                  <div className="text-gray-400">
                    <span className="block text-xs uppercase mb-1">Requested</span>
                    <span className="text-green-400">{req.newProduct.title}</span>
                  </div>
                </div>
                
                {req.priceDifference > 0 && (
                  <p className="text-yellow-400 text-sm mt-3 flex items-center">
                    Payment required: ₹{req.priceDifference}
                  </p>
                )}
              </div>

              {req.status === 'requested' && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'rejected')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'approved')}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Exchange
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Undo2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type ReturnRequest = {
  id: string;
  order: { shopifyOrderId: string };
  customer: { name: string; email: string };
  product: { title: string };
  sku: string;
  reason: string;
  status: string;
  requestedAt: string;
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd have a GET /api/admin/returns, but since Next.js allows hybrid, 
    // we'll mock the fetch here and assume it exists, or just simulate it for layout purposes.
    // For this build, let's just make it a UI shell since the API `/api/admin/returns/[id]` exists.
    const fetchReturns = async () => {
      try {
        const res = await fetch("/api/admin/returns");
        if (res.ok) {
          const data = await res.json();
          setReturns(data.returns || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setReturns(returns.map(r => r.id === id ? { ...r, status } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Returns</h1>
          <p className="text-gray-400 text-sm">Review and manage customer return requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : returns.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Undo2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">No return requests</h3>
            <p className="text-gray-400 mt-2">You're all caught up!</p>
          </div>
        ) : (
          returns.map(req => (
            <div key={req.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">Order #{req.order.shopifyOrderId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    req.status === 'requested' ? 'bg-yellow-500/20 text-yellow-400' :
                    req.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                    req.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{req.product.title} (SKU: {req.sku || 'N/A'})</p>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <span className="font-medium text-gray-300">{req.customer?.name}</span> • 
                  <span>Reason: {req.reason}</span>
                </p>
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
                    <CheckCircle2 className="w-4 h-4" /> Approve Return
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

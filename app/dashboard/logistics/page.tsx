"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Truck,
  Loader2,
  Check,
  X,
  RefreshCw,
  Webhook,
  Key,
  Globe,
  Shield,
  Zap,
  Copy,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShipmentRecord {
  id: string;
  orderId: string;
  trackingNumber: string | null;
  courier: string | null;
  status: string;
  currentLocation: string | null;
  estimatedDelivery: string | null;
  trackingUrl: string | null;
  createdAt: string;
}

interface LogisticsInfo {
  activeProvider: string;
  baseUrl: string;
  webhookUrl: string;
  webhookSecret: string;
  recentShipments: ShipmentRecord[];
}

const PROVIDERS = [
  { value: "shiprocket", label: "Shiprocket", icon: "🚚" },
  { value: "delhivery", label: "Delhivery", icon: "📦" },
  { value: "bluedart", label: "Blue Dart", icon: "✈️" },
  { value: "fedex", label: "FedEx", icon: "🌍" },
  { value: "custom", label: "Custom Provider", icon: "⚙️" },
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  packed: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  shipped: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  in_transit: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  out_for_delivery: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  delivered: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  cancelled: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  label_created: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  rto: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  failed: "text-rose-500 bg-rose-500/10 border-rose-500/20",
};

export default function LogisticsPage() {
  const [info, setInfo] = useState<LogisticsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Test connection states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Track lookup
  const [trackInput, setTrackInput] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logistics");
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/logistics?action=test");
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, message: "Test request failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleTrackLookup = async () => {
    if (!trackInput.trim()) return;
    setTrackLoading(true);
    setTrackResult(null);
    try {
      const res = await fetch(`/api/admin/logistics?track=${encodeURIComponent(trackInput.trim())}`);
      const data = await res.json();
      setTrackResult(data.tracking);
    } catch (err) {
      console.error(err);
    } finally {
      setTrackLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/40">Loading Logistics...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-20 relative z-10 max-w-5xl mx-auto"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-8 left-1/2 z-50 bg-background border border-foreground/[0.05] rounded-md px-4 py-2 text-[10px] font-medium text-foreground shadow-sm flex items-center gap-2 uppercase tracking-wide"
          >
            <Check className="w-3 h-3 text-green-500" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Logistics</h1>
          <p className="text-[11px] text-foreground/50 tracking-wide max-w-xl">
            Connect logistics partners, track shipments, and manage delivery webhooks.
          </p>
        </div>
        <button
          onClick={fetchInfo}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-md text-[10px] font-medium uppercase tracking-[0.15em] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Connection Status Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-foreground/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${info?.activeProvider !== 'none' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              <Truck className={`w-5 h-5 ${info?.activeProvider !== 'none' ? 'text-emerald-500' : 'text-amber-500'}`} />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-foreground uppercase tracking-widest">Active Provider</h3>
              <p className="text-[10px] text-foreground/50 uppercase tracking-widest mt-0.5">
                {info?.activeProvider !== 'none' ? PROVIDERS.find(p => p.value === info?.activeProvider)?.label || info?.activeProvider : 'Not configured'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-[9px] font-bold uppercase tracking-widest text-foreground/60 hover:bg-foreground/10 transition-all active:scale-95 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Test Connection
          </button>
        </div>

        {/* Test result */}
        <AnimatePresence>
          {testResult && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`px-6 py-4 flex items-center gap-3 border-b border-foreground/5 ${testResult.success ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <p className={`text-[10px] font-medium ${testResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {testResult.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Provider details */}
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[8px] font-bold uppercase tracking-[0.3em] text-foreground/30 mb-2">API Base URL</label>
            <div className="flex items-center gap-2 bg-foreground/[0.02] border border-foreground/5 rounded-lg px-4 py-2.5">
              <Globe className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
              <span className="text-[11px] font-mono text-foreground/60 truncate">{info?.baseUrl || 'Not configured'}</span>
            </div>
          </div>
          <div>
            <label className="block text-[8px] font-bold uppercase tracking-[0.3em] text-foreground/30 mb-2">Webhook Secret</label>
            <div className="flex items-center gap-2 bg-foreground/[0.02] border border-foreground/5 rounded-lg px-4 py-2.5">
              <Shield className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
              <span className="text-[11px] font-mono text-foreground/60">{info?.webhookSecret}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Webhook URL Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Webhook className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-widest">Webhook Endpoint</h3>
            <p className="text-[9px] text-foreground/40 mt-0.5">Provide this URL to your logistics partner for tracking updates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-foreground/[0.02] border border-foreground/5 rounded-lg px-4 py-3">
            <span className="text-[11px] font-mono text-foreground/70 break-all">{info?.webhookUrl || 'Loading...'}</span>
          </div>
          <button
            onClick={() => copyToClipboard(info?.webhookUrl || '')}
            className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg hover:bg-foreground/10 transition-colors active:scale-95 shrink-0"
          >
            <Copy className="w-4 h-4 text-foreground/50" />
          </button>
        </div>

        <div className="mt-3 bg-amber-500/5 border border-amber-500/10 rounded-lg px-4 py-2.5 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-amber-600 dark:text-amber-400">
            Set the webhook signature header to <code className="bg-foreground/5 px-1 py-0.5 rounded text-[8px]">x-webhook-signature</code> with HMAC SHA256 of the payload using your webhook secret.
          </p>
        </div>
      </motion.div>

      {/* Track Shipment Lookup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-widest mb-4">Track Shipment</h3>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-foreground/[0.02] border border-foreground/5 focus:border-foreground/20 rounded-lg px-4 py-2.5 text-[11px] font-mono text-foreground placeholder:text-foreground/30 outline-none transition-colors"
            placeholder="Enter tracking number..."
            value={trackInput}
            onChange={(e) => setTrackInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrackLookup()}
          />
          <button
            onClick={handleTrackLookup}
            disabled={trackLoading || !trackInput.trim()}
            className="px-4 py-2.5 bg-foreground text-background rounded-lg text-[9px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-95"
          >
            {trackLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Track"}
          </button>
        </div>

        {/* Track result */}
        <AnimatePresence>
          {trackResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 bg-foreground/[0.02] border border-foreground/5 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${STATUS_COLORS[trackResult.status] || 'text-foreground/50 bg-foreground/5 border-foreground/10'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_COLORS[trackResult.status] || '').includes('text-') ? STATUS_COLORS[trackResult.status].split(' ')[0].replace('text-', 'bg-') : 'bg-foreground/20'}`} />
                    {trackResult.status}
                  </span>
                  {trackResult.location && (
                    <span className="text-[10px] text-foreground/50 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {trackResult.location}
                    </span>
                  )}
                </div>
                {trackResult.trackingUrl && (
                  <a href={trackResult.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 flex items-center gap-1 hover:underline">
                    Track Online <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {trackResult.estimatedDelivery && (
                <div className="flex items-center gap-2 text-[10px] text-foreground/50">
                  <Clock className="w-3 h-3" />
                  Est. Delivery: {new Date(trackResult.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}

              {/* Events timeline */}
              {trackResult.events?.length > 0 && (
                <div className="space-y-0">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 mb-3">Tracking Events</h4>
                  {trackResult.events.map((event: any, i: number) => (
                    <div key={i} className="flex gap-3 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${i === trackResult.events.length - 1 ? 'bg-emerald-500' : 'bg-foreground/20'} z-10`} />
                        {i < trackResult.events.length - 1 && <div className="w-px flex-1 bg-foreground/10" />}
                      </div>
                      <div className="pb-4 -mt-0.5">
                        <p className="text-[10px] font-medium text-foreground">{event.description || event.status}</p>
                        <p className="text-[9px] text-foreground/40 mt-0.5">
                          {event.location && `${event.location} · `}
                          {new Date(event.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recent Shipments */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-foreground/5 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-widest">Recent Shipments</h3>
          <span className="text-[9px] text-foreground/30 uppercase tracking-widest">{info?.recentShipments?.length || 0} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-foreground/[0.01] border-b border-foreground/5">
              <tr>
                <th className="px-5 py-3 text-[8px] font-semibold text-foreground/40 uppercase tracking-widest">Order</th>
                <th className="px-5 py-3 text-[8px] font-semibold text-foreground/40 uppercase tracking-widest">Tracking #</th>
                <th className="px-5 py-3 text-[8px] font-semibold text-foreground/40 uppercase tracking-widest">Courier</th>
                <th className="px-5 py-3 text-[8px] font-semibold text-foreground/40 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3 text-[8px] font-semibold text-foreground/40 uppercase tracking-widest">Location</th>
                <th className="px-5 py-3 text-[8px] font-semibold text-foreground/40 uppercase tracking-widest text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.03]">
              {(!info?.recentShipments || info.recentShipments.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Package className="w-8 h-8 text-foreground/10 mx-auto mb-3" />
                    <p className="text-[10px] text-foreground/30 uppercase tracking-widest">No shipments yet</p>
                  </td>
                </tr>
              ) : (
                info.recentShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-foreground/[0.01] transition-all">
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-semibold text-foreground">#{shipment.orderId}</span>
                    </td>
                    <td className="px-5 py-3">
                      {shipment.trackingNumber ? (
                        <button
                          onClick={() => { setTrackInput(shipment.trackingNumber!); handleTrackLookup(); }}
                          className="text-[10px] font-mono text-blue-500 hover:underline"
                        >
                          {shipment.trackingNumber}
                        </button>
                      ) : (
                        <span className="text-[10px] text-foreground/20">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] text-foreground/60">{shipment.courier || '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${STATUS_COLORS[shipment.status] || 'text-foreground/40 bg-foreground/5 border-foreground/10'}`}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] text-foreground/50">{shipment.currentLocation || '—'}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[10px] text-foreground/40">
                        {new Date(shipment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Provider Configuration Note */}
      <div className="text-center pt-4">
        <p className="text-[9px] text-foreground/30 uppercase tracking-widest">
          Configure API keys in{" "}
          <a href="/dashboard/settings" className="text-foreground/50 hover:text-foreground underline decoration-foreground/20">
            Settings → Logistics Services
          </a>
        </p>
      </div>
    </motion.div>
  );
}

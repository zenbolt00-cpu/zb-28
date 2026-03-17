"use client";

import { useState, useEffect } from "react";
import { Search, Download, Filter, FileText, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

type ScanRecord = {
  id: string;
  productId: string;
  productTitle: string;
  sku: string;
  barcode: string;
  actionType: string;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  staffName: string;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  STOCK_IN: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ORDER_OUT: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  RETURN: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  EXCHANGE: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  RTO: "bg-red-500/10 text-red-500 border-red-500/20",
  AUDIT: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export default function ScannerRecordsPage() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const fetchRecords = async (page = 1, search = searchTerm, action = filterAction) => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/scanner-records", window.location.origin);
      url.searchParams.set("page", page.toString());
      if (search) url.searchParams.set("search", search);
      if (action !== "ALL") url.searchParams.set("actionType", action);

      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (data.records) {
        setRecords(data.records);
        setPagination({ page, total: data.total, pages: data.pages });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRecords(1, searchTerm, filterAction);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterAction]);

  const exportCSV = () => {
    if (!records.length) return;
    
    const headers = ["ID", "Date", "Action", "SKU", "Barcode", "Product", "Qty", "Before Stock", "After Stock", "Staff"];
    const csvContent = [
      headers.join(","),
      ...records.map(r => [
        r.id,
        new Date(r.createdAt).toLocaleString(),
        r.actionType,
        r.sku || "",
        `"${r.barcode || ""}"`, // quote barcodes to prevent Excel treating as scientific
        `"${(r.productTitle || "").replace(/"/g, '""')}"`,
        r.quantity,
        r.beforeStock ?? "",
        r.afterStock ?? "",
        r.staffName || "Admin"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `scanner_records_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scanner Audit Log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete history of all warehouse scanning operations.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!records.length}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4 border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by SKU, Barcode, Staff, or Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-background rounded-lg border border-input text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-background rounded-lg border border-input text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="ALL">All Actions</option>
            <option value="STOCK_IN">Stock In</option>
            <option value="ORDER_OUT">Order Out</option>
            <option value="RETURN">Return</option>
            <option value="EXCHANGE">Exchange</option>
            <option value="RTO">RTO</option>
            <option value="AUDIT">Audit</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl whitespace-nowrap">Time & Staff</th>
                <th className="px-6 py-4 whitespace-nowrap">Action</th>
                <th className="px-6 py-4 whitespace-nowrap">Product Details</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Change</th>
                <th className="px-6 py-4 text-right rounded-tr-xl whitespace-nowrap">Stock Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    No scan records found matching your criteria.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">
                        {format(new Date(record.createdAt), "MMM d, yyyy h:mm a")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {record.staffName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border ${ACTION_COLORS[record.actionType] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                        {record.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 min-w-[250px]">
                      <div className="font-semibold text-foreground truncate max-w-[300px]">
                        {record.productTitle || "Unknown Product"}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
                        <span className="bg-muted px-1.5 py-0.5 rounded">{record.sku || "NO SKU"}</span>
                        <span>•</span>
                        <span>{record.barcode || "NO BARCODE"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-mono">
                      <div className={`font-bold ${record.quantity > 0 && record.actionType !== 'ORDER_OUT' ? 'text-emerald-500' : record.actionType === 'ORDER_OUT' ? 'text-red-500' : 'text-foreground/50'}`}>
                        {record.actionType === 'ORDER_OUT' ? '-' : record.quantity > 0 && record.actionType !== 'AUDIT' ? '+' : ''}{record.quantity || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {record.beforeStock != null && record.afterStock != null && record.actionType !== 'AUDIT' ? (
                        <div className="flex items-center justify-end gap-2 text-xs font-mono">
                          <span className="text-muted-foreground line-through decoration-muted-foreground/50">{record.beforeStock}</span>
                          <span className="text-muted-foreground/50">→</span>
                          <span className="font-bold text-foreground">{record.afterStock}</span>
                        </div>
                      ) : record.afterStock != null ? (
                         <div className="text-sm font-mono font-bold text-foreground">{record.afterStock}</div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{records.length}</span> of <span className="font-medium text-foreground">{pagination.total}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchRecords(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors font-medium"
            >
              Previous
            </button>
            <span className="px-2">Page {pagination.page} of {pagination.pages}</span>
            <button 
              onClick={() => fetchRecords(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

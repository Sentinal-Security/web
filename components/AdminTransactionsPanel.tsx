"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BillingTransactionRecord, fetchBillingTransactions } from "@/lib/api";
import { exportCsvRows } from "@/lib/csvExport";

interface AdminTransactionsPanelProps {
  adminId?: number;
  company?: string;
}

export function AdminTransactionsPanel({ adminId, company }: AdminTransactionsPanelProps) {
  const [transactions, setTransactions] = useState<BillingTransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<BillingTransactionRecord | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!adminId && !company) return;
    setLoading(true);
    setError(null);
    const res = await fetchBillingTransactions(adminId, company);
    setLoading(false);
    if (res.success && Array.isArray(res.data)) {
      setTransactions(res.data);
    } else {
      setError(res.message || "Failed to load transaction records.");
    }
  }, [adminId, company]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (tierFilter !== "ALL" && tx.tier.toUpperCase() !== tierFilter) {
        return false;
      }
      if (!q) return true;
      return (
        tx.invoiceNumber.toLowerCase().includes(q) ||
        tx.orderId.toLowerCase().includes(q) ||
        tx.adminEmail.toLowerCase().includes(q) ||
        tx.tier.toLowerCase().includes(q) ||
        tx.billingCycle.toLowerCase().includes(q) ||
        tx.paymentMethod.toLowerCase().includes(q) ||
        tx.status.toLowerCase().includes(q)
      );
    });
  }, [transactions, searchQuery, tierFilter]);

  const totalSpend = useMemo(
    () => filteredTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0),
    [filteredTransactions]
  );

  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) return;
    const headers = [
      "Date",
      "Invoice Number",
      "Order ID",
      "Organization",
      "Admin Email",
      "Subscription Tier",
      "Billing Cycle",
      "Amount",
      "Currency",
      "Payment Method",
      "Status",
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.createdAt,
      tx.invoiceNumber,
      tx.orderId,
      tx.company,
      tx.adminEmail,
      tx.tier,
      tx.billingCycle,
      tx.amount.toFixed(2),
      tx.currency,
      tx.paymentMethod,
      tx.status,
    ]);
    const dateStr = new Date().toISOString().slice(0, 10);
    exportCsvRows(`sentinel-transactions-${dateStr}.csv`, headers, rows);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getTierBadgeClass = (tier: string) => {
    switch (tier.toUpperCase()) {
      case "ENTERPRISE":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      case "PROFESSIONAL":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className={selectedInvoice ? "no-print space-y-6" : "space-y-6 printable-area"}>
        {/* Print-Only Report Header */}
        <div className="print-only pb-4 border-b border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-extrabold tracking-wider">SENTINEL SECURITY INC.</h1>
              <p className="text-xs font-mono">Admin Billing &amp; Subscription Transaction Ledger</p>
              <p className="text-xs font-mono">Tax ID: US-EIN-94-382910</p>
            </div>
            <div className="text-right text-xs font-mono">
              <p>Organization: {(company || "N/A").toUpperCase()}</p>
              <p>Records Shown: {filteredTransactions.length}</p>
              <p>Total Billed: ${totalSpend.toFixed(2)} USD</p>
            </div>
          </div>
        </div>

        {/* Header & Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#070b16] border border-cyan-500/15 no-print">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Admin Transaction Records</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {filteredTransactions.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Subscription invoices, PayPal sandbox captures, and printable tax receipts for your organization.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadTransactions}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
            >
              <svg className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/30 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Ledger / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
          <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recorded Transactions</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-cyan-400">{filteredTransactions.length}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                Billing Ledger
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Billed (Filtered)</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-emerald-400">${totalSpend.toFixed(2)}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                USD
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Latest Subscription Tier</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-lg font-bold text-white font-mono">
                {transactions[0]?.tier || "COMMUNITY"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                {(company || "Organization").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#070b16] border border-cyan-500/15 no-print">
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by invoice number, order ID, admin email, or tier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2 rounded-xl bg-slate-950/80 border border-white/10 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/5 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">Tier:</span>
            {["ALL", "COMMUNITY", "PROFESSIONAL", "ENTERPRISE"].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tierFilter === tier
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-900/60 text-slate-400 hover:text-white border border-transparent hover:border-white/10"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs no-print">
            {error}
          </div>
        )}

        {/* Transaction Records Table */}
        <div className="rounded-2xl bg-[#070b16] border border-cyan-500/15 overflow-hidden">
          {loading && transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400">Loading billing transaction records...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-14 text-center">
              <h3 className="text-sm font-bold text-white mb-1">No Transaction Records Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Subscription upgrades and billing captures processed from the Pricing &amp; Plans page will appear here with printable official tax invoices.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/60 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Admin</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right no-print">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {tx.createdAt}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300 whitespace-nowrap">
                        {tx.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        {tx.orderId}
                      </td>
                      <td className="py-3 px-4 text-white whitespace-nowrap">
                        {tx.adminEmail}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getTierBadgeClass(tx.tier)}`}>
                          {tx.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        {tx.billingCycle}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        ${Number(tx.amount).toFixed(2)} {tx.currency}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap no-print">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(tx)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                        >
                          View / Print Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Printable Official Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 printable-modal-backdrop">
          <div className="w-full max-w-lg rounded-2xl bg-[#070b16] border border-cyan-500/30 p-6 space-y-5 shadow-2xl printable-area">
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <span className="font-extrabold text-white text-sm tracking-wider block">SENTINEL SECURITY INC.</span>
                <p className="text-[11px] text-slate-400 font-mono">Tax ID: US-EIN-94-382910</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase mt-1">Official Tax Invoice / Transaction Receipt</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Invoice Number</span>
                <span className="text-cyan-300 font-mono font-bold text-sm">{selectedInvoice.invoiceNumber}</span>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Transaction Date:</span>
                <span className="text-white">{selectedInvoice.createdAt}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="text-white">{selectedInvoice.paymentMethod} ({selectedInvoice.orderId})</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Subscription Tier:</span>
                <span className="text-white font-bold">{selectedInvoice.tier}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Billing Cycle:</span>
                <span className="text-slate-300">{selectedInvoice.billingCycle}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Billed Organization:</span>
                <span className="text-white uppercase">{selectedInvoice.company}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Authorized Admin:</span>
                <span className="text-slate-300">{selectedInvoice.adminEmail}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{selectedInvoice.status}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Tax / VAT:</span>
                <span className="text-slate-300">$0.00 USD (0% Reverse Charge)</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between text-sm font-bold">
                <span className="text-white">Total Amount Paid:</span>
                <span className="text-emerald-400 font-extrabold">
                  ${Number(selectedInvoice.amount).toFixed(2)} {selectedInvoice.currency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

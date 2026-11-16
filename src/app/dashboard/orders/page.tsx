"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { formatPKR } from "@/lib/utils";

interface OrderItem {
  _id: string;
  tableNumber: number;
  customerId?: { name?: string; email?: string } | null;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  paymentStatus?: "unpaid" | "bill_requested" | "paid";
  createdAt: string;
}

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Orders load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (orderId: string, tableNumber: number, total: number) => {
    if (!confirm(`Table ${tableNumber} ka Rs. ${total} bill Paid mark karein?`)) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "cash" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Payment marked as paid!");
        fetchOrders();
      } else {
        alert(data.message || "Failed to mark paid");
      }
    } catch {
      alert("Error marking order paid");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && o.paymentStatus === "paid") ||
      (paymentFilter === "unpaid" && (!o.paymentStatus || o.paymentStatus === "unpaid")) ||
      (paymentFilter === "bill_requested" && o.paymentStatus === "bill_requested");
    return matchesStatus && matchesPayment;
  });

  return (
    <OwnerLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Dining Order Log</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Historical ledger of all table orders, dishes cooked, and cash settlement.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl text-xs font-bold">
              {[
                { id: "all", label: "All Bills" },
                { id: "unpaid", label: "Unpaid" },
                { id: "bill_requested", label: "Requested" },
                { id: "paid", label: "Paid" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaymentFilter(p.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    paymentFilter === p.id
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Kitchen Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
              {["all", "received", "preparing", "ready", "served"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    statusFilter === st
                      ? "bg-surface-container-high text-on-surface shadow-xs border border-outline-variant/40"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-medium">Loading orders log...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
              receipt_long
            </span>
            <p className="font-bold text-sm text-on-surface">No orders found in this filter.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="py-3.5 px-4">Order &amp; Table</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Dishes</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Kitchen</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs">
                  {filteredOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-on-surface">Table {ord.tableNumber}</span>
                        <p className="text-[10px] font-mono text-on-surface-variant">
                          #{ord._id.slice(-6).toUpperCase()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {ord.customerId ? (
                          <div>
                            <p className="font-bold text-on-surface">{ord.customerId.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-mono">
                              {ord.customerId.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/70 italic">Guest Diner</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="max-w-xs space-y-0.5">
                          {ord.items.map((it, idx) => (
                            <span key={idx} className="block text-[11px] text-on-surface">
                              {it.quantity}x {it.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-primary">
                        {formatPKR(ord.total)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            ord.status === "served"
                              ? "bg-emerald-100 text-emerald-900"
                              : ord.status === "ready"
                              ? "bg-blue-100 text-blue-900"
                              : ord.status === "preparing"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-surface-container text-on-surface"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              ord.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : ord.paymentStatus === "bill_requested"
                                ? "bg-amber-100 text-amber-900 animate-pulse"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {ord.paymentStatus === "paid"
                              ? "Paid (Cash)"
                              : ord.paymentStatus === "bill_requested"
                              ? "Bill Requested"
                              : "Unpaid"}
                          </span>
                          {ord.paymentStatus !== "paid" && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(ord._id, ord.tableNumber, ord.total)}
                              className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                            >
                              <span>Mark Paid</span>
                              <span className="material-symbols-outlined text-[11px]">done</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-on-surface-variant text-[11px]">
                        {new Date(ord.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}

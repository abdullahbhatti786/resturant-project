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
  createdAt: string;
}

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

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

  const filteredOrders =
    statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <OwnerLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Dining Order Log</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Historical ledger of all table orders, dishes cooked, and revenue generated.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
            {["all", "received", "preparing", "ready", "served"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  statusFilter === st
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {st}
              </button>
            ))}
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
                    <th className="py-3.5 px-5">Order ID & Table</th>
                    <th className="py-3.5 px-5">Customer</th>
                    <th className="py-3.5 px-5">Dishes Ordered</th>
                    <th className="py-3.5 px-5">Total Amount</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs">
                  {filteredOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-on-surface">Table {ord.tableNumber}</span>
                        <p className="text-[10px] font-mono text-on-surface-variant">
                          #{ord._id.slice(-6).toUpperCase()}
                        </p>
                      </td>
                      <td className="py-4 px-5">
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
                      <td className="py-4 px-5">
                        <div className="max-w-xs space-y-0.5">
                          {ord.items.map((it, idx) => (
                            <span key={idx} className="block text-[11px] text-on-surface">
                              {it.quantity}x {it.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-extrabold text-primary">
                        {formatPKR(ord.total)}
                      </td>
                      <td className="py-4 px-5">
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
                      <td className="py-4 px-5 text-right font-mono text-on-surface-variant text-[11px]">
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

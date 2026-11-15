"use client";

import React, { useState, useEffect, useCallback } from "react";
import StaffLayout from "@/components/layouts/StaffLayout";
import { useRouter } from "next/navigation";
import { formatPKR } from "@/lib/utils";

interface KDSOrder {
  _id: string;
  tableNumber: number;
  items: Array<{ name: string; quantity: number; specialInstructions?: string }>;
  total: number;
  status: "received" | "preparing" | "ready";
  createdAt: string;
}

interface MenuItemStock {
  _id: string;
  name: string;
  price: number;
  available: boolean;
}

export default function KitchenKDSPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [now, setNow] = useState(Date.now());

  // 86'd Stock Modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockItems, setStockItems] = useState<MenuItemStock[]>([]);
  const [stockSearch, setStockSearch] = useState("");
  const [loadingStock, setLoadingStock] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success && data.orders) {
        // Only active KDS orders (not yet served)
        const active = data.orders.filter(
          (o: KDSOrder) => o.status === "received" || o.status === "preparing" || o.status === "ready"
        );
        setOrders(active);
      }
    } catch (err) {
      console.error("KDS orders fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const isAllowed =
          data.authenticated &&
          (data.user?.role === "kitchen" ||
            data.user?.role === "owner" ||
            data.activeRoles?.kitchen ||
            data.activeRoles?.owner);

        if (!isAllowed) {
          router.push("/login");
        } else {
          setLoading(false);
          fetchOrders();
        }
      })
      .catch(() => router.push("/login"));

    // Ticker for timers every 1s
    const timerInterval = setInterval(() => setNow(Date.now()), 1000);

    // SSE connection with fallback polling
    let sse: EventSource | null = null;
    try {
      sse = new EventSource("/api/sse/kitchen?channel=kitchen");
      sse.addEventListener("order:new", () => fetchOrders());
      sse.addEventListener("order:status", () => fetchOrders());
    } catch {
      // fallback
    }

    const pollInterval = setInterval(fetchOrders, 4000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(pollInterval);
      if (sse) sse.close();
    };
  }, [router, fetchOrders]);

  const handleUpdateStatus = async (orderId: string, status: "preparing" | "ready") => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update order status");
      }
    } catch {
      alert("Error updating order");
    }
  };

  const openStockModal = async () => {
    setShowStockModal(true);
    setLoadingStock(true);
    try {
      const res = await fetch("/api/owner/menu");
      const data = await res.json();
      if (data.success) {
        setStockItems(data.items);
      }
    } catch {
      alert("Failed to load inventory");
    } finally {
      setLoadingStock(false);
    }
  };

  const toggleItemStock = async (itemId: string) => {
    // 1-Click Instant Optimistic Toggle
    let targetAvailable = true;
    setStockItems((prev) =>
      prev.map((it) => {
        if (it._id === itemId) {
          targetAvailable = !it.available;
          return { ...it, available: !it.available };
        }
        return it;
      })
    );

    try {
      const res = await fetch(`/api/owner/items/${itemId}/toggle`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Revert on failure
        setStockItems((prev) =>
          prev.map((it) => (it._id === itemId ? { ...it, available: !targetAvailable } : it))
        );
        alert(data.message || "Failed to update item availability");
      }
    } catch {
      // Revert on failure
      setStockItems((prev) =>
        prev.map((it) => (it._id === itemId ? { ...it, available: !targetAvailable } : it))
      );
      alert("Error toggling item availability");
    }
  };

  const formatElapsed = (createdAt: string) => {
    const elapsedSecs = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
    const mins = Math.floor(elapsedSecs / 60);
    const secs = elapsedSecs % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const getTimerColor = (createdAt: string) => {
    const elapsedMins = (now - new Date(createdAt).getTime()) / 60000;
    if (elapsedMins > 20) return "bg-rose-600 text-white animate-pulse";
    if (elapsedMins > 10) return "bg-amber-500 text-white";
    return "bg-emerald-600 text-white";
  };

  const receivedOrders = orders.filter((o) => o.status === "received");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  if (loading) {
    return (
      <StaffLayout roleTitle="Kitchen KDS" stationName="Station: Main Hot Line">
        <div className="flex-1 flex items-center justify-center p-8 text-on-surface-variant font-bold text-sm">
          Connecting to Kitchen Terminal...
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout roleTitle="Kitchen KDS" stationName="Station: Main Hot Line">
      <div className="flex-1 flex flex-col bg-surface-container-low p-4 lg:p-6 gap-4">
        {/* Overhead Action Dock */}
        <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-extrabold text-sm tracking-wide uppercase text-surface-bright">
              KDS Hot Line • Active Tickets ({orders.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openStockModal}
              className="px-3.5 py-1.5 rounded-xl bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5 hover:bg-surface-container-high transition-colors border border-outline-variant/40 shadow-xs"
            >
              <span className="material-symbols-outlined text-sm text-rose-600">remove_shopping_cart</span>
              <span>Sold Out / Stock Menu</span>
            </button>
          </div>
        </div>

        {/* 3-Column Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-start">
          {/* Column 1: Received */}
          <div className="flex flex-col gap-3 bg-surface-container/40 p-3 rounded-2xl border border-outline-variant/30 min-h-[500px]">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-extrabold text-xs text-on-surface uppercase tracking-wider">
                  New Orders ({receivedOrders.length})
                </h3>
              </div>
            </div>

            {receivedOrders.length === 0 ? (
              <p className="p-8 text-center text-xs text-on-surface-variant">No new orders</p>
            ) : (
              receivedOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary font-black text-xs">
                      Table {ord.tableNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getTimerColor(
                        ord.createdAt
                      )}`}
                    >
                      {formatElapsed(ord.createdAt)}
                    </span>
                  </div>

                  <div className="divide-y divide-outline-variant/20 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex items-start justify-between">
                        <span className="font-bold text-on-surface">
                          {it.quantity}x {it.name}
                        </span>
                        {it.specialInstructions && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded">
                            {it.specialInstructions}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(ord._id, "preparing")}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">skillet</span>
                    <span>Start Cooking</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Column 2: In Preparation */}
          <div className="flex flex-col gap-3 bg-surface-container/40 p-3 rounded-2xl border border-outline-variant/30 min-h-[500px]">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="font-extrabold text-xs text-on-surface uppercase tracking-wider">
                  Cooking in Wok ({preparingOrders.length})
                </h3>
              </div>
            </div>

            {preparingOrders.length === 0 ? (
              <p className="p-8 text-center text-xs text-on-surface-variant">No dishes cooking</p>
            ) : (
              preparingOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="bg-surface-container-lowest rounded-2xl p-4 border border-blue-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs">
                      Table {ord.tableNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getTimerColor(
                        ord.createdAt
                      )}`}
                    >
                      {formatElapsed(ord.createdAt)}
                    </span>
                  </div>

                  <div className="divide-y divide-outline-variant/20 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex items-start justify-between">
                        <span className="font-bold text-on-surface">
                          {it.quantity}x {it.name}
                        </span>
                        {it.specialInstructions && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded">
                            {it.specialInstructions}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(ord._id, "ready")}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">room_service</span>
                    <span>Ready for Pickup</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Column 3: Ready */}
          <div className="flex flex-col gap-3 bg-surface-container/40 p-3 rounded-2xl border border-outline-variant/30 min-h-[500px]">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-extrabold text-xs text-on-surface uppercase tracking-wider">
                  Ready at Counter ({readyOrders.length})
                </h3>
              </div>
            </div>

            {readyOrders.length === 0 ? (
              <p className="p-8 text-center text-xs text-on-surface-variant">Counter is clear</p>
            ) : (
              readyOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="bg-surface-container-lowest rounded-2xl p-4 border border-emerald-300 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-black text-xs">
                      Table {ord.tableNumber}
                    </span>
                    <span className="text-xs font-bold text-emerald-800">Captain Notified</span>
                  </div>

                  <div className="divide-y divide-outline-variant/20 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-on-surface">
                          {it.quantity}x {it.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-center text-on-surface-variant font-medium">
                    Waiting for floor captain delivery...
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sold Out & Stock Management Modal */}
        {showStockModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600">remove_shopping_cart</span>
                  <h3 className="font-bold text-base text-on-surface">Dish Stock &amp; Sold Out Status</h3>
                </div>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Search dish to mark sold out or available..."
                className="w-full mb-3 rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />

              <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/20 pr-1">
                {loadingStock ? (
                  <p className="p-4 text-center text-xs text-on-surface-variant">Loading dishes...</p>
                ) : (
                  stockItems
                    .filter((it) => it.name.toLowerCase().includes(stockSearch.toLowerCase()))
                    .map((item) => (
                      <div
                        key={item._id}
                        className="py-3 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-on-surface truncate">{item.name}</p>
                          <p className="text-[11px] text-primary font-medium">{formatPKR(item.price)}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              item.available
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {item.available ? "In Stock" : "Sold Out"}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleItemStock(item._id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1 ${
                              item.available
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {item.available ? "block" : "check_circle"}
                            </span>
                            <span>{item.available ? "Mark Sold Out" : "Mark Available"}</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}

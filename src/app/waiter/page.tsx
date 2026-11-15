"use client";

import React, { useState, useEffect, useCallback } from "react";
import StaffLayout from "@/components/layouts/StaffLayout";
import { useRouter } from "next/navigation";
import { formatPKR } from "@/lib/utils";

interface ServiceReq {
  _id: string;
  tableNumber: number;
  type: "water" | "bill" | "waiter" | "other";
  note: string;
  status: "submitted" | "acknowledged" | "in_progress" | "resolved";
  createdAt: string;
}

interface ReadyOrder {
  _id: string;
  tableNumber: number;
  items: Array<{ name: string; quantity: number; specialInstructions?: string }>;
  total: number;
  status: string;
  createdAt: string;
}

interface TableFloorItem {
  tableNumber: number;
  status: "vacant" | "occupied" | "request_pending" | "food_ready";
  order?: { id: string; status: string; total: number; itemCount: number } | null;
  requests?: Array<{ id: string; type: string; status: string }>;
}

export default function WaiterPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"requests" | "pickups" | "floor" | "voucher">("requests");
  const [loading, setLoading] = useState(true);

  const [requests, setRequests] = useState<ServiceReq[]>([]);
  const [pickups, setPickups] = useState<ReadyOrder[]>([]);
  const [floorTables, setFloorTables] = useState<TableFloorItem[]>([]);

  // Voucher tab state
  const [voucherCode, setVoucherCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [voucherResult, setVoucherResult] = useState<{
    id: string;
    code: string;
    description: string;
    customerName: string;
    customerEmailMasked: string;
    expiresAt: string;
  } | null>(null);
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; type: "success" | "error" } | null>(
    null
  );

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, pickRes, floorRes] = await Promise.all([
        fetch("/api/service-requests"),
        fetch("/api/orders?status=ready"),
        fetch("/api/floor"),
      ]);

      const reqData = await reqRes.json();
      if (reqData.success) setRequests(reqData.requests);

      const pickData = await pickRes.json();
      if (pickData.success) setPickups(pickData.orders);

      const floorData = await floorRes.json();
      if (floorData.success) setFloorTables(floorData.tables);
    } catch (err) {
      console.error("Waiter data load error:", err);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const isAllowed =
          data.authenticated &&
          (data.user?.role === "waiter" ||
            data.user?.role === "owner" ||
            data.activeRoles?.waiter ||
            data.activeRoles?.owner);

        if (!isAllowed) {
          router.push("/login");
        } else {
          setLoading(false);
          fetchData();
        }
      })
      .catch(() => router.push("/login"));

    // SSE connection with polling fallback
    let sse: EventSource | null = null;
    try {
      sse = new EventSource("/api/sse/kitchen?channel=waiter");
      sse.addEventListener("request:new", () => fetchData());
      sse.addEventListener("request:status", () => fetchData());
      sse.addEventListener("order:ready", () => fetchData());
      sse.addEventListener("order:status", () => fetchData());
    } catch {
      // fallback
    }

    const interval = setInterval(fetchData, 5000);

    return () => {
      clearInterval(interval);
      if (sse) sse.close();
    };
  }, [router, fetchData]);

  const handleUpdateReqStatus = async (
    reqId: string,
    newStatus: "acknowledged" | "in_progress" | "resolved"
  ) => {
    try {
      const res = await fetch(`/api/service-requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Req status update error:", err);
    }
  };

  const handleMarkServed = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "served" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.rewardCreated) {
          alert(
            `Order Served! 🎉 Customer completed their dining streak and earned a ${data.rewardCreated.description} voucher (Code: ${data.rewardCreated.code})!`
          );
        }
        fetchData();
      } else {
        alert(data.message || "Failed to mark order served");
      }
    } catch {
      alert("Error marking order served");
    }
  };

  const handleLookupVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setVerifying(true);
    setVoucherMsg(null);
    setVoucherResult(null);

    try {
      const res = await fetch("/api/rewards/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVoucherResult(data.voucher);
      } else {
        setVoucherMsg({ text: data.message || "Invalid voucher code", type: "error" });
      }
    } catch {
      setVoucherMsg({ text: "Error verifying voucher", type: "error" });
    } finally {
      setVerifying(false);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!voucherResult) return;
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: voucherResult.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVoucherMsg({ text: data.message, type: "success" });
        setVoucherResult(null);
        setVoucherCode("");
      } else {
        setVoucherMsg({ text: data.message || "Failed to redeem", type: "error" });
      }
    } catch {
      setVoucherMsg({ text: "Error redeeming voucher", type: "error" });
    }
  };

  const activeRequests = requests.filter((r) => r.status !== "resolved");

  if (loading) {
    return (
      <StaffLayout roleTitle="Floor Captain" stationName="Floor Operations">
        <div className="flex-1 flex items-center justify-center p-8 text-on-surface-variant font-bold text-sm">
          Loading Floor Terminal...
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout roleTitle="Floor Captain" stationName="Floor Operations">
      <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-7xl mx-auto w-full">
        {/* Top Shift Header Strip */}
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold shadow-md">
              <span className="material-symbols-outlined text-2xl">directions_walk</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-on-surface">Floor Captain Command</h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
                  Live Shift
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Fast table assistance, hot food delivery, and loyalty rewards redemption.
              </p>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">notifications</span>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold leading-none">
                  Requests
                </p>
                <p className="text-sm font-extrabold text-on-surface leading-tight">
                  {activeRequests.length}
                </p>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">skillet</span>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold leading-none">
                  Pickups
                </p>
                <p className="text-sm font-extrabold text-on-surface leading-tight">
                  {pickups.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 ${
              activeTab === "requests"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">notifications_active</span>
            <span>Table Requests</span>
            {activeRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-primary text-[10px] font-extrabold leading-none">
                {activeRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("pickups")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 ${
              activeTab === "pickups"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">room_service</span>
            <span>Kitchen Pickups</span>
            {pickups.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-primary text-[10px] font-extrabold leading-none">
                {pickups.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("floor")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 ${
              activeTab === "floor"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">grid_view</span>
            <span>Floor Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("voucher")}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 ${
              activeTab === "voucher"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">loyalty</span>
            <span>Redeem Voucher</span>
          </button>
        </div>

        {/* TAB 1: TABLE REQUESTS */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {activeRequests.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-emerald-600 mb-2">
                  task_alt
                </span>
                <p className="font-bold text-sm text-on-surface">All Tables Satisfied!</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  No pending water, bill, or waiter call requests on the floor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary font-black text-xs">
                          Table {req.tableNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            req.status === "submitted"
                              ? "bg-rose-100 text-rose-800 animate-pulse"
                              : req.status === "acknowledged"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 my-2">
                        <span className="material-symbols-outlined text-primary text-xl">
                          {req.type === "water"
                            ? "water_drop"
                            : req.type === "bill"
                            ? "receipt_long"
                            : "person_pin"}
                        </span>
                        <h4 className="font-bold text-sm text-on-surface capitalize">
                          {req.type === "water"
                            ? "Drinking Water"
                            : req.type === "bill"
                            ? "Requesting Bill"
                            : "Waiter Assistance"}
                        </h4>
                      </div>

                      <p className="text-xs text-on-surface-variant mb-4 bg-surface p-2.5 rounded-xl border border-outline-variant/20">
                        {req.note || "Customer tapped quick button on table."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                      {req.status === "submitted" && (
                        <button
                          onClick={() => handleUpdateReqStatus(req._id, "acknowledged")}
                          className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      {req.status === "acknowledged" && (
                        <button
                          onClick={() => handleUpdateReqStatus(req._id, "in_progress")}
                          className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
                        >
                          On My Way
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateReqStatus(req._id, "resolved")}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                      >
                        Mark Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KITCHEN PICKUPS */}
        {activeTab === "pickups" && (
          <div className="space-y-4">
            {pickups.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
                  restaurant
                </span>
                <p className="font-bold text-sm text-on-surface">No Hot Dishes Waiting at Station</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  When chef marks an order &apos;Ready&apos;, it will chime here immediately.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pickups.map((order) => (
                  <div
                    key={order._id}
                    className="p-5 rounded-2xl bg-surface-container-lowest border-2 border-emerald-500/40 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-sm shadow-xs">
                          Table {order.tableNumber}
                        </span>
                        <span className="font-bold text-xs text-primary">
                          {formatPKR(order.total)}
                        </span>
                      </div>

                      <div className="divide-y divide-outline-variant/20 mb-4 text-xs">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="py-1.5 flex items-start justify-between">
                            <span className="font-bold text-on-surface">
                              {it.quantity}x {it.name}
                            </span>
                            {it.specialInstructions && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                {it.specialInstructions}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkServed(order._id)}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                    >
                      <span className="material-symbols-outlined text-base">check</span>
                      <span>Delivered &amp; Mark Served</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FLOOR MATRIX */}
        {activeTab === "floor" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-surface-container border" />
                <span>Vacant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Occupied / Cooking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span>Food Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-bounce" />
                <span>Service Alert</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {floorTables.map((t) => {
                let badgeStyle = "bg-surface-container border-outline-variant/30 text-on-surface";
                if (t.status === "request_pending") {
                  badgeStyle = "bg-rose-50 border-rose-300 text-rose-800 shadow-sm";
                } else if (t.status === "food_ready") {
                  badgeStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm";
                } else if (t.status === "occupied") {
                  badgeStyle = "bg-blue-50 border-blue-300 text-blue-800";
                }

                return (
                  <div
                    key={t.tableNumber}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between min-h-[90px] transition-all ${badgeStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">Table {t.tableNumber}</span>
                      <span className="text-[10px] font-bold uppercase">
                        {t.status === "request_pending"
                          ? "Alert"
                          : t.status === "food_ready"
                          ? "Ready"
                          : t.status === "occupied"
                          ? "Eating"
                          : "Free"}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px]">
                      {t.order ? (
                        <p className="font-medium">
                          {t.order.itemCount} items • {formatPKR(t.order.total)}
                        </p>
                      ) : (
                        <p className="opacity-60">Ready for guest</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: REDEEM VOUCHER */}
        {activeTab === "voucher" && (
          <div className="max-w-md mx-auto w-full space-y-4">
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-2xl">loyalty</span>
              </div>
              <h3 className="font-extrabold text-base text-on-surface">Redeem Diner Gift Voucher</h3>
              <p className="text-xs text-on-surface-variant mt-1 mb-5">
                Verify and redeem customer 8-character reward codes (e.g. GIFT8842) presented on their phone.
              </p>

              {voucherMsg && (
                <div
                  className={`mb-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    voucherMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {voucherMsg.type === "success" ? "check_circle" : "error"}
                  </span>
                  <span>{voucherMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleLookupVoucher} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">
                    Enter 8-Character Voucher Code
                  </label>
                  <input
                    type="text"
                    required
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="e.g. GIFT8842"
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 font-mono text-base font-extrabold text-on-surface tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 active:scale-98 disabled:opacity-50 transition-all"
                >
                  {verifying ? "Checking Voucher..." : "Verify Voucher Code"}
                </button>
              </form>

              {voucherResult && (
                <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-emerald-900 tracking-wider">
                      {voucherResult.code}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold uppercase">
                      Active
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-950">
                      {voucherResult.description}
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Customer: {voucherResult.customerName} ({voucherResult.customerEmailMasked})
                    </p>
                  </div>

                  <button
                    onClick={handleRedeemVoucher}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span>Confirm &amp; Redeem Free Gift</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}

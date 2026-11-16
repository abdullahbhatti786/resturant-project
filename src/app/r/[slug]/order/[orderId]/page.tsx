"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import CustomerLayout from "@/components/layouts/CustomerLayout";
import { formatPKR } from "@/lib/utils";

interface OrderDetail {
  id: string;
  tableNumber: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
  }>;
  total: number;
  status: "received" | "preparing" | "ready" | "served";
  paymentStatus: "unpaid" | "bill_requested" | "paid";
  paidAt?: string;
  createdAt: string;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || "cafe-lahore";
  const orderId = params?.orderId as string;
  const token = searchParams.get("token") || "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [restaurantName, setRestaurantName] = useState("Café Lahore");
  const [wifiCreds, setWifiCreds] = useState<{ name?: string; pass?: string }>({});
  const [loading, setLoading] = useState(true);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);
  const [billMsg, setBillMsg] = useState<string | null>(null);

  const handleRequestBill = async () => {
    try {
      setRequestingBill(true);
      setBillMsg(null);
      const res = await fetch(`/api/orders/${orderId}/bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setBillMsg("Floor Captain ko bill request bhej di gayi hai! Please cash ready rakhain.");
        setOrder((prev) => (prev ? { ...prev, paymentStatus: "bill_requested" } : null));
      } else {
        setBillMsg(data.message || "Failed to request bill");
      }
    } catch {
      setBillMsg("Network error. Please call waiter directly.");
    } finally {
      setRequestingBill(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}?token=${token}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          if (data.order.paymentStatus === "paid" && typeof window !== "undefined") {
            localStorage.removeItem(`servora_${slug}_active_order`);
            sessionStorage.removeItem(`servora_${slug}_active_order`);
            window.dispatchEvent(new Event("servora_order_cleared"));
          }
          if (data.restaurant) {
            setRestaurantName(data.restaurant.name);
            setWifiCreds({
              name: data.restaurant.wifiName,
              pass: data.restaurant.wifiPassword,
            });
          }
        }
      } catch (err) {
        console.error("Order poll error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    // Poll status every 4 seconds for real-time live progression
    const interval = setInterval(fetchOrder, 4000);

    return () => clearInterval(interval);
  }, [orderId, token]);

  const copyWifiPassword = () => {
    if (wifiCreds.pass) {
      navigator.clipboard.writeText(wifiCreds.pass);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  const getStepIndex = (status: OrderDetail["status"]) => {
    switch (status) {
      case "received":
        return 1;
      case "preparing":
        return 2;
      case "ready":
        return 3;
      case "served":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 1;

  return (
    <CustomerLayout restaurantName={restaurantName} tableNumber={order?.tableNumber}>
      <div className="p-4 flex flex-col gap-4">
        {/* Status Header Banner */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-xs text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-3xl animate-pulse">
              {order?.status === "served"
                ? "sentiment_very_satisfied"
                : order?.status === "ready"
                ? "room_service"
                : order?.status === "preparing"
                ? "skillet"
                : "receipt_long"}
            </span>
          </div>

          <h2 className="text-lg font-extrabold text-on-surface">
            {order?.status === "served"
              ? "Served & Enjoy!"
              : order?.status === "ready"
              ? "Dishes are Ready!"
              : order?.status === "preparing"
              ? "Chef is Preparing"
              : "Order Received"}
          </h2>

          <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
            {order?.status === "served"
              ? "Thank you for dining with us! How was your food and service?"
              : order?.status === "ready"
              ? "Your food is plated and the captain is bringing it to your table."
              : order?.status === "preparing"
              ? "Fresh spices are simmering in the kitchen."
              : "Kitchen has confirmed your ticket and assigned your station."}
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface">
            <span>Table {order?.tableNumber}</span>
            <span>•</span>
            <span className="font-mono text-on-surface-variant">
              #{orderId.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>

        {/* 4-Step Progress Stepper */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-xs">
          <div className="flex items-center justify-between relative mb-2">
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-surface-container -z-0" />
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-primary -z-0 transition-all duration-500"
              style={{
                width: `${((currentStep - 1) / 3) * 88}%`,
              }}
            />

            {[
              { num: 1, label: "Received", icon: "done" },
              { num: 2, label: "Cooking", icon: "skillet" },
              { num: 3, label: "Ready", icon: "room_service" },
              { num: 4, label: "Served", icon: "celebration" },
            ].map((st) => {
              const isPastOrCurrent = currentStep >= st.num;
              const isCurrent = currentStep === st.num;
              return (
                <div key={st.num} className="flex flex-col items-center z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPastOrCurrent
                        ? "bg-primary text-on-primary ring-4 ring-primary/20 shadow-xs"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{st.icon}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1.5 ${
                      isCurrent ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Served Celebration or Feedback CTA */}
        {order?.status === "served" && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col items-center text-center gap-2">
            <span className="material-symbols-outlined text-3xl text-emerald-600">
              verified
            </span>
            <p className="text-xs font-bold">Khana Kaisa Laga? (Give Feedback)</p>
            <p className="text-[11px] text-emerald-800">
              Rate your taste and captain service in 10 seconds.
            </p>
            <Link
              href={`/r/${slug}/feedback`}
              className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-colors"
            >
              Leave Quick Feedback
            </Link>
          </div>
        )}

        {/* Bored Waiting Entertainment Banner */}
        {order?.status !== "served" && (
          <div className="p-4 rounded-2xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">sports_esports</span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-on-surface">Khana aane tak Games kheliye!</h4>
                <p className="text-[10px] text-on-surface-variant">
                  Tic-Tac-Toe, Memory Flip & Desi Quiz
                </p>
              </div>
            </div>
            <Link
              href={`/r/${slug}/games`}
              className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs shrink-0 active:scale-95 transition-all"
            >
              Play Now
            </Link>
          </div>
        )}

        {/* Wi-Fi Card */}
        {wifiCreds.name && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg">wifi</span>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">
                  Free Wi-Fi: {wifiCreds.name}
                </p>
                <p className="text-xs font-mono font-bold text-on-surface">
                  Password: {wifiCreds.pass}
                </p>
              </div>
            </div>
            <button
              onClick={copyWifiPassword}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">
                {copiedWifi ? "done" : "content_copy"}
              </span>
              <span>{copiedWifi ? "Copied" : "Copy"}</span>
            </button>
          </div>
        )}

        {/* Ordered Items Receipt */}
        {loading ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">Loading receipt...</div>
        ) : order ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 shadow-xs">
            <h3 className="font-bold text-xs text-on-surface mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">receipt</span>
              <span>Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
            </h3>

            <div className="divide-y divide-outline-variant/20 text-xs">
              {order.items.map((it, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary">{it.quantity}x</span>
                      <span className="font-semibold text-on-surface">{it.name}</span>
                    </div>
                    {it.specialInstructions && (
                      <p className="text-[10px] text-on-surface-variant italic mt-0.5">
                        Note: {it.specialInstructions}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-on-surface">
                    {formatPKR(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-outline-variant/30 flex justify-between items-center text-sm font-extrabold text-on-surface">
              <span>Total Bill</span>
              <span className="text-primary">{formatPKR(order.total)}</span>
            </div>
          </div>
        ) : null}

        {/* CASH IN HAND & BILL PAYMENT CARD */}
        {order && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-xl">payments</span>
                <h3 className="font-bold text-xs text-on-surface">Bill &amp; Payment Status</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  order.paymentStatus === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : order.paymentStatus === "bill_requested"
                    ? "bg-amber-100 text-amber-800 animate-pulse"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {order.paymentStatus === "paid"
                  ? "Paid in Cash"
                  : order.paymentStatus === "bill_requested"
                  ? "Bill Requested"
                  : "Payment Pending"}
              </span>
            </div>

            {order.paymentStatus === "paid" ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col gap-1.5 text-center items-center">
                <span className="material-symbols-outlined text-2xl text-emerald-600">
                  check_circle
                </span>
                <p className="font-extrabold text-xs">
                  Cash Payment of {formatPKR(order.total)} Received!
                </p>
                <p className="text-[11px] text-emerald-800">
                  Aap ki payment verify ho chuki hai aur Table free ho chuka hai. Thank you!
                </p>
              </div>
            ) : order.paymentStatus === "bill_requested" ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-1.5 text-center items-center">
                <span className="material-symbols-outlined text-2xl text-amber-600 animate-bounce">
                  receipt_long
                </span>
                <p className="font-extrabold text-xs">
                  Floor Captain Bill aur Paper Receipt lekar aa raha hai
                </p>
                <p className="text-[11px] text-amber-800">
                  Please total cash <strong>{formatPKR(order.total)}</strong> ready rakhain.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-on-surface-variant font-medium">Payment Mode</span>
                    <p className="font-bold text-on-surface">Cash in Hand</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-on-surface-variant font-medium">Payable Amount</span>
                    <p className="font-extrabold text-primary text-sm">{formatPKR(order.total)}</p>
                  </div>
                </div>

                {billMsg && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg font-semibold text-center">
                    {billMsg}
                  </p>
                )}

                <button
                  type="button"
                  disabled={requestingBill}
                  onClick={handleRequestBill}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">receipt_long</span>
                  <span>
                    {requestingBill ? "Requesting Bill..." : `Request Bill from Captain (${formatPKR(order.total)} Cash)`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Order More Items Button */}
        <Link
          href={`/r/${slug}/menu`}
          className="w-full py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Order More Dishes</span>
        </Link>
      </div>
    </CustomerLayout>
  );
}

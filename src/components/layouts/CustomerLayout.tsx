"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

interface CustomerLayoutProps {
  children: React.ReactNode;
  restaurantName?: string;
  tableNumber?: number | string | null;
}

interface ActiveOrderBanner {
  id: string;
  token: string;
  tableNumber: number;
  status: string;
}

export default function CustomerLayout({
  children,
  restaurantName = "Café Lahore",
  tableNumber: initialTable = null,
}: CustomerLayoutProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || "cafe-lahore";

  const [table, setTable] = useState<string | number | null>(initialTable);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrderBanner | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const paramTable = searchParams?.get("table");
      if (paramTable && Number(paramTable) > 0) {
        setTable(paramTable);
        sessionStorage.setItem(`servora_${slug}_table`, paramTable);
        localStorage.setItem(`servora_${slug}_table`, paramTable);
      } else {
        const stored =
          sessionStorage.getItem(`servora_${slug}_table`) ||
          localStorage.getItem(`servora_${slug}_table`);
        if (stored) setTable(stored);
      }

      // Check active order in local/session storage
      const activeRaw =
        localStorage.getItem(`servora_${slug}_active_order`) ||
        sessionStorage.getItem(`servora_${slug}_active_order`);

      if (activeRaw) {
        try {
          const parsed = JSON.parse(activeRaw);
          if (parsed.orderId && parsed.token) {
            fetch(`/api/orders/${parsed.orderId}?token=${parsed.token}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success && data.order) {
                  setActiveOrder({
                    id: parsed.orderId,
                    token: parsed.token,
                    tableNumber: data.order.tableNumber,
                    status: data.order.status,
                  });
                }
              })
              .catch(() => {});
          }
        } catch {
          // ignore parse errors
        }
      }
      // Listen for custom logout / order clear event
      const onOrderCleared = () => setActiveOrder(null);
      window.addEventListener("servora_order_cleared", onOrderCleared);

      return () => {
        window.removeEventListener("servora_order_cleared", onOrderCleared);
      };
    }
  }, [slug]);

  const handleDismissOrder = () => {
    setActiveOrder(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`servora_${slug}_active_order`);
      sessionStorage.removeItem(`servora_${slug}_active_order`);
    }
  };

  const handleCallWaiter = async (type = "waiter", note = "Waiter assistance requested") => {
    try {
      setCallStatus("Calling captain...");
      const tableNum = Number(table) || activeOrder?.tableNumber || 1;
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          tableNumber: tableNum,
          type,
          note,
        }),
      });
      if (res.ok) {
        setCallStatus("Captain notified! Arriving soon.");
        setTimeout(() => {
          setShowCallModal(false);
          setCallStatus(null);
        }, 2500);
      } else {
        const data = await res.json();
        setCallStatus(data.message || "Request sent");
        setTimeout(() => setCallStatus(null), 3000);
      }
    } catch {
      setCallStatus("Request sent to Floor Captain");
      setTimeout(() => {
        setShowCallModal(false);
        setCallStatus(null);
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center">
      {/* Mobile Shell Container (Max 480px on desktop, full width on mobile) */}
      <div className="w-full max-w-md min-h-screen bg-surface flex flex-col relative shadow-xl">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 px-4 py-3 flex items-center justify-between">
          <Link href={`/r/${slug}/menu`} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img
                src="/images/servora-logo.svg"
                alt="Servora"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-base text-on-surface leading-tight">
                {restaurantName}
              </h1>
              <p className="text-xs text-on-surface-variant font-medium">
                Gulberg III • Fast QR Dining
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {table ? (
              <span className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary font-bold text-xs shadow-xs">
                T-{table}
              </span>
            ) : (
              <Link
                href={`/r/${slug}`}
                className="px-2 py-1 rounded-lg bg-surface-container-high text-primary font-bold text-xs"
              >
                Pick Table
              </Link>
            )}

            <Link
              href={`/r/${slug}/feedback`}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-amber-500 hover:bg-surface-variant transition-colors"
              title="Dining Feedback"
            >
              <span className="material-symbols-outlined text-base">star</span>
            </Link>

            <Link
              href={`/r/${slug}/account`}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors"
              title="Customer Account & Rewards"
            >
              <span className="material-symbols-outlined text-base">person</span>
            </Link>
          </div>
        </header>

        {/* Persistent Active Order Banner (Visible across ALL screens when order exists) */}
        {activeOrder && (
          <div className="sticky top-[61px] z-30 bg-primary text-on-primary px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-md animate-in slide-in-from-top duration-200">
            <Link
              href={`/r/${slug}/order/${activeOrder.id}?token=${activeOrder.token}`}
              className="flex items-center gap-2 flex-1 min-w-0 pr-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
              <span className="truncate">
                Table {activeOrder.tableNumber} Order •{" "}
                <span className="uppercase">{activeOrder.status}</span>
              </span>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/r/${slug}/order/${activeOrder.id}?token=${activeOrder.token}`}
                className="flex items-center gap-1 text-[11px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-lg"
              >
                <span>Track</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <button
                type="button"
                onClick={handleDismissOrder}
                className="w-5 h-5 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-[10px] font-bold"
                title="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col pb-24 overflow-y-auto">{children}</main>

        {/* Floating "Call Waiter" Button (Visible on all customer screens) */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowCallModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-surface-container-lowest text-on-surface border border-outline-variant/40 shadow-xl hover:bg-surface-container-low active:scale-95 transition-all text-xs font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-primary text-lg animate-pulse">
              room_service
            </span>
            <span>Need help? Call Waiter</span>
          </button>
        </div>

        {/* Call Waiter Quick Action Modal */}
        {showCallModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">notifications_active</span>
                  <h3 className="font-bold text-base text-on-surface">Floor Service Request</h3>
                </div>
                <button
                  onClick={() => setShowCallModal(false)}
                  className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {callStatus ? (
                <div className="p-4 rounded-xl bg-primary/10 text-primary font-bold text-center text-sm">
                  {callStatus}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleCallWaiter("water", "Table needs drinking water")}
                    className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high flex flex-col items-center gap-1.5 transition-colors text-xs font-bold text-on-surface"
                  >
                    <span className="material-symbols-outlined text-primary text-2xl">water_drop</span>
                    <span>Need Water</span>
                  </button>
                  <button
                    onClick={() => handleCallWaiter("bill", "Bill requested (Cash / Card)")}
                    className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high flex flex-col items-center gap-1.5 transition-colors text-xs font-bold text-on-surface"
                  >
                    <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
                    <span>Request Bill</span>
                  </button>
                  <button
                    onClick={() => handleCallWaiter("waiter", "Captain assistance requested")}
                    className="p-3 rounded-xl bg-primary-container/15 hover:bg-primary-container/25 flex flex-col items-center gap-1.5 transition-colors text-xs font-bold text-primary"
                  >
                    <span className="material-symbols-outlined text-2xl">person_pin</span>
                    <span>Call Captain</span>
                  </button>
                  <button
                    onClick={() => handleCallWaiter("other", "Table cleanup requested")}
                    className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high flex flex-col items-center gap-1.5 transition-colors text-xs font-bold text-on-surface"
                  >
                    <span className="material-symbols-outlined text-primary text-2xl">cleaning_services</span>
                    <span>Clean Table</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

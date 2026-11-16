"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CustomerLayout from "@/components/layouts/CustomerLayout";
import { formatPKR } from "@/lib/utils";

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export default function CustomerCartPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "cafe-lahore";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [table, setTable] = useState<string | null>(null);

  const [orderInstructions, setOrderInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tableParam = searchParams?.get("table");
      if (tableParam && Number(tableParam) > 0) {
        setTable(tableParam);
        sessionStorage.setItem(`servora_${slug}_table`, tableParam);
        localStorage.setItem(`servora_${slug}_table`, tableParam);
      } else {
        const storedTable =
          sessionStorage.getItem(`servora_${slug}_table`) ||
          localStorage.getItem(`servora_${slug}_table`);
        setTable(storedTable);
      }

      const storedCart = sessionStorage.getItem(`servora_${slug}_cart`);
      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch {
          setCart([]);
        }
      }
    }
  }, [slug, searchParams]);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`servora_${slug}_cart`, JSON.stringify(newCart));
    }
  };

  const handleQtyChange = (itemId: string, delta: number) => {
    const updated = cart
      .map((it) => {
        if (it.menuItemId === itemId) {
          const newQty = it.quantity + delta;
          return newQty > 0 ? { ...it, quantity: newQty } : null;
        }
        return it;
      })
      .filter(Boolean) as CartItem[];
    updateCart(updated);
  };

  const handleRemove = (itemId: string) => {
    updateCart(cart.filter((it) => it.menuItemId !== itemId));
  };

  const subtotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!table) {
      setErrorMsg("Please select your table first.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: {
        slug: string;
        tableNumber: number;
        items: Array<{
          menuItemId: string;
          quantity: number;
          specialInstructions: string;
        }>;
        customerName?: string;
        customerEmail?: string;
        marketingConsent?: boolean;
      } = {
        slug,
        tableNumber: Number(table),
        items: cart.map((it) => ({
          menuItemId: it.menuItemId,
          quantity: it.quantity,
          specialInstructions: orderInstructions
            ? `${orderInstructions} ${it.specialInstructions || ""}`.trim()
            : it.specialInstructions || "",
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Clear cart
        updateCart([]);
        // Save current active order tracking strictly per table
        if (typeof window !== "undefined") {
          const orderRecord = JSON.stringify({
            orderId: data.orderId,
            token: data.publicToken,
            tableNumber: Number(table),
          });
          if (table) {
            localStorage.setItem(`servora_${slug}_active_order_t${table}`, orderRecord);
            sessionStorage.setItem(`servora_${slug}_active_order_t${table}`, orderRecord);
          }
          localStorage.setItem(`servora_${slug}_active_order`, orderRecord);
          sessionStorage.setItem(`servora_${slug}_active_order`, orderRecord);
          sessionStorage.setItem(`servora_${slug}_last_order_id`, data.orderId);
          sessionStorage.setItem(`servora_${slug}_last_order_token`, data.publicToken);
        }
        // Redirect to live order tracking
        router.push(`/r/${slug}/order/${data.orderId}?token=${data.publicToken}`);
      } else {
        setErrorMsg(data.message || "Failed to place order");
      }
    } catch {
      setErrorMsg("Network error placing order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerLayout tableNumber={table}>
      <div className="p-4 flex flex-col gap-4">
        {/* Cart Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/r/${slug}/menu`}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
            </Link>
            <h2 className="font-bold text-base text-on-surface">Your Food Order</h2>
          </div>

          {table ? (
            <span className="px-3 py-1 rounded-full bg-primary-container/20 text-primary font-bold text-xs">
              Table {table}
            </span>
          ) : (
            <Link
              href={`/r/${slug}`}
              className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs"
            >
              Select Table
            </Link>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
              shopping_bag
            </span>
            <p className="font-bold text-sm text-on-surface">Your plate is empty</p>
            <p className="text-xs text-on-surface-variant">Add some mouthwatering dishes to begin!</p>
            <Link
              href={`/r/${slug}/menu`}
              className="mt-3 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Items List */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 overflow-hidden shadow-xs">
              {cart.map((item) => (
                <div key={item.menuItemId} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-on-surface truncate">{item.name}</h4>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {formatPKR(item.price * item.quantity)}
                      <span className="text-[10px] text-on-surface-variant font-normal ml-1.5">
                        ({formatPKR(item.price)} each)
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.menuItemId, -1)}
                        className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center text-primary font-bold active:scale-95 text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-on-surface w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.menuItemId, 1)}
                        className="w-6 h-6 rounded bg-primary text-on-primary flex items-center justify-center font-bold active:scale-95 text-xs"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.menuItemId)}
                      className="text-on-surface-variant hover:text-rose-600 transition-colors"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Special Instructions */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-3.5 shadow-xs">
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                Special Kitchen Instructions (Optional)
              </label>
              <input
                type="text"
                value={orderInstructions}
                onChange={(e) => setOrderInstructions(e.target.value)}
                placeholder="e.g. Less spice in Karahi, serve raita cold"
                className="w-full rounded-xl border border-outline-variant/50 bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Bill Summary */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 shadow-xs space-y-2 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-semibold text-on-surface">{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Service & Delivery</span>
                <span className="font-semibold text-emerald-700">Free (Table Dining)</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/30 flex justify-between text-sm font-extrabold text-on-surface">
                <span>Total Payable</span>
                <span className="text-primary">{formatPKR(subtotal)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={submitting || !table}
              className="w-full py-3.5 rounded-2xl bg-primary text-on-primary font-bold text-sm shadow-lg hover:opacity-95 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>{submitting ? "Sending to Kitchen..." : `Confirm Order • ${formatPKR(subtotal)}`}</span>
            </button>
          </form>
        )}
      </div>
    </CustomerLayout>
  );
}

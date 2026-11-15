"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import CustomerLayout from "@/components/layouts/CustomerLayout";
import { formatPKR } from "@/lib/utils";

interface RewardItem {
  _id: string;
  code: string;
  description: string;
  status: string;
  expiresAt: string;
}

interface OrderHistoryItem {
  _id: string;
  tableNumber: number;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

export default function CustomerAccountPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "cafe-lahore";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    customer: { name: string; email: string };
    streak: {
      qualifyingVisits: number;
      requiredVisits: number;
      withinDays: number;
      giftDescription: string;
    };
    activeRewards: RewardItem[];
    orders: OrderHistoryItem[];
  } | null>(null);

  // Sign-in Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/customers/me");
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      let activeOrderId: string | undefined;
      if (typeof window !== "undefined") {
        const raw =
          localStorage.getItem(`servora_${slug}_active_order`) ||
          sessionStorage.getItem(`servora_${slug}_active_order`);
        if (raw) {
          try {
            const p = JSON.parse(raw);
            activeOrderId = p.orderId;
          } catch {}
        }
      }

      const res = await fetch("/api/auth/customer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, email, marketingConsent, activeOrderId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchProfile();
      } else {
        setErrorMsg(data.message || "Sign in failed");
      }
    } catch {
      setErrorMsg("Network error signing in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout?type=customer", { method: "POST" });
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(`servora_${slug}_active_order`);
      sessionStorage.removeItem(`servora_${slug}_active_order`);
      sessionStorage.removeItem(`servora_${slug}_cart`);
      window.dispatchEvent(new Event("servora_order_cleared"));
    }
    setProfile(null);
    router.refresh();
  };

  const handleFastFillDemo = () => {
    setName("Demo Customer");
    setEmail("demo@servora.pk");
  };

  return (
    <CustomerLayout>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/r/${slug}/menu`}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </Link>
          <h2 className="font-bold text-base text-on-surface">Member Rewards & Profile</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-on-surface-variant font-medium">
            Loading loyalty account...
          </div>
        ) : !profile ? (
          /* Sign-in / Join Form */
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl">loyalty</span>
            </div>
            <h3 className="font-extrabold text-base text-on-surface">Join Diners Loyalty Club</h3>
            <p className="text-xs text-on-surface-variant mt-1 mb-5">
              Enter your email to track your dining streak and earn free food gifts at Café Lahore.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Abdullah Khan"
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. demo@servora.pk"
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="w-3.5 h-3.5 accent-primary rounded"
                />
                <span className="text-[11px] text-on-surface-variant">
                  Notify me of exclusive chef specials & discounts
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{submitting ? "Signing in..." : "Continue to Account"}</span>
              </button>

              {/* Fast fill for presentation demo */}
              <button
                type="button"
                onClick={handleFastFillDemo}
                className="w-full py-2.5 rounded-xl bg-surface-container text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                ⚡ Fast Fill: Demo Customer (demo@servora.pk)
              </button>
            </form>
          </div>
        ) : (
          /* Profile & Streak View */
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-sm">
                  {profile.customer.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-on-surface">{profile.customer.name}</h3>
                  <p className="text-[11px] text-on-surface-variant font-mono">{profile.customer.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Sign Out
              </button>
            </div>

            {/* Streak Progress Card */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">local_fire_department</span>
                  <h3 className="font-extrabold text-sm text-on-surface">Dining Streak</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-primary-container/20 text-primary font-extrabold text-xs">
                  {profile.streak.qualifyingVisits} / {profile.streak.requiredVisits} Visits
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      (profile.streak.qualifyingVisits / profile.streak.requiredVisits) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="text-xs text-on-surface-variant">
                {profile.streak.qualifyingVisits >= profile.streak.requiredVisits ? (
                  <span className="text-emerald-700 font-bold">
                    🎉 Reward unlocked! Check your active voucher below.
                  </span>
                ) : (
                  <span>
                    Visit <strong>{profile.streak.requiredVisits - profile.streak.qualifyingVisits} more time</strong> within {profile.streak.withinDays} days to get a <strong>{profile.streak.giftDescription}</strong>!
                  </span>
                )}
              </p>
            </div>

            {/* Active Rewards Vouchers */}
            {profile.activeRewards.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-on-surface-variant uppercase tracking-wider px-1">
                  Active Vouchers ({profile.activeRewards.length})
                </h3>

                {profile.activeRewards.map((reward) => (
                  <div
                    key={reward._id}
                    className="p-4 rounded-2xl bg-primary-container/15 border-2 border-dashed border-primary/40 shadow-xs flex flex-col items-center text-center gap-2"
                  >
                    <span className="material-symbols-outlined text-3xl text-primary">card_giftcard</span>
                    <h4 className="font-extrabold text-sm text-on-surface">{reward.description}</h4>
                    <p className="text-[11px] text-on-surface-variant">
                      Show this 8-character code to your floor captain to claim:
                    </p>
                    <div className="px-4 py-2 rounded-xl bg-surface border border-outline-variant/40 font-mono text-base font-extrabold tracking-widest text-primary select-all shadow-xs">
                      {reward.code}
                    </div>
                    <span className="text-[10px] text-on-surface-variant/70">
                      Valid until {new Date(reward.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Order History */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 shadow-xs">
              <h3 className="font-bold text-xs text-on-surface mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">history</span>
                <span>Past Dining Visits</span>
              </h3>

              {profile.orders.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No orders placed yet.</p>
              ) : (
                <div className="divide-y divide-outline-variant/20 text-xs">
                  {profile.orders.map((ord) => (
                    <div key={ord._id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-on-surface">Table {ord.tableNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container capitalize text-on-surface-variant">
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} items
                        </p>
                      </div>
                      <span className="font-bold text-primary">{formatPKR(ord.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

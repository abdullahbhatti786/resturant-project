"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";

export default function OwnerLoyaltyPage() {
  const [rules, setRules] = useState({
    requiredVisits: 2,
    withinDays: 30,
    giftDescription: "Free Peshawari Kulfa",
    rewardExpiryDays: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/owner/settings");
      const data = await res.json();
      if (data.success && data.restaurant?.loyaltyRules) {
        setRules(data.restaurant.loyaltyRules);
      }
    } catch {
      setMessage({ text: "Failed to load loyalty rules", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/owner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loyaltyRules: rules }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: "Loyalty program rules updated successfully!", type: "success" });
      } else {
        setMessage({ text: data.message || "Failed to update rules", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error saving rules", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface">Loyalty Program Engine</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure automated dining streak thresholds, reward gifts, and voucher expiry.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {message.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-medium">Loading rules...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">loyalty</span>
                Streak &amp; Reward Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Required Dining Visits to Unlock Reward
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={rules.requiredVisits}
                    onChange={(e) =>
                      setRules({ ...rules, requiredVisits: Number(e.target.value) || 1 })
                    }
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Demo setting: 2 visits unlocks reward.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Active Streak Window (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    required
                    value={rules.withinDays}
                    onChange={(e) =>
                      setRules({ ...rules, withinDays: Number(e.target.value) || 1 })
                    }
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Visits within this window count toward the streak.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Complimentary Gift Title
                  </label>
                  <input
                    type="text"
                    required
                    value={rules.giftDescription}
                    onChange={(e) => setRules({ ...rules, giftDescription: e.target.value })}
                    placeholder="e.g. Free Peshawari Kulfa"
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Voucher Validity (Days After Unlocking)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    required
                    value={rules.rewardExpiryDays}
                    onChange={(e) =>
                      setRules({ ...rules, rewardExpiryDays: Number(e.target.value) || 1 })
                    }
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                <span>{saving ? "Saving Rules..." : "Save Loyalty Rules"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </OwnerLayout>
  );
}

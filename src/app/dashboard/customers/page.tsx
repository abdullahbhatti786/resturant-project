"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";

interface CustomerDirItem {
  id: string;
  name: string;
  email: string;
  marketingConsent: boolean;
  totalVisits: number;
  streakStatus: string;
  hasActiveReward: boolean;
  lastVisit: string;
  createdAt: string;
}

export default function OwnerCustomersPage() {
  const [customers, setCustomers] = useState<CustomerDirItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/owner/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error("Customers load error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-surface">Registered Diners &amp; Loyalty Directory</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Track customer frequency, visit streaks, rewards eligibility, and opt-in marketing profiles.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-medium">Loading customer database...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
              group_off
            </span>
            <p className="font-bold text-sm text-on-surface">No customers registered yet.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="py-3.5 px-5">Customer Profile</th>
                    <th className="py-3.5 px-5">Lifetime Visits</th>
                    <th className="py-3.5 px-5">Current Streak</th>
                    <th className="py-3.5 px-5">Voucher Status</th>
                    <th className="py-3.5 px-5">Marketing Opt-In</th>
                    <th className="py-3.5 px-5 text-right">Last Dining Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                            {c.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{c.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-mono">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-bold text-on-surface">
                        {c.totalVisits} visits
                      </td>
                      <td className="py-4 px-5">
                        <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-bold text-[11px]">
                          {c.streakStatus}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {c.hasActiveReward ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px] flex items-center gap-1 w-fit">
                            <span className="material-symbols-outlined text-xs">card_giftcard</span>
                            <span>Active Voucher</span>
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/60 text-[11px]">In Progress</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.marketingConsent
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {c.marketingConsent ? "Opted In" : "No"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-on-surface-variant text-[11px]">
                        {new Date(c.lastVisit).toLocaleDateString()}
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

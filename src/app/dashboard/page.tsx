"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import Link from "next/link";
import { formatPKR } from "@/lib/utils";

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    servedOrdersCount: number;
    totalOrdersCount: number;
    totalRequests: number;
    totalCustomers: number;
  };
  peakHours: Array<{ hour: string; orders: number }>;
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/owner/analytics")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch((err) => console.error("Analytics fetch error:", err));
  }, []);

  return (
    <OwnerLayout>
      <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto w-full">
        {/* Top Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Gulberg Flagship • Live Operations
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Café Lahore Executive Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant font-bold text-xs text-on-surface transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">settings</span>
              <span>Settings</span>
            </Link>
            <Link
              href="/r/cafe-lahore"
              target="_blank"
              className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              <span>Open Diner Portal</span>
            </Link>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Served Revenue
              </p>
              <h3 className="text-2xl font-extrabold text-on-surface mt-1">
                {data ? formatPKR(data.kpis.totalRevenue) : "Rs. 0"}
              </h3>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {data ? `${data.kpis.servedOrdersCount} served orders` : "0 orders"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Total Orders Placed
              </p>
              <h3 className="text-2xl font-extrabold text-on-surface mt-1">
                {data ? data.kpis.totalOrdersCount : 0}
              </h3>
              <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
                Kitchen ticket count
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">restaurant</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Service Calls
              </p>
              <h3 className="text-2xl font-extrabold text-on-surface mt-1">
                {data ? data.kpis.totalRequests : 0}
              </h3>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Water & Waiter Calls</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">room_service</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Registered Diners
              </p>
              <h3 className="text-2xl font-extrabold text-on-surface mt-1">
                {data ? data.kpis.totalCustomers : 0}
              </h3>
              <p className="text-[11px] text-primary font-semibold mt-0.5">Loyalty Member Pool</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">loyalty</span>
            </div>
          </div>
        </div>

        {/* Operational Modules Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/menu"
            className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-primary transition-all group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">restaurant_menu</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                Menu & Catalog
              </h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Update dishes, prices, photos, and real-time in-stock availability.
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/qr"
            className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-primary transition-all group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">qr_code_2</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                Print Table QR
              </h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Download printable PNG and vector SVG QR tent cards for all tables.
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/staff"
            className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-primary transition-all group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">badge</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                Staff Accounts
              </h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Manage Floor Captains and Kitchen Line Cook login credentials.
              </p>
            </div>
          </Link>
        </div>

        {/* Peak Hours Volume Visualizer */}
        {data?.peakHours && (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-on-surface">Dining Peak Hours Distribution</h3>
                <p className="text-xs text-on-surface-variant">Order frequency through dinner rush hours</p>
              </div>
              <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
            </div>

            <div className="flex items-end gap-2 h-32 pt-6 px-2 border-b border-outline-variant/30">
              {data.peakHours.map((ph, idx) => {
                const maxOrders = Math.max(...data.peakHours.map((p) => p.orders), 1);
                const heightPct = Math.max((ph.orders / maxOrders) * 100, 10);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-on-surface">{ph.orders}</span>
                    <div
                      className="w-full bg-primary rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                      {ph.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}

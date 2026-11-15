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
      <div className="flex flex-col gap-4 sm:gap-6 w-full">
        {/* Top Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-outline-variant/30">
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Gulberg Flagship • Live Operations
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight mt-0.5">
              Café Lahore Executive Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="px-3 sm:px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant font-bold text-xs text-on-surface transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">settings</span>
              <span>Settings</span>
            </Link>
            <Link
              href="/r/cafe-lahore"
              target="_blank"
              className="px-3 sm:px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              <span>Open Diner Portal</span>
            </Link>
          </div>
        </div>

        {/* 4 Top KPI Cards - 2x2 on Mobile, 4x1 on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider truncate">
                Served Revenue
              </p>
              <h3 className="text-lg sm:text-2xl font-extrabold text-on-surface mt-0.5 sm:mt-1 truncate">
                {data ? formatPKR(data.kpis.totalRevenue) : "Rs. 0"}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold mt-0.5 truncate">
                {data ? `${data.kpis.servedOrdersCount} served` : "0 orders"}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 ml-2">
              <span className="material-symbols-outlined text-xl sm:text-2xl">payments</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider truncate">
                Orders Placed
              </p>
              <h3 className="text-lg sm:text-2xl font-extrabold text-on-surface mt-0.5 sm:mt-1 truncate">
                {data ? data.kpis.totalOrdersCount : 0}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-on-surface-variant font-semibold mt-0.5 truncate">
                Kitchen tickets
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 ml-2">
              <span className="material-symbols-outlined text-xl sm:text-2xl">restaurant</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider truncate">
                Service Calls
              </p>
              <h3 className="text-lg sm:text-2xl font-extrabold text-on-surface mt-0.5 sm:mt-1 truncate">
                {data ? data.kpis.totalRequests : 0}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-amber-700 font-semibold mt-0.5 truncate">
                Water & Waiter
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 ml-2">
              <span className="material-symbols-outlined text-xl sm:text-2xl">room_service</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider truncate">
                Diners Pool
              </p>
              <h3 className="text-lg sm:text-2xl font-extrabold text-on-surface mt-0.5 sm:mt-1 truncate">
                {data ? data.kpis.totalCustomers : 0}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-purple-700 font-semibold mt-0.5 truncate">
                Loyalty Club
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 ml-2">
              <span className="material-symbols-outlined text-xl sm:text-2xl">loyalty</span>
            </div>
          </div>
        </div>

        {/* Operational Modules Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <Link
            href="/dashboard/menu"
            className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-primary transition-all group flex items-start gap-3 sm:gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">restaurant_menu</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                Menu & Catalog
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5 sm:mt-1">
                Update dishes, prices, photos, and real-time in-stock availability.
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/qr"
            className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-primary transition-all group flex items-start gap-3 sm:gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">qr_code_2</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                Print Table QR
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5 sm:mt-1">
                Download printable PNG and vector SVG QR tent cards for all tables.
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/staff"
            className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-primary transition-all group flex items-start gap-3 sm:gap-4 sm:col-span-2 md:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">badge</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                Staff Accounts
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5 sm:mt-1">
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

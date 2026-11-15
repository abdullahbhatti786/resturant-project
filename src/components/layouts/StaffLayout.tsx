"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ServoraBrand from "@/components/brand/ServoraBrand";

interface StaffLayoutProps {
  children: React.ReactNode;
  roleTitle: string;
  stationName?: string;
}

export default function StaffLayout({
  children,
  roleTitle,
  stationName,
}: StaffLayoutProps) {
  const router = useRouter();
  const [clock, setClock] = useState("");
  const [staffName, setStaffName] = useState("Staff");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setStaffName(data.user.name);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout?type=staff", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface">
      {/* Overhead Staff Command Header */}
      <header className="h-16 w-full bg-surface-container-low border-b border-outline-variant/30 px-3 sm:px-6 flex items-center justify-between shadow-xs sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-4">
          <ServoraBrand size="sm" showTagline={false} />

          <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] sm:text-xs uppercase tracking-wider">
            {roleTitle}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {stationName && (
            <span className="hidden md:inline font-bold text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-lg">
              {stationName}
            </span>
          )}

          {/* Live High-Vis Clock */}
          <div className="bg-surface-container-highest/40 px-2.5 py-1 rounded-lg text-right font-mono font-bold text-xs sm:text-sm text-on-surface">
            {clock}
          </div>

          {/* Staff Info & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-outline-variant/40">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <span className="material-symbols-outlined text-base">person</span>
            </div>
            <span className="hidden lg:inline text-xs font-bold text-on-surface">
              {staffName}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors text-on-surface-variant"
              title="Sign Out"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Staff Viewport */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

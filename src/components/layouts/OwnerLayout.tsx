"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ServoraBrand from "@/components/brand/ServoraBrand";

interface OwnerLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard Overview", icon: "dashboard" },
  { href: "/dashboard/settings", label: "Restaurant Settings", icon: "store" },
  { href: "/dashboard/menu", label: "Menu & Pricing", icon: "restaurant_menu" },
  { href: "/dashboard/qr", label: "QR Code Studio", icon: "qr_code_2" },
  { href: "/dashboard/staff", label: "Staff Accounts", icon: "badge" },
  { href: "/dashboard/orders", label: "Order History", icon: "receipt_long" },
  { href: "/dashboard/requests", label: "Service Log", icon: "notifications" },
  { href: "/dashboard/feedback", label: "Customer Reviews", icon: "star" },
  { href: "/dashboard/customers", label: "Customer Directory", icon: "group" },
  { href: "/dashboard/loyalty", label: "Loyalty Program", icon: "military_tech" },
];

export default function OwnerLayout({ children }: OwnerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("Owner");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          const isOwner = data.user?.role === "owner" || data.activeRoles?.owner;
          if (isOwner) {
            setOwnerName(data.activeRoles?.owner?.name || data.user?.name || "Owner");
          } else {
            router.push(data.user?.role === "waiter" || data.activeRoles?.waiter ? "/waiter" : "/kitchen");
          }
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout?type=staff", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row font-sans text-on-surface">
      {/* Mobile Top Navbar (Visible on < 1024px) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 px-3.5 sm:px-4 py-2.5 flex items-center justify-between shadow-xs h-14">
        <ServoraBrand size="sm" showTagline={false} />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5 text-on-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-on-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* 260px Responsive Sidebar (Fixed desktop, Drawer on mobile) */}
      <aside
        className={`w-64 bg-surface-container-low border-r border-outline-variant/30 flex flex-col justify-between fixed top-0 bottom-0 left-0 z-50 shadow-md lg:shadow-xs transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo & Brand Header */}
          <div className="p-4 flex items-center justify-between border-b border-outline-variant/20">
            <ServoraBrand size="md" />
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
            >
              <svg className="w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Branch Pill */}
          <div className="p-3">
            <div className="px-3 py-2 rounded-xl bg-surface-container flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-on-surface">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Gulberg Flagship</span>
              </div>
              <span className="text-primary text-[11px] font-extrabold uppercase">Live</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1 px-3 py-2 overflow-y-auto max-h-[calc(100vh-210px)] no-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors ${
                    isActive
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Sign Out */}
        <div className="p-3 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-lg">person</span>
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-on-surface truncate">{ownerName}</div>
              <div className="text-[10px] text-on-surface-variant font-medium">Restaurant Admin</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors text-on-surface-variant"
            title="Log Out"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area Offset by Sidebar (lg:pl-64) & Top bar on mobile (pt-14) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen pt-14 lg:pt-0 w-full min-w-0">
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}

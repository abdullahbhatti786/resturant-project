"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ServoraBrand from "@/components/brand/ServoraBrand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple rapid clicks
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      // Successful login -> Redirect based on role
      router.push(data.redirect || "/dashboard");
    } catch {
      setError("Network error. Please ensure server is running.");
      setLoading(false);
    }
  };

  const handleInstantLogin = async (roleEmail: string, rolePass: string) => {
    if (loading) return; // Prevent multiple clicks race condition
    setError(null);
    setLoading(true);
    setEmail(roleEmail);
    setPassword(rolePass);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: roleEmail, password: rolePass }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      router.push(data.redirect || "/dashboard");
    } catch {
      setError("Network error. Please ensure server is running.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <ServoraBrand size="lg" className="mb-2" />
        <p className="text-xs font-semibold text-on-surface-variant mt-1">
          Hospitality Operating System • Staff &amp; Management Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-on-surface">Welcome back</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Sign in with your restaurant staff credentials to access your station.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider">
              Staff Email
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-lg">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. owner@cafelahore.pk"
                className="w-full h-12 pl-10 pr-4 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-lg">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-4 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Instant Login Buttons for Presentation */}
        <div className="mt-8 pt-6 border-t border-outline-variant/20">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              1-Click Instant Demo Login
            </span>
            <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
              Single Click
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleInstantLogin("owner@cafelahore.pk", "admin123")}
              className="py-2.5 px-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface text-center transition-all border border-outline-variant/30 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1 shadow-2xs"
            >
              <span className="text-base">👑</span>
              <span className="leading-tight">Owner</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleInstantLogin("waiter@cafelahore.pk", "waiter123")}
              className="py-2.5 px-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface text-center transition-all border border-outline-variant/30 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1 shadow-2xs"
            >
              <span className="text-base">🚶</span>
              <span className="leading-tight">Waiter</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleInstantLogin("kitchen@cafelahore.pk", "kitchen123")}
              className="py-2.5 px-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface text-center transition-all border border-outline-variant/30 active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1 shadow-2xs"
            >
              <span className="text-base">👨‍🍳</span>
              <span className="leading-tight">Kitchen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guest QR Experience Hint */}
      <div className="mt-6 text-center">
        <a
          href="/r/cafe-lahore"
          className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">qr_code_scanner</span>
          <span>Open Customer Mobile QR Portal (/r/cafe-lahore)</span>
        </a>
      </div>
    </div>
  );
}

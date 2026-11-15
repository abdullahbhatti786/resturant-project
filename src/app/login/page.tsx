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
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-3 sm:px-4 py-6 sm:py-10">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-5 sm:mb-6 text-center">
        <ServoraBrand size="lg" className="mb-2" />
        <p className="text-xs font-semibold text-on-surface-variant mt-1 text-center max-w-xs sm:max-w-md">
          Hospitality Operating System • Staff &amp; Management Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm sm:max-w-md bg-surface-container-lowest rounded-2xl sm:rounded-3xl border border-outline-variant/40 p-5 sm:p-8 shadow-xl">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface">Welcome back</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Sign in with your restaurant staff credentials to access your station.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 sm:p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-bold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="break-words">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider">
              Staff Email
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-on-surface-variant pointer-events-none flex items-center">
                <svg className="w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. owner@cafelahore.pk"
                className="w-full h-11 sm:h-12 pl-10 pr-3 sm:pr-4 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface text-xs sm:text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-on-surface-variant pointer-events-none flex items-center">
                <svg className="w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 sm:h-12 pl-10 pr-3 sm:pr-4 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface text-xs sm:text-sm focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 sm:h-12 mt-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
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

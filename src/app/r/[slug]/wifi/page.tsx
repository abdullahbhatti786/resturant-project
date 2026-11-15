"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CustomerLayout from "@/components/layouts/CustomerLayout";

export default function CustomerWifiPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "cafe-lahore";

  const [wifi, setWifi] = useState<{ name: string; pass: string; restaurantName: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/r/${slug}/info`);
        const data = await res.json();
        const rest = data.restaurant || data;
        if (rest && (rest.name || rest.wifiName)) {
          setWifi({
            name: rest.wifiName || "CafeLahore_Guest",
            pass: rest.wifiPassword || "lahore123",
            restaurantName: rest.name || "Café Lahore",
          });
        }
      } catch (err) {
        console.error("Wifi info error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [slug]);

  const handleCopy = () => {
    if (!wifi?.pass) return;
    navigator.clipboard.writeText(wifi.pass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CustomerLayout restaurantName={wifi?.restaurantName}>
      <div className="p-4 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link
            href={`/r/${slug}/menu`}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </Link>
          <h2 className="font-bold text-base text-on-surface">Complimentary Wi-Fi</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">Connecting to Wi-Fi setup...</div>
        ) : !wifi ? (
          <div className="p-8 text-center text-xs text-rose-600">Wi-Fi information not available.</div>
        ) : (
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">wifi</span>
            </div>

            <h3 className="font-extrabold text-base text-on-surface">{wifi.restaurantName} High-Speed Guest Wi-Fi</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
              Enjoy unlimited high-speed internet while your food is being cooked fresh.
            </p>

            <div className="w-full my-6 p-4 rounded-2xl bg-surface border border-outline-variant/30 text-left space-y-3">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Wi-Fi Network (SSID)
                </p>
                <p className="text-sm font-bold text-on-surface mt-0.5">{wifi.name}</p>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Password
                  </p>
                  <p className="text-sm font-mono font-extrabold text-primary mt-0.5">{wifi.pass}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copied ? "done" : "content_copy"}
                  </span>
                  <span>{copied ? "Copied!" : "Copy Password"}</span>
                </button>
              </div>
            </div>

            <div className="w-full space-y-2">
              <Link
                href={`/r/${slug}/games`}
                className="w-full py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-primary text-base">sports_esports</span>
                <span>Play Entertainment Games</span>
              </Link>

              <Link
                href={`/r/${slug}/menu`}
                className="w-full py-3 rounded-2xl bg-primary-container/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Return to Menu</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";

export default function OwnerQRPage() {
  const [qrData, setQrData] = useState<{
    qrDataUrl: string;
    qrSvg: string;
    targetUrl: string;
    restaurantName: string;
    slug: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQR();
  }, []);

  const fetchQR = async () => {
    try {
      const res = await fetch("/api/owner/qr");
      const data = await res.json();
      if (data.success) {
        setQrData(data);
      }
    } catch (err) {
      console.error("QR load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPNG = () => {
    if (!qrData?.qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrData.qrDataUrl;
    a.download = `${qrData.slug}-table-qr.png`;
    a.click();
  };

  const handleDownloadSVG = () => {
    if (!qrData?.qrSvg) return;
    const blob = new Blob([qrData.qrSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${qrData.slug}-table-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <OwnerLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface">Universal Table QR Code</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Every table displays this QR code. Diners scan it with their phone camera to pick their table and start ordering.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-medium">
            Generating printable QR Code...
          </div>
        ) : !qrData ? (
          <div className="p-12 text-center text-rose-600 font-medium">
            Failed to generate QR code.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Table Tent Card Mockup */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-lg flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-container/15 flex items-center justify-center text-primary mb-3">
                <span className="material-symbols-outlined text-2xl">local_cafe</span>
              </div>

              <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
                {qrData.restaurantName}
              </h2>
              <p className="text-xs font-semibold text-primary mt-0.5 uppercase tracking-wider">
                Scan to Order • Wi-Fi • Games
              </p>

              {/* QR Image Box */}
              <div className="my-6 p-4 rounded-2xl bg-white border border-outline-variant/40 shadow-xs">
                <img
                  src={qrData.qrDataUrl}
                  alt="Restaurant QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">qr_code_scanner</span>
                <span>Camera Point Karein • No App Needed</span>
              </div>
            </div>

            {/* Action & Info Panel */}
            <div className="space-y-6">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-on-surface mb-2">QR Destination URL</h3>
                <div className="p-3 rounded-xl bg-surface border border-outline-variant/30 text-xs font-mono text-on-surface break-all mb-3 select-all">
                  {qrData.targetUrl}
                </div>
                <a
                  href={qrData.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span>Open Customer Mobile Portal</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-on-surface">Print & Export Options</h3>
                <p className="text-xs text-on-surface-variant">
                  Download high-resolution assets to print table stickers, tent cards, or counter displays.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadPNG}
                    className="p-3.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>Download PNG</span>
                  </button>

                  <button
                    onClick={handleDownloadSVG}
                    className="p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    <span>Vector SVG</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary-container/10 border border-primary-container/20 text-xs text-on-surface flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">
                  info
                </span>
                <p>
                  <strong>Same-WiFi Testing Tip:</strong> If testing from your phone, ensure your phone is connected to the same Wi-Fi and that <code className="bg-surface px-1 py-0.5 rounded">NEXT_PUBLIC_APP_URL</code> is set to your Mac&apos;s local IP (e.g. <code className="bg-surface px-1 py-0.5 rounded">http://192.168.x.x:3000</code>).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}

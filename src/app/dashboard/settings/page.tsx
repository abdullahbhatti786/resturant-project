"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";

interface RestaurantSettings {
  name: string;
  slug: string;
  address: string;
  wifiName: string;
  wifiPassword: string;
  tableCount: number;
  logo: string;
  enabledGames: {
    tictactoe: boolean;
    memory: boolean;
    quiz: boolean;
  };
  loyaltyRules: {
    requiredVisits: number;
    withinDays: number;
    giftDescription: string;
    rewardExpiryDays: number;
  };
}

export default function OwnerSettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/owner/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.restaurant);
      }
    } catch {
      setMessage({ text: "Failed to load restaurant settings", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/owner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.restaurant);
        setMessage({ text: "Settings updated successfully!", type: "success" });
      } else {
        setMessage({ text: data.message || "Failed to update settings", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error while saving settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploadingLogo(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/owner/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings({ ...settings, logo: data.url });
        setMessage({ text: "Logo uploaded! Click 'Save Changes' to apply.", type: "success" });
      } else {
        setMessage({ text: data.message || "Logo upload failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to upload logo file", type: "error" });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Restaurant Settings</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Configure your establishment profile, guest Wi-Fi, table capacity, and dining features.
            </p>
          </div>
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
          <div className="p-12 text-center text-on-surface-variant font-medium">
            Loading settings...
          </div>
        ) : !settings ? (
          <div className="p-12 text-center text-rose-600 font-medium">Settings not found.</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* General Profile Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs">
              <h2 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">store</span>
                Establishment Profile
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Restaurant Slug (URL identifier)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={settings.slug}
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-high px-3.5 py-2.5 text-sm text-on-surface-variant cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. 42-C Gulberg III, Lahore, Pakistan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Active Floor Tables (1 - 100)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.tableCount}
                    onChange={(e) =>
                      setSettings({ ...settings, tableCount: Number(e.target.value) || 1 })
                    }
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Restaurant Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={settings.logo || "/images/placeholder-logo.svg"}
                      alt="Logo preview"
                      className="w-10 h-10 rounded-xl object-cover border border-outline-variant/40 bg-surface"
                    />
                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors">
                      {uploadingLogo ? "Uploading..." : "Change Logo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Wi-Fi Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs">
              <h2 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">wifi</span>
                Guest Wi-Fi Setup
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Wi-Fi Network SSID
                  </label>
                  <input
                    type="text"
                    value={settings.wifiName}
                    onChange={(e) => setSettings({ ...settings, wifiName: e.target.value })}
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. CafeLahore_Guest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    value={settings.wifiPassword}
                    onChange={(e) => setSettings({ ...settings, wifiPassword: e.target.value })}
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. lahore123"
                  />
                </div>
              </div>
            </div>

            {/* Games & Digital Amenities */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs">
              <h2 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">sports_esports</span>
                Customer Entertainment Games
              </h2>
              <p className="text-xs text-on-surface-variant mb-4">
                Toggle games available for customers waiting at tables.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enabledGames.tictactoe}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enabledGames: { ...settings.enabledGames, tictactoe: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-on-surface">Tic-Tac-Toe</p>
                    <p className="text-[11px] text-on-surface-variant">2 Players</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enabledGames.memory}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enabledGames: { ...settings.enabledGames, memory: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-on-surface">Memory Match</p>
                    <p className="text-[11px] text-on-surface-variant">Card Flip</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enabledGames.quiz}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enabledGames: { ...settings.enabledGames, quiz: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-on-surface">Desi Quiz</p>
                    <p className="text-[11px] text-on-surface-variant">Trivia</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </OwnerLayout>
  );
}

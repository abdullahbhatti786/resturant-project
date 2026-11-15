"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CustomerLayout from "@/components/layouts/CustomerLayout";

export default function CustomerEntryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "cafe-lahore";

  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tableCount, setTableCount] = useState(20);
  const [restaurantName, setRestaurantName] = useState("Café Lahore");

  useEffect(() => {
    // Check if table already selected in session
    const stored = sessionStorage.getItem(`servora_${slug}_table`);
    if (stored) setSelectedTable(Number(stored));

    // Fetch restaurant table count
    fetch(`/api/r/${slug}/info`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) {
          if (data.tableCount) setTableCount(data.tableCount);
          if (data.name) setRestaurantName(data.name);
        }
      })
      .catch(() => {});
  }, [slug]);

  const handleSelectTable = (tbl: number) => {
    setSelectedTable(tbl);
    sessionStorage.setItem(`servora_${slug}_table`, String(tbl));
  };

  const handleContinue = () => {
    if (!selectedTable) return;
    router.push(`/r/${slug}/menu`);
  };

  return (
    <CustomerLayout restaurantName={restaurantName} tableNumber={selectedTable}>
      <div className="p-4 flex flex-col gap-4">
        {/* Welcome Lead */}
        <div className="flex flex-col gap-1">
          <span className="font-bold text-xs uppercase tracking-wider text-primary">
            Dine-In Session
          </span>
          <h2 className="text-xl font-extrabold text-on-surface">Welcome! Select your table</h2>
          <p className="text-xs text-on-surface-variant">
            Confirm the table number matching the wooden pedestal at your seat.
          </p>
        </div>

        {/* Table Matrix */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {Array.from({ length: tableCount }, (_, i) => i + 1).map((tbl) => {
            const isSelected = selectedTable === tbl;
            return (
              <button
                key={tbl}
                type="button"
                onClick={() => handleSelectTable(tbl)}
                className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? "bg-primary-container text-on-primary font-black shadow-md scale-105 z-10"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface font-bold"
                }`}
              >
                <span className="text-sm">T-{tbl}</span>
                <span className="text-[10px] opacity-80">
                  {isSelected ? "Selected" : "Open"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Table Callout */}
        {selectedTable && (
          <div className="p-3.5 rounded-xl bg-tertiary-container/15 border border-tertiary-container/40 flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-xl">sensors</span>
              <span className="text-xs font-bold text-on-surface">
                Table #{selectedTable} Connected
              </span>
            </div>
            <span className="text-xs font-bold text-tertiary">Ready to Dine</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          <button
            type="button"
            disabled={!selectedTable}
            onClick={handleContinue}
            className="w-full h-12 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{selectedTable ? `Continue to Menu (Table ${selectedTable})` : "Please Pick a Table"}</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </CustomerLayout>
  );
}

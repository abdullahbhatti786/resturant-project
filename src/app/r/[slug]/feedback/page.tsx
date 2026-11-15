"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CustomerLayout from "@/components/layouts/CustomerLayout";

export default function CustomerFeedbackPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "cafe-lahore";

  const [table, setTable] = useState<string | null>(null);
  const [ratings, setRatings] = useState({
    food: 5,
    service: 5,
    cleanliness: 5,
    waitingTime: 5,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`servora_${slug}_table`);
      if (stored) setTable(stored);
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          tableNumber: Number(table) || 1,
          ratings,
          comment,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || "Failed to submit review");
      }
    } catch {
      setErrorMsg("Network error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarPicker = (category: keyof typeof ratings, label: string) => {
    const currentVal = ratings[category];
    return (
      <div className="flex items-center justify-between py-2 border-b border-outline-variant/20 last:border-0">
        <span className="text-xs font-bold text-on-surface">{label}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRatings({ ...ratings, [category]: star })}
              className="p-1 transition-transform active:scale-125"
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  star <= currentVal ? "text-amber-500 fill-1" : "text-outline-variant"
                }`}
              >
                star
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <CustomerLayout tableNumber={table}>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/r/${slug}/menu`}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </Link>
          <h2 className="font-bold text-base text-on-surface">Dining Feedback</h2>
        </div>

        {submitted ? (
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-8 shadow-sm text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">sentiment_very_satisfied</span>
            </div>
            <h3 className="font-extrabold text-base text-on-surface">Shukriya! Thank You!</h3>
            <p className="text-xs text-on-surface-variant mt-1 mb-6 max-w-xs">
              Your honest feedback helps our chefs and floor captain serve you even better next time.
            </p>
            <Link
              href={`/r/${slug}/menu`}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs"
            >
              Back to Menu
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 shadow-xs">
              <h3 className="font-bold text-xs text-on-surface mb-3">Rate Your Experience (Table {table || 1})</h3>
              {renderStarPicker("food", "Food & Taste")}
              {renderStarPicker("service", "Captain Service")}
              {renderStarPicker("cleanliness", "Table Cleanliness")}
              {renderStarPicker("waitingTime", "Food Preparation Speed")}
            </div>

            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 shadow-xs">
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                Any comments or suggestions for the Chef? (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Karahi was amazing! Need extra napkins next time..."
                className="w-full rounded-xl border border-outline-variant/50 bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-primary text-on-primary font-bold text-sm shadow-md hover:opacity-95 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span>{submitting ? "Submitting Review..." : "Submit Feedback"}</span>
            </button>
          </form>
        )}
      </div>
    </CustomerLayout>
  );
}

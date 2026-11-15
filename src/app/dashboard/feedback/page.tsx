"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";

interface FeedbackItem {
  _id: string;
  tableNumber: number;
  customerId?: { name?: string; email?: string } | null;
  ratings: {
    food: number;
    service: number;
    cleanliness: number;
    waitingTime: number;
  };
  comment: string;
  createdAt: string;
}

export default function OwnerFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [averages, setAverages] = useState<{
    food: number;
    service: number;
    cleanliness: number;
    waitingTime: number;
    totalCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedbacks);
        setAverages(data.averages);
      }
    } catch (err) {
      console.error("Feedback load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-surface">Guest Reviews & Feedback</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real customer impressions on food flavor, service speed, and dining environment.
          </p>
        </div>

        {/* Scorecard Averages */}
        {averages && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                Food & Taste
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-extrabold text-on-surface">{averages.food}</span>
                <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                Captain Service
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-extrabold text-on-surface">{averages.service}</span>
                <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                Cleanliness
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-extrabold text-on-surface">
                  {averages.cleanliness}
                </span>
                <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                Serving Speed
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-extrabold text-on-surface">
                  {averages.waitingTime}
                </span>
                <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-medium">Loading feedback...</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
              reviews
            </span>
            <p className="font-bold text-sm text-on-surface">No feedback submitted yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbacks.map((fb) => (
              <div
                key={fb._id}
                className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-primary-container text-on-primary font-bold text-xs">
                      Table {fb.tableNumber}
                    </span>
                    <span className="font-bold text-xs text-on-surface">
                      {fb.customerId ? fb.customerId.name : "Guest Diner"}
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs bg-surface p-2 rounded-xl">
                  <span>Food: <strong>{fb.ratings?.food}★</strong></span>
                  <span>Service: <strong>{fb.ratings?.service}★</strong></span>
                  <span>Clean: <strong>{fb.ratings?.cleanliness}★</strong></span>
                  <span>Speed: <strong>{fb.ratings?.waitingTime}★</strong></span>
                </div>

                {fb.comment && (
                  <p className="text-xs text-on-surface-variant italic">&quot;{fb.comment}&quot;</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}

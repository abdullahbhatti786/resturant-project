"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";

interface ServiceReqItem {
  _id: string;
  tableNumber: number;
  type: string;
  note: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function OwnerRequestsPage() {
  const [requests, setRequests] = useState<ServiceReqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/service-requests");
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Requests load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface">Floor Service Requests</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Audit log of all waiter calls, water refills, and bill requests made by table diners.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-medium">Loading requests log...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
              notifications_none
            </span>
            <p className="font-bold text-sm text-on-surface">No service requests recorded yet.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="py-3.5 px-5">Table</th>
                    <th className="py-3.5 px-5">Request Type</th>
                    <th className="py-3.5 px-5">Special Note</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Requested At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-4 px-5 font-extrabold text-on-surface">
                        Table {req.tableNumber}
                      </td>
                      <td className="py-4 px-5">
                        <span className="capitalize font-bold text-on-surface">{req.type}</span>
                      </td>
                      <td className="py-4 px-5 text-on-surface-variant">
                        {req.note || "Standard request"}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            req.status === "resolved"
                              ? "bg-emerald-100 text-emerald-900"
                              : req.status === "in_progress"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-on-surface-variant text-[11px]">
                        {new Date(req.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}

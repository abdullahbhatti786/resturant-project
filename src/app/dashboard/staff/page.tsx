"use client";

import React, { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "waiter" | "kitchen";
  active: boolean;
  createdAt: string;
}

export default function OwnerStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "waiter" as "waiter" | "kitchen",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/owner/staff");
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff);
      }
    } catch {
      setMessage({ text: "Failed to load staff list", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    if (member.role === "owner") return;
    try {
      const res = await fetch("/api/owner/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member._id, active: !member.active }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStaff((prev) =>
          prev.map((s) => (s._id === member._id ? { ...s, active: data.user.active } : s))
        );
      } else {
        alert(data.message || "Failed to update staff status");
      }
    } catch {
      alert("Error updating staff member");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || form.password.length < 6) return;
    setCreating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStaff((prev) => [data.user, ...prev]);
        setShowModal(false);
        setForm({ name: "", email: "", password: "", role: "waiter" });
        setMessage({ text: `Account created for ${data.user.name}`, type: "success" });
      } else {
        setMessage({ text: data.message || "Failed to create account", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error creating staff account", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Staff & Team Accounts</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Manage floor captain (waiter) and kitchen display (chef) credentials.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-primary hover:opacity-95 text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Add Team Member</span>
          </button>
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
            Loading team roster...
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="py-3.5 px-5">Staff Member</th>
                    <th className="py-3.5 px-5">Email Address</th>
                    <th className="py-3.5 px-5">Assigned Role</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs">
                  {staff.map((member) => (
                    <tr key={member._id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface">
                            {member.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="font-bold text-on-surface">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono text-on-surface-variant">
                        {member.email}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            member.role === "owner"
                              ? "bg-amber-100 text-amber-900"
                              : member.role === "waiter"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-purple-100 text-purple-900"
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {member.role === "owner"
                              ? "badge"
                              : member.role === "waiter"
                              ? "room_service"
                              : "skillet"}
                          </span>
                          <span className="capitalize">{member.role}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            member.active
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-rose-50 text-rose-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.active ? "bg-emerald-600" : "bg-rose-600"
                            }`}
                          />
                          <span>{member.active ? "Active" : "Disabled"}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {member.role === "owner" ? (
                          <span className="text-[11px] font-semibold text-on-surface-variant/60">
                            Permanent Owner
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(member)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              member.active
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {member.active ? "Disable Account" : "Activate Account"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Staff Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-base text-on-surface mb-4">Add New Team Member</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Asad Floor Captain"
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. captain2@cafelahore.pk"
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Password (min 6 characters) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Staff Role *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        form.role === "waiter"
                          ? "border-primary bg-primary-container/10 text-primary font-bold"
                          : "border-outline-variant/40 bg-surface text-on-surface"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="waiter"
                        checked={form.role === "waiter"}
                        onChange={() => setForm({ ...form, role: "waiter" })}
                        className="hidden"
                      />
                      <span className="material-symbols-outlined text-xl">room_service</span>
                      <span className="text-xs">Waiter / Captain</span>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        form.role === "kitchen"
                          ? "border-primary bg-primary-container/10 text-primary font-bold"
                          : "border-outline-variant/40 bg-surface text-on-surface"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="kitchen"
                        checked={form.role === "kitchen"}
                        onChange={() => setForm({ ...form, role: "kitchen" })}
                        className="hidden"
                      />
                      <span className="material-symbols-outlined text-xl">skillet</span>
                      <span className="text-xs">Kitchen / Chef</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-surface-container text-xs font-bold text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl bg-primary text-xs font-bold text-on-primary disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}

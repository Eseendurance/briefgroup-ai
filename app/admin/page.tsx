"use client";

import { Database, ShieldCheck, Users } from "lucide-react";
import { ProtectedRoute } from "@/app/lib/auth";

const adminItems = [
  {
    title: "Users",
    value: "Firebase Auth",
    detail: "Manage real accounts from Firebase Console or a future admin API.",
    icon: Users,
  },
  {
    title: "Security Rules",
    value: "Defined",
    detail: "Owner-scoped Firestore and Storage rules must be published in Firebase.",
    icon: ShieldCheck,
  },
  {
    title: "Data",
    value: "Firestore",
    detail: "Account profiles, saved reports, inspection metadata, and signed-in AI interactions.",
    icon: Database,
  },
];

function AdminContent() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-800">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-800">
          Admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">Control Panel</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {adminItems.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <item.icon className="h-6 w-6 text-emerald-700" />
              <p className="mt-5 text-sm text-slate-500">{item.title}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              <p className="mt-4 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminContent />
    </ProtectedRoute>
  );
}

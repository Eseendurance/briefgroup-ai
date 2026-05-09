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
    value: "Locked",
    detail: "Firestore and Storage rules are included in the repository.",
    icon: ShieldCheck,
  },
  {
    title: "Data",
    value: "Firestore",
    detail: "Inspection records, reports, and account metadata should live here.",
    icon: Database,
  },
];

function AdminContent() {
  return (
    <main className="min-h-screen bg-[#07110f] px-5 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-200/70">
          Admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Control Panel</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {adminItems.map((item) => (
            <article
              key={item.title}
              className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
            >
              <item.icon className="h-6 w-6 text-emerald-300" />
              <p className="mt-5 text-sm text-white/60">{item.title}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              <p className="mt-4 text-sm leading-6 text-white/65">{item.detail}</p>
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

"use client";

import {
  ArrowRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const contactMethods = [
  {
    label: "Email",
    value: "briefgroup1@gmail.com",
    href: "mailto:briefgroup1@gmail.com",
    icon: Mail,
    color: "from-emerald-300 to-teal-500",
  },
  {
    label: "Phone / WhatsApp",
    value: "+2348152158339",
    href: "tel:+2348152158339",
    icon: Phone,
    color: "from-sky-300 to-blue-500",
  },
  {
    label: "Customer Care",
    value: "Chat with the AI assistant",
    href: "/customer-care",
    icon: MessageCircle,
    color: "from-fuchsia-300 to-violet-500",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f7fdff_0%,#e8fff2_38%,#edf4ff_70%,#fff8e7_100%)] text-[#102027]">
      <nav className="border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <Image
              src="/brief-group-logo.svg"
              alt="Brief Group logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg object-cover"
            />
            Brief Group
          </Link>
          <Link
            href="/customer-care"
            className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Customer Care
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Contact Us
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
            Talk to Brief Group.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-700">
            Contact our team for pilot onboarding, product questions,
            partnerships, support, or enterprise deployment discussions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-lg border border-white bg-white/75 p-6 shadow-2xl shadow-blue-100/70 backdrop-blur-xl"
        >
          <div className="grid gap-4">
            {contactMethods.map((method) => (
              <a
                key={method.label}
                href={method.href}
                className="group flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-white/80 p-5 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${method.color} text-white`}
                  >
                    <method.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm text-slate-500">{method.label}</p>
                    <p className="font-semibold text-[#102027]">
                      {method.value}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-emerald-600" />
              </a>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-16 md:grid-cols-3">
        {[
          {
            icon: Clock,
            title: "Response",
            detail: "Use email, phone, or the AI assistant for quick support.",
          },
          {
            icon: MapPin,
            title: "Pilot Focus",
            detail: "Energy, farming, reports, inspection, and fault detection.",
          },
          {
            icon: MessageCircle,
            title: "Chatbot",
            detail: "Ask common questions instantly on the customer care page.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-white bg-white/70 p-6 shadow-xl shadow-slate-200/70 backdrop-blur-xl"
          >
            <item.icon className="h-6 w-6 text-emerald-700" />
            <h2 className="mt-5 text-2xl font-semibold">{item.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{item.detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  CloudSun,
  FileText,
  Lock,
  Play,
  Radar,
  ShoppingCart,
  Sprout,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    title: "Energy Monitoring",
    detail:
      "Real-time energy visibility, usage verification, site benchmarking, and consumption alerts.",
    icon: Zap,
    accent: "from-yellow-300 to-orange-400",
  },
  {
    title: "Smart Farm Prediction",
    detail:
      "Weather, soil, irrigation, crop-health, and yield-risk intelligence for modern farms.",
    icon: Sprout,
    accent: "from-lime-300 to-emerald-500",
  },
  {
    title: "AI Fault Detection",
    detail:
      "Predict machine and infrastructure failures before downtime reaches operations.",
    icon: AlertTriangle,
    accent: "from-rose-300 to-red-500",
  },
  {
    title: "Automated Reports",
    detail:
      "Generate boardroom-ready energy, farm, inspection, and maintenance reports.",
    icon: FileText,
    accent: "from-sky-300 to-blue-500",
  },
  {
    title: "Computer Vision Inspection",
    detail:
      "Upload visual evidence and queue AI-assisted field inspection workflows.",
    icon: Camera,
    accent: "from-fuchsia-300 to-violet-500",
  },
  {
    title: "Digital Marketplace",
    detail:
      "Coming soon: trusted energy equipment, smart farm tools, services, and partners.",
    icon: ShoppingCart,
    accent: "from-amber-300 to-orange-500",
  },
];

const roadmap = [
  ["Pilot Launch", "Live accounts, protected dashboard, reports, inspections"],
  ["Field Intelligence", "Weather, farm signals, energy verification, alerts"],
  ["Automation Layer", "Scheduled reports, fault scoring, admin workflows"],
  ["Marketplace", "Coming soon after pilot validation"],
];

const metrics = [
  ["6", "Core SaaS modules"],
  ["24/7", "Monitoring posture"],
  ["10MB", "Inspection uploads"],
  ["100%", "Protected routes"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5fbff] text-[#102027]">
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <Image
              src="/brief-group-logo.svg"
              alt="Brief Group logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg object-cover"
            />
            <span className="text-lg tracking-wide">Brief Group</span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-slate-700 md:flex">
            <a href="#features" className="transition hover:text-emerald-700">
              Platform
            </a>
            <a href="#showcase" className="transition hover:text-emerald-700">
              Dashboard
            </a>
            <a href="#roadmap" className="transition hover:text-emerald-700">
              Roadmap
            </a>
            <Link
              href="/customer-care"
              className="transition hover:text-emerald-700"
            >
              Customer Care
            </Link>
            <Link href="/contact" className="transition hover:text-emerald-700">
              Contact
            </Link>
          </div>

          <Link
            href="/login"
            className="rounded-lg bg-[#102027] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#18363f]"
          >
            Launch Dashboard
          </Link>
        </div>
      </nav>

      <section className="relative min-h-[94vh] overflow-hidden px-5 pt-28">
        <HeroMotionScene />
        <div className="relative z-10 mx-auto flex min-h-[calc(94vh-7rem)] max-w-7xl flex-col justify-center pb-20">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-tight text-[#102027] md:text-7xl"
          >
            AI operations for energy, farming, inspections, and industrial risk.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 md:text-xl"
          >
            Brief Group gives pilot teams a secure command center for live
            energy monitoring, smart farm prediction, AI fault detection,
            automated reports, and computer vision inspection.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-4 font-semibold text-white shadow-xl shadow-emerald-500/25 transition hover:bg-emerald-600"
            >
              Start Pilot Program
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href="#showcase"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/75 px-6 py-4 font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              View Dashboard
            </a>
            <Link
              href="/customer-care"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-6 py-4 font-semibold text-emerald-800 shadow-sm backdrop-blur transition hover:bg-emerald-100"
            >
              Ask AI Assistant
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="-mt-6 border-y border-white/70 bg-white/70 px-5 py-8 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(([value, label], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg border border-white bg-white/75 p-5 shadow-xl shadow-slate-200/60 backdrop-blur"
            >
              <p className="text-3xl font-semibold text-[#102027]">{value}</p>
              <p className="mt-1 text-sm text-slate-600">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Product Suite
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#102027] md:text-6xl">
              One sidebar. Six core products. Real pilot workflows.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -6 }}
                className="relative overflow-hidden rounded-lg border border-white bg-white/70 p-6 shadow-xl shadow-slate-200/70 backdrop-blur-xl"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.accent}`}
                />
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.accent} text-white shadow-lg`}
                >
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-[#102027]">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {feature.detail}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="showcase"
        className="bg-gradient-to-b from-white to-[#e7f8ff] px-5 py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
              Dashboard Showcase
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#102027] md:text-6xl">
              Built for users to start a real pilot, not just watch a demo.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-700">
              Sign up, launch the dashboard, move through the product sidebar,
              upload inspection evidence, generate reports, and evaluate farm
              and energy signals from the same command center.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                "Firebase user accounts and protected routes",
                "Live weather API and AI report endpoints",
                "Responsive glassmorphism dashboard UI",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2
                    className="h-5 w-5 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="rounded-lg border border-white bg-white/70 p-4 shadow-2xl shadow-blue-200/60 backdrop-blur-xl"
          >
            <DashboardShowcase />
          </motion.div>
        </div>
      </section>

      <section id="roadmap" className="px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Interactive Roadmap
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[#102027] md:text-6xl">
                A practical path from pilot to global operations.
              </h2>
            </div>
            <Link
              href="/login"
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#102027] px-5 py-3 font-semibold text-white"
            >
              Join pilot
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {roadmap.map(([title, detail], index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-lg border border-white bg-white/75 p-6 shadow-xl shadow-slate-200/70 backdrop-blur-xl"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 font-semibold text-emerald-800">
                  {index + 1}
                </span>
                <h3 className="mt-6 text-xl font-semibold text-[#102027]">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{detail}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24">
        <div className="mx-auto overflow-hidden rounded-lg bg-[#102027] p-8 text-white shadow-2xl shadow-slate-300/80 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">
                Brief Group Pilot
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
                Launch the dashboard and begin onboarding real users.
              </h2>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 font-semibold text-[#102027]"
            >
              Launch Dashboard
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-6 py-4 font-semibold text-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroMotionScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,#f7fdff_0%,#e8fff2_36%,#eaf2ff_68%,#fff8e7_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#f5fbff] to-transparent" />

      <motion.div
        animate={{ x: [0, 18, 0], y: [0, -14, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[8%] top-[18%] hidden w-[560px] rounded-lg border border-white bg-white/55 p-4 shadow-2xl shadow-emerald-200/60 backdrop-blur-xl lg:block"
      >
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Live operations
            </span>
            <Radar className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Energy", "92%"],
              ["Farm", "88%"],
              ["Fault", "Low"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white/75 p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#102027]">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="h-32 rounded-lg bg-[linear-gradient(90deg,#34d399_12%,#38bdf8_34%,#fbbf24_56%,#f472b6_78%,#34d399_100%)] opacity-80" />
        </div>
      </motion.div>

      <motion.div
        animate={{ x: [0, -16, 0], y: [0, 18, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[18%] right-[18%] hidden w-72 rounded-lg border border-white bg-white/50 p-4 shadow-xl shadow-blue-200/50 backdrop-blur-xl md:block"
      >
        <div className="flex items-center gap-3">
          <CloudSun className="h-9 w-9 text-sky-500" />
          <div>
            <p className="text-sm font-semibold text-[#102027]">
              Weather signal
            </p>
            <p className="text-sm text-slate-600">Field risk stable</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardShowcase() {
  return (
    <div className="overflow-hidden rounded-lg bg-[#102027] text-white">
      <div className="grid min-h-[520px] lg:grid-cols-[230px_1fr]">
        <aside className="bg-white/10 p-4">
          <p className="text-sm font-semibold">Brief Group</p>
          <div className="mt-6 space-y-2">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${
                  index === 0 ? "bg-white text-[#102027]" : "text-white/75"
                }`}
              >
                <feature.icon className="h-4 w-4" />
                <span>{feature.title}</span>
              </div>
            ))}
          </div>
        </aside>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">
                Pilot Command
              </p>
              <h3 className="mt-2 text-3xl font-semibold">
                Energy Monitoring
              </h3>
            </div>
            <Lock className="h-5 w-5 text-emerald-200" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Load", "62%"],
              ["Crop Health", "91%"],
              ["Reports", "Ready"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white/10 p-4">
                <p className="text-sm text-white/55">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-lg bg-white/10 p-4">
              <BarChart3 className="h-5 w-5 text-emerald-200" />
              <div className="mt-6 flex h-44 items-end gap-3">
                {[44, 58, 49, 72, 64, 61].map((height, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="w-full rounded-t bg-gradient-to-t from-emerald-300 to-cyan-200"
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <p className="font-semibold">Automated Report</p>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Current status is stable with energy, farm, inspection, and
                machine risk signals ready for pilot review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

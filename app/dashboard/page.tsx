"use client";

import {
  Activity,
  CloudSun,
  Cpu,
  FileText,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProtectedRoute, useAuth } from "@/app/lib/auth";

const energyData = [
  { month: "Jan", energy: 40, inspections: 12 },
  { month: "Feb", energy: 55, inspections: 18 },
  { month: "Mar", energy: 48, inspections: 21 },
  { month: "Apr", energy: 70, inspections: 25 },
  { month: "May", energy: 62, inspections: 31 },
  { month: "Jun", energy: 58, inspections: 37 },
];

type Report = {
  operationalScore: number;
  status: string;
  summary: string;
  recommendations: string[];
};

type InspectionResult = {
  inspectionId: string;
  status: string;
  risk: string;
  engine: string;
};

function DashboardContent() {
  const { user, logout } = useAuth();
  const [weather, setWeather] = useState<string>("Loading weather");
  const [report, setReport] = useState<Report | null>(null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [uploadName, setUploadName] = useState("No file selected");

  const cards = useMemo(
    () => [
      {
        label: "Operational Score",
        value: report ? `${report.operationalScore}%` : "Pending",
        icon: Activity,
      },
      {
        label: "Weather Intelligence",
        value: weather,
        icon: CloudSun,
      },
      {
        label: "Inspection Engine",
        value: inspection ? `${inspection.status} / ${inspection.risk}` : "Ready",
        icon: Cpu,
      },
    ],
    [inspection, report, weather],
  );

  useEffect(() => {
    async function loadProductionData() {
      if (!user) return;

      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [weatherResponse, reportResponse] = await Promise.all([
        fetch("/api/weather", {
          method: "POST",
          headers,
          body: JSON.stringify({ latitude: 6.5244, longitude: 3.3792 }),
        }),
        fetch("/api/reports", {
          method: "POST",
          headers,
          body: JSON.stringify({
            energyLoad: 62,
            machineHealth: 84,
            rainfallRisk: 31,
          }),
        }),
      ]);

      if (weatherResponse.ok) {
        const payload = await weatherResponse.json();
        const temperature = payload.weather?.current?.temperature_2m;
        setWeather(`${Math.round(temperature)}C live`);
      } else {
        setWeather("Provider offline");
      }

      if (reportResponse.ok) {
        setReport(await reportResponse.json());
      }
    }

    loadProductionData().catch(() => {
      setWeather("Needs retry");
    });
  }, [user]);

  async function handleInspection(file: File | null) {
    if (!file || !user) return;

    setUploadName(file.name);
    const token = await user.getIdToken();
    const response = await fetch("/api/inspections", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        category: "computer",
      }),
    });

    if (response.ok) {
      setInspection(await response.json());
    }
  }

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      <header className="border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-200/70">
              Brief Group AI
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">
              Operations Command
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <span>{user?.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-white/15 px-4 py-2 text-white transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-8 md:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl"
          >
            <card.icon className="h-6 w-6 text-emerald-300" />
            <p className="mt-5 text-sm text-white/60">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 lg:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-semibold">Real Analytics Dashboard</h2>
          </div>
          <div className="mt-6 h-80 min-h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={energyData}>
                <defs>
                  <linearGradient id="energy" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.55)" />
                <YAxis stroke="rgba(255,255,255,0.55)" />
                <Tooltip
                  contentStyle={{
                    background: "#07110f",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                  }}
                />
                <Area
                  dataKey="energy"
                  fill="url(#energy)"
                  stroke="#34d399"
                  strokeWidth={3}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <aside className="space-y-5">
          <article className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-emerald-300" />
              <h2 className="text-xl font-semibold">AI Report</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/70">
              {report?.summary ?? "Generating an automated operations report."}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              {(report?.recommendations ?? ["Loading recommendations"]).map(
                (item) => (
                  <li key={item} className="rounded-lg bg-black/20 p-3">
                    {item}
                  </li>
                ),
              )}
            </ul>
          </article>

          <article className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <UploadCloud className="h-5 w-5 text-emerald-300" />
              <h2 className="text-xl font-semibold">Inspection Upload</h2>
            </div>
            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 p-6 text-center text-sm text-white/70 transition hover:border-emerald-300/70">
              <UploadCloud className="mb-3 h-7 w-7 text-emerald-300" />
              {uploadName}
              <input
                className="sr-only"
                type="file"
                accept="image/*,.pdf"
                onChange={(event) =>
                  handleInspection(event.target.files?.[0] ?? null)
                }
              />
            </label>
            {inspection ? (
              <p className="mt-4 rounded-lg bg-emerald-300/10 p-3 text-sm text-emerald-100">
                {inspection.engine}
              </p>
            ) : null}
          </article>
        </aside>
      </section>
    </main>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

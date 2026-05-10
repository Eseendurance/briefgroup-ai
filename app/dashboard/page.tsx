"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  Binary,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  Cpu,
  FileText,
  Gauge,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Orbit,
  Plus,
  Radar,
  Settings,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProtectedRoute, useAuth } from "@/app/lib/auth";

const sites = [
  {
    name: "Lagos Main Facility",
    location: "Lagos, Nigeria",
    status: "Online",
    capacity: "500 kW",
    output: 320,
    devices: 12,
    health: 92,
  },
  {
    name: "Abuja Data Center",
    location: "Abuja, Nigeria",
    status: "Online",
    capacity: "750 kW",
    output: 580,
    devices: 8,
    health: 88,
  },
  {
    name: "Port Harcourt Plant",
    location: "Port Harcourt, Nigeria",
    status: "Maintenance",
    capacity: "300 kW",
    output: 0,
    devices: 5,
    health: 61,
  },
];

const energyData = [
  { label: "Jan", consumption: 44, verified: 38, forecast: 42 },
  { label: "Feb", consumption: 58, verified: 51, forecast: 55 },
  { label: "Mar", consumption: 49, verified: 46, forecast: 52 },
  { label: "Apr", consumption: 72, verified: 63, forecast: 68 },
  { label: "May", consumption: 64, verified: 59, forecast: 66 },
  { label: "Jun", consumption: 61, verified: 58, forecast: 63 },
];

const faultSignals = [
  {
    asset: "Inverter Bank A",
    risk: "Medium",
    confidence: 82,
    action: "Inspect thermal readings within 24 hours.",
  },
  {
    asset: "Transformer TX-04",
    risk: "High",
    confidence: 91,
    action: "Schedule load balance and oil temperature review.",
  },
  {
    asset: "Server Rack UPS",
    risk: "Low",
    confidence: 74,
    action: "Continue predictive monitoring.",
  },
];

const reports = [
  "Daily energy verification summary",
  "Weekly site performance report",
  "Fault risk and maintenance actions",
  "Inspection evidence and compliance record",
];

const moduleAccents: Record<ModuleId, string> = {
  overview: "from-emerald-300 to-cyan-200",
  energy: "from-yellow-200 to-emerald-300",
  fault: "from-rose-300 to-amber-200",
  forecast: "from-cyan-200 to-blue-300",
  assistant: "from-violet-300 to-cyan-200",
  reports: "from-amber-200 to-emerald-300",
  inspections: "from-fuchsia-300 to-emerald-300",
  marketplace: "from-amber-200 to-orange-300",
  sites: "from-sky-200 to-emerald-300",
  settings: "from-slate-200 to-cyan-200",
};

const modules = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "energy", label: "Smart Energy I&V", icon: Zap },
  { id: "fault", label: "AI Fault Detection", icon: Cpu },
  { id: "forecast", label: "AI Forecasting", icon: TrendingUp },
  { id: "assistant", label: "AI Assistant", icon: MessageSquare },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "inspections", label: "Inspections", icon: Camera },
  { id: "marketplace", label: "Digital Marketplace", icon: ShoppingCart },
  { id: "sites", label: "Sites", icon: Building2 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type ModuleId = (typeof modules)[number]["id"];
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

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone?: "emerald" | "cyan" | "amber" | "rose";
}) {
  const tones = {
    emerald: "border-emerald-300/15 bg-emerald-300/10 text-emerald-100",
    cyan: "border-cyan-200/15 bg-cyan-300/10 text-cyan-100",
    amber: "border-amber-200/15 bg-amber-300/10 text-amber-100",
    rose: "border-rose-200/15 bg-rose-300/10 text-rose-100",
  };

  return (
    <article className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          <p className="mt-3 text-sm text-white/55">{detail}</p>
        </div>
        <div className={`rounded-lg border p-3 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/35 to-transparent" />
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const [weather, setWeather] = useState("Loading");
  const [report, setReport] = useState<Report | null>(null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [uploadName, setUploadName] = useState("Choose an image or PDF");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to the Brief Group pilot dashboard. Ask about energy usage, fault risk, reports, or inspections.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const stats = useMemo(
    () => [
      {
        label: "Operational Score",
        value: report ? `${report.operationalScore}%` : "Pilot",
        detail: report?.status ?? "Live AI report engine",
        icon: Gauge,
        tone: "emerald" as const,
      },
      {
        label: "Weather Intelligence",
        value: weather,
        detail: "Live climate signal for field operations",
        icon: CloudSun,
        tone: "cyan" as const,
      },
      {
        label: "Sites Online",
        value: "2 / 3",
        detail: "Remote energy and inspection locations",
        icon: Building2,
        tone: "amber" as const,
      },
      {
        label: "Security",
        value: "Protected",
        detail: "Firebase auth, route guard, and API limits",
        icon: ShieldCheck,
        tone: "rose" as const,
      },
    ],
    [report, weather],
  );

  useEffect(() => {
    async function loadPilotData() {
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
        setWeather("Retry");
      }

      if (reportResponse.ok) {
        setReport(await reportResponse.json());
      }
    }

    loadPilotData().catch(() => setWeather("Offline"));
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

  function sendMessage() {
    const question = chatInput.trim();
    if (!question) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: question },
      {
        role: "assistant",
        text:
          "Pilot insight: energy load is stable, Abuja has the strongest output, and TX-04 needs maintenance review. I can turn this into an automated report.",
      },
    ]);
    setChatInput("");
  }

  const activeLabel =
    modules.find((item) => item.id === activeModule)?.label ?? "Dashboard";
  const activeAccent = moduleAccents[activeModule];

  return (
    <main className="brief-grid min-h-screen bg-[#040908] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.18),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(103,232,249,0.12),transparent_30%),radial-gradient(circle_at_65%_80%,rgba(251,191,36,0.10),transparent_34%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#030806]/85 p-4 backdrop-blur-xl lg:block">
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-200/30 bg-emerald-300/10 text-emerald-100">
              <Orbit className="absolute h-9 w-9 text-emerald-300/30" />
              <Binary className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Brief Nexus</p>
              <p className="text-xs text-white/50">Infrastructure OS</p>
            </div>
          </div>

          <div className="mx-2 mt-4 rounded-lg border border-white/10 bg-white/[0.045] p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
              Pilot Network
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-300 brief-pulse" />
              <span className="text-sm text-emerald-100">
                3 sites connected
              </span>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {modules.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                  activeModule === item.id
                    ? "bg-white text-[#06110f]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#040908]/85 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`bg-gradient-to-r ${activeAccent} bg-clip-text text-xs uppercase tracking-[0.24em] text-transparent`}>
                  Launch Dashboard / Pilot Mission Control
                </p>
                <h1 className="mt-1 text-2xl font-semibold md:text-4xl">
                  {activeLabel}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className="relative rounded-lg border border-white/10 bg-white/[0.05] p-3 text-white/75">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-300" />
                </button>
                <div className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/70">
                  {user?.email}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-5 py-3 lg:hidden">
              {modules.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    activeModule === item.id
                      ? "bg-white text-[#06110f]"
                      : "bg-white/[0.06] text-white/70"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          <div className="px-5 py-6">
            {activeModule === "overview" ? (
              <div className="space-y-5">
                <section className="brief-scanline relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(5,17,14,0.96),rgba(7,13,24,0.98)),radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.28),transparent_30%)] p-6 shadow-2xl md:p-8">
                  <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-emerald-200/20 lg:block">
                    <div className="absolute inset-4 rounded-full border border-cyan-200/20" />
                    <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300 brief-pulse" />
                  </div>
                  <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                        <Radar className="h-4 w-4" />
                        Live pilot network
                      </span>
                      <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                        Brief Nexus turns field signals into boardroom-ready
                        infrastructure decisions.
                      </h2>
                      <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 md:text-lg">
                        A secure pilot cockpit for energy verification,
                        inspections, machine risk, weather intelligence, and
                        automated reporting across client sites.
                      </p>
                      <div className="mt-7 flex flex-wrap gap-3">
                        {["Energy", "Weather", "Faults", "Inspections"].map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/70"
                          >
                            {item} signal online
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="relative min-h-[360px] rounded-lg border border-white/10 bg-black/30 p-5">
                      <div className="absolute inset-5 rounded-lg border border-white/10" />
                      <div className="absolute left-[16%] top-[18%] h-4 w-4 rounded-full bg-emerald-300 shadow-[0_0_34px_rgba(52,211,153,0.9)] brief-pulse" />
                      <div className="absolute right-[18%] top-[32%] h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_28px_rgba(103,232,249,0.8)] brief-pulse" />
                      <div className="absolute bottom-[18%] left-[34%] h-3 w-3 rounded-full bg-amber-200 shadow-[0_0_28px_rgba(251,191,36,0.8)] brief-pulse" />
                      <div className="absolute bottom-[28%] right-[28%] h-5 w-5 rounded-full bg-rose-200 shadow-[0_0_28px_rgba(251,113,133,0.65)] brief-pulse" />
                      <div className="relative grid h-full gap-3 sm:grid-cols-2">
                        {[
                          ["Lagos", "Energy verified", "92%"],
                          ["Abuja", "Peak forecast", "84%"],
                          ["Port Harcourt", "Maintenance lane", "61%"],
                          ["Pilot Core", "Security active", "100%"],
                        ].map(([city, label, value]) => (
                          <div key={city} className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
                            <p className="text-sm text-white/45">{city}</p>
                            <p className="mt-2 font-semibold">{label}</p>
                            <p className="mt-4 text-3xl font-semibold">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {stats.map((item) => (
                    <StatCard key={item.label} {...item} />
                  ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                  <EnergyChart />
                  <PilotReport report={report} />
                </div>
              </div>
            ) : null}

            {activeModule === "energy" ? <EnergyModule /> : null}
            {activeModule === "fault" ? <FaultModule /> : null}
            {activeModule === "forecast" ? <ForecastModule /> : null}
            {activeModule === "assistant" ? (
              <AssistantModule
                chatInput={chatInput}
                messages={messages}
                sendMessage={sendMessage}
                setChatInput={setChatInput}
              />
            ) : null}
            {activeModule === "reports" ? <ReportsModule report={report} /> : null}
            {activeModule === "inspections" ? (
              <InspectionsModule
                handleInspection={handleInspection}
                inspection={inspection}
                uploadName={uploadName}
              />
            ) : null}
            {activeModule === "marketplace" ? <MarketplaceModule /> : null}
            {activeModule === "sites" ? <SitesModule /> : null}
            {activeModule === "settings" ? <SettingsModule /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function EnergyChart() {
  return (
    <Panel title="Energy Verification Trend">
      <div className="h-80 min-h-80">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={energyData}>
            <defs>
              <linearGradient id="consumption" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.55)" />
            <YAxis stroke="rgba(255,255,255,0.55)" />
            <Tooltip
              contentStyle={{
                background: "#07110f",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
              }}
            />
            <Area
              dataKey="consumption"
              fill="url(#consumption)"
              stroke="#34d399"
              strokeWidth={3}
              type="monotone"
            />
            <Line dataKey="verified" stroke="#67e8f9" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function PilotReport({ report }: { report: Report | null }) {
  return (
    <Panel title="Automated Report">
      <p className="text-sm leading-6 text-white/65">
        {report?.summary ?? "Generating the current pilot report."}
      </p>
      <div className="mt-5 space-y-3">
        {(report?.recommendations ?? reports).map((item) => (
          <div key={item} className="rounded-lg bg-black/25 p-3 text-sm text-white/70">
            {item}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SignalRibbon({
  title,
  detail,
  items,
}: {
  title: string;
  detail: string;
  items: string[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(120deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-5 shadow-2xl backdrop-blur-xl">
      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/60">
            Brief signal layer
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">{detail}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={item}
              className="relative rounded-lg border border-white/10 bg-black/25 p-4"
            >
              <span className="text-xs text-white/35">0{index + 1}</span>
              <p className="mt-4 text-sm font-medium">{item}</p>
              <div className="mt-4 h-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-200"
                  style={{ width: `${68 + index * 8}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EnergyModule() {
  return (
    <div className="space-y-5">
      <SignalRibbon
        title="Smart Energy I&V"
        detail="Verify consumption, detect leakage, and turn meter evidence into client-ready proof."
        items={["Meter integrity", "Usage anomaly", "Tariff impact", "Site confidence"]}
      />
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Verified Energy" value="58 MWh" detail="Current pilot month" icon={Zap} />
        <StatCard label="Cost Avoidance" value="NGN 4.8M" detail="Estimated from anomaly reduction" icon={TrendingUp} />
        <StatCard label="Data Quality" value="96%" detail="Meter and site signal coverage" icon={CheckCircle2} />
      </div>
      <EnergyChart />
      <Panel title="Smart Energy Inspection & Verification">
        <div className="grid gap-4 md:grid-cols-3">
          {sites.map((site) => (
            <div key={site.name} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="font-semibold">{site.name}</p>
              <p className="mt-1 text-sm text-white/50">{site.location}</p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-300"
                  style={{ width: `${site.health}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-white/60">{site.health}% verification confidence</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function FaultModule() {
  return (
    <div className="space-y-5">
      <SignalRibbon
        title="Fault Intelligence"
        detail="Rank machine risks by confidence, urgency, and operational impact before downtime starts."
        items={["Thermal drift", "Load imbalance", "UPS stress", "Maintenance action"]}
      />
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Open Risks" value="3" detail="AI-ranked maintenance items" icon={AlertTriangle} />
        <StatCard label="Highest Confidence" value="91%" detail="Transformer TX-04" icon={Cpu} />
        <StatCard label="Prevented Downtime" value="18 hrs" detail="Pilot estimate this month" icon={ShieldCheck} />
      </div>
      <Panel title="AI Fault Detection Queue">
        <div className="space-y-3">
          {faultSignals.map((fault) => (
            <div key={fault.asset} className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="font-semibold">{fault.asset}</p>
                <p className="mt-1 text-sm text-white/55">{fault.action}</p>
              </div>
              <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-sm text-amber-100">
                {fault.risk}
              </span>
              <span className="text-sm text-white/65">{fault.confidence}% confidence</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ForecastModule() {
  return (
    <div className="space-y-5">
      <SignalRibbon
        title="Forecast Studio"
        detail="Blend weather, historical load, and inspection outcomes into practical operating forecasts."
        items={["Climate signal", "Demand curve", "Asset health", "Pilot forecast"]}
      />
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
      <Panel title="AI Energy Forecast">
        <div className="h-96 min-h-96">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={energyData}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.55)" />
              <YAxis stroke="rgba(255,255,255,0.55)" />
              <Tooltip
                contentStyle={{
                  background: "#07110f",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                }}
              />
              <Line dataKey="consumption" stroke="#34d399" strokeWidth={3} />
              <Line dataKey="forecast" stroke="#fbbf24" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Forecast Inputs">
        <div className="space-y-3 text-sm text-white/70">
          {["Weather exposure", "Historical load", "Inspection outcomes", "Machine health", "Site capacity"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-lg bg-black/25 p-3">
              <span>{item}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
          ))}
        </div>
      </Panel>
      </div>
    </div>
  );
}

function AssistantModule({
  chatInput,
  messages,
  sendMessage,
  setChatInput,
}: {
  chatInput: string;
  messages: { role: string; text: string }[];
  sendMessage: () => void;
  setChatInput: (value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <SignalRibbon
        title="Nexus Assistant"
        detail="A pilot copilot that explains site signals in plain language for operators and decision makers."
        items={["Ask", "Analyze", "Recommend", "Report"]}
      />
    <Panel title="AI Energy Assistant">
      <div className="space-y-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-3xl rounded-lg p-4 text-sm leading-6 ${
              message.role === "assistant"
                ? "bg-emerald-300/10 text-emerald-50"
                : "ml-auto bg-white/10 text-white"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-3">
        <input
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder="Ask about energy, faults, forecasts, or reports"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-emerald-300"
        />
        <button
          onClick={sendMessage}
          className="rounded-lg bg-emerald-300 px-5 py-3 font-semibold text-[#06110f]"
        >
          Send
        </button>
      </div>
    </Panel>
    </div>
  );
}

function ReportsModule({ report }: { report: Report | null }) {
  return (
    <div className="space-y-5">
      <PilotReport report={report} />
      <Panel
        title="Report Automation"
        action={<button className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06110f]">Generate</button>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((item) => (
            <div key={item} className="flex items-center justify-between rounded-lg bg-black/25 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-300" />
                <span>{item}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function InspectionsModule({
  handleInspection,
  inspection,
  uploadName,
}: {
  handleInspection: (file: File | null) => void;
  inspection: InspectionResult | null;
  uploadName: string;
}) {
  return (
    <div className="space-y-5">
      <SignalRibbon
        title="Inspection Evidence Hub"
        detail="Collect field evidence, queue computer inspection, and attach findings to the operational record."
        items={["Upload", "Classify", "Inspect", "Attach"]}
      />
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Inspection Upload">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-emerald-300/35 bg-black/25 p-10 text-center text-sm text-white/65 transition hover:border-emerald-200">
          <UploadCloud className="mb-4 h-10 w-10 text-emerald-300" />
          {uploadName}
          <span className="mt-2 text-xs text-white/40">Images and PDFs up to 10 MB</span>
          <input
            className="sr-only"
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => handleInspection(event.target.files?.[0] ?? null)}
          />
        </label>
        {inspection ? (
          <div className="mt-5 rounded-lg bg-emerald-300/10 p-4 text-sm text-emerald-100">
            {inspection.engine}
          </div>
        ) : null}
      </Panel>
      <Panel title="Computer Inspection Engine">
        <div className="grid gap-4 md:grid-cols-3">
          {["Evidence received", "Anomaly scan", "Report queued"].map((item) => (
            <div key={item} className="rounded-lg bg-black/25 p-4">
              <Camera className="h-5 w-5 text-emerald-300" />
              <p className="mt-4 font-semibold">{item}</p>
              <p className="mt-2 text-sm text-white/55">Pilot workflow active</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
    </div>
  );
}

function MarketplaceModule() {
  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.16),transparent_35%),linear-gradient(135deg,rgba(25,18,8,0.92),rgba(6,9,8,0.96))] p-8 text-center shadow-2xl">
      <div className="absolute inset-8 rounded-lg border border-amber-200/10" />
      <div className="absolute left-10 top-10 h-3 w-3 rounded-full bg-amber-200 brief-pulse" />
      <div className="absolute bottom-14 right-16 h-2 w-2 rounded-full bg-emerald-300 brief-pulse" />
      <div className="max-w-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-amber-300/15 text-amber-100">
          <ShoppingCart className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-4xl font-semibold">Digital Marketplace</h2>
        <p className="mt-4 text-white/65">
          Coming soon. This future module will support trusted energy equipment,
          services, and partner listings after the pilot dashboard is live.
        </p>
      </div>
    </section>
  );
}

function SitesModule() {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button className="flex items-center gap-2 rounded-lg bg-emerald-300 px-4 py-3 font-semibold text-[#06110f]">
          <Plus className="h-4 w-4" />
          Add Site
        </button>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sites.map((site) => (
          <article key={site.name} className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{site.name}</p>
                <p className="mt-1 text-sm text-white/50">{site.location}</p>
              </div>
              <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                {site.status}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-black/25 p-3">
                <p className="text-white/45">Capacity</p>
                <p className="mt-1 font-semibold">{site.capacity}</p>
              </div>
              <div className="rounded-lg bg-black/25 p-3">
                <p className="text-white/45">Devices</p>
                <p className="mt-1 font-semibold">{site.devices}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SettingsModule() {
  return (
    <div className="space-y-5">
      <SignalRibbon
        title="Pilot Configuration"
        detail="Tune contact data, alert posture, security posture, and pilot readiness from one place."
        items={["Identity", "Alerts", "Security", "Readiness"]}
      />
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
      <Panel title="Pilot Account">
        <div className="grid gap-4 md:grid-cols-2">
          {["Organization", "Contact email", "Pilot region", "Alert threshold"].map((field) => (
            <label key={field} className="block">
              <span className="text-sm text-white/55">{field}</span>
              <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-emerald-300"
                placeholder={field}
              />
            </label>
          ))}
        </div>
      </Panel>
      <Panel title="Production Security">
        <div className="space-y-3">
          {[
            "Firebase user accounts",
            "Protected dashboard routes",
            "API bearer token requirement",
            "Rate limited pilot endpoints",
            "Firestore and Storage rules",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg bg-black/25 p-3 text-sm text-white/70">
              <Lock className="h-4 w-4 text-emerald-300" />
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </div>
    </div>
  );
}

function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

export default Dashboard;

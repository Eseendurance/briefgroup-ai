"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const data = [
  { month: "Jan", energy: 40 },
  { month: "Feb", energy: 55 },
  { month: "Mar", energy: 48 },
  { month: "Apr", energy: 70 },
  { month: "May", energy: 62 },
];

export default function Dashboard() {

  return (
    <main className="min-h-screen bg-[#050816] text-white p-10">

      <h1 className="text-5xl font-bold mb-10">
        AI Analytics Dashboard
      </h1>

      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">

        <h2 className="text-2xl mb-6">
          Energy Consumption Analytics
        </h2>

        <div className="h-[400px]">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={data}>

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="energy"
                stroke="#3B82F6"
                strokeWidth={4}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>
    </main>
  );
}
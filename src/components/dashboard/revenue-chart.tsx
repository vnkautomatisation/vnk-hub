"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function RevenueChart({ data, lang = "fr" }: { data: { day: string; revenue: number }[]; lang?: string }) {
  return (
    <ResponsiveContainer width="100%" height={200} style={{ border: "none", outline: "none" }}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "var(--text-3)" }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          contentStyle={{ background: "var(--bg-surface)", border: "0.5px solid var(--border-strong)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--text-1)" }}
          formatter={(value) => [`${Number(value).toFixed(2)} CAD`, lang === "en" ? "Revenue" : "Revenus"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

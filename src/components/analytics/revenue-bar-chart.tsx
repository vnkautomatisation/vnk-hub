"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function RevenueBarChart({ data }: { data: { day: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--text-3)" }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          contentStyle={{ background: "var(--bg-surface)", border: "0.5px solid var(--border-strong)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--text-1)" }}
          formatter={(value) => [`${Number(value).toFixed(2)} CAD`, "Revenus"]}
        />
        <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

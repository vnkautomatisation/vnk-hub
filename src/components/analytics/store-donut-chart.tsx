"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const palette = ["var(--accent)", "var(--purple)", "var(--info)", "var(--success)", "var(--warning)", "var(--danger)"];

export function StoreDonutChart({ data }: { data: { name: string; revenue: number }[] }) {
  const filtered = data.filter((d) => d.revenue > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-[13px]" style={{ color: "var(--text-3)" }}>
        Aucune donnée
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={filtered} dataKey="revenue" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {filtered.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "var(--bg-surface)", border: "0.5px solid var(--border-strong)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--text-1)" }}
          formatter={(value, name) => [`${Number(value).toFixed(2)} $`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-2)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

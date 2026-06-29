"use client";

import {
  IconPaw,
  IconHome,
  IconTent,
  IconHanger,
  IconDeviceMobile,
  IconBallFootball,
  IconDotsCircleHorizontal,
} from "@tabler/icons-react";

const niches = [
  { value: "Animaux", icon: IconPaw },
  { value: "Déco", icon: IconHome },
  { value: "Outdoor", icon: IconTent },
  { value: "Mode", icon: IconHanger },
  { value: "Tech", icon: IconDeviceMobile },
  { value: "Sport", icon: IconBallFootball },
  { value: "Autre", icon: IconDotsCircleHorizontal },
];

export function NichePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {niches.map((n) => {
        const Icon = n.icon;
        const selected = value === n.value;
        return (
          <button
            key={n.value}
            type="button"
            onClick={() => onChange(n.value)}
            className="flex flex-col items-center gap-1.5 rounded-[var(--radius)] py-3.5 text-center transition-colors duration-150"
            style={{
              border: `0.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
              background: selected ? "var(--bg-active)" : "transparent",
            }}
          >
            <Icon size={24} style={{ color: selected ? "var(--accent-light)" : "var(--text-2)" }} />
            <span className="text-[12px]" style={{ color: selected ? "var(--accent-light)" : "var(--text-2)" }}>
              {n.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Select, type SelectOption } from "@/components/ui/Select";

const OPTIONS: SelectOption[] = [
  { value: "7", label: "7 jours" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
  { value: "365", label: "12 mois" },
];

export function AnalyticsPeriodSelect({ value }: { value: number }) {
  const router = useRouter();
  return (
    <Select
      options={OPTIONS}
      value={String(value)}
      onChange={(v) => router.push(`/analytics?period=${v}`)}
      minWidth={120}
    />
  );
}

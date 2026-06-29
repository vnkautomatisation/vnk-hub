"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

export function AnalyticsPeriodSelect({ value }: { value: number }) {
  const router = useRouter();

  return (
    <Select value={String(value)} onChange={(e) => router.push(`/analytics?period=${e.target.value}`)} style={{ width: 160 }}>
      <option value="7">7 jours</option>
      <option value="30">30 jours</option>
      <option value="90">90 jours</option>
      <option value="365">12 mois</option>
    </Select>
  );
}

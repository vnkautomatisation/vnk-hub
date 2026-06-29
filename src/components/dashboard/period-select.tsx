"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

export function PeriodSelect({ value }: { value: number }) {
  const router = useRouter();

  return (
    <Select
      value={String(value)}
      onChange={(e) => router.push(`/?period=${e.target.value}`)}
      className="h-8 text-[12px]"
    >
      <option value="7">7 jours</option>
      <option value="30">30 jours</option>
      <option value="90">90 jours</option>
    </Select>
  );
}

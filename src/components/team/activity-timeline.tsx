"use client";

import { useState } from "react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { relativeTime } from "@/lib/relative-time";
import { useLanguage } from "@/contexts/lang-context";

type LogEntry = { id: string; action: string; createdAt: Date; user: { id: string; name: string } };

export function ActivityTimeline({ logs, members }: { logs: LogEntry[]; members: { id: string; name: string }[] }) {
  const { t } = useLanguage();
  const [memberId, setMemberId] = useState("");

  const filtered = memberId ? logs.filter((l) => l.user.id === memberId) : logs;

  const memberOptions: SelectOption[] = [
    { value: "", label: t.ph_all_members },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  return (
    <div className="card space-y-3">
      <div className="card-header" style={{ marginBottom: 0 }}>
        <h2 className="card-title">{t.team_logs}</h2>
        <Select options={memberOptions} value={memberId} onChange={setMemberId} minWidth={180} />
      </div>
      <ul className="space-y-2">
        {filtered.map((log) => (
          <li key={log.id} className="flex items-center justify-between text-[13px]">
            <span style={{ color: "var(--text-1)" }}>{log.user.name} — {log.action}</span>
            <span style={{ color: "var(--text-3)" }}>{relativeTime(log.createdAt)}</span>
          </li>
        ))}
        {filtered.length === 0 && <li style={{ color: "var(--text-3)" }} className="text-[13px]">{t.team_no_activity}</li>}
      </ul>
    </div>
  );
}

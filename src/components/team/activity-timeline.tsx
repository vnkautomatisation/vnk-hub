"use client";

import { useState } from "react";
import { Select } from "@/components/ui/input";
import { relativeTime } from "@/lib/relative-time";

type LogEntry = { id: string; action: string; createdAt: Date; user: { id: string; name: string } };

export function ActivityTimeline({ logs, members }: { logs: LogEntry[]; members: { id: string; name: string }[] }) {
  const [memberId, setMemberId] = useState("");

  const filtered = memberId ? logs.filter((l) => l.user.id === memberId) : logs;

  return (
    <div className="card space-y-3">
      <div className="card-header" style={{ marginBottom: 0 }}>
        <h2 className="card-title">Logs d&apos;activité</h2>
        <Select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ width: 200 }}>
          <option value="">Tous les membres</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>

      <ul className="space-y-2">
        {filtered.map((log) => (
          <li key={log.id} className="flex items-center justify-between text-[13px]">
            <span style={{ color: "var(--text-1)" }}>
              {log.user.name} — {log.action}
            </span>
            <span style={{ color: "var(--text-3)" }}>{relativeTime(log.createdAt)}</span>
          </li>
        ))}
        {filtered.length === 0 && (
          <li style={{ color: "var(--text-3)" }} className="text-[13px]">
            Aucune activité
          </li>
        )}
      </ul>
    </div>
  );
}

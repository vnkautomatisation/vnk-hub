"use client";

import { useState } from "react";
import { IconSearch, IconCheck, IconClock } from "@tabler/icons-react";
import type { TrackingResult } from "@/lib/tracking/seventeen-track";
import { Button } from "@/components/ui/button";

export function TrackingLookup() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="mx-auto flex gap-2" style={{ maxWidth: 500 }}>
        <div className="input-group flex-1">
          <IconSearch className="icon-left" size={16} />
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Entrez un numéro de tracking"
            className="input"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Recherche..." : "Suivre"}
        </Button>
      </form>

      {result && (
        <div className="card mx-auto" style={{ maxWidth: 560 }}>
          <p className="mb-4 text-[13px]" style={{ color: "var(--text-2)" }}>
            Transporteur: <span style={{ color: "var(--text-1)" }}>{result.carrier}</span> · Statut:{" "}
            <span style={{ color: "var(--accent-light)" }}>{result.status}</span>
          </p>

          <div>
            {result.events.map((event, i) => {
              const isLast = i === result.events.length - 1;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: "var(--success)", color: "white" }}
                    >
                      <IconCheck size={14} />
                    </div>
                    {!isLast && <div style={{ width: 1, flex: 1, background: "var(--border)", minHeight: 24 }} />}
                  </div>
                  <div className="pb-5">
                    <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                      {event.status}
                    </p>
                    <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                      {new Date(event.occurredAt).toLocaleString("fr-CA")} · {event.location}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="flex gap-3">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", color: "var(--text-3)" }}
              >
                <IconClock size={14} />
              </div>
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
                Livraison prévue
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

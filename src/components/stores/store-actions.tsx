"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StoreActiveToggle({ storeId, active }: { storeId: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/stores/${storeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        toggle();
      }}
      disabled={loading}
      className="rounded-[20px] px-2.5 py-[3px] text-[11px] font-medium"
      style={{
        background: active ? "var(--success-bg)" : "var(--bg-hover)",
        color: active ? "var(--success)" : "var(--text-2)",
      }}
    >
      {active ? "Active" : "Inactive"}
    </button>
  );
}

export function DuplicateStoreButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function duplicate() {
    setLoading(true);
    await fetch(`/api/stores/${storeId}/duplicate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        duplicate();
      }}
      disabled={loading}
      className="rounded-lg px-2.5 py-1 text-[12px]"
      style={{ border: "0.5px solid var(--border-strong)", color: "var(--text-1)" }}
    >
      {loading ? "..." : "Dupliquer"}
    </button>
  );
}

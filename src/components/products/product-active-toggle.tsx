"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProductActiveToggle({ productId, active }: { productId: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="rounded-[20px] px-2.5 py-[3px] text-[11px] font-medium"
      style={{
        background: active ? "var(--success-bg)" : "var(--bg-hover)",
        color: active ? "var(--success)" : "var(--text-2)",
      }}
    >
      {active ? "Actif" : "Inactif"}
    </button>
  );
}

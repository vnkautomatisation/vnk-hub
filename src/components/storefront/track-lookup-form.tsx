"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TrackLookupForm({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (orderNumber.trim()) {
      router.push(`/${storeSlug}/track/${orderNumber.trim()}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="Numéro de commande"
        className="flex-1 rounded border px-3 py-2"
      />
      <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm text-white">
        Suivre
      </button>
    </form>
  );
}

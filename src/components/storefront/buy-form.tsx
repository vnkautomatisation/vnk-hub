"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuyForm({
  storeSlug,
  storeId,
  productId,
  primaryColor,
}: {
  storeSlug: string;
  storeId: string;
  productId: string;
  primaryColor: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        productId,
        quantity,
        customerName,
        customerEmail,
        shippingAddress: { city, country: "CA" },
      }),
    });

    const order = await res.json();
    setLoading(false);
    router.push(`/${storeSlug}/confirmation/${order.orderNumber}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm">Quantité</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
          className="w-24 rounded border px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm">Nom complet</label>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm">Courriel</label>
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm">Ville</label>
        <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded border px-3 py-2" />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{ backgroundColor: primaryColor }}
        className="w-full rounded px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Traitement..." : "Acheter maintenant"}
      </button>
      <p className="text-center text-xs text-gray-400">Paiement Stripe simulé — aucune carte requise pour l&apos;instant</p>
    </form>
  );
}

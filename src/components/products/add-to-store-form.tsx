"use client";

import { useState } from "react";
import type { SupplierProduct } from "@/types/supplier";
import { Select, type SelectOption } from "@/components/ui/Select";

const supplierEnumMap: Record<string, string> = {
  cj: "CJ_DROPSHIPPING",
  aliexpress: "ALIEXPRESS",
  zendrop: "ZENDROP",
  printful: "PRINTFUL",
};

export function AddToStoreForm({
  product,
  supplierSlug,
  stores,
  onAdded,
}: {
  product: SupplierProduct;
  supplierSlug: string;
  stores: { id: string; name: string }[];
  onAdded: () => void;
}) {
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [price, setPrice] = useState(product.suggestedPrice);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const storeOptions: SelectOption[] = stores.map((s) => ({ value: s.id, label: s.name }));

  async function handleAdd() {
    setLoading(true);
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        name: product.name,
        nameFr: product.nameFr,
        description: product.description,
        descriptionFr: product.descriptionFr,
        price,
        cost: product.cost,
        images: product.images,
        supplier: supplierEnumMap[supplierSlug],
        supplierSku: product.sku,
      }),
    });
    setLoading(false);
    setOpen(false);
    onAdded();
  }

  if (stores.length === 0) {
    return (
      <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
        Créez une boutique avant d&apos;ajouter des produits
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-2.5 py-1 text-[12px]"
        style={{ border: "0.5px solid var(--border-strong)", color: "var(--text-1)" }}
      >
        Ajouter à une boutique
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[12px]">
      <Select options={storeOptions} value={storeId} onChange={setStoreId} minWidth={140} />
      <input
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(parseFloat(e.target.value))}
        className="w-20 rounded-lg px-2 py-1"
        style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", color: "var(--text-1)" }}
      />
      <button
        onClick={handleAdd}
        disabled={loading}
        className="rounded-lg px-2.5 py-1 font-medium text-white"
        style={{ background: "var(--accent-gradient)" }}
      >
        {loading ? "..." : "Confirmer"}
      </button>
    </div>
  );
}

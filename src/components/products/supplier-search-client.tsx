"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SupplierProduct } from "@/types/supplier";
import { AddToStoreForm } from "@/components/products/add-to-store-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const suppliers = [
  { slug: "cj", label: "CJ Dropshipping" },
  { slug: "aliexpress", label: "AliExpress" },
  { slug: "zendrop", label: "Zendrop" },
  { slug: "printful", label: "Printful" },
] as const;

export function SupplierSearchClient({ stores }: { stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const [activeSupplier, setActiveSupplier] = useState<string>("cj");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/suppliers/${activeSupplier}?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {suppliers.map((s) => (
          <button
            key={s.slug}
            onClick={() => setActiveSupplier(s.slug)}
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium"
            style={
              activeSupplier === s.slug
                ? { background: "var(--accent-gradient)", color: "#fff" }
                : { border: "0.5px solid var(--border-strong)", color: "var(--text-1)" }
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mot-clé produit" className="flex-1" />
        <Button type="submit" disabled={loading}>
          {loading ? "Recherche..." : "Rechercher"}
        </Button>
      </form>

      <ul className="grid grid-cols-2 gap-4">
        {results.map((product) => (
          <Card key={product.sku} className="space-y-2">
            <p className="font-medium" style={{ color: "var(--text-1)" }}>
              {product.nameFr}
            </p>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
              {product.descriptionFr}
            </p>
            <p className="text-[13px]" style={{ color: "var(--text-1)" }}>
              Coût: {product.cost.toFixed(2)} $ · Suggéré: {product.suggestedPrice.toFixed(2)} $
            </p>
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
              Stock: {product.stock}
            </p>
            <AddToStoreForm
              product={product}
              supplierSlug={activeSupplier}
              stores={stores}
              onAdded={() => router.refresh()}
            />
          </Card>
        ))}
      </ul>
    </div>
  );
}

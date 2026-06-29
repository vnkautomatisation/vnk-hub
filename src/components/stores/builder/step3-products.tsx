"use client";

import { useState } from "react";
import type { Product } from "@prisma/client";
import type { SupplierProduct } from "@/types/supplier";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const suppliers = [
  { slug: "cj", label: "CJ Dropshipping", enumValue: "CJ_DROPSHIPPING" },
  { slug: "aliexpress", label: "AliExpress", enumValue: "ALIEXPRESS" },
  { slug: "zendrop", label: "Zendrop", enumValue: "ZENDROP" },
  { slug: "printful", label: "Printful", enumValue: "PRINTFUL" },
] as const;

export function Step3Products({
  storeId,
  products,
  onChange,
}: {
  storeId: string;
  products: Product[];
  onChange: () => void;
}) {
  const [activeSupplier, setActiveSupplier] = useState<string>("cj");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/suppliers/${activeSupplier}?q=${encodeURIComponent(query)}`);
    setResults(await res.json());
    setLoading(false);
  }

  async function addProduct(p: SupplierProduct) {
    const supplier = suppliers.find((s) => s.slug === activeSupplier)?.enumValue;
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        name: p.name,
        nameFr: p.nameFr,
        description: p.description,
        descriptionFr: p.descriptionFr,
        price: p.suggestedPrice,
        cost: p.cost,
        images: p.images,
        supplier,
        supplierSku: p.sku,
      }),
    });
    onChange();
  }

  async function updateProduct(id: string, data: Record<string, unknown>) {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onChange();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
          Produits de la boutique
        </h2>
        {products.length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
            Aucun produit — utilisez la recherche ci-dessous
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: "var(--bg-card)" }}>
                {["Produit", "Prix", "Vedette", "Actif"].map((h) => (
                  <th
                    key={h}
                    className="border-b-[0.5px] px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide"
                    style={{ color: "var(--text-3)", borderColor: "var(--border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b-[0.5px]" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2" style={{ color: "var(--text-1)" }}>
                    {p.nameFr}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={p.price}
                      onBlur={(e) => updateProduct(p.id, { price: parseFloat(e.target.value) })}
                      className="w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      defaultChecked={p.featured}
                      onChange={(e) => updateProduct(p.id, { featured: e.target.checked })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      defaultChecked={p.active}
                      onChange={(e) => updateProduct(p.id, { active: e.target.checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Card className="space-y-3">
        <h2 className="font-medium" style={{ color: "var(--text-1)" }}>
          Rechercher chez les fournisseurs
        </h2>
        <div className="flex gap-2">
          {suppliers.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setActiveSupplier(s.slug)}
              className="rounded-lg px-3 py-1.5 text-[13px]"
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
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mot-clé" className="flex-1" />
          <Button type="submit" disabled={loading}>
            {loading ? "Recherche..." : "Rechercher"}
          </Button>
        </form>

        {results.length > 0 && (
          <ul className="grid grid-cols-2 gap-3">
            {results.map((p) => (
              <Card key={p.sku} className="space-y-1">
                <p className="font-medium" style={{ color: "var(--text-1)" }}>
                  {p.nameFr}
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
                  Coût: {p.cost.toFixed(2)} $ · Suggéré: {p.suggestedPrice.toFixed(2)} $
                </p>
                <button
                  type="button"
                  onClick={() => addProduct(p)}
                  className="rounded-lg px-2.5 py-1 text-[12px]"
                  style={{ border: "0.5px solid var(--border-strong)", color: "var(--text-1)" }}
                >
                  Ajouter à la boutique
                </button>
              </Card>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

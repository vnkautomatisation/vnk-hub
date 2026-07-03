"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";
import type { SupplierProduct } from "@/types/supplier";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, type SelectOption } from "@/components/ui/Select";
import { AddToStoreForm } from "@/components/products/add-to-store-form";
import { EmptyState } from "@/components/ui/empty-state";

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "", label: "Toutes catégories" },
  { value: "electronics", label: "Électronique" },
  { value: "home", label: "Maison" },
  { value: "fashion", label: "Mode" },
];

export function SupplierProductSearch({ slug, stores }: { slug: string; stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/suppliers/${slug}?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
    setSearched(true);
    setLoading(false);
  }

  return (
    <Card className="space-y-4">
      <h2 className="card-title">Recherche produits</h2>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="input-group flex-1">
          <IconSearch className="icon-left" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="input"
          />
        </div>
        <Select options={CATEGORY_OPTIONS} value={category} onChange={setCategory} minWidth={150} />
        <Button type="submit" disabled={loading}>
          {loading ? "Recherche..." : "Rechercher"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {results.map((p) => {
            const margin = p.cost > 0 ? Math.round(((p.suggestedPrice - p.cost) / p.suggestedPrice) * 100) : 0;
            return (
              <div key={p.sku} className="rounded-[10px]" style={{ border: "0.5px solid var(--border)", overflow: "hidden" }}>
                <div style={{ height: 120, background: "var(--bg-card)" }} className="flex items-center justify-center">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.nameFr} className="h-full w-full object-cover" />
                  ) : (
                    <span style={{ color: "var(--text-3)", fontSize: 12 }}>Aucune image</span>
                  )}
                </div>
                <div className="space-y-1.5 p-3">
                  <p className="truncate text-[13px] font-medium" style={{ color: "var(--text-1)" }}>{p.nameFr}</p>
                  <div className="flex items-center justify-between text-[12px]">
                    <span style={{ color: "var(--success)" }}>{p.cost.toFixed(2)} $</span>
                    <span style={{ color: "var(--text-1)" }}>{p.suggestedPrice.toFixed(2)} $</span>
                    <Badge tone="purple">{margin}% marge</Badge>
                  </div>
                  <AddToStoreForm product={p} supplierSlug={slug} stores={stores} onAdded={() => router.refresh()} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <EmptyState icon={IconSearch} title="Aucun produit trouvé" description="Essayez un autre mot-clé." />
      )}
    </Card>
  );
}

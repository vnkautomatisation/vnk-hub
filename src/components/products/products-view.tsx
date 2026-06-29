"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconGridDots, IconList, IconTrash, IconEye } from "@tabler/icons-react";
import type { Product, Supplier } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ProductActiveToggle } from "@/components/products/product-active-toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconPackageOff } from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";

type ProductRow = Product & { store: { name: string } };

const supplierBadgeLabel: Record<Supplier, string> = {
  CJ_DROPSHIPPING: "CJ",
  ALIEXPRESS: "AliEx",
  ZENDROP: "Zendrop",
  PRINTFUL: "Printful",
  MANUAL: "Manuel",
};

export function ProductsView({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [toDelete, setToDelete] = useState<ProductRow | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  async function handleDelete() {
    if (!toDelete) return;
    const res = await fetch(`/api/products/${toDelete.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      showToast(body.error ?? "Suppression impossible", "error");
    } else {
      showToast("Produit supprimé", "success");
    }
    setToDelete(null);
    router.refresh();
  }

  if (products.length === 0) {
    return <EmptyState icon={IconPackageOff} title="Aucun produit" description="Importez des produits depuis un fournisseur ou ajoutez-en un manuellement." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-1">
        <button
          onClick={() => setView("grid")}
          className="btn-icon"
          style={view === "grid" ? { background: "var(--bg-hover)", color: "var(--text-1)" } : { color: "var(--text-2)" }}
          aria-label="Vue grille"
        >
          <IconGridDots size={16} />
        </button>
        <button
          onClick={() => setView("list")}
          className="btn-icon"
          style={view === "list" ? { background: "var(--bg-hover)", color: "var(--text-1)" } : { color: "var(--text-2)" }}
          aria-label="Vue liste"
        >
          <IconList size={16} />
        </button>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const margin = product.price > 0 ? Math.round(((product.price - product.cost) / product.price) * 100) : 0;
            return (
              <div
                key={product.id}
                className="card relative"
                style={{ padding: 0, overflow: "hidden" }}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={{ height: 200, background: "var(--bg-card)", position: "relative" }} className="flex items-center justify-center">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.nameFr} className="h-full w-full object-cover" />
                  ) : (
                    <span style={{ color: "var(--text-3)", fontSize: 12 }}>Aucune image</span>
                  )}
                  <div style={{ position: "absolute", top: 8, left: 8 }}>
                    <ProductActiveToggle productId={product.id} active={product.active} />
                  </div>
                  <div style={{ position: "absolute", top: 8, right: 8 }}>
                    <span className="badge badge-neutral">{supplierBadgeLabel[product.supplier]}</span>
                  </div>
                  {hoveredId === product.id && (
                    <div
                      style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 4 }}
                    >
                      <button className="btn-icon" style={{ background: "var(--bg-surface)", color: "var(--text-2)" }} aria-label="Aperçu">
                        <IconEye size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ background: "var(--bg-surface)", color: "var(--danger)" }}
                        aria-label="Supprimer"
                        onClick={() => setToDelete(product)}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 p-3">
                  <p className="truncate text-[14px] font-medium" style={{ color: "var(--text-1)" }}>
                    {product.nameFr}
                  </p>
                  <div className="flex items-center gap-1.5 text-[12px]">
                    <span style={{ color: "var(--text-3)" }}>{product.cost.toFixed(2)} $</span>
                    <span style={{ color: "var(--text-3)" }}>→</span>
                    <span style={{ color: "var(--text-1)" }}>{product.price.toFixed(2)} $</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge tone="success">{margin}% marge</Badge>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {product.store.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="w-full">
            <thead>
              <tr>
                {["Produit", "Boutique", "Fournisseur", "Coût", "Prix de vente", "Marge", "Statut", ""].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.nameFr}</td>
                  <td className="td-muted">{product.store.name}</td>
                  <td className="td-muted">{supplierBadgeLabel[product.supplier]}</td>
                  <td className="td-muted">{product.cost.toFixed(2)} $</td>
                  <td>{product.price.toFixed(2)} $</td>
                  <td style={{ color: "var(--success)" }}>{(product.price - product.cost).toFixed(2)} $</td>
                  <td>
                    <ProductActiveToggle productId={product.id} active={product.active} />
                  </td>
                  <td>
                    <button onClick={() => setToDelete(product)} className="btn-icon" style={{ color: "var(--danger)" }} aria-label="Supprimer">
                      <IconTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        description={`Supprimer "${toDelete?.nameFr}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

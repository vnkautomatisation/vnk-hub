"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ManualProductModal({
  open,
  onClose,
  stores,
}: {
  open: boolean;
  onClose: () => void;
  stores: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(false);

  const storeOptions: SelectOption[] = stores.map((s) => ({ value: s.id, label: s.name }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        name,
        nameFr: name,
        description: "",
        descriptionFr: "",
        price: parseFloat(price),
        cost: parseFloat(cost),
        images: [],
        supplier: "MANUAL",
        supplierSku: sku || `MANUAL-${Date.now()}`,
      }),
    });
    setLoading(false);
    showToast("Produit ajouté", "success");
    setName("");
    setPrice("");
    setCost("");
    setSku("");
    onClose();
    router.refresh();
  }

  return (
    <Modal title="Ajouter un produit manuellement" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="input-label">Boutique</label>
          <Select options={storeOptions} value={storeId} onChange={setStoreId} minWidth="100%" />
        </div>
        <div>
          <label className="input-label">Nom du produit</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required className="w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Coût</label>
            <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required className="w-full" />
          </div>
          <div>
            <label className="input-label">Prix de vente</label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full" />
          </div>
        </div>
        <div>
          <label className="input-label">SKU (optionnel)</label>
          <Input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full" />
        </div>
        <Button type="submit" disabled={loading || !storeId} className="w-full" style={{ marginTop: 8 }}>
          {loading ? "Ajout..." : "Ajouter le produit"}
        </Button>
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { IconDownload, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ManualProductModal } from "@/components/products/manual-product-modal";

export function ProductsPageActions({ stores }: { stores: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Link href="/products/search">
        <Button>
          <IconDownload size={16} />
          Importer depuis fournisseur
        </Button>
      </Link>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <IconPlus size={16} />
        Ajouter manuellement
      </Button>
      <ManualProductModal open={open} onClose={() => setOpen(false)} stores={stores} />
    </div>
  );
}

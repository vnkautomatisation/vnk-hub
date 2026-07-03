"use client";

import { useState } from "react";
import { IconDownload, IconPlus } from "@tabler/icons-react";
import { CreateOrderModal } from "@/components/orders/create-order-modal";

type Store = { id: string; name: string };

export function OrdersHeaderActions({ stores, exportHref }: { stores: Store[]; exportHref: string }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      {showCreate && <CreateOrderModal stores={stores} onClose={() => setShowCreate(false)} />}
      <a href={exportHref} className="btn btn-secondary btn-sm" download>
        <IconDownload size={14} /> Exporter CSV
      </a>
      <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(true)}>
        <IconPlus size={14} /> Nouvelle commande
      </button>
    </>
  );
}

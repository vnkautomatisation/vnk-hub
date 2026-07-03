"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/lang-context";

const SUPPLIER_KEYS = [
  { value: "",                 labelFr: "Tous les fournisseurs", labelEn: "All suppliers" },
  { value: "CJ_DROPSHIPPING", labelFr: "CJ Dropshipping",       labelEn: "CJ Dropshipping" },
  { value: "ALIEXPRESS",       labelFr: "AliExpress",            labelEn: "AliExpress" },
  { value: "ZENDROP",          labelFr: "Zendrop",               labelEn: "Zendrop" },
  { value: "PRINTFUL",         labelFr: "Printful",              labelEn: "Printful" },
  { value: "MANUAL",           labelFr: "Manuel",                labelEn: "Manual" },
];

export function ProductsFilterBar({ stores, storeId, supplier, search }: {
  stores: { id: string; name: string }[];
  storeId?: string; supplier?: string; search?: string;
}) {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [localStore, setLocalStore]       = useState(storeId ?? "");
  const [localSupplier, setLocalSupplier] = useState(supplier ?? "");
  const [localSearch, setLocalSearch]     = useState(search ?? "");

  const storeOptions: SelectOption[] = [
    { value: "", label: t.ph_all_stores },
    ...stores.map((s) => ({ value: s.id, label: s.name })),
  ];
  const supplierOptions: SelectOption[] = SUPPLIER_KEYS.map((s) => ({ value: s.value, label: lang === "en" ? s.labelEn : s.labelFr }));

  function apply() {
    const params = new URLSearchParams();
    if (localStore)    params.set("storeId", localStore);
    if (localSupplier) params.set("supplier", localSupplier);
    if (localSearch)   params.set("search", localSearch);
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "12px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      <Select options={storeOptions}    value={localStore}    onChange={setLocalStore}    minWidth={140} />
      <Select options={supplierOptions} value={localSupplier} onChange={setLocalSupplier} minWidth={140} />
      <Input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder={t.ph_search_product} style={{ minWidth: 200, flex: 1, height: 36 }} />
      <button type="button" className="btn btn-primary" style={{ height: 36, padding: "0 16px", flexShrink: 0 }} onClick={apply}>{t.action_filter}</button>
      <Link href="/products" className="btn btn-ghost" style={{ height: 36 }}>{t.action_reset}</Link>
    </div>
  );
}

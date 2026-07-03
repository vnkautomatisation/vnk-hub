"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { useLanguage } from "@/contexts/lang-context";
import { IconSearch, IconX } from "@tabler/icons-react";

const STATUS_KEYS = [
  { value: "", labelFr: "Tous les statuts", labelEn: "All statuses" },
  { value: "PENDING",                 labelFr: "En attente",          labelEn: "Pending" },
  { value: "CONFIRMED",               labelFr: "Confirmée",           labelEn: "Confirmed" },
  { value: "DISPATCHED_TO_SUPPLIER",  labelFr: "Envoyée fournisseur", labelEn: "Sent to supplier" },
  { value: "SHIPPED",                 labelFr: "Expédiée",            labelEn: "Shipped" },
  { value: "IN_TRANSIT",              labelFr: "En transit",          labelEn: "In transit" },
  { value: "DELIVERED",               labelFr: "Livrée",              labelEn: "Delivered" },
  { value: "CANCELLED",               labelFr: "Annulée",             labelEn: "Cancelled" },
  { value: "REFUNDED",                labelFr: "Remboursée",          labelEn: "Refunded" },
];

const SUPPLIER_KEYS = [
  { value: "",                 labelFr: "Tous les fournisseurs", labelEn: "All suppliers" },
  { value: "CJ_DROPSHIPPING", labelFr: "CJ Dropshipping",       labelEn: "CJ Dropshipping" },
  { value: "ALIEXPRESS",       labelFr: "AliExpress",            labelEn: "AliExpress" },
  { value: "ZENDROP",          labelFr: "Zendrop",               labelEn: "Zendrop" },
  { value: "PRINTFUL",         labelFr: "Printful",              labelEn: "Printful" },
];

export function OrdersFilterBar({
  stores, status, storeId, supplier, from, to, search,
}: {
  stores: { id: string; name: string }[];
  status?: string; storeId?: string; supplier?: string;
  from?: string; to?: string; search?: string;
}) {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [localSearch,   setLocalSearch]   = useState(search ?? "");
  const [localStatus,   setLocalStatus]   = useState(status ?? "");
  const [localStore,    setLocalStore]    = useState(storeId ?? "");
  const [localSupplier, setLocalSupplier] = useState(supplier ?? "");
  const [localFrom,     setLocalFrom]     = useState(from ?? "");
  const [localTo,       setLocalTo]       = useState(to ?? "");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalSearch(search ?? ""); },   [search]);
  useEffect(() => { setLocalStatus(status ?? ""); },   [status]);
  useEffect(() => { setLocalStore(storeId ?? ""); },   [storeId]);
  useEffect(() => { setLocalSupplier(supplier ?? ""); }, [supplier]);
  useEffect(() => { setLocalFrom(from ?? ""); },       [from]);
  useEffect(() => { setLocalTo(to ?? ""); },           [to]);

  const statusOptions: SelectOption[] = STATUS_KEYS.map((s) => ({ value: s.value, label: lang === "en" ? s.labelEn : s.labelFr }));
  const supplierOptions: SelectOption[] = SUPPLIER_KEYS.map((s) => ({ value: s.value, label: lang === "en" ? s.labelEn : s.labelFr }));
  const storeOptions: SelectOption[] = [
    { value: "", label: t.ph_all_stores },
    ...stores.map((s) => ({ value: s.id, label: s.name })),
  ];

  function apply() {
    const params = new URLSearchParams();
    if (localSearch)   params.set("q", localSearch);
    if (localStatus)   params.set("status", localStatus);
    if (localStore)    params.set("storeId", localStore);
    if (localSupplier) params.set("supplier", localSupplier);
    if (localFrom)     params.set("from", localFrom);
    if (localTo)       params.set("to", localTo);
    router.push(`/orders?${params.toString()}`);
  }

  function reset() {
    setLocalSearch(""); setLocalStatus(""); setLocalStore("");
    setLocalSupplier(""); setLocalFrom(""); setLocalTo("");
    router.push("/orders");
  }

  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
      padding: "12px 16px",
      background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 10,
    }}>
      {/* Search */}
      <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 260 }}>
        <IconSearch size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
        <input
          ref={searchRef}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
          placeholder="Numéro, client, produit..."
          style={{
            width: "100%", height: 36, paddingLeft: 32, paddingRight: 10,
            background: "var(--bg-base)", border: "0.5px solid var(--border)",
            borderRadius: 8, fontSize: 13, color: "var(--text-1)", outline: "none",
            fontFamily: "inherit",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        />
      </div>

      <Select options={statusOptions}   value={localStatus}   onChange={setLocalStatus}   minWidth={150} />
      <Select options={storeOptions}    value={localStore}    onChange={setLocalStore}    minWidth={160} />
      <Select options={supplierOptions} value={localSupplier} onChange={setLocalSupplier} minWidth={155} />
      <DatePicker value={localFrom} onChange={setLocalFrom} placeholder={t.ph_start_date} minWidth={138} />
      <DatePicker value={localTo}   onChange={setLocalTo}   placeholder={t.ph_end_date}   minWidth={130} />

      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={apply}>
          <IconSearch size={13} /> {t.action_filter}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
          <IconX size={13} /> {t.action_reset}
        </button>
      </div>
    </div>
  );
}

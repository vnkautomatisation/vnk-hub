"use client";

import Link from "next/link";
import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus, Supplier } from "@prisma/client";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/contexts/lang-context";
import { EmptyState } from "@/components/ui/empty-state";
import {
  IconShoppingCartOff, IconChevronDown, IconChevronUp,
  IconX, IconCheck, IconDownload, IconUserPin, IconBan,
  IconEye, IconRefresh, IconMail, IconDots, IconSend,
  IconClipboardCopy, IconTruckDelivery,
} from "@tabler/icons-react";

type OrderRow = {
  id: string; orderNumber: string;
  customerName: string; customerEmail: string;
  totalAmount: number; currency: string; status: OrderStatus;
  trackingNumber: string | null; trackingUrl: string | null;
  createdAt: Date;
  store: { name: string };
  assignedTo: { id: string; name: string } | null;
  items: { product: { name: string; supplier: Supplier } }[];
};

type Employee = { id: string; name: string };

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:                { label: "En attente",       color: "#FBBF24", bg: "rgba(251,191,36,.14)"  },
  CONFIRMED:              { label: "Confirmée",         color: "#6366F1", bg: "rgba(99,102,241,.14)"  },
  DISPATCHED_TO_SUPPLIER: { label: "Chez fournisseur", color: "#A78BFA", bg: "rgba(167,139,250,.14)" },
  SHIPPED:                { label: "Expédiée",          color: "#34D399", bg: "rgba(52,211,153,.14)"  },
  IN_TRANSIT:             { label: "En transit",        color: "#60A5FA", bg: "rgba(96,165,250,.14)"  },
  DELIVERED:              { label: "Livrée",            color: "#4ADE80", bg: "rgba(74,222,128,.14)"  },
  CANCELLED:              { label: "Annulée",           color: "#F87171", bg: "rgba(248,113,113,.14)" },
  REFUNDED:               { label: "Remboursée",        color: "#FB923C", bg: "rgba(251,146,60,.14)"  },
};

const SUPPLIER_LABELS: Partial<Record<Supplier, string>> = {
  CJ_DROPSHIPPING: "CJ Dropshipping", ALIEXPRESS: "AliExpress",
  ZENDROP: "Zendrop", PRINTFUL: "Printful", MANUAL: "Manuel",
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function avatarGrad(name: string) {
  const g = ["#3B82F6,#6366F1","#8B5CF6,#EC4899","#10B981,#059669","#F59E0B,#EF4444","#6366F1,#8B5CF6"];
  return g[name.charCodeAt(0) % g.length];
}

function fmtDate(d: Date) { return new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "short" }); }
function fmtTime(d: Date) { return new Date(d).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }); }

type SortKey = "createdAt" | "totalAmount" | "status";

/* ── Fixed portal dropdown ── */
type DropdownPos = { top: number; right: number };

function FixedDropdown({ pos, onClose, children }: { pos: DropdownPos; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const fn = () => onClose();
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: pos.top,
        right: `calc(100vw - ${pos.right}px)`,
        zIndex: 1000,
        background: "var(--bg-surface)",
        border: "0.5px solid var(--border)",
        borderRadius: 10,
        padding: 4,
        minWidth: 190,
        boxShadow: "var(--shadow-lg)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export function OrdersTable({ orders, employees = [] }: { orders: OrderRow[]; employees?: Employee[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const [selected,      setSelected]      = useState<Set<string>>(new Set());
  const [hovered,       setHovered]       = useState<string | null>(null);
  const [dropdown,      setDropdown]      = useState<{ id: string; type: "dots" | "status" | "assign"; pos: DropdownPos } | null>(null);
  const [bulkStatus,    setBulkStatus]    = useState<DropdownPos | null>(null);
  const [bulkAssign,    setBulkAssign]    = useState<DropdownPos | null>(null);
  const [sortCol,       setSortCol]       = useState<SortKey>("createdAt");
  const [sortDir,       setSortDir]       = useState<"asc" | "desc">("desc");
  const [cancelConfirm, setCancelConfirm] = useState<{ ids: string[]; label: string } | null>(null);

  const closeDropdown = useCallback(() => { setDropdown(null); setBulkStatus(null); setBulkAssign(null); }, []);

  function toggleAll() { setSelected(selected.size === orders.length ? new Set() : new Set(orders.map((o) => o.id))); }
  function toggleOne(id: string) { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); }
  function handleSort(col: SortKey) { if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc"); } }

  function openDropdown(e: React.MouseEvent<HTMLElement>, id: string, type: "dots" | "status" | "assign") {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const pos: DropdownPos = { top: r.bottom + 4, right: r.right };
    setDropdown((prev) => prev?.id === id && prev.type === type ? null : { id, type, pos });
  }

  function openBulk(e: React.MouseEvent<HTMLElement>, type: "status" | "assign") {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const pos: DropdownPos = { top: r.bottom + 4, right: r.right };
    if (type === "status") { setBulkStatus((v) => v ? null : pos); setBulkAssign(null); }
    else { setBulkAssign((v) => v ? null : pos); setBulkStatus(null); }
  }

  const sorted = [...orders].sort((a, b) => {
    let c = 0;
    if (sortCol === "createdAt")   c = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortCol === "totalAmount") c = a.totalAmount - b.totalAmount;
    if (sortCol === "status")      c = a.status.localeCompare(b.status);
    return sortDir === "asc" ? c : -c;
  });

  async function patchOrder(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { showToast("Erreur", "error"); return false; }
    startTransition(() => router.refresh());
    return true;
  }

  async function bulkAction(action: string, value?: string) {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const res = await fetch("/api/orders/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, action, value }) });
    if (!res.ok) { showToast("Erreur", "error"); return; }
    if (action === "export") {
      const data = await res.json();
      const csv = [
        ["N°", "Client", "Email", "Boutique", "Montant", "Statut", "Tracking", "Date"],
        ...data.map((o: OrderRow) => [o.orderNumber, o.customerName, o.customerEmail, o.store.name, `${o.totalAmount.toFixed(2)} ${o.currency}`, STATUS_META[o.status]?.label ?? o.status, o.trackingNumber ?? "", new Date(o.createdAt).toLocaleDateString("fr-CA")]),
      ].map((r) => r.map((c: string) => `"${c}"`).join(",")).join("\n");
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: "commandes.csv" });
      a.click(); showToast(`${ids.length} commandes exportées`, "success");
    } else {
      const { updated } = await res.json();
      showToast(`${updated} commandes mises à jour`, "success");
      setSelected(new Set());
      startTransition(() => router.refresh());
    }
    closeDropdown();
  }

  async function confirmCancel() {
    if (!cancelConfirm) return;
    const res = await fetch("/api/orders/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: cancelConfirm.ids, action: "cancel" }) });
    setCancelConfirm(null);
    if (res.ok) {
      const { updated } = await res.json();
      showToast(`${updated} commande${updated > 1 ? "s" : ""} annulée${updated > 1 ? "s" : ""}`, "success");
      setSelected(new Set());
      closeDropdown();
      startTransition(() => router.refresh());
    } else {
      showToast("Erreur lors de l'annulation", "error");
    }
  }

  if (orders.length === 0) return <EmptyState icon={IconShoppingCartOff} title={t.orders_empty} description={t.orders_empty_desc} />;

  const selCount = selected.size;

  function SortTh({ col, label, right }: { col: SortKey; label: string; right?: boolean }) {
    const active = sortCol === col;
    return (
      <th onClick={() => handleSort(col)} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 500, color: active ? "var(--accent-light)" : "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", textAlign: right ? "right" : "left", background: "var(--bg-base)", borderBottom: "0.5px solid var(--border)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          {label} {active && (sortDir === "asc" ? <IconChevronUp size={11}/> : <IconChevronDown size={11}/>)}
        </span>
      </th>
    );
  }

  function Th({ label }: { label: string }) {
    return <th style={{ padding: "11px 16px", fontSize: 11, fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", textAlign: "left", background: "var(--bg-base)", borderBottom: "0.5px solid var(--border)" }}>{label}</th>;
  }

  const DD = dropdown;

  return (
    <div style={{ position: "relative" }}>
      {/* Cancel confirmation modal */}
      {cancelConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 14, padding: 24, maxWidth: 420, width: "calc(100% - 32px)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 20, alignItems: "flex-start" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(248,113,113,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconBan size={20} style={{ color: "var(--danger)" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>Annuler {cancelConfirm.label} ?</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
                  Cette action est irréversible. Les commandes annulées ne peuvent pas être réactivées.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setCancelConfirm(null)}>Retour</button>
              <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff", border: "none" }} onClick={confirmCancel}>
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Bulk bar ── */}
      {selCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "10px 16px", background: "rgba(99,102,241,0.08)", border: "0.5px solid rgba(99,102,241,0.3)", borderRadius: 8, margin: "0 0 12px", animation: "slide-up 200ms ease" }}>
          <IconCheck size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--accent-light)", fontWeight: 500 }}>
            {selCount} commande{selCount > 1 ? "s" : ""} sélectionnée{selCount > 1 ? "s" : ""}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={(e) => openBulk(e, "assign")}>
              <IconUserPin size={13}/> Assigner <IconChevronDown size={11}/>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={(e) => openBulk(e, "status")}>
              <IconRefresh size={13}/> Statut <IconChevronDown size={11}/>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => bulkAction("export")}>
              <IconDownload size={13}/> Exporter
            </button>
            <button className="btn btn-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "0.5px solid var(--danger)" }} onClick={() => setCancelConfirm({ ids: Array.from(selected), label: `${selCount} commande${selCount > 1 ? "s" : ""}` })}>
              <IconBan size={13}/> Annuler
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())} style={{ color: "var(--text-3)" }}>
              <IconX size={13}/>
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ width: 44, padding: "11px 16px", background: "var(--bg-base)", borderBottom: "0.5px solid var(--border)" }}>
                <input type="checkbox" checked={orders.length > 0 && selected.size === orders.length} onChange={toggleAll} style={{ width: 14, height: 14 }} />
              </th>
              <SortTh col="createdAt"   label="N° / Date" />
              <Th label="Client" />
              <Th label="Produit" />
              <Th label="Boutique" />
              <SortTh col="totalAmount" label="Montant" right />
              <SortTh col="status"      label="Statut" />
              <Th label="Fournisseur" />
              <Th label="Agent" />
              <Th label="Tracking" />
              <th style={{ width: 130, background: "var(--bg-base)", borderBottom: "0.5px solid var(--border)" }}/>
            </tr>
          </thead>
          <tbody>
            {sorted.map((order) => {
              const meta   = STATUS_META[order.status];
              const isHov  = hovered === order.id;
              const isSel  = selected.has(order.id);
              const grad   = avatarGrad(order.customerName);

              return (
                <tr
                  key={order.id}
                  style={{ borderBottom: "0.5px solid var(--border)", background: isSel ? "rgba(99,102,241,0.04)" : isHov ? "var(--bg-hover)" : "var(--bg-surface)", transition: "background 100ms" }}
                  onMouseEnter={() => setHovered(order.id)}
                  onMouseLeave={() => { setHovered(null); }}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <input type="checkbox" checked={isSel} onChange={() => toggleOne(order.id)} style={{ width: 14, height: 14 }} />
                  </td>

                  {/* N° / Date */}
                  <td style={{ padding: "13px 16px", minWidth: 110 }}>
                    <Link href={`/orders/${order.id}`} style={{ fontSize: 13, fontWeight: 500, color: "var(--accent-light)", textDecoration: "none" }}>
                      {order.orderNumber}
                    </Link>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                      {fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}
                    </div>
                  </td>

                  {/* Client */}
                  <td style={{ padding: "13px 16px", minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${grad})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {initials(order.customerName)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: "var(--text-1)" }}>{order.customerName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{order.customerEmail}</div>
                      </div>
                    </div>
                  </td>

                  {/* Produit */}
                  <td style={{ padding: "13px 16px", maxWidth: 180 }}>
                    <div style={{ fontSize: 13, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                      {order.items[0]?.product.name ?? "—"}
                      {order.items.length > 1 && <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 4 }}>+{order.items.length - 1}</span>}
                    </div>
                  </td>

                  {/* Boutique */}
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ fontSize: 12, color: "var(--text-2)", background: "var(--bg-base)", border: "0.5px solid var(--border)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap" }}>
                      {order.store.name}
                    </span>
                  </td>

                  {/* Montant */}
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
                      {order.totalAmount.toLocaleString("fr-CA", { minimumFractionDigits: 2 })} $
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{order.currency}</div>
                  </td>

                  {/* Statut */}
                  <td style={{ padding: "13px 16px" }}>
                    {meta && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: meta.bg, color: meta.color, whiteSpace: "nowrap" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 }}/>
                        {meta.label}
                      </span>
                    )}
                  </td>

                  {/* Fournisseur */}
                  <td style={{ padding: "13px 16px" }}>
                    {(() => {
                      const supps = [...new Set(order.items.map((i) => i.product.supplier).filter(Boolean))] as Supplier[];
                      if (!supps.length) return <span style={{ color: "var(--text-3)", fontSize: 13 }}>—</span>;
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {supps.map((s) => (
                            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <div style={{ width: 16, height: 16, borderRadius: 3, background: "var(--bg-base)", border: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <IconTruckDelivery size={9} style={{ color: "var(--text-3)" }}/>
                              </div>
                              <span style={{ fontSize: 11, color: "var(--text-2)", whiteSpace: "nowrap" }}>{SUPPLIER_LABELS[s] ?? s}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Agent */}
                  <td style={{ padding: "13px 16px" }}>
                    {order.assignedTo ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg-active)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "var(--accent-light)", flexShrink: 0 }}>
                          {initials(order.assignedTo.name)}
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap" }}>{order.assignedTo.name}</span>
                      </div>
                    ) : (
                      employees.length > 0 ? (
                        <button style={{ fontSize: 11, color: "var(--accent-light)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }} onClick={(e) => openDropdown(e, order.id, "assign")}>
                          + Assigner
                        </button>
                      ) : <span style={{ color: "var(--text-3)", fontSize: 13 }}>—</span>
                    )}
                  </td>

                  {/* Tracking */}
                  <td style={{ padding: "13px 16px" }}>
                    {order.trackingNumber ? (
                      order.trackingUrl
                        ? <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--info)", fontFamily: "monospace", textDecoration: "none" }}>{order.trackingNumber}</a>
                        : <span style={{ fontSize: 12, color: "var(--info)", fontFamily: "monospace" }}>{order.trackingNumber}</span>
                    ) : <span style={{ color: "var(--text-3)" }}>—</span>}
                  </td>

                  {/* Actions (visible on hover) */}
                  <td style={{ padding: "13px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end", opacity: isHov ? 1 : 0, transition: "opacity 120ms" }}>
                      {/* Context shortcut */}
                      {order.status === "PENDING" && (
                        <button title="Confirmer" style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1" }}
                          onClick={async () => { if (await patchOrder(order.id, { status: "CONFIRMED" })) showToast("Confirmée", "success"); }}>
                          <IconCheck size={13}/>
                        </button>
                      )}
                      {order.status === "CONFIRMED" && (
                        <button title="Dispatcher" style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#A78BFA" }}
                          onClick={async () => { const r = await fetch(`/api/orders/${order.id}/dispatch`, { method: "POST" }); if (r.ok) { showToast("Dispatché", "success"); startTransition(() => router.refresh()); } }}>
                          <IconSend size={13}/>
                        </button>
                      )}
                      {/* Status */}
                      <button title="Changer statut" style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}
                        onClick={(e) => openDropdown(e, order.id, "status")}>
                        <IconRefresh size={13}/>
                      </button>
                      {/* View */}
                      <Link href={`/orders/${order.id}`} title="Voir détail" style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}>
                        <IconEye size={13}/>
                      </Link>
                      {/* Email */}
                      <a href={`mailto:${order.customerEmail}?subject=Votre commande ${order.orderNumber}`} title="Email client" style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)", textDecoration: "none" }}>
                        <IconMail size={13}/>
                      </a>
                      {/* Dots */}
                      <button title="Plus d'actions" style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}
                        onClick={(e) => openDropdown(e, order.id, "dots")}>
                        <IconDots size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Fixed dropdowns (no overflow clipping) ── */}
      {DD && DD.type === "status" && (
        <FixedDropdown pos={DD.pos} onClose={closeDropdown}>
          {Object.entries(STATUS_META).map(([k, m]) => (
            <button key={k} className="dropdown-item" style={{ fontSize: 12 }} onClick={async () => { if (await patchOrder(DD.id, { status: k })) { showToast(`→ ${m.label}`, "success"); closeDropdown(); } }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.color, flexShrink: 0 }}/> {m.label}
            </button>
          ))}
        </FixedDropdown>
      )}

      {DD && DD.type === "assign" && employees.length > 0 && (
        <FixedDropdown pos={DD.pos} onClose={closeDropdown}>
          <button className="dropdown-item" style={{ fontSize: 12 }} onClick={async () => { if (await patchOrder(DD.id, { assignedToId: null })) { showToast("Désassigné", "success"); closeDropdown(); } }}>Non assigné</button>
          {employees.map((e) => (
            <button key={e.id} className="dropdown-item" style={{ fontSize: 12 }} onClick={async () => { if (await patchOrder(DD.id, { assignedToId: e.id })) { showToast(`Assigné à ${e.name}`, "success"); closeDropdown(); } }}>
              {e.name}
            </button>
          ))}
        </FixedDropdown>
      )}

      {DD && DD.type === "dots" && (() => {
        const o = orders.find((x) => x.id === DD.id);
        return o ? (
          <FixedDropdown pos={DD.pos} onClose={closeDropdown}>
            <button className="dropdown-item" style={{ fontSize: 12 }} onClick={() => { navigator.clipboard.writeText(o.orderNumber); showToast("N° copié", "success"); closeDropdown(); }}>
              <IconClipboardCopy size={13}/> Copier N° commande
            </button>
            {o.trackingNumber && (
              <button className="dropdown-item" style={{ fontSize: 12 }} onClick={() => { navigator.clipboard.writeText(o.trackingNumber!); showToast("Tracking copié", "success"); closeDropdown(); }}>
                <IconClipboardCopy size={13}/> Copier tracking
              </button>
            )}
            <div style={{ height: "0.5px", background: "var(--border)", margin: "4px 0" }}/>
            <button className="dropdown-item" style={{ fontSize: 12, color: "var(--danger)" }} onClick={() => { closeDropdown(); setCancelConfirm({ ids: [o.id], label: `la commande ${o.orderNumber}` }); }}>
              <IconBan size={13}/> Annuler la commande
            </button>
          </FixedDropdown>
        ) : null;
      })()}

      {/* Bulk dropdowns */}
      {bulkStatus && (
        <FixedDropdown pos={bulkStatus} onClose={closeDropdown}>
          {Object.entries(STATUS_META).map(([k, m]) => (
            <button key={k} className="dropdown-item" style={{ fontSize: 12 }} onClick={() => bulkAction("status", k)}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.color, flexShrink: 0 }}/> {m.label}
            </button>
          ))}
        </FixedDropdown>
      )}

      {bulkAssign && employees.length > 0 && (
        <FixedDropdown pos={bulkAssign} onClose={closeDropdown}>
          <button className="dropdown-item" style={{ fontSize: 12 }} onClick={() => bulkAction("assign", "")}>Non assigné</button>
          {employees.map((e) => (
            <button key={e.id} className="dropdown-item" style={{ fontSize: 12 }} onClick={() => bulkAction("assign", e.id)}>{e.name}</button>
          ))}
        </FixedDropdown>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/Select";
import { StatusTransitionModal, type TransitionResult } from "@/components/orders/status-transition-modal";
import {
  IconX, IconExternalLink, IconSend, IconRefresh, IconCopy,
  IconCheck, IconChevronDown, IconNotes, IconTruck,
  IconMail, IconUser, IconPackage, IconClipboardCopy, IconAlertCircle,
} from "@tabler/icons-react";

type LiveOrder = {
  id: string; orderNumber: string; status: string;
  customerName: string; customerEmail?: string; totalAmount: number; currency: string;
  createdAt: string; updatedAt: string;
  store: { name: string };
  assignedTo: { id: string; name: string } | null;
  items: { product: { name: string } }[];
  trackingNumber?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente", CONFIRMED: "Confirmée",
  DISPATCHED_TO_SUPPLIER: "Chez fournisseur", SHIPPED: "Expédiée",
  IN_TRANSIT: "En transit", DELIVERED: "Livrée",
  CANCELLED: "Annulée", REFUNDED: "Remboursée",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#FBBF24", CONFIRMED: "#6366F1", DISPATCHED_TO_SUPPLIER: "#A78BFA",
  SHIPPED: "#34D399", IN_TRANSIT: "#60A5FA", DELIVERED: "#4ADE80",
  CANCELLED: "#F87171", REFUNDED: "#FB923C",
};

const STATUS_KEYS = [
  "PENDING", "CONFIRMED", "DISPATCHED_TO_SUPPLIER",
  "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "REFUNDED",
];

// Statuses that need a guided workflow modal
const GUIDED_STATUSES = new Set(["CONFIRMED", "DISPATCHED_TO_SUPPLIER", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]);

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ConfirmInline({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ background: "rgba(248,113,113,0.08)", border: "0.5px solid #F8717150", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
        <IconAlertCircle size={15} style={{ color: "#F87171", flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{message}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>Annuler</button>
        <button className="btn btn-sm" style={{ flex: 1, background: "#F87171", color: "#fff", border: "none", justifyContent: "center" }} onClick={onConfirm}>Confirmer</button>
      </div>
    </div>
  );
}

export function OrderSlidePanel({
  order: initialOrder,
  employees,
  onClose,
  onStatusChange,
}: {
  order: LiveOrder;
  employees: { id: string; name: string }[];
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const { showToast } = useToast();
  const [order, setOrder] = useState(initialOrder);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState<{ id: string; content: string; createdAt: string; user: { name: string } }[]>([]);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [transition, setTransition] = useState<string | null>(null); // toStatus for the modal
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Load notes on open
  useEffect(() => {
    fetch(`/api/orders/${order.id}/notes`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (Array.isArray(data)) setNotes(data); })
      .catch(() => {});
  }, [order.id]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && !transition) onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, transition]);

  // Outside click closes status menu
  useEffect(() => {
    if (!statusMenuOpen) return;
    const fn = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [statusMenuOpen]);

  function openTransition(toStatus: string) {
    setStatusMenuOpen(false);
    if (GUIDED_STATUSES.has(toStatus)) {
      setTransition(toStatus);
    } else {
      // PENDING or REFUNDED — direct change
      quickSetStatus(toStatus);
    }
  }

  async function quickSetStatus(status: string) {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { showToast("Erreur lors du changement de statut", "error"); return; }
    setOrder((prev) => ({ ...prev, status }));
    onStatusChange(order.id, status);
    showToast(`Statut → ${STATUS_LABELS[status]}`, "success");
  }

  function handleTransitionSuccess(result: TransitionResult) {
    setTransition(null);
    setOrder((prev) => ({
      ...prev,
      status: result.status,
      trackingNumber: result.trackingNumber !== undefined ? result.trackingNumber : prev.trackingNumber,
      supplierOrderId: (result.supplierOrderId !== undefined ? result.supplierOrderId : (prev as never as { supplierOrderId?: string | null }).supplierOrderId) as never,
    }));
    onStatusChange(order.id, result.status);
    showToast(`Statut → ${STATUS_LABELS[result.status]}`, "success");
  }

  async function doRefund() {
    setConfirmRefund(false);
    const res = await fetch(`/api/orders/${order.id}/refund`, { method: "POST" });
    if (!res.ok) { showToast("Erreur lors du remboursement", "error"); return; }
    const data = await res.json();
    setOrder((prev) => ({ ...prev, status: "REFUNDED" }));
    onStatusChange(order.id, "REFUNDED");
    showToast(data.stripe ? "Remboursé via Stripe" : "Statut remboursé", "success");
  }

  async function addNote() {
    if (!noteText.trim()) return;
    const res = await fetch(`/api/orders/${order.id}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteText }),
    });
    if (!res.ok) { showToast("Erreur lors de l'ajout", "error"); return; }
    const note = await res.json();
    setNotes((prev) => [...prev, note]);
    setNoteText("");
    showToast("Note ajoutée", "success");
  }

  async function assignAgent(agentId: string) {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: agentId || null }),
    });
    if (!res.ok) { showToast("Erreur lors de l'assignation", "error"); return; }
    const agent = employees.find((e) => e.id === agentId) ?? null;
    setOrder((prev) => ({ ...prev, assignedTo: agent }));
    showToast("Agent assigné", "success");
  }

  function copyOrderNumber() {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const isBlocked = Date.now() - new Date(order.createdAt).getTime() > 48 * 3600 * 1000
    && !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status);

  const agentOptions = [
    { value: "", label: "Non assigné" },
    ...employees.map((e) => ({ value: e.id, label: e.name })),
  ];

  return (
    <>
      {/* Transition modal */}
      {transition && (
        <StatusTransitionModal
          orderId={order.id}
          orderNumber={order.orderNumber}
          fromStatus={order.status}
          toStatus={transition}
          totalAmount={order.totalAmount}
          currency={order.currency}
          onSuccess={handleTransitionSuccess}
          onClose={() => setTransition(null)}
        />
      )}

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", zIndex: 200 }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
        background: "var(--bg-surface)", borderLeft: "0.5px solid var(--border)",
        zIndex: 201, display: "flex", flexDirection: "column",
        boxShadow: "var(--shadow-lg)",
        animation: "slide-in-right 200ms ease",
      }}>

        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
              <IconX size={15} />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{order.orderNumber}</span>
                <button onClick={copyOrderNumber} className="btn btn-ghost btn-sm" style={{ padding: "2px 6px" }}>
                  {copied ? <IconCheck size={12} style={{ color: "var(--success)" }} /> : <IconCopy size={12} />}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>{fmtDateTime(order.createdAt)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StatusBadge status={order.status as never} label={STATUS_LABELS[order.status] ?? order.status} />
            <Link href={`/orders/${order.id}`} className="btn btn-ghost btn-icon btn-sm" title="Fiche complète">
              <IconExternalLink size={14} />
            </Link>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Blocked warning */}
          {isBlocked && (
            <div style={{ background: "var(--danger-bg)", border: "0.5px solid var(--danger)", borderRadius: 9, padding: "9px 13px", fontSize: 12, color: "var(--danger)", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
              <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
              Commande bloquée depuis plus de 48h — action requise
            </div>
          )}

          {/* Quick actions */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Actions rapides</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {order.status === "PENDING" && (
                <button className="btn btn-sm" style={{ background: "rgba(96,165,250,0.10)", color: "var(--info)", border: "0.5px solid var(--info)" }} onClick={() => openTransition("CONFIRMED")}>
                  <IconCheck size={12} /> Confirmer
                </button>
              )}
              {order.status === "CONFIRMED" && (
                <button className="btn btn-primary btn-sm" onClick={() => openTransition("DISPATCHED_TO_SUPPLIER")}>
                  <IconSend size={12} /> Dispatcher
                </button>
              )}
              {order.status === "DISPATCHED_TO_SUPPLIER" && (
                <button className="btn btn-sm" style={{ background: "rgba(99,102,241,0.10)", color: "var(--accent)", border: "0.5px solid var(--accent)" }} onClick={() => openTransition("SHIPPED")}>
                  <IconTruck size={12} /> Marquer Expédiée
                </button>
              )}
              {(order.status === "SHIPPED" || order.status === "IN_TRANSIT") && (
                <button className="btn btn-sm" style={{ background: "var(--success-bg)", color: "var(--success)", border: "0.5px solid var(--success)" }} onClick={() => openTransition("DELIVERED")}>
                  <IconCheck size={12} /> Marquer Livrée
                </button>
              )}
              {(order.status === "DELIVERED" || order.status === "SHIPPED") && !confirmRefund && (
                <button className="btn btn-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "0.5px solid var(--danger)" }} onClick={() => setConfirmRefund(true)}>
                  <IconRefresh size={12} /> Rembourser
                </button>
              )}
              {order.customerEmail && (
                <a href={`mailto:${order.customerEmail}?subject=Votre commande ${order.orderNumber}`} className="btn btn-secondary btn-sm">
                  <IconMail size={12} /> Email client
                </a>
              )}
              {order.trackingNumber && (
                <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(order.trackingNumber!); showToast("Tracking copié", "success"); }}>
                  <IconClipboardCopy size={12} /> Copier tracking
                </button>
              )}

              {/* Status dropdown */}
              <div ref={statusMenuRef} style={{ position: "relative" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setStatusMenuOpen((v) => !v)}>
                  Statut <IconChevronDown size={11} style={{ transition: "transform 150ms", transform: statusMenuOpen ? "rotate(180deg)" : "none" }} />
                </button>
                {statusMenuOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 210,
                    background: "var(--bg-surface)", border: "0.5px solid var(--border)",
                    borderRadius: 10, padding: 4, minWidth: 200, boxShadow: "var(--shadow-lg)",
                  }}>
                    {STATUS_KEYS.map((s) => (
                      <button key={s} className="dropdown-item" onClick={() => {
                        if (s === "REFUNDED") { setStatusMenuOpen(false); setConfirmRefund(true); }
                        else openTransition(s);
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[s], flexShrink: 0 }} />
                        <span style={{ color: "var(--text-1)" }}>{STATUS_LABELS[s]}</span>
                        {order.status === s && <IconCheck size={11} style={{ marginLeft: "auto", color: "var(--success)" }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Confirm refund inline */}
          {confirmRefund && (
            <ConfirmInline
              message={`Confirmer le remboursement de ${order.totalAmount.toFixed(2)} ${order.currency} pour ${order.customerName} ?`}
              onConfirm={doRefund}
              onCancel={() => setConfirmRefund(false)}
            />
          )}

          {/* Order info */}
          <div className="card" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconUser size={12} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{order.customerName}</span>
            </div>
            {order.customerEmail && (
              <div style={{ fontSize: 12, color: "var(--accent-light)", paddingLeft: 20 }}>{order.customerEmail}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <IconPackage size={12} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>{order.store.name}</span>
            </div>
            {order.items.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--text-3)", paddingLeft: 20 }}>
                {order.items.map((i) => i.product.name).join(", ")}
              </div>
            )}
            {order.trackingNumber && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <IconTruck size={12} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                <code style={{ fontSize: 11, color: "var(--text-2)" }}>{order.trackingNumber}</code>
              </div>
            )}
            <div style={{ marginTop: 6, paddingTop: 8, borderTop: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                {order.totalAmount.toFixed(2)} {order.currency}
              </span>
            </div>
          </div>

          {/* Agent assigné */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Agent assigné</div>
            <Select
              options={agentOptions}
              value={order.assignedTo?.id ?? ""}
              onChange={assignAgent}
            />
          </div>

          {/* Notes internes */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <IconNotes size={11} /> Notes internes
            </div>
            {notes.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>Aucune note.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {notes.map((n) => (
                  <div key={n.id} style={{ background: "var(--bg-base)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.5 }}>{n.content}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>{n.user.name}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                className="input"
                style={{ fontSize: 12, flex: 1 }}
                placeholder="Ajouter une note (Entrée)..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
              />
              <button className="btn btn-primary" style={{ padding: "0 12px", flexShrink: 0 }} onClick={addNote} disabled={!noteText.trim()}>
                <IconSend size={13} />
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: "0.5px solid var(--border)", flexShrink: 0 }}>
          <Link href={`/orders/${order.id}`} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            Ouvrir la fiche complète <IconExternalLink size={13} />
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

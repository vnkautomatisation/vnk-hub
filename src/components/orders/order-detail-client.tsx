"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { OrderStatus, Supplier } from "@prisma/client";
import { StatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { StatusTransitionModal, type TransitionResult } from "@/components/orders/status-transition-modal";
import {
  IconArrowLeft, IconTruck, IconUser, IconMapPin, IconCreditCard,
  IconNotes, IconHistory, IconPackage, IconChevronDown, IconSend,
  IconRefresh, IconTrash, IconCheck, IconClock, IconMail,
  IconPrinter, IconCopy, IconEdit, IconX, IconPlus,
  IconExternalLink, IconAlertCircle, IconBuilding,
} from "@tabler/icons-react";

type TrackingEvent = { id: string; status: string; location: string | null; occurredAt: Date };
type OrderNote = { id: string; content: string; createdAt: Date; user: { name: string } };
type RelatedOrder = { id: string; orderNumber: string; status: OrderStatus; totalAmount: number; currency: string; createdAt: string };
type OrderItem = {
  id: string; quantity: number; price: number;
  product: { name: string; supplier: Supplier; supplierSku: string; price: number; cost: number };
};
type StatusHistoryEntry = {
  id: string; fromStatus: string | null; toStatus: string; userId: string | null;
  note: string | null; createdAt: Date;
  user?: { name: string } | null;
};
type Order = {
  id: string; orderNumber: string; status: OrderStatus;
  customerName: string; customerEmail: string; customerPhone: string | null;
  shippingAddress: unknown;
  totalAmount: number; currency: string;
  stripePaymentId: string | null; supplierOrderId: string | null;
  trackingNumber: string | null; trackingUrl: string | null; trackingCarrier: string | null;
  notes: string | null;
  cancellationReason: string | null;
  expectedDeliveryAt: Date | null;
  createdAt: Date; updatedAt: Date;
  store: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
  items: OrderItem[];
  trackingEvents: TrackingEvent[];
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "En attente", CONFIRMED: "Confirmée",
  DISPATCHED_TO_SUPPLIER: "Envoyée fournisseur", SHIPPED: "Expédiée",
  IN_TRANSIT: "En transit", DELIVERED: "Livrée",
  CANCELLED: "Annulée", REFUNDED: "Remboursée",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "#FBBF24", CONFIRMED: "#6366F1", DISPATCHED_TO_SUPPLIER: "#A78BFA",
  SHIPPED: "#34D399", IN_TRANSIT: "#60A5FA", DELIVERED: "#4ADE80",
  CANCELLED: "#F87171", REFUNDED: "#FB923C",
};

const STATUS_FLOW: OrderStatus[] = [
  "PENDING", "CONFIRMED", "DISPATCHED_TO_SUPPLIER", "SHIPPED", "IN_TRANSIT", "DELIVERED",
];

const STATUS_KEYS: OrderStatus[] = [
  "PENDING", "CONFIRMED", "DISPATCHED_TO_SUPPLIER", "SHIPPED",
  "IN_TRANSIT", "DELIVERED", "CANCELLED", "REFUNDED",
];

const EMAIL_TEMPLATES: Record<OrderStatus, { subject: string; body: string }> = {
  PENDING: {
    subject: "Votre commande {orderNumber} est en cours de traitement",
    body: "Bonjour {customerName},\n\nNous avons bien reçu votre commande {orderNumber} et elle est actuellement en cours de traitement.\n\nNous vous contacterons dès qu'elle sera confirmée.\n\nMerci de votre confiance !\n\nL'équipe",
  },
  CONFIRMED: {
    subject: "Commande {orderNumber} confirmée",
    body: "Bonjour {customerName},\n\nVotre commande {orderNumber} a été confirmée et est en cours de préparation.\n\nNous vous enverrons une mise à jour dès qu'elle sera expédiée.\n\nL'équipe",
  },
  DISPATCHED_TO_SUPPLIER: {
    subject: "Commande {orderNumber} - Traitement en cours",
    body: "Bonjour {customerName},\n\nVotre commande {orderNumber} a été transmise à notre fournisseur.\n\nNous vous communiquerons le numéro de suivi dès que disponible.\n\nL'équipe",
  },
  SHIPPED: {
    subject: "Votre commande {orderNumber} est en route !",
    body: "Bonjour {customerName},\n\nExcellente nouvelle — votre commande {orderNumber} vient d'être expédiée !\n\nNuméro de suivi : {trackingNumber}\nSuivre ma commande : {trackingUrl}\n\nDélai estimé : 7-14 jours ouvrables.\n\nL'équipe",
  },
  IN_TRANSIT: {
    subject: "Commande {orderNumber} - En transit",
    body: "Bonjour {customerName},\n\nVotre commande {orderNumber} est actuellement en transit.\n\nNuméro de suivi : {trackingNumber}\n\nL'équipe",
  },
  DELIVERED: {
    subject: "Commande {orderNumber} livrée",
    body: "Bonjour {customerName},\n\nVotre commande {orderNumber} a été livrée.\n\nNous espérons que vous êtes satisfait(e) de votre achat. N'hésitez pas à nous contacter si vous avez des questions.\n\nL'équipe",
  },
  CANCELLED: {
    subject: "Commande {orderNumber} annulée",
    body: "Bonjour {customerName},\n\nNous vous informons que votre commande {orderNumber} a été annulée.\n\nSi vous avez des questions, n'hésitez pas à nous contacter.\n\nL'équipe",
  },
  REFUNDED: {
    subject: "Remboursement - Commande {orderNumber}",
    body: "Bonjour {customerName},\n\nNous vous confirmons que le remboursement de votre commande {orderNumber} a été traité.\n\nVeuillez prévoir 3-5 jours ouvrables pour que le montant apparaisse sur votre relevé.\n\nL'équipe",
  },
};

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("fr-CA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function avatarColor(name: string) {
  const palette = ["#6366F1", "#8B5CF6", "#EC4899", "#F97316", "#14B8A6", "#0EA5E9", "#84CC16"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % palette.length;
  return palette[h];
}

function Section({ title, icon, iconBg, action, children }: {
  title: string; icon: React.ReactNode; iconBg: string;
  action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: "12px 18px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 27, height: 27, borderRadius: 8, background: `${iconBg}20`, display: "flex", alignItems: "center", justifyContent: "center", color: iconBg }}>
            {icon}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 14, padding: 24, maxWidth: 420, width: "calc(100% - 32px)", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 22, alignItems: "flex-start" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(248,113,113,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconAlertCircle size={20} style={{ color: "#F87171" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>Confirmer l'action</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>{message}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Annuler</button>
          <button className="btn btn-sm" style={{ background: "#F87171", color: "#fff", border: "none" }} onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}

function EmailModal({ order, onClose, onSend }: {
  order: Order; onClose: () => void;
  onSend: (subject: string, body: string) => Promise<void>;
}) {
  const tpl = EMAIL_TEMPLATES[order.status];
  const fill = (s: string) => s
    .replace(/{orderNumber}/g, order.orderNumber)
    .replace(/{customerName}/g, order.customerName)
    .replace(/{trackingNumber}/g, order.trackingNumber ?? "N/A")
    .replace(/{trackingUrl}/g, order.trackingUrl ?? "");

  const [subject, setSubject] = useState(fill(tpl.subject));
  const [body, setBody] = useState(fill(tpl.body));
  const [sending, setSending] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 14, padding: 24, width: 600, maxWidth: "calc(100vw - 32px)", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>Envoyer un email</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
              {order.customerName} · {order.customerEmail}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="input-label">Objet</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Message</label>
            <textarea
              className="input"
              style={{ height: 220, resize: "vertical", paddingTop: 10, fontFamily: "inherit", lineHeight: 1.6 }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary btn-sm"
            disabled={sending}
            onClick={async () => {
              setSending(true);
              await onSend(subject, body);
              setSending(false);
              onClose();
            }}
          >
            <IconSend size={13} /> {sending ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailClient({
  order: initialOrder,
  employees,
  notes: initialNotes,
  relatedOrders = [],
  trackingEnabled = false,
  statusHistory: initialStatusHistory = [],
}: {
  order: Order;
  employees: { id: string; name: string }[];
  notes: OrderNote[];
  relatedOrders?: RelatedOrder[];
  trackingEnabled?: boolean;
  statusHistory?: StatusHistoryEntry[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [order, setOrder] = useState(initialOrder);
  const [notes, setNotes] = useState(initialNotes);
  const [noteText, setNoteText] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [editTracking, setEditTracking] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? "");
  const [trackingEvents, setTrackingEvents] = useState(order.trackingEvents);
  const [refreshingTracking, setRefreshingTracking] = useState(false);
  const [notesLoading, setNotesLoading] = useState(initialNotes.length === 0);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [editSupplierOrderId, setEditSupplierOrderId] = useState(false);
  const [supplierOrderId, setSupplierOrderId] = useState(order.supplierOrderId ?? "");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [pendingTransition, setPendingTransition] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState(initialStatusHistory);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Load notes from API on mount
  useEffect(() => {
    setNotesLoading(true);
    fetch(`/api/orders/${order.id}/notes`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (Array.isArray(data)) setNotes(data); })
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, [order.id]);

  // Close status menu on outside click
  useEffect(() => {
    if (!statusMenuOpen) return;
    const fn = () => setStatusMenuOpen(false);
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [statusMenuOpen]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) { showToast("Erreur lors de la mise à jour", "error"); return null; }
    const updated = await res.json();
    setOrder((prev) => ({ ...prev, ...updated }));
    startTransition(() => router.refresh());
    return updated;
  }

  function changeStatus(s: OrderStatus) {
    setStatusMenuOpen(false);
    // Simple statuses with no required fields go direct; guided ones use the modal
    const guided = new Set(["CONFIRMED", "DISPATCHED_TO_SUPPLIER", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]);
    if (guided.has(s)) {
      setPendingTransition(s);
    } else {
      patch({ status: s }).then(() => showToast(`Statut → ${STATUS_LABELS[s]}`, "success"));
    }
  }

  function handleTransitionSuccess(result: TransitionResult) {
    setPendingTransition(null);
    setOrder((prev) => ({
      ...prev,
      status: result.status as OrderStatus,
      ...(result.trackingNumber      !== undefined && { trackingNumber:      result.trackingNumber }),
      ...(result.trackingUrl         !== undefined && { trackingUrl:         result.trackingUrl }),
      ...(result.supplierOrderId     !== undefined && { supplierOrderId:     result.supplierOrderId }),
      ...(result.cancellationReason  !== undefined && { cancellationReason:  result.cancellationReason }),
    }));
    setTrackingNumber(result.trackingNumber ?? order.trackingNumber ?? "");
    setTrackingUrl(result.trackingUrl ?? order.trackingUrl ?? "");
    if (result.supplierOrderId !== undefined) setSupplierOrderId(result.supplierOrderId ?? "");
    // Prepend optimistic history entry
    setStatusHistory((prev) => [{
      id: `opt-${Date.now()}`, fromStatus: order.status, toStatus: result.status,
      userId: null, note: result.cancellationReason ?? result.notes ?? null, createdAt: new Date(),
    }, ...prev]);
    showToast(`Statut → ${STATUS_LABELS[result.status as OrderStatus]}`, "success");
    startTransition(() => router.refresh());
  }

  function promptRefund() {
    setConfirmDialog({
      message: `Confirmer le remboursement de ${order.totalAmount.toFixed(2)} ${order.currency} pour ${order.customerName} ?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await fetch(`/api/orders/${order.id}/refund`, { method: "POST" });
        if (!res.ok) { showToast("Erreur lors du remboursement", "error"); return; }
        const data = await res.json();
        setOrder((prev) => ({ ...prev, status: "REFUNDED" }));
        showToast(data.stripe ? "Remboursé via Stripe" : "Statut remboursé", data.stripe ? "success" : "warning");
        startTransition(() => router.refresh());
      },
    });
  }

  function promptDelete() {
    setConfirmDialog({
      message: `Supprimer définitivement la commande ${order.orderNumber} ? Cette action est irréversible.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
        if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error ?? "Impossible de supprimer", "error"); return; }
        showToast("Commande supprimée", "success");
        router.push("/orders");
      },
    });
  }

  async function saveTracking() {
    await patch({ trackingNumber: trackingNumber || null, trackingUrl: trackingUrl || null });
    setEditTracking(false);
    showToast("Suivi mis à jour", "success");
  }

  async function refreshTracking() {
    setRefreshingTracking(true);
    const res = await fetch(`/api/orders/${order.id}/tracking/refresh`, { method: "POST" });
    const data = await res.json();
    setRefreshingTracking(false);
    if (!res.ok) { showToast(data.error ?? "Erreur refresh tracking", "error"); return; }
    setTrackingEvents(data.events ?? []);
    if (data.statusAdvanced && data.newStatus) {
      setOrder((prev) => ({ ...prev, status: data.newStatus }));
      showToast(`Statut avancé → ${data.newStatus}`, "success");
    } else if (data.newEvents > 0) {
      showToast(`${data.newEvents} nouvel(s) événement(s) — ${data.tagLabel}`, "success");
    } else {
      showToast(`Aucun changement — ${data.tagLabel}`, "info");
    }
  }

  async function saveSupplierOrderId() {
    await patch({ supplierOrderId: supplierOrderId || null });
    setEditSupplierOrderId(false);
    showToast("ID fournisseur mis à jour", "success");
  }

  async function submitNote() {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    const res = await fetch(`/api/orders/${order.id}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: noteText }),
    });
    setSubmittingNote(false);
    if (!res.ok) { showToast("Erreur lors de l'ajout de la note", "error"); return; }
    const note = await res.json();
    setNotes((prev) => [...prev, note]);
    setNoteText("");
  }

  async function sendEmail(subject: string, body: string) {
    const res = await fetch(`/api/orders/${order.id}/send-email`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showToast("Erreur lors de l'envoi", "error"); return; }
    if (data.mailto) {
      window.open(data.mailto, "_blank");
      showToast("Email ouvert dans votre client mail", "success");
    } else {
      showToast("Email envoyé", "success");
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    showToast("Lien copié", "success");
  }

  const addr = order.shippingAddress as Record<string, string> | null;
  const margin = order.items.reduce((sum, item) => sum + (item.price - item.product.cost) * item.quantity, 0);
  const marginPct = order.totalAmount > 0 ? (margin / order.totalAmount) * 100 : 0;
  const flowIndex = STATUS_FLOW.indexOf(order.status);
  const isTerminal = order.status === "CANCELLED" || order.status === "REFUNDED";
  const statusColor = STATUS_COLORS[order.status];
  const clientColor = avatarColor(order.customerName);

  return (
    <>
      {confirmDialog && (
        <ConfirmModal message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />
      )}
      {showEmailModal && (
        <EmailModal order={order} onClose={() => setShowEmailModal(false)} onSend={sendEmail} />
      )}
      {pendingTransition && (
        <StatusTransitionModal
          orderId={order.id}
          orderNumber={order.orderNumber}
          fromStatus={order.status}
          toStatus={pendingTransition}
          totalAmount={order.totalAmount}
          currency={order.currency}
          onSuccess={handleTransitionSuccess}
          onClose={() => setPendingTransition(null)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Header card ── */}
        <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12 }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${statusColor}, ${statusColor}50)`, borderRadius: "11px 11px 0 0" }} />
          <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/orders" className="btn btn-ghost btn-icon btn-sm">
                <IconArrowLeft size={15} />
              </Link>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.3px" }}>
                    {order.orderNumber}
                  </h1>
                  <StatusBadge status={order.status} label={STATUS_LABELS[order.status]} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                  {order.customerName} · Créée le {fmtDateTime(order.createdAt)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEmailModal(true)}>
                <IconMail size={13} /> Email client
              </button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={copyLink} title="Copier le lien">
                <IconCopy size={14} />
              </button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => window.print()} title="Imprimer">
                <IconPrinter size={14} />
              </button>

              <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px" }} />

              {/* Status dropdown */}
              <div style={{ position: "relative" }}>
                <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setStatusMenuOpen((v) => !v); }}>
                  Changer statut <IconChevronDown size={12} />
                </button>
                {statusMenuOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
                    background: "var(--bg-surface)", border: "0.5px solid var(--border)",
                    borderRadius: 10, padding: 4, minWidth: 220, boxShadow: "var(--shadow-lg)",
                  }} onMouseDown={(e) => e.stopPropagation()}>
                    {STATUS_KEYS.map((s) => (
                      <button key={s} className="dropdown-item" onClick={() => changeStatus(s)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[s], flexShrink: 0 }} />
                        {STATUS_LABELS[s]}
                        {order.status === s && <IconCheck size={12} style={{ marginLeft: "auto", color: "var(--success)" }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {order.status === "CONFIRMED" && (
                <button className="btn btn-primary btn-sm" onClick={() => setPendingTransition("DISPATCHED_TO_SUPPLIER")}>
                  <IconSend size={13} /> Dispatcher
                </button>
              )}
              {(order.status === "DELIVERED" || order.status === "SHIPPED") && (
                <button className="btn btn-sm" style={{ background: "rgba(248,113,113,0.10)", color: "#F87171", border: "0.5px solid #F8717150" }} onClick={promptRefund}>
                  <IconRefresh size={13} /> Rembourser
                </button>
              )}
              {isTerminal && (
                <button className="btn btn-ghost btn-icon btn-sm" onClick={promptDelete} title="Supprimer la commande">
                  <IconTrash size={14} style={{ color: "#F87171" }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Workflow timeline ── */}
        <div className="card" style={{ padding: "18px 28px" }}>
          {(() => {
            // Build display steps: always the 6 main steps + optional terminal step
            const terminalStep = isTerminal ? order.status : null;
            const terminalColor = order.status === "CANCELLED" ? "#F87171" : "#FB923C";
            const terminalLabel = order.status === "CANCELLED" ? "Annulée" : "Remboursée";
            const steps = [...STATUS_FLOW, ...(terminalStep ? [terminalStep as OrderStatus] : [])];
            const totalSteps = steps.length;

            // For a terminal order, progress bar goes to the last completed main step
            const progressIdx = isTerminal ? flowIndex : flowIndex;
            const progressPct = Math.max(0, progressIdx / (STATUS_FLOW.length - 1)) * 100;

            return (
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
                {/* Track background */}
                <div style={{ position: "absolute", top: 13, left: `calc(100% / ${totalSteps * 2})`, right: `calc(100% / ${totalSteps * 2})`, height: 2, background: "var(--border)", borderRadius: 2 }} />
                {/* Progress fill */}
                <div style={{
                  position: "absolute", top: 13, left: `calc(100% / ${totalSteps * 2})`, height: 2, borderRadius: 2,
                  background: isTerminal
                    ? `linear-gradient(90deg, var(--accent), ${terminalColor})`
                    : `linear-gradient(90deg, ${statusColor}, ${statusColor}60)`,
                  width: isTerminal
                    ? `${Math.min(100, (flowIndex / (totalSteps - 1)) * 100)}%`
                    : `${progressPct}%`,
                  transition: "width 400ms ease",
                }} />

                {steps.map((s, i) => {
                  const isTerminalStep = isTerminal && i === steps.length - 1;
                  const done = isTerminalStep ? false : i < flowIndex;
                  const current = isTerminalStep ? true : (!isTerminal && i === flowIndex);
                  const color = isTerminalStep ? terminalColor : (done ? "var(--accent)" : current ? statusColor : "var(--border)");
                  const bgColor = isTerminalStep ? terminalColor : (done ? "var(--accent)" : current ? statusColor : "var(--bg-base)");
                  const label = isTerminalStep ? terminalLabel : STATUS_LABELS[s];

                  return (
                    <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, position: "relative", flex: 1 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
                        background: bgColor, border: `2px solid ${color}`,
                        color: (done || current || isTerminalStep) ? "#fff" : "var(--text-3)",
                        boxShadow: current ? `0 0 0 5px ${color}22` : "none",
                        transition: "all 200ms",
                      }}>
                        {isTerminalStep
                          ? <IconAlertCircle size={12} />
                          : done ? <IconCheck size={12} /> : <IconClock size={11} />}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: (current || isTerminalStep) ? 700 : 400, textAlign: "center", maxWidth: 72, lineHeight: 1.3,
                        color: isTerminalStep ? terminalColor : (current ? statusColor : done ? "var(--text-2)" : "var(--text-3)"),
                      }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ── Main 2-col layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 16, alignItems: "start" }}>

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Products table */}
            <Section title="Produits commandés" icon={<IconPackage size={13} />} iconBg="#6366F1">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse", minWidth: 560 }}>
                  <thead>
                    <tr>
                      {["Produit", "SKU", "Fournisseur", "Qté", "Prix unit.", "Coût", "Total", "Marge"].map((h, i) => (
                        <th key={h} style={{
                          fontSize: 11, fontWeight: 500, color: "var(--text-3)", padding: "0 8px 10px",
                          borderBottom: "0.5px solid var(--border)", whiteSpace: "nowrap",
                          textAlign: i >= 6 ? "right" : "left",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => {
                      const lineTotal = item.price * item.quantity;
                      const lineCost = item.product.cost * item.quantity;
                      const lineMargin = lineTotal - lineCost;
                      return (
                        <tr key={item.id} style={{ borderBottom: "0.5px solid var(--border)" }}>
                          <td style={{ padding: "10px 8px", fontWeight: 600, color: "var(--text-1)" }}>{item.product.name}</td>
                          <td style={{ padding: "10px 8px", color: "var(--text-3)", fontFamily: "monospace", fontSize: 11 }}>{item.product.supplierSku}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "var(--bg-base)", color: "var(--text-2)", whiteSpace: "nowrap" }}>
                              {item.product.supplier.replace("_", " ")}
                            </span>
                          </td>
                          <td style={{ padding: "10px 8px", color: "var(--text-1)", fontWeight: 500 }}>{item.quantity}</td>
                          <td style={{ padding: "10px 8px", color: "var(--text-1)" }}>{item.price.toFixed(2)}</td>
                          <td style={{ padding: "10px 8px", color: "var(--text-3)" }}>{item.product.cost.toFixed(2)}</td>
                          <td style={{ padding: "10px 8px", fontWeight: 600, color: "var(--text-1)", textAlign: "right" }}>{lineTotal.toFixed(2)}</td>
                          <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: lineMargin >= 0 ? "var(--success)" : "var(--danger)" }}>
                            {lineMargin.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "1.5px solid var(--border)" }}>
                      <td colSpan={5} />
                      <td style={{ padding: "10px 8px", fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>Total</td>
                      <td style={{ padding: "10px 8px", fontWeight: 700, color: "var(--text-1)", textAlign: "right" }}>
                        {order.totalAmount.toFixed(2)} {order.currency}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: 700, textAlign: "right", color: margin >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {margin.toFixed(2)} <span style={{ fontSize: 10, opacity: 0.75 }}>({marginPct.toFixed(0)}%)</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Section>

            {/* Tracking */}
            <Section
              title="Suivi de livraison"
              icon={<IconTruck size={13} />}
              iconBg="#60A5FA"
              action={
                <div style={{ display: "flex", gap: 6 }}>
                  {order.trackingNumber && !editTracking && trackingEnabled && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11 }}
                      onClick={refreshTracking}
                      disabled={refreshingTracking}
                      title="Actualiser depuis 17track"
                    >
                      <IconRefresh size={12} style={{ animation: refreshingTracking ? "spin 1s linear infinite" : "none" }} />
                      {refreshingTracking ? "..." : "Actualiser"}
                    </button>
                  )}
                  {!editTracking && (
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setEditTracking(true)}>
                      <IconEdit size={12} /> Modifier
                    </button>
                  )}
                </div>
              }
            >
              {editTracking ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label className="input-label">Numéro de suivi</label>
                    <input className="input" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Ex: LY123456789CN" />
                  </div>
                  <div>
                    <label className="input-label">URL de suivi</label>
                    <input className="input" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveTracking}>Enregistrer</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditTracking(false)}>Annuler</button>
                  </div>
                </div>
              ) : order.trackingNumber ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <code style={{ background: "var(--bg-base)", padding: "5px 12px", borderRadius: 7, fontSize: 12.5, color: "var(--text-1)", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                      {order.trackingNumber}
                    </code>
                    {order.trackingCarrier && (
                      <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5, background: "var(--bg-base)", color: "var(--text-3)", border: "0.5px solid var(--border)" }}>
                        {order.trackingCarrier}
                      </span>
                    )}
                    {order.trackingUrl && (
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>
                        <IconExternalLink size={12} /> Tracker →
                      </a>
                    )}
                  </div>
                  {order.expectedDeliveryAt && !["DELIVERED","CANCELLED","REFUNDED"].includes(order.status) && (
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: trackingEvents.length > 0 ? 18 : 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <IconClock size={12} style={{ flexShrink: 0 }} />
                      Livraison promise le {fmtDate(order.expectedDeliveryAt)}
                      {new Date(order.expectedDeliveryAt) < new Date() && (
                        <span style={{ fontSize: 10, color: "var(--warning)", fontWeight: 600, background: "var(--warning-bg)", padding: "1px 6px", borderRadius: 4 }}>
                          En retard
                        </span>
                      )}
                    </div>
                  )}

                  {trackingEvents.length === 0 ? (
                    <div style={{ padding: "10px 12px", background: "var(--bg-base)", borderRadius: 8, fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8 }}>
                      <IconClock size={13} style={{ flexShrink: 0 }} />
                      En attente du premier scan transporteur. Cliquez "Actualiser" ou attendez le webhook automatique.
                    </div>
                  ) : (
                    <div style={{ borderLeft: "2px solid var(--border)", marginLeft: 10, display: "flex", flexDirection: "column", gap: 0 }}>
                      {[...trackingEvents].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).map((ev, i) => (
                        <div key={ev.id} style={{ display: "flex", gap: 14, padding: "8px 0 8px 18px", position: "relative" }}>
                          <div style={{
                            position: "absolute", left: -5, top: 13, width: 8, height: 8, borderRadius: "50%",
                            background: i === 0 ? "#60A5FA" : "var(--border-strong)", border: "2px solid var(--bg-card)",
                          }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>{ev.status}</div>
                            {ev.location && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{ev.location}</div>}
                            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{fmtDateTime(ev.occurredAt)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditTracking(true)}>
                  <IconPlus size={13} /> Ajouter un numéro de suivi
                </button>
              )}
            </Section>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Notes internes */}
            <Section title="Notes internes" icon={<IconNotes size={13} />} iconBg="#A78BFA">
              {notes.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  {notes.map((n) => (
                    <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: avatarColor(n.user.name), color: "#fff", fontSize: 10, fontWeight: 700,
                      }}>
                        {initials(n.user.name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ background: "var(--bg-base)", borderRadius: "0 8px 8px 8px", padding: "9px 13px" }}>
                          <div style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.55 }}>{n.content}</div>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5, marginLeft: 4 }}>
                          {n.user.name} · {fmtDate(n.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {notesLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {[100, 80, 60].map((w) => (
                    <div key={w} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 4 }} />
                  ))}
                </div>
              ) : notes.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 14px" }}>Aucune note pour cette commande.</p>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <textarea
                    ref={noteRef}
                    className="input"
                    style={{ height: 64, resize: "none", paddingTop: 9, paddingBottom: 9, fontSize: 13 }}
                    placeholder="Ajouter une note... (Ctrl+Enter pour envoyer)"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) submitNote(); }}
                  />
                  <div style={{ fontSize: 10, color: "var(--text-3)", textAlign: "right", marginTop: 3 }}>
                    {noteText.length}/500
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginBottom: 18, flexShrink: 0 }}
                  onClick={submitNote}
                  disabled={submittingNote || !noteText.trim()}
                >
                  <IconSend size={13} />
                </button>
              </div>
            </Section>

          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Client */}
            <Section title="Client" icon={<IconUser size={13} />} iconBg="#34D399">
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, paddingBottom: 14, borderBottom: "0.5px solid var(--border)" }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: clientColor, color: "#fff", fontSize: 16, fontWeight: 700, letterSpacing: "-0.5px",
                }}>
                  {initials(order.customerName)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>{order.customerName}</div>
                  <a href={`mailto:${order.customerEmail}`} style={{ fontSize: 12, color: "var(--accent-light)", textDecoration: "none", wordBreak: "break-all" }}>
                    {order.customerEmail}
                  </a>
                  {order.customerPhone && (
                    <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{order.customerPhone}</div>
                  )}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowEmailModal(true)}>
                <IconMail size={13} /> Envoyer un email
              </button>
            </Section>

            {/* Adresse livraison */}
            {addr && (
              <Section title="Adresse de livraison" icon={<IconMapPin size={13} />} iconBg="#FBBF24">
                <div style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.85 }}>
                  {addr.line1 && <div>{addr.line1}</div>}
                  {addr.line2 && <div style={{ color: "var(--text-2)" }}>{addr.line2}</div>}
                  <div>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}</div>
                  {addr.country && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{addr.country}</div>}
                </div>
              </Section>
            )}

            {/* Paiement */}
            <Section title="Paiement" icon={<IconCreditCard size={13} />} iconBg="#4ADE80">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, paddingBottom: 14, borderBottom: "0.5px solid var(--border)" }}>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>Total commande</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)" }}>
                  {order.totalAmount.toFixed(2)} {order.currency}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>Marge brute</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: margin >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {margin.toFixed(2)} <span style={{ fontSize: 11, opacity: 0.7 }}>({marginPct.toFixed(0)}%)</span>
                </span>
              </div>
              {order.stripePaymentId && (
                <div style={{ marginTop: 12, padding: "8px 10px", background: "var(--bg-base)", borderRadius: 7 }}>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>Stripe ID</div>
                  <code style={{ fontSize: 10.5, color: "var(--text-2)", wordBreak: "break-all" }}>{order.stripePaymentId}</code>
                </div>
              )}
            </Section>

            {/* Boutique & Agent */}
            <Section title="Boutique & Agent" icon={<IconBuilding size={13} />} iconBg="#FB923C">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Boutique</div>
                <Link href={`/stores/${order.store.id}`} style={{ fontSize: 13, color: "var(--accent-light)", textDecoration: "none", fontWeight: 500 }}>
                  {order.store.name}
                </Link>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="input-label">Agent assigné</label>
                <select
                  className="input"
                  style={{ fontSize: 13 }}
                  defaultValue={order.assignedTo?.id ?? ""}
                  onChange={async (e) => {
                    await patch({ assignedToId: e.target.value || null });
                    showToast("Agent mis à jour", "success");
                  }}
                >
                  <option value="">Non assigné</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              {/* Supplier Order ID inline edit */}
              <div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 5 }}>ID commande fournisseur</div>
                {editSupplierOrderId ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      className="input"
                      style={{ fontSize: 12, flex: 1 }}
                      value={supplierOrderId}
                      onChange={(e) => setSupplierOrderId(e.target.value)}
                      placeholder="Ex: CJ-12345678"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveSupplierOrderId();
                        if (e.key === "Escape") setEditSupplierOrderId(false);
                      }}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={saveSupplierOrderId}><IconCheck size={12} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditSupplierOrderId(false)}><IconX size={12} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditSupplierOrderId(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      background: "none", border: "0.5px dashed var(--border-strong)",
                      borderRadius: 7, padding: "6px 10px", cursor: "pointer",
                      color: order.supplierOrderId ? "var(--text-1)" : "var(--text-3)",
                      fontSize: 12, width: "100%", textAlign: "left",
                    }}
                  >
                    {order.supplierOrderId ? (
                      <>
                        <code style={{ fontSize: 12, flex: 1 }}>{order.supplierOrderId}</code>
                        <IconEdit size={11} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                      </>
                    ) : (
                      <><IconPlus size={11} /> Ajouter un ID fournisseur</>
                    )}
                  </button>
                )}
              </div>
            </Section>

            {/* Raison d'annulation */}
            {order.cancellationReason && (
              <Section title="Raison d'annulation" icon={<IconAlertCircle size={13} />} iconBg="#F87171">
                <p style={{ fontSize: 13, color: "#F87171", lineHeight: 1.65, margin: 0 }}>{order.cancellationReason}</p>
              </Section>
            )}

            {/* Note de commande (notes champ texte, pas orderNote) */}
            {order.notes && (
              <Section title="Note de commande" icon={<IconNotes size={13} />} iconBg="#60A5FA">
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>{order.notes}</p>
              </Section>
            )}

            {/* Historique des transitions de statut */}
            {statusHistory.length > 0 && (
              <Section title="Historique des statuts" icon={<IconHistory size={13} />} iconBg="#6366F1">
                <div style={{ display: "flex", flexDirection: "column", gap: 0, borderLeft: "2px solid var(--border)", marginLeft: 6 }}>
                  {statusHistory.map((h) => (
                    <div key={h.id} style={{ display: "flex", gap: 10, paddingLeft: 14, paddingBottom: 14, position: "relative" }}>
                      <div style={{
                        position: "absolute", left: -5, top: 3,
                        width: 8, height: 8, borderRadius: "50%",
                        background: STATUS_COLORS[h.toStatus as OrderStatus] ?? "var(--text-3)",
                        border: "2px solid var(--bg-card)",
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {h.fromStatus && (
                            <>
                              <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                                {STATUS_LABELS[h.fromStatus as OrderStatus] ?? h.fromStatus}
                              </span>
                              <span style={{ fontSize: 10, color: "var(--text-3)" }}>→</span>
                            </>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLORS[h.toStatus as OrderStatus] ?? "var(--text-2)" }}>
                            {STATUS_LABELS[h.toStatus as OrderStatus] ?? h.toStatus}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                          {fmtDateTime(h.createdAt)}
                          {h.user?.name && ` · ${h.user.name}`}
                          {!h.user?.name && h.userId === null && " · Système"}
                        </div>
                        {h.note && (
                          <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 3, fontStyle: "italic" }}>{h.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Autres commandes du même client */}
            {relatedOrders.length > 0 && (
              <Section title={`Historique client (${relatedOrders.length})`} icon={<IconHistory size={13} />} iconBg="#FBBF24">
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {relatedOrders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "7px 8px", borderRadius: 7, textDecoration: "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{o.orderNumber}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{fmtDate(o.createdAt)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>{o.totalAmount.toFixed(2)} {o.currency}</span>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[o.status], flexShrink: 0 }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

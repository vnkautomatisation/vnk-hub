"use client";

import { useState } from "react";
import {
  IconX, IconSend, IconTruck, IconCheck, IconAlertCircle,
  IconPackage, IconRefresh, IconMapPin,
} from "@tabler/icons-react";

export type TransitionResult = {
  status: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  supplierOrderId?: string | null;
  cancellationReason?: string | null;
  notes?: string | null;
};

type Props = {
  orderId: string;
  orderNumber: string;
  fromStatus: string;
  toStatus: string;
  totalAmount?: number;
  currency?: string;
  onSuccess: (result: TransitionResult) => void;
  onClose: () => void;
};

const CARRIER_OPTIONS = [
  { value: "", label: "Transporteur..." },
  { value: "Poste Canada", label: "Poste Canada" },
  { value: "UPS", label: "UPS" },
  { value: "FedEx", label: "FedEx" },
  { value: "DHL", label: "DHL" },
  { value: "Purolator", label: "Purolator" },
  { value: "USPS", label: "USPS" },
  { value: "Autre", label: "Autre" },
];

const SUPPLIER_OPTIONS = [
  { value: "CJ_DROPSHIPPING", label: "CJ Dropshipping" },
  { value: "ALIEXPRESS", label: "AliExpress" },
  { value: "ZENDROP", label: "Zendrop" },
  { value: "PRINTFUL", label: "Printful" },
  { value: "AUTRE", label: "Autre fournisseur" },
];

const CANCEL_REASONS = [
  { value: "client_request", label: "Demande du client" },
  { value: "out_of_stock", label: "Rupture de stock" },
  { value: "duplicate", label: "Commande en doublon" },
  { value: "payment_failed", label: "Paiement refusé" },
  { value: "supplier_issue", label: "Problème fournisseur" },
  { value: "other", label: "Autre raison" },
];

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="input-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {children}
      {required && <span style={{ color: "var(--danger)", fontSize: 11 }}>*</span>}
    </label>
  );
}

function RadioGroup({ options, value, onChange }: {
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
            borderRadius: 8, border: `0.5px solid ${value === opt.value ? "var(--accent)" : "var(--border)"}`,
            background: value === opt.value ? "var(--bg-active)" : "var(--bg-base)",
            cursor: "pointer", textAlign: "left", transition: "all 120ms",
          }}
        >
          <div style={{
            width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1,
            border: `2px solid ${value === opt.value ? "var(--accent)" : "var(--border)"}`,
            background: value === opt.value ? "var(--accent)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {value === opt.value && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{opt.label}</div>
            {opt.description && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{opt.description}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}

export function StatusTransitionModal({ orderId, orderNumber, fromStatus, toStatus, totalAmount, currency, onSuccess, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DISPATCHED fields
  const [supplier, setSupplier] = useState("CJ_DROPSHIPPING");
  const [supplierOrderId, setSupplierOrderId] = useState("");
  const [dispatchNote, setDispatchNote] = useState("");

  // SHIPPED fields
  const [shipMode, setShipMode] = useState<"supplier" | "manual">("supplier");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [carrier, setCarrier] = useState("");

  // CANCELLED fields
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");

  // DELIVERED fields
  const [deliveryNote, setDeliveryNote] = useState("");

  // CONFIRMED fields
  const [confirmNote, setConfirmNote] = useState("");

  async function submit() {
    setError(null);

    // Validation
    if (toStatus === "SHIPPED" && !trackingNumber.trim()) {
      setError("Le numéro de tracking est requis.");
      return;
    }
    if (toStatus === "CANCELLED" && !cancelReason) {
      setError("Veuillez sélectionner une raison d'annulation.");
      return;
    }

    setLoading(true);

    const body: Record<string, unknown> = { status: toStatus };

    if (toStatus === "DISPATCHED_TO_SUPPLIER") {
      if (supplierOrderId.trim()) body.supplierOrderId = supplierOrderId.trim();
      if (dispatchNote.trim()) body.notes = dispatchNote.trim();
    }

    if (toStatus === "SHIPPED") {
      body.trackingNumber = trackingNumber.trim() || null;
      body.trackingUrl = trackingUrl.trim() || null;
      if (carrier && !trackingUrl.trim()) {
        // Auto-build tracking URL for known carriers
        const urls: Record<string, string> = {
          "Poste Canada": `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${trackingNumber}`,
          "UPS": `https://www.ups.com/track?tracknum=${trackingNumber}`,
          "FedEx": `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
          "DHL": `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
          "USPS": `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
        };
        if (urls[carrier]) body.trackingUrl = urls[carrier];
      }
    }

    if (toStatus === "CANCELLED") {
      const reasons: Record<string, string> = Object.fromEntries(CANCEL_REASONS.map((r) => [r.value, r.label]));
      const reasonLabel = reasons[cancelReason] ?? cancelReason;
      body.cancellationReason = reasonLabel;
      if (cancelNote.trim()) body.notes = cancelNote.trim();
    }

    if (toStatus === "DELIVERED" && deliveryNote.trim()) {
      body.notes = deliveryNote.trim();
    }

    if (toStatus === "CONFIRMED" && confirmNote.trim()) {
      body.notes = confirmNote.trim();
    }

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erreur lors de la mise à jour.");
      return;
    }

    onSuccess({
      status: toStatus,
      trackingNumber: body.trackingNumber as string | null | undefined,
      trackingUrl: body.trackingUrl as string | null | undefined,
      supplierOrderId: body.supplierOrderId as string | null | undefined,
      cancellationReason: body.cancellationReason as string | null | undefined,
      notes: body.notes as string | null | undefined,
    });
  }

  // Config per transition
  const config: Record<string, { title: string; icon: React.ReactNode; color: string; submitLabel: string }> = {
    CONFIRMED:              { title: "Confirmer la commande",         icon: <IconCheck size={16} />,   color: "#6366F1", submitLabel: "Confirmer" },
    DISPATCHED_TO_SUPPLIER: { title: "Envoyer au fournisseur",        icon: <IconSend size={16} />,    color: "#A78BFA", submitLabel: "Dispatcher" },
    SHIPPED:                { title: "Marquer comme expédiée",        icon: <IconTruck size={16} />,   color: "#34D399", submitLabel: "Confirmer l'expédition" },
    IN_TRANSIT:             { title: "Marquer en transit",            icon: <IconMapPin size={16} />,  color: "#60A5FA", submitLabel: "Confirmer" },
    DELIVERED:              { title: "Marquer comme livrée",          icon: <IconCheck size={16} />,   color: "#4ADE80", submitLabel: "Confirmer la livraison" },
    CANCELLED:              { title: "Annuler la commande",           icon: <IconAlertCircle size={16} />, color: "#F87171", submitLabel: "Annuler la commande" },
    REFUNDED:               { title: "Rembourser la commande",        icon: <IconRefresh size={16} />, color: "#FB923C", submitLabel: "Confirmer le remboursement" },
  };

  const cfg = config[toStatus] ?? { title: `→ ${toStatus}`, icon: <IconCheck size={16} />, color: "var(--accent)", submitLabel: "Confirmer" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "var(--bg-surface)", border: "0.5px solid var(--border)",
        borderRadius: 14, width: 520, maxWidth: "calc(100vw - 32px)",
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${cfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color }}>
              {cfg.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{cfg.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>{orderNumber}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><IconX size={14} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* CONFIRMED */}
          {toStatus === "CONFIRMED" && (
            <>
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>
                La commande sera confirmée et en attente d'envoi au fournisseur.
              </p>
              <div>
                <Label>Note interne (optionnel)</Label>
                <textarea className="input" style={{ height: 70, resize: "none", paddingTop: 8 }}
                  placeholder="Ex: Vérification du stock effectuée..." value={confirmNote} onChange={(e) => setConfirmNote(e.target.value)} />
              </div>
            </>
          )}

          {/* DISPATCHED_TO_SUPPLIER */}
          {toStatus === "DISPATCHED_TO_SUPPLIER" && (
            <>
              <div>
                <Label required>Fournisseur</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {SUPPLIER_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setSupplier(opt.value)} style={{
                      padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: supplier === opt.value ? 600 : 400,
                      border: `0.5px solid ${supplier === opt.value ? cfg.color : "var(--border)"}`,
                      background: supplier === opt.value ? `${cfg.color}12` : "var(--bg-base)",
                      color: supplier === opt.value ? cfg.color : "var(--text-2)",
                      cursor: "pointer", transition: "all 120ms",
                    }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>ID commande fournisseur</Label>
                <input className="input" placeholder="Ex: CJ-987654321" value={supplierOrderId} onChange={(e) => setSupplierOrderId(e.target.value)} />
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Numéro de commande dans l'interface du fournisseur</div>
              </div>
              <div>
                <Label>Note interne (optionnel)</Label>
                <textarea className="input" style={{ height: 60, resize: "none", paddingTop: 8 }}
                  placeholder="Ex: Stock confirmé, délai estimé 5 jours..." value={dispatchNote} onChange={(e) => setDispatchNote(e.target.value)} />
              </div>
            </>
          )}

          {/* SHIPPED */}
          {toStatus === "SHIPPED" && (
            <>
              <div>
                <Label required>Mode d'expédition</Label>
                <RadioGroup
                  value={shipMode}
                  onChange={(v) => setShipMode(v as "supplier" | "manual")}
                  options={[
                    { value: "supplier", label: "Le fournisseur a expédié", description: "Le fournisseur gère l'expédition et le tracking" },
                    { value: "manual",   label: "J'ai expédié moi-même",    description: "Vous avez physiquement expédié la commande" },
                  ]}
                />
              </div>

              <div>
                <Label required>Numéro de tracking</Label>
                <input className="input" placeholder="Ex: LM123456789CN" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              </div>

              {shipMode === "manual" && (
                <div>
                  <Label>Transporteur</Label>
                  <select className="input" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                    {CARRIER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                    L'URL de suivi sera générée automatiquement pour les transporteurs connus.
                  </div>
                </div>
              )}

              <div>
                <Label>URL de suivi (optionnel)</Label>
                <input className="input" placeholder="https://..." value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                  Laissez vide pour générer automatiquement selon le transporteur.
                </div>
              </div>
            </>
          )}

          {/* IN_TRANSIT */}
          {toStatus === "IN_TRANSIT" && (
            <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>
              La commande est en transit vers le client. Le suivi sera mis à jour automatiquement si une URL de tracking est configurée.
            </p>
          )}

          {/* DELIVERED */}
          {toStatus === "DELIVERED" && (
            <>
              <div style={{ padding: "12px 14px", background: "var(--success-bg)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <IconCheck size={15} style={{ color: "var(--success)", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 500 }}>
                  La commande sera marquée comme livrée au client.
                </span>
              </div>
              <div>
                <Label>Note de livraison (optionnel)</Label>
                <textarea className="input" style={{ height: 70, resize: "none", paddingTop: 8 }}
                  placeholder="Ex: Livré en main propre, laissé chez le voisin..."
                  value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} />
              </div>
            </>
          )}

          {/* CANCELLED */}
          {toStatus === "CANCELLED" && (
            <>
              <div style={{ padding: "10px 14px", background: "var(--danger-bg)", borderRadius: 9, display: "flex", alignItems: "center", gap: 8 }}>
                <IconAlertCircle size={14} style={{ color: "var(--danger)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--danger)" }}>Cette action est irréversible. La commande passera en statut Annulée.</span>
              </div>
              <div>
                <Label required>Raison d'annulation</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {CANCEL_REASONS.map((r) => (
                    <button key={r.value} type="button" onClick={() => setCancelReason(r.value)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 7,
                      border: `0.5px solid ${cancelReason === r.value ? "#F87171" : "var(--border)"}`,
                      background: cancelReason === r.value ? "rgba(248,113,113,0.08)" : "var(--bg-base)",
                      color: cancelReason === r.value ? "#F87171" : "var(--text-2)",
                      cursor: "pointer", fontSize: 13, textAlign: "left", transition: "all 120ms",
                    }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${cancelReason === r.value ? "#F87171" : "var(--border)"}`, background: cancelReason === r.value ? "#F87171" : "transparent", flexShrink: 0 }} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Détails supplémentaires (optionnel)</Label>
                <textarea className="input" style={{ height: 60, resize: "none", paddingTop: 8 }}
                  placeholder="Contexte additionnel..." value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} />
              </div>
            </>
          )}

          {/* REFUNDED */}
          {toStatus === "REFUNDED" && (
            <>
              {totalAmount && (
                <div style={{ padding: "12px 14px", background: "var(--bg-base)", borderRadius: 9 }}>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Montant à rembourser</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)" }}>
                    {totalAmount.toFixed(2)} {currency}
                  </div>
                </div>
              )}
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>
                Le remboursement sera effectué via Stripe si configuré, sinon le statut sera mis à jour manuellement.
              </p>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: "10px 12px", background: "var(--danger-bg)", border: "0.5px solid var(--danger)", borderRadius: 8, fontSize: 12, color: "var(--danger)", display: "flex", alignItems: "center", gap: 7 }}>
              <IconAlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>Annuler</button>
          <button
            className="btn btn-sm"
            style={{ background: cfg.color, color: "#fff", border: "none" }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Enregistrement..." : cfg.submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

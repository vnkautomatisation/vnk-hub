"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconX, IconPlus, IconUser, IconMapPin, IconShoppingCart } from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";

type Store = { id: string; name: string };

const CURRENCIES = ["CAD", "USD", "EUR", "GBP"];
const CA_PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

export function CreateOrderModal({ stores, onClose }: { stores: Store[]; onClose: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Client
  const [storeId,       setStoreId]       = useState(stores[0]?.id ?? "");
  const [customerName,  setCustomerName]  = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Step 2 — Adresse
  const [line1,       setLine1]       = useState("");
  const [line2,       setLine2]       = useState("");
  const [city,        setCity]        = useState("");
  const [province,    setProvince]    = useState("QC");
  const [postalCode,  setPostalCode]  = useState("");
  const [country,     setCountry]     = useState("CA");

  // Step 3 — Commande
  const [totalAmount, setTotalAmount] = useState("");
  const [currency,    setCurrency]    = useState("CAD");
  const [notes,       setNotes]       = useState("");

  function validateStep1() {
    if (!storeId) return "Sélectionnez une boutique.";
    if (!customerName.trim()) return "Nom du client requis.";
    if (!customerEmail.trim() || !customerEmail.includes("@")) return "Email invalide.";
    return null;
  }

  function validateStep3() {
    const n = parseFloat(totalAmount);
    if (isNaN(n) || n < 0) return "Montant invalide.";
    return null;
  }

  async function handleSubmit() {
    const err = validateStep3();
    if (err) { showToast(err, "error"); return; }

    setSaving(true);
    const res = await fetch("/api/orders/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        shippingAddress: { line1, line2: line2 || undefined, city, state: province, postalCode, country },
        totalAmount: parseFloat(totalAmount),
        currency,
        notes: notes || null,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? "Erreur lors de la création", "error");
      return;
    }

    const order = await res.json();
    showToast(`Commande ${order.orderNumber} créée`, "success");
    router.push(`/orders/${order.id}`);
    onClose();
  }

  const steps = [
    { n: 1, label: "Client", icon: <IconUser size={13} /> },
    { n: 2, label: "Adresse", icon: <IconMapPin size={13} /> },
    { n: 3, label: "Commande", icon: <IconShoppingCart size={13} /> },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 16, padding: 0, width: 520, maxWidth: "calc(100vw - 32px)", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px 14px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>Nouvelle commande manuelle</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>Commande téléphonique ou hors vitrine</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><IconX size={14} /></button>
        </div>

        {/* Steps indicator */}
        <div style={{ display: "flex", padding: "12px 24px", borderBottom: "0.5px solid var(--border)", gap: 4, flexShrink: 0 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: step === s.n ? 600 : 400, cursor: step > s.n ? "pointer" : "default",
                background: step === s.n ? "var(--accent)" : step > s.n ? "var(--bg-base)" : "transparent",
                color: step === s.n ? "#fff" : step > s.n ? "var(--text-2)" : "var(--text-3)",
                border: step === s.n ? "none" : "0.5px solid var(--border)",
              }} onClick={() => step > s.n && setStep(s.n as 1|2|3)}>
                {s.icon} {s.label}
              </div>
              {i < steps.length - 1 && <div style={{ width: 16, height: 1, background: "var(--border)", flexShrink: 0 }} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="input-label">Boutique *</label>
                <select className="input" style={{ fontSize: 13 }} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Nom complet du client *</label>
                <input className="input" placeholder="Jean Tremblay" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Email *</label>
                <input className="input" type="email" placeholder="jean@exemple.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Téléphone</label>
                <input className="input" type="tel" placeholder="+1 514 555-0000" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="input-label">Adresse ligne 1</label>
                <input className="input" placeholder="123 rue Principale" value={line1} onChange={(e) => setLine1(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Appartement / suite</label>
                <input className="input" placeholder="App. 4" value={line2} onChange={(e) => setLine2(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="input-label">Ville</label>
                  <input className="input" placeholder="Montréal" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Province</label>
                  <select className="input" style={{ fontSize: 13 }} value={province} onChange={(e) => setProvince(e.target.value)}>
                    {CA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="input-label">Code postal</label>
                  <input className="input" placeholder="H1A 1A1" value={postalCode} onChange={(e) => setPostalCode(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className="input-label">Pays</label>
                  <select className="input" style={{ fontSize: 13 }} value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="CA">Canada</option>
                    <option value="US">États-Unis</option>
                    <option value="FR">France</option>
                    <option value="BE">Belgique</option>
                    <option value="CH">Suisse</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div>
                  <label className="input-label">Montant total *</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label">Devise</label>
                  <select className="input" style={{ fontSize: 13 }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Note interne</label>
                <textarea
                  className="input"
                  style={{ height: 80, resize: "none", fontSize: 13 }}
                  placeholder="Commande par téléphone le 2 juillet..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {/* Summary */}
              <div style={{ background: "var(--bg-base)", borderRadius: 9, padding: "12px 14px", fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
                <div style={{ fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>Récapitulatif</div>
                <div><span style={{ color: "var(--text-3)" }}>Client :</span> {customerName} ({customerEmail})</div>
                {city && <div><span style={{ color: "var(--text-3)" }}>Adresse :</span> {[line1, city, province, postalCode].filter(Boolean).join(", ")}</div>}
                <div><span style={{ color: "var(--text-3)" }}>Total :</span> {parseFloat(totalAmount || "0").toFixed(2)} {currency}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "0.5px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
          {step > 1 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setStep((s) => (s - 1) as 1|2|3)}>
              Retour
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
          {step < 3 ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (step === 1) {
                  const err = validateStep1();
                  if (err) { showToast(err, "error"); return; }
                }
                setStep((s) => (s + 1) as 2|3);
              }}
            >
              Suivant →
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSubmit}>
              <IconPlus size={13} /> {saving ? "Création..." : "Créer la commande"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";

const CA_PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

export function CreateClientButton() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("QC");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const { showToast } = useToast();
  const router = useRouter();

  function reset() {
    setName(""); setEmail(""); setPhone(""); setLine1(""); setCity("");
    setProvince("QC"); setPostalCode(""); setNotes("");
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !email.includes("@")) {
      showToast("Nom et email valide requis.", "error"); return;
    }
    setSaving(true);
    const address = (line1 || city || postalCode)
      ? { line1, city, state: province, postalCode, country: "CA" }
      : null;

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone || null, address, notes: notes || null }),
    });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? "Erreur lors de la création.", "error"); return;
    }
    showToast("Client créé.", "success");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <IconPlus size={14} /> Nouveau client
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 16, width: 460, maxWidth: "calc(100vw - 32px)", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "18px 24px 14px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>Nouveau client</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { reset(); setOpen(false); }}><IconX size={14} /></button>
            </div>

            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="input-label">Nom complet *</label>
                <input className="input" placeholder="Jean Tremblay" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Email *</label>
                <input className="input" type="email" placeholder="jean@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Téléphone</label>
                <input className="input" type="tel" placeholder="+1 514 555-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Adresse (optionnel)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input className="input" placeholder="Adresse ligne 1" value={line1} onChange={(e) => setLine1(e.target.value)} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <input className="input" placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
                    <select className="input" style={{ fontSize: 13 }} value={province} onChange={(e) => setProvince(e.target.value)}>
                      {CA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input className="input" placeholder="H1A 1A1" value={postalCode} onChange={(e) => setPostalCode(e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
              <div>
                <label className="input-label">Notes internes</label>
                <textarea className="input" style={{ height: 70, resize: "none", fontSize: 13 }} placeholder="Client VIP, préférence de livraison…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <div style={{ padding: "14px 24px", borderTop: "0.5px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { reset(); setOpen(false); }}>Annuler</button>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSubmit}>
                <IconPlus size={13} /> {saving ? "Création..." : "Créer le client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

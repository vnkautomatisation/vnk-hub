"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconEdit, IconCheck, IconX, IconMail, IconPhone, IconMapPin, IconNotes } from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";

const CA_PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

type Address = { line1?: string; city?: string; state?: string; postalCode?: string; country?: string } | null;

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: Address;
  notes: string | null;
};

export function ClientEditPanel({ customer }: { customer: Customer }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const addr = customer.address as Address ?? null;
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [line1, setLine1] = useState(addr?.line1 ?? "");
  const [city, setCity] = useState(addr?.city ?? "");
  const [province, setProvince] = useState(addr?.state ?? "QC");
  const [postalCode, setPostalCode] = useState(addr?.postalCode ?? "");
  const [notes, setNotes] = useState(customer.notes ?? "");

  async function handleSave() {
    if (!name.trim() || !email.trim()) { showToast("Nom et email requis.", "error"); return; }
    setSaving(true);
    const address = (line1 || city || postalCode)
      ? { line1, city, state: province, postalCode, country: "CA" }
      : null;
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone || null, address, notes: notes || null }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error ?? "Erreur.", "error"); return; }
    showToast("Client mis à jour.", "success");
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setName(customer.name); setEmail(customer.email); setPhone(customer.phone ?? "");
    setLine1(addr?.line1 ?? ""); setCity(addr?.city ?? ""); setProvince(addr?.state ?? "QC");
    setPostalCode(addr?.postalCode ?? ""); setNotes(customer.notes ?? "");
    setEditing(false);
  }

  return (
    <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Informations</div>
        {editing ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={handleCancel} title="Annuler"><IconX size={13} /></button>
            <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
              <IconCheck size={13} /> {saving ? "…" : "Enregistrer"}
            </button>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><IconEdit size={13} /> Modifier</button>
        )}
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="input-label">Nom</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Téléphone</label>
            <input className="input" type="tel" placeholder="+1 514 555-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Adresse</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input className="input" placeholder="Adresse ligne 1" value={line1} onChange={(e) => setLine1(e.target.value)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 6 }}>
                <input className="input" placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
                <select className="input" style={{ fontSize: 12, padding: "6px 8px" }} value={province} onChange={(e) => setProvince(e.target.value)}>
                  {CA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input className="input" placeholder="H1A 1A1" value={postalCode} onChange={(e) => setPostalCode(e.target.value.toUpperCase())} />
              </div>
            </div>
          </div>
          <div>
            <label className="input-label">Notes</label>
            <textarea className="input" style={{ height: 70, resize: "none", fontSize: 13 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <InfoRow icon={<IconMail size={13} />} label="Email" value={customer.email} />
          <InfoRow icon={<IconPhone size={13} />} label="Téléphone" value={customer.phone ?? "—"} />
          {addr && (addr.line1 || addr.city) && (
            <InfoRow
              icon={<IconMapPin size={13} />}
              label="Adresse"
              value={[addr.line1, addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}
            />
          )}
          {customer.notes && (
            <InfoRow icon={<IconNotes size={13} />} label="Notes" value={customer.notes} />
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ color: "var(--text-3)", marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)" }}>{value}</div>
      </div>
    </div>
  );
}

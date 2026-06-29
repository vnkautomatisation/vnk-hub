"use client";

import type { EmailTemplates } from "./types";

export function Step5Emails({
  templates,
  setTemplates,
}: {
  templates: EmailTemplates;
  setTemplates: (v: EmailTemplates) => void;
}) {
  function update(key: keyof EmailTemplates, value: string) {
    setTemplates({ ...templates, [key]: value });
  }

  const fields: { key: keyof EmailTemplates; label: string }[] = [
    { key: "confirmationFr", label: "Confirmation de commande (FR)" },
    { key: "confirmationEn", label: "Order confirmation (EN)" },
    { key: "shippingFr", label: "Expédition (FR)" },
    { key: "shippingEn", label: "Shipping (EN)" },
    { key: "deliveredFr", label: "Livraison (FR)" },
    { key: "deliveredEn", label: "Delivered (EN)" },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
        Variables disponibles: {"{{customerName}}"}, {"{{orderNumber}}"}, {"{{storeName}}"},{" "}
        {"{{trackingNumber}}"}
      </p>
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {f.label}
          </label>
          <textarea
            value={templates[f.key]}
            onChange={(e) => update(f.key, e.target.value)}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
            style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", color: "var(--text-1)" }}
          />
        </div>
      ))}
    </div>
  );
}

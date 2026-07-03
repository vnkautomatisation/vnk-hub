"use client";

import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/Select";

const availableMethods = [
  { value: "card", label: "Carte de crédit" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "google_pay", label: "Google Pay" },
];

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: "CAD", label: "CAD" },
  { value: "USD", label: "USD" },
];

export function Step4Payment({
  useMainStripeKey,
  setUseMainStripeKey,
  stripeKey,
  setStripeKey,
  currency,
  setCurrency,
  paymentMethods,
  setPaymentMethods,
}: {
  useMainStripeKey: boolean;
  setUseMainStripeKey: (v: boolean) => void;
  stripeKey: string;
  setStripeKey: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  paymentMethods: string[];
  setPaymentMethods: (v: string[]) => void;
}) {
  function toggleMethod(value: string) {
    if (paymentMethods.includes(value)) {
      setPaymentMethods(paymentMethods.filter((m) => m !== value));
    } else {
      setPaymentMethods([...paymentMethods, value]);
    }
  }

  const labelStyle = { color: "var(--text-2)" };

  return (
    <div className="max-w-lg space-y-4">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-1)" }}>
          <input type="checkbox" checked={useMainStripeKey} onChange={(e) => setUseMainStripeKey(e.target.checked)} />
          Utiliser la clé Stripe principale de VNK
        </label>

        {!useMainStripeKey && (
          <div className="space-y-1">
            <label className="text-[13px]" style={labelStyle}>Clé Stripe dédiée à cette boutique</label>
            <Input value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} placeholder="sk_test_..." className="w-full" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-[13px]" style={labelStyle}>Devise</label>
        <Select options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} minWidth="100%" />
      </div>

      <div className="space-y-1">
        <label className="text-[13px]" style={labelStyle}>Modes de paiement</label>
        {availableMethods.map((m) => (
          <label key={m.value} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-1)" }}>
            <input type="checkbox" checked={paymentMethods.includes(m.value)} onChange={() => toggleMethod(m.value)} />
            {m.label}
          </label>
        ))}
      </div>
    </div>
  );
}

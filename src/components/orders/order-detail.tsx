"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/contexts/lang-context";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    store: { select: { name: true } };
    assignedTo: { select: { id: true; name: true } };
    items: { include: { product: { select: { name: true; supplier: true; supplierSku: true } } } };
    trackingEvents: true;
  };
}>;

const STATUS_LABELS: Record<string, Record<string, string>> = {
  fr: {
    PENDING: "En attente", CONFIRMED: "Confirmée", DISPATCHED_TO_SUPPLIER: "Envoyée fournisseur",
    SHIPPED: "Expédiée", IN_TRANSIT: "En transit", DELIVERED: "Livrée", CANCELLED: "Annulée", REFUNDED: "Remboursée",
  },
  en: {
    PENDING: "Pending", CONFIRMED: "Confirmed", DISPATCHED_TO_SUPPLIER: "Sent to supplier",
    SHIPPED: "Shipped", IN_TRANSIT: "In transit", DELIVERED: "Delivered", CANCELLED: "Cancelled", REFUNDED: "Refunded",
  },
};

export function OrderDetail({ order, employees }: { order: OrderWithRelations; employees: { id: string; name: string }[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { lang, t } = useLanguage();
  const [status, setStatus] = useState(order.status);
  const [assignedToId, setAssignedToId] = useState(order.assignedToId ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const statusLabels = STATUS_LABELS[lang];

  const statusOptions: SelectOption[] = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));
  const employeeOptions: SelectOption[] = [
    { value: "", label: t.label_unassigned },
    ...employees.map((e) => ({ value: e.id, label: e.name })),
  ];

  async function save(changes: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    setSaving(false);
    showToast(t.orders_updated, "success");
    router.refresh();
  }

  async function handleSendEmail() {
    await fetch(`/api/orders/${order.id}/send-email`, { method: "POST" });
    setEmailSent(true);
    showToast(t.action_email_sent, "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-medium" style={{ color: "var(--text-1)" }}>
          {lang === "en" ? "Order" : "Commande"} {order.orderNumber}
        </h1>
        <StatusBadge status={order.status} label={statusLabels[order.status]} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 font-medium" style={{ color: "var(--text-1)" }}>{t.label_client}</h2>
            <p style={{ color: "var(--text-1)" }}>{order.customerName}</p>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>{order.customerEmail}</p>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>{order.customerPhone ?? "—"}</p>
          </Card>

          <Card>
            <h2 className="mb-2 font-medium" style={{ color: "var(--text-1)" }}>{t.label_products}</h2>
            <ul className="space-y-1 text-[13px]">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span style={{ color: "var(--text-1)" }}>{item.product.name} × {item.quantity}</span>
                  <span style={{ color: "var(--text-2)" }}>{item.price.toFixed(2)} $</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right font-medium" style={{ color: "var(--text-1)" }}>
              {t.label_total}: {order.totalAmount.toFixed(2)} {order.currency}
            </p>
          </Card>

          <Card>
            <h2 className="mb-2 font-medium" style={{ color: "var(--text-1)" }}>{t.label_tracking}</h2>
            {order.trackingNumber ? (
              <p className="text-[13px]" style={{ color: "var(--text-1)" }}>{order.trackingNumber} — {order.trackingUrl ?? "—"}</p>
            ) : (
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>{t.tracking_no_number}</p>
            )}
            <ul className="mt-2 space-y-1 text-[13px]">
              {order.trackingEvents.map((event) => (
                <li key={event.id} style={{ color: "var(--text-2)" }}>
                  {new Date(event.occurredAt).toLocaleString(lang === "en" ? "en-CA" : "fr-CA")} — {event.status}
                  {event.location ? ` (${event.location})` : ""}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-2">
            <h2 className="font-medium" style={{ color: "var(--text-1)" }}>{t.label_status}</h2>
            <Select options={statusOptions} value={status} onChange={(v) => { const val = v as typeof status; setStatus(val); save({ status: val }); }} minWidth="100%" />
          </Card>

          <Card className="space-y-2">
            <h2 className="font-medium" style={{ color: "var(--text-1)" }}>{t.label_assigned_to}</h2>
            <Select options={employeeOptions} value={assignedToId} onChange={(v) => { setAssignedToId(v); save({ assignedToId: v }); }} minWidth="100%" />
          </Card>

          <Card className="space-y-2">
            <h2 className="font-medium" style={{ color: "var(--text-1)" }}>{t.label_notes}</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => save({ notes })}
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
              style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", color: "var(--text-1)" }}
            />
          </Card>

          <Button variant="secondary" onClick={handleSendEmail} disabled={emailSent} className="w-full">
            {emailSent ? t.action_email_sent : t.action_send_email}
          </Button>

          {saving && <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{t.action_saving}</p>}
        </div>
      </div>
    </div>
  );
}

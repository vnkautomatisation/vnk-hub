"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { orderStatusLabels } from "@/lib/order-status";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    store: { select: { name: true } };
    assignedTo: { select: { id: true; name: true } };
    items: { include: { product: { select: { name: true; supplier: true; supplierSku: true } } } };
    trackingEvents: true;
  };
}>;

export function OrderDetail({
  order,
  employees,
}: {
  order: OrderWithRelations;
  employees: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [status, setStatus] = useState(order.status);
  const [assignedToId, setAssignedToId] = useState(order.assignedToId ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function save(changes: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    setSaving(false);
    showToast("Commande mise à jour", "success");
    router.refresh();
  }

  async function handleSendEmail() {
    await fetch(`/api/orders/${order.id}/send-email`, { method: "POST" });
    setEmailSent(true);
    showToast("Email envoyé au client", "success");
  }

  const labelStyle = { color: "var(--text-1)" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-medium" style={{ color: "var(--text-1)" }}>
          Commande {order.orderNumber}
        </h1>
        <StatusBadge status={order.status} label={orderStatusLabels[order.status]} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 font-medium" style={labelStyle}>
              Client
            </h2>
            <p style={{ color: "var(--text-1)" }}>{order.customerName}</p>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
              {order.customerEmail}
            </p>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
              {order.customerPhone ?? "—"}
            </p>
          </Card>

          <Card>
            <h2 className="mb-2 font-medium" style={labelStyle}>
              Produits
            </h2>
            <ul className="space-y-1 text-[13px]">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span style={{ color: "var(--text-1)" }}>
                    {item.product.name} × {item.quantity}
                  </span>
                  <span style={{ color: "var(--text-2)" }}>{item.price.toFixed(2)} $</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right font-medium" style={{ color: "var(--text-1)" }}>
              Total: {order.totalAmount.toFixed(2)} {order.currency}
            </p>
          </Card>

          <Card>
            <h2 className="mb-2 font-medium" style={labelStyle}>
              Tracking
            </h2>
            {order.trackingNumber ? (
              <p className="text-[13px]" style={{ color: "var(--text-1)" }}>
                {order.trackingNumber} — {order.trackingUrl ?? "—"}
              </p>
            ) : (
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
                Aucun numéro de suivi
              </p>
            )}
            <ul className="mt-2 space-y-1 text-[13px]">
              {order.trackingEvents.map((event) => (
                <li key={event.id} style={{ color: "var(--text-2)" }}>
                  {new Date(event.occurredAt).toLocaleString("fr-CA")} — {event.status}
                  {event.location ? ` (${event.location})` : ""}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-2">
            <h2 className="font-medium" style={labelStyle}>
              Statut
            </h2>
            <Select
              value={status}
              onChange={(e) => {
                const value = e.target.value as typeof status;
                setStatus(value);
                save({ status: value });
              }}
              className="w-full"
            >
              {Object.entries(orderStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Card>

          <Card className="space-y-2">
            <h2 className="font-medium" style={labelStyle}>
              Assigné à
            </h2>
            <Select
              value={assignedToId}
              onChange={(e) => {
                setAssignedToId(e.target.value);
                save({ assignedToId: e.target.value });
              }}
              className="w-full"
            >
              <option value="">Non assigné</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Card>

          <Card className="space-y-2">
            <h2 className="font-medium" style={labelStyle}>
              Notes internes
            </h2>
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
            {emailSent ? "Email envoyé" : "Envoyer un email au client"}
          </Button>

          {saving && (
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
              Enregistrement...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

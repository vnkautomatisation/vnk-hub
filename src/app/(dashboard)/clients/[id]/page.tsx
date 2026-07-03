import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconShoppingCart } from "@tabler/icons-react";
import { ClientEditPanel } from "@/components/clients/client-edit-panel";

const STATUS_FR: Record<string, string> = {
  PENDING: "En attente", CONFIRMED: "Confirmée", DISPATCHED_TO_SUPPLIER: "Fournisseur",
  SHIPPED: "Expédiée", IN_TRANSIT: "En transit", DELIVERED: "Livrée",
  CANCELLED: "Annulée", REFUNDED: "Remboursée",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#FBBF24", CONFIRMED: "#6366F1", DISPATCHED_TO_SUPPLIER: "#A78BFA",
  SHIPPED: "#34D399", IN_TRANSIT: "#60A5FA", DELIVERED: "#4ADE80",
  CANCELLED: "#F87171", REFUNDED: "#FB923C",
};

type CustomerRow = {
  id: string; name: string; email: string; phone: string | null;
  address: unknown; notes: string | null; createdAt: Date; updatedAt: Date;
};
type OrderRow = {
  id: string; orderNumber: string; status: string;
  totalAmount: number; currency: string; createdAt: Date; storeName: string;
};

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
}
function fmtAmount(n: number, currency = "CAD") {
  return n.toLocaleString("fr-CA", { style: "currency", currency, minimumFractionDigits: 2 });
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const rows = await prisma.$queryRaw<CustomerRow[]>`
    SELECT id, name, email, phone, address, notes, "createdAt", "updatedAt"
    FROM "Customer" WHERE id = ${params.id} LIMIT 1`;
  if (!rows.length) notFound();
  const customer = rows[0];

  const orders = await prisma.$queryRaw<OrderRow[]>`
    SELECT o.id, o."orderNumber", o.status, o."totalAmount", o.currency, o."createdAt",
           s.name AS "storeName"
    FROM "Order" o
    JOIN "Store" s ON s.id = o."storeId"
    WHERE o."customerId" = ${params.id}
    ORDER BY o."createdAt" DESC`;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/clients" className="btn btn-ghost btn-icon btn-sm">
          <IconArrowLeft size={15} />
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-1)", margin: 0, letterSpacing: "-0.3px" }}>
            {customer.name}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>Client depuis le {fmtDate(customer.createdAt)}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Commandes",    value: String(orders.length) },
              { label: "Total dépensé", value: fmtAmount(totalSpent) },
              { label: "Panier moyen", value: orders.length ? fmtAmount(totalSpent / orders.length) : "—" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "0.5px solid var(--border)", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
              Historique des commandes
            </div>
            {orders.length === 0 ? (
              <div style={{ padding: "36px 24px", textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>
                Aucune commande liée à ce client.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                    {["Numéro", "Boutique", "Statut", "Montant", "Date"].map((h) => (
                      <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "0.5px solid var(--border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "11px 16px" }}>
                        <Link href={`/orders/${o.id}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "var(--accent-light)", textDecoration: "none" }}>
                          <IconShoppingCart size={13} /> {o.orderNumber}
                        </Link>
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-2)" }}>{o.storeName}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, color: STATUS_COLOR[o.status] ?? "var(--text-2)", background: `${STATUS_COLOR[o.status] ?? "#888"}1a` }}>
                          {STATUS_FR[o.status] ?? o.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{fmtAmount(Number(o.totalAmount), o.currency)}</td>
                      <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-3)" }}>{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <ClientEditPanel customer={customer as any} />
      </div>
    </div>
  );
}

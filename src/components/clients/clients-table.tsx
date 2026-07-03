"use client";

import Link from "next/link";
import { IconChevronRight, IconMail, IconPhone } from "@tabler/icons-react";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-CA", { year: "numeric", month: "short", day: "numeric" });
}

function fmtAmount(n: number) {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2 });
}

export function ClientsTable({ customers }: { customers: Customer[] }) {
  if (!customers.length) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
        Aucun client trouvé.
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
          {["Client", "Contact", "Commandes", "Total dépensé", "Depuis le", ""].map((h) => (
            <th key={h} style={{
              padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 600,
              color: "var(--text-3)", letterSpacing: "0.05em", textTransform: "uppercase",
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {customers.map((c) => (
          <tr
            key={c.id}
            style={{ borderBottom: "0.5px solid var(--border)", transition: "background 100ms" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: "var(--accent)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff",
                }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{c.name}</div>
                </div>
              </div>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)" }}>
                  <IconMail size={11} style={{ color: "var(--text-3)" }} /> {c.email}
                </div>
                {c.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)" }}>
                    <IconPhone size={11} style={{ color: "var(--text-3)" }} /> {c.phone}
                  </div>
                )}
              </div>
            </td>
            <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>
              {c.orderCount}
            </td>
            <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>
              {fmtAmount(c.totalSpent)}
            </td>
            <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-3)" }}>
              {fmtDate(c.createdAt)}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <Link
                href={`/clients/${c.id}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", color: "var(--text-3)", textDecoration: "none" }}
              >
                <IconChevronRight size={15} />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

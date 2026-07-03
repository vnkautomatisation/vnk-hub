import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClientsTable } from "@/components/clients/clients-table";
import { CreateClientButton } from "@/components/clients/create-client-button";

type CustomerRow = {
  id: string; name: string; email: string; phone: string | null;
  address: unknown; notes: string | null; createdAt: Date; updatedAt: Date;
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";

  const customers: CustomerRow[] = q
    ? await prisma.$queryRaw`
        SELECT id, name, email, phone, address, notes, "createdAt", "updatedAt"
        FROM "Customer"
        WHERE name ILIKE ${"%" + q + "%"}
           OR email ILIKE ${"%" + q + "%"}
           OR phone ILIKE ${"%" + q + "%"}
        ORDER BY "createdAt" DESC LIMIT 200`
    : await prisma.$queryRaw`
        SELECT id, name, email, phone, address, notes, "createdAt", "updatedAt"
        FROM "Customer"
        ORDER BY "createdAt" DESC LIMIT 200`;

  const enriched = await Promise.all(
    customers.map(async (c) => {
      const [counts, totals] = await Promise.all([
        prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM "Order" WHERE "customerId" = ${c.id}`,
        prisma.$queryRaw<[{ sum: number | null }]>`SELECT SUM("totalAmount") as sum FROM "Order" WHERE "customerId" = ${c.id}`,
      ]);
      return { ...c, orderCount: Number(counts[0].count), totalSpent: totals[0].sum ?? 0 };
    })
  );

  const [totalRow] = await prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM "Customer"`;
  const totalCount = Number(totalRow.count);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-1)", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
            Clients
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>
            {totalCount} client{totalCount !== 1 ? "s" : ""} enregistré{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateClientButton />
      </div>

      <form method="GET" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          name="q"
          defaultValue={q}
          className="input"
          style={{ width: 280, fontSize: 13 }}
          placeholder="Rechercher par nom, email ou téléphone…"
        />
        <button type="submit" className="btn btn-secondary btn-sm">Rechercher</button>
        {q && <Link href="/clients" className="btn btn-ghost btn-sm">Effacer</Link>}
      </form>

      <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <ClientsTable customers={enriched as any} />
      </div>
    </div>
  );
}

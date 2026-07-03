import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClientsTable } from "@/components/clients/clients-table";
import { CreateClientButton } from "@/components/clients/create-client-button";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";

  const where = q
    ? {
        OR: [
          { name:  { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const customers = await (prisma as any).customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
    take: 200,
  });

  const enriched = await Promise.all(
    customers.map(async (c: any) => {
      const agg = await (prisma.order.aggregate as any)({
        where: { customerId: c.id },
        _sum: { totalAmount: true },
      });
      return { ...c, totalSpent: (agg._sum?.totalAmount ?? 0) as number, orderCount: c._count.orders as number };
    })
  );

  const totalCount = await (prisma as any).customer.count();

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
        <ClientsTable customers={enriched} />
      </div>
    </div>
  );
}

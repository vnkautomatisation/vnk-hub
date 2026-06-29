import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { orderStatusLabels } from "@/lib/order-status";
import { Card } from "@/components/ui/card";
import { Select, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { OrdersTable } from "@/components/orders/orders-table";

const PAGE_SIZE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; storeId?: string; supplier?: string; from?: string; to?: string; page?: string };
}) {
  const stores = await prisma.store.findMany({ select: { id: true, name: true } });
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where: Record<string, unknown> = {};
  if (searchParams.status) where.status = searchParams.status as OrderStatus;
  if (searchParams.storeId) where.storeId = searchParams.storeId;
  if (searchParams.supplier) {
    where.items = { some: { product: { supplier: searchParams.supplier } } };
  }
  if (searchParams.from || searchParams.to) {
    where.createdAt = {
      ...(searchParams.from ? { gte: new Date(searchParams.from) } : {}),
      ...(searchParams.to ? { lte: new Date(searchParams.to) } : {}),
    };
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        store: { select: { name: true } },
        items: { include: { product: { select: { name: true, supplier: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function buildHref(page: number) {
    const params = new URLSearchParams();
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.storeId) params.set("storeId", searchParams.storeId);
    if (searchParams.supplier) params.set("supplier", searchParams.supplier);
    if (searchParams.from) params.set("from", searchParams.from);
    if (searchParams.to) params.set("to", searchParams.to);
    params.set("page", String(page));
    return `/orders?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
          Commandes
        </h1>
        <Badge>{totalCount} commandes</Badge>
      </div>

      <Card>
        <form className="flex flex-wrap items-end gap-2">
          <Select name="status" defaultValue={searchParams.status ?? ""}>
            <option value="">Tous les statuts</option>
            {Object.entries(orderStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Select name="storeId" defaultValue={searchParams.storeId ?? ""}>
            <option value="">Toutes les boutiques</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          <Select name="supplier" defaultValue={searchParams.supplier ?? ""}>
            <option value="">Tous les fournisseurs</option>
            <option value="CJ_DROPSHIPPING">CJ Dropshipping</option>
            <option value="ALIEXPRESS">AliExpress</option>
            <option value="ZENDROP">Zendrop</option>
            <option value="PRINTFUL">Printful</option>
          </Select>

          <Input type="date" name="from" defaultValue={searchParams.from ?? ""} />
          <Input type="date" name="to" defaultValue={searchParams.to ?? ""} />

          <Button type="submit">Filtrer</Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <OrdersTable orders={orders} />
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}

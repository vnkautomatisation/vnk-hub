import { prisma } from "@/lib/prisma";
import { TrackingLookup } from "@/components/tracking/tracking-lookup";
import { TrackingTable } from "@/components/tracking/tracking-table";
import { getT } from "@/lib/i18n";

export default async function TrackingPage() {
  const t = getT();
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["SHIPPED", "IN_TRANSIT", "DELIVERED", "DISPATCHED_TO_SUPPLIER"] },
    },
    include: {
      store: { select: { name: true } },
      items: { include: { product: { select: { supplier: true } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
          {t.tracking_title}
        </h1>
      </div>

      <TrackingLookup />

      <TrackingTable orders={orders} />
    </div>
  );
}

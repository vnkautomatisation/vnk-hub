import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { OrderStatus } from "@prisma/client";

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const where: Record<string, unknown> = {};
  if (sp.get("status"))  where.status  = sp.get("status") as OrderStatus;
  if (sp.get("storeId")) where.storeId = sp.get("storeId");
  if (sp.get("from") || sp.get("to")) {
    where.createdAt = {
      ...(sp.get("from") ? { gte: new Date(sp.get("from")!) } : {}),
      ...(sp.get("to")   ? { lte: new Date(sp.get("to")!)   } : {}),
    };
  }
  if (sp.get("q")) {
    const q = sp.get("q")!;
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { customerEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      orderNumber: true, status: true, customerName: true, customerEmail: true,
      customerPhone: true, totalAmount: true, currency: true,
      trackingNumber: true, trackingCarrier: true,
      supplierOrderId: true, cancellationReason: true,
      createdAt: true, dispatchedAt: true, cancelledAt: true, refundedAt: true,
      store: { select: { name: true } },
      items: { select: { quantity: true, price: true, product: { select: { name: true, supplier: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  } as Parameters<typeof prisma.order.findMany>[0]);

  const headers = [
    "Numéro","Statut","Boutique","Client","Email","Téléphone",
    "Montant","Devise","Produits","Fournisseurs",
    "Tracking","Transporteur","ID Fournisseur","Raison annulation",
    "Créée le","Expédiée le","Annulée le","Remboursée le",
  ];

  const rows = (orders as Record<string, unknown>[]).map((o) => {
    const items = (o.items as { quantity: number; price: number; product: { name: string; supplier: string } }[]);
    const products   = items.map((i) => `${i.product.name} (x${i.quantity})`).join(" | ");
    const suppliers  = [...new Set(items.map((i) => i.product.supplier))].join(" | ");
    const store = (o.store as { name: string }).name;
    return [
      o.orderNumber, o.status, store, o.customerName, o.customerEmail, o.customerPhone ?? "",
      (o.totalAmount as number).toFixed(2), o.currency,
      products, suppliers,
      o.trackingNumber ?? "", o.trackingCarrier ?? "", o.supplierOrderId ?? "",
      o.cancellationReason ?? "",
      new Date(o.createdAt as Date).toLocaleDateString("fr-CA"),
      o.dispatchedAt ? new Date(o.dispatchedAt as Date).toLocaleDateString("fr-CA") : "",
      o.cancelledAt  ? new Date(o.cancelledAt  as Date).toLocaleDateString("fr-CA") : "",
      o.refundedAt   ? new Date(o.refundedAt   as Date).toLocaleDateString("fr-CA") : "",
    ].map(csvEscape).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

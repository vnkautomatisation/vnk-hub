import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersFilterBar } from "@/components/orders/orders-filter-bar";
import { getT, getLang } from "@/lib/i18n";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { OrdersHeaderActions } from "@/components/orders/orders-header-actions";

const PAGE_SIZE = 25;

const STATUS_META: Record<string, { fr: string; en: string; color: string; bg: string }> = {
  PENDING:                { fr: "En attente",          en: "Pending",          color: "#FBBF24", bg: "rgba(251,191,36,.12)"  },
  CONFIRMED:              { fr: "Confirmée",            en: "Confirmed",        color: "#6366F1", bg: "rgba(99,102,241,.12)"  },
  DISPATCHED_TO_SUPPLIER: { fr: "Fournisseur",          en: "Supplier",         color: "#A78BFA", bg: "rgba(167,139,250,.12)" },
  SHIPPED:                { fr: "Expédiée",             en: "Shipped",          color: "#34D399", bg: "rgba(52,211,153,.12)"  },
  IN_TRANSIT:             { fr: "En transit",           en: "In transit",       color: "#60A5FA", bg: "rgba(96,165,250,.12)"  },
  DELIVERED:              { fr: "Livrée",               en: "Delivered",        color: "#4ADE80", bg: "rgba(74,222,128,.12)"  },
  CANCELLED:              { fr: "Annulée",              en: "Cancelled",        color: "#F87171", bg: "rgba(248,113,113,.12)" },
  REFUNDED:               { fr: "Remboursée",           en: "Refunded",         color: "#FB923C", bg: "rgba(251,146,60,.12)"  },
};

const STATUS_ORDER: OrderStatus[] = ["PENDING","CONFIRMED","DISPATCHED_TO_SUPPLIER","SHIPPED","IN_TRANSIT","DELIVERED","CANCELLED","REFUNDED"];

function todayLabel(lang: string) {
  return new Date().toLocaleDateString(lang === "en" ? "en-CA" : "fr-CA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function buildPageHref(searchParams: Record<string, string | undefined>, page: number) {
  const p = new URLSearchParams();
  if (searchParams.q)        p.set("q", searchParams.q);
  if (searchParams.status)   p.set("status", searchParams.status);
  if (searchParams.storeId)  p.set("storeId", searchParams.storeId);
  if (searchParams.supplier) p.set("supplier", searchParams.supplier);
  if (searchParams.from)     p.set("from", searchParams.from);
  if (searchParams.to)       p.set("to", searchParams.to);
  p.set("page", String(page));
  return `/orders?${p.toString()}`;
}

function paginationPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; storeId?: string; supplier?: string; from?: string; to?: string; page?: string };
}) {
  const t = getT();
  const lang = getLang();
  const isEn = lang === "en";

  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [stores, employees, statusCounts] = await Promise.all([
    prisma.store.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  const where: Record<string, unknown> = {};
  if (searchParams.status) where.status = searchParams.status as OrderStatus;
  if (searchParams.storeId) where.storeId = searchParams.storeId;
  if (searchParams.supplier) where.items = { some: { product: { supplier: searchParams.supplier } } };
  if (searchParams.from || searchParams.to) {
    where.createdAt = {
      ...(searchParams.from ? { gte: new Date(searchParams.from) } : {}),
      ...(searchParams.to   ? { lte: new Date(searchParams.to) }   : {}),
    };
  }
  if (searchParams.q) {
    const q = searchParams.q;
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { customerEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true, orderNumber: true, customerName: true, customerEmail: true,
        totalAmount: true, currency: true, status: true,
        trackingNumber: true, trackingUrl: true, createdAt: true,
        store: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
        items: { select: { product: { select: { name: true, supplier: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  const countMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id]));
  const totalAll = Object.values(countMap).reduce((a, b) => a + b, 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalCount);
  const pages = paginationPages(currentPage, totalPages);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ══ Header ══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-1)", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
            Commandes
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, textTransform: "capitalize" }}>
            {todayLabel(lang)} — {totalAll} commande{totalAll !== 1 ? "s" : ""} au total
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <OrdersHeaderActions
            stores={stores}
            exportHref={`/api/orders/export?${new URLSearchParams({
              ...(searchParams.status   ? { status:   searchParams.status   } : {}),
              ...(searchParams.storeId  ? { storeId:  searchParams.storeId  } : {}),
              ...(searchParams.supplier ? { supplier: searchParams.supplier } : {}),
              ...(searchParams.from     ? { from:     searchParams.from     } : {}),
              ...(searchParams.to       ? { to:       searchParams.to       } : {}),
              ...(searchParams.q        ? { q:        searchParams.q        } : {}),
            }).toString()}`}
          />
          <Link href="/orders/live" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "0.5px solid #4ADE80", color: "#4ADE80", textDecoration: "none", background: "rgba(74,222,128,0.06)" }}>
            <span style={{ width: 7, height: 7, background: "#4ADE80", borderRadius: "50%", boxShadow: "0 0 6px #4ADE80" }} />
            Vue Live
          </Link>
        </div>
      </div>

      {/* ══ Status cards ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 8 }}>
        {/* Toutes */}
        {(() => {
          const active = !searchParams.status;
          return (
            <Link href="/orders" style={{
              padding: "12px 14px", borderRadius: 10, cursor: "pointer", textDecoration: "none",
              background: active ? "rgba(255,255,255,0.10)" : "var(--bg-card)",
              border: `${active ? "1.5px" : "0.5px"} solid ${active ? "var(--border-strong)" : "var(--border)"}`,
              boxShadow: active ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              transition: "all 150ms",
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", marginBottom: 3, lineHeight: 1 }}>{totalAll}</div>
              <div style={{ fontSize: 11, color: active ? "var(--text-2)" : "var(--text-3)", fontWeight: active ? 500 : 400 }}>Toutes</div>
            </Link>
          );
        })()}
        {STATUS_ORDER.map((s) => {
          const meta = STATUS_META[s];
          const count = countMap[s] ?? 0;
          const active = searchParams.status === s;
          return (
            <Link
              key={s}
              href={`/orders?status=${s}`}
              style={{
                padding: "12px 14px", borderRadius: 10, cursor: "pointer", textDecoration: "none",
                background: active ? meta.bg : "var(--bg-card)",
                border: `${active ? "1.5px" : "0.5px"} solid ${active ? meta.color : "var(--border)"}`,
                boxShadow: active ? `0 0 0 3px ${meta.color}1a` : "none",
                transition: "all 150ms",
              }}
            >
              {/* Nombre — couleur du statut si actif, sinon text-1 ou text-3 si zéro */}
              <div style={{
                fontSize: 22, fontWeight: 700, lineHeight: 1, marginBottom: 4,
                color: active ? meta.color : count === 0 ? "var(--text-3)" : "var(--text-1)",
              }}>
                {count}
              </div>
              {/* Label — toujours lisible avec text-2 ou text-3 */}
              <div style={{
                fontSize: 11, fontWeight: active ? 500 : 400,
                color: count === 0 && !active ? "var(--text-3)" : "var(--text-2)",
              }}>
                {isEn ? meta.en : meta.fr}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ══ Filters ══ */}
      <OrdersFilterBar
        stores={stores}
        status={searchParams.status}
        storeId={searchParams.storeId}
        supplier={searchParams.supplier}
        from={searchParams.from}
        to={searchParams.to}
        search={searchParams.q}
      />

      {/* ══ Table card ══ */}
      <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <OrdersTable orders={orders} employees={employees} />

        {/* ── Pagination footer ── */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "0.5px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>
              Affichage {pageStart}–{pageEnd} sur {totalCount} commande{totalCount !== 1 ? "s" : ""}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <Link
                href={buildPageHref(searchParams, Math.max(1, currentPage - 1))}
                style={{ width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: currentPage === 1 ? "var(--text-3)" : "var(--text-2)", pointerEvents: currentPage === 1 ? "none" : "auto", border: "0.5px solid var(--border)", textDecoration: "none" }}
              >
                <IconChevronLeft size={15} />
              </Link>
              {pages.map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} style={{ width: 32, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>…</span>
                ) : (
                  <Link
                    key={p}
                    href={buildPageHref(searchParams, p)}
                    style={{ width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: p === currentPage ? 600 : 400, textDecoration: "none", background: p === currentPage ? "var(--accent)" : "transparent", color: p === currentPage ? "#fff" : "var(--text-2)", border: p === currentPage ? "none" : "none" }}
                  >
                    {p}
                  </Link>
                )
              )}
              <Link
                href={buildPageHref(searchParams, Math.min(totalPages, currentPage + 1))}
                style={{ width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: currentPage === totalPages ? "var(--text-3)" : "var(--text-2)", pointerEvents: currentPage === totalPages ? "none" : "auto", border: "0.5px solid var(--border)", textDecoration: "none" }}
              >
                <IconChevronRight size={15} />
              </Link>
            </div>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>
              {PAGE_SIZE} par page
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

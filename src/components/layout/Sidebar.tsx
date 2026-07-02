"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  IconLayoutDashboard, IconShoppingCart, IconPackage,
  IconWorld, IconTruckDelivery, IconMapPin,
  IconUsers, IconChartBar, IconSettings,
  IconChevronDown,
} from "@tabler/icons-react";
import { supplierLabels, type ConnectableSupplier } from "@/lib/suppliers";
import { LogoIcon } from "@/components/brand/logo";
import { useLanguage } from "@/contexts/lang-context";

type SidebarProps = {
  userName?: string;
  userRole?: string;
  supplierStatus: Record<ConnectableSupplier, boolean>;
};

/* ─── Nav item styles ─── */
const BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 12px 8px 10px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 450,
  color: "var(--text-2)",
  background: "transparent",
  cursor: "pointer",
  border: "none",
  borderLeft: "2px solid transparent",
  width: "100%",
  textAlign: "left" as const,
  textDecoration: "none",
  transition: "background 120ms, color 120ms",
  lineHeight: 1,
};

const ACTIVE: React.CSSProperties = {
  ...BASE,
  background: "rgba(99,102,241,0.13)",
  color: "#A5B4FC",
  borderLeft: "2px solid #6366F1",
  fontWeight: 500,
};

/* sub-item: flex so we can show the dot indicator */
const SUB_BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px 6px 34px",
  fontSize: 12.5,
  fontWeight: 400,
  color: "var(--text-2)",
  textDecoration: "none",
  borderRadius: 6,
  transition: "background 100ms, color 100ms",
  lineHeight: 1,
};

const SUB_ACTIVE: React.CSSProperties = {
  ...SUB_BASE,
  color: "#A5B4FC",
  background: "rgba(99,102,241,0.10)",
  fontWeight: 500,
};

export function Sidebar({ supplierStatus }: SidebarProps) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { lang, t, setLang } = useLanguage();

  const [ordersOpen,    setOrdersOpen]    = useState(pathname.startsWith("/orders"));
  const [suppliersOpen, setSuppliersOpen] = useState(pathname.startsWith("/suppliers"));

  /* exact path match (no query string) */
  const isActive = (path: string) => pathname === path;

  /* sub-item match: path + optional query params must match exactly */
  function isSubActive(href: string): boolean {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    if (!query) {
      // "/orders" (no filter) — active only when no status param set
      return !searchParams.get("status");
    }
    const params = new URLSearchParams(query);
    for (const [key, val] of params.entries()) {
      if (searchParams.get(key) !== val) return false;
    }
    return true;
  }

  const startsWith = (prefix: string) => pathname.startsWith(prefix);

  const orderFilters = [
    { href: "/orders",                    label: t.nav_orders_all       },
    { href: "/orders?status=PENDING",     label: t.nav_orders_pending   },
    { href: "/orders?status=SHIPPED",     label: t.nav_orders_shipped   },
    { href: "/orders?status=CANCELLED",   label: t.nav_orders_cancelled },
    { href: "/orders?status=REFUNDED",    label: t.nav_orders_refunded  },
  ];

  function NavItem({
    href, icon, label, active, onClick, open,
  }: {
    href?: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick?: () => void;
    open?: boolean;
  }) {
    const style = active ? ACTIVE : BASE;
    const hoverHandlers = {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        if (!active) {
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.color = "var(--text-1)";
        }
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-2)";
        }
      },
    };

    if (href) {
      return (
        <Link href={href} style={style} {...hoverHandlers}>
          <span style={{ color: active ? "#A5B4FC" : "var(--text-2)", display: "flex", flexShrink: 0 }}>{icon}</span>
          {label}
        </Link>
      );
    }
    return (
      <button style={{ ...style, justifyContent: "space-between" }} onClick={onClick} {...hoverHandlers}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: active ? "#A5B4FC" : "var(--text-2)", display: "flex", flexShrink: 0 }}>{icon}</span>
          {label}
        </span>
        <IconChevronDown size={13} style={{ color: "var(--text-3)", transition: "transform 150ms", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }} />
      </button>
    );
  }

  function SubItem({ href, label }: { href: string; label: string }) {
    const active = isSubActive(href);
    return (
      <Link
        href={href}
        style={active ? SUB_ACTIVE : SUB_BASE}
        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-1)"; } }}
        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; } }}
      >
        {/* dot indicator */}
        <span style={{
          width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
          background: active ? "#6366F1" : "var(--border-strong)",
          transition: "background 120ms",
          boxShadow: active ? "0 0 0 2px rgba(99,102,241,0.25)" : "none",
        }} />
        {label}
      </Link>
    );
  }

  return (
    <aside style={{
      position: "fixed", inset: "0 auto 0 0",
      width: 224, height: "100vh",
      display: "flex", flexDirection: "column",
      background: "var(--bg-surface)",
      borderRight: "0.5px solid var(--border)",
      zIndex: 100,
    }}>
      {/* ── Logo ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "18px 16px 14px" }}>
        <LogoIcon size={34} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
            VNK<span style={{ color: "var(--accent)" }}>Hub</span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.02em", marginTop: 1 }}>
            by VNK Automatisation
          </div>
        </div>
      </div>

      <div style={{ height: "0.5px", background: "var(--border)", margin: "0 12px" }} />

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>

        <NavItem href="/" icon={<IconLayoutDashboard size={16} />} label={t.nav_dashboard} active={isActive("/")} />

        {/* Orders */}
        <NavItem
          icon={<IconShoppingCart size={16} />}
          label={t.nav_orders}
          active={startsWith("/orders")}
          onClick={() => setOrdersOpen((v) => !v)}
          open={ordersOpen}
        />
        {ordersOpen && (
          <div style={{ marginBottom: 2, marginTop: 1 }}>
            {orderFilters.map((f) => <SubItem key={f.href} href={f.href} label={f.label} />)}
          </div>
        )}

        <NavItem href="/products"  icon={<IconPackage        size={16} />} label={t.nav_products}  active={startsWith("/products")}  />
        <NavItem href="/stores"    icon={<IconWorld          size={16} />} label={t.nav_stores}    active={startsWith("/stores")}    />

        {/* Suppliers */}
        <NavItem
          icon={<IconTruckDelivery size={16} />}
          label={t.nav_suppliers}
          active={startsWith("/suppliers")}
          onClick={() => setSuppliersOpen((v) => !v)}
          open={suppliersOpen}
        />
        {suppliersOpen && (
          <div style={{ marginBottom: 2, marginTop: 1 }}>
            {Object.entries(supplierLabels).map(([key, label]) => {
              const href = `/suppliers/${key.toLowerCase().replace("_dropshipping", "")}`;
              const connected = supplierStatus[key as ConnectableSupplier];
              const active = pathname.startsWith(href);
              return (
                <Link key={key} href={href}
                  style={active ? SUB_ACTIVE : SUB_BASE}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-1)"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; } }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: active ? "#6366F1" : "var(--border-strong)", boxShadow: active ? "0 0 0 2px rgba(99,102,241,0.25)" : "none" }} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: connected ? "var(--success)" : "var(--danger)" }} />
                </Link>
              );
            })}
          </div>
        )}

        <NavItem href="/tracking"  icon={<IconMapPin         size={16} />} label={t.nav_tracking}  active={startsWith("/tracking")}  />
        <NavItem href="/team"      icon={<IconUsers          size={16} />} label={t.nav_team}      active={startsWith("/team")}      />
        <NavItem href="/analytics" icon={<IconChartBar       size={16} />} label={t.nav_analytics} active={startsWith("/analytics")} />
        <NavItem href="/settings"  icon={<IconSettings       size={16} />} label={t.nav_settings}  active={startsWith("/settings")}  />
      </nav>

      {/* ── Bottom : lang toggle only ── */}
      <div style={{ borderTop: "0.5px solid var(--border)", padding: "14px 16px", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 20, padding: 2 }}>
          {(["fr", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 500,
              cursor: "pointer", border: "none",
              background: lang === l ? "var(--accent)" : "transparent",
              color: lang === l ? "#fff" : "var(--text-3)",
              transition: "all 150ms",
            }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

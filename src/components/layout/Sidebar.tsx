"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  IconLayoutDashboard, IconShoppingCart, IconPackage,
  IconWorld, IconTruckDelivery, IconMapPin,
  IconUsers, IconChartBar, IconSettings,
  IconChevronDown, IconLogout,
} from "@tabler/icons-react";
import { supplierLabels, type ConnectableSupplier } from "@/lib/suppliers";
import { LogoIcon } from "@/components/brand/logo";
import { useLanguage } from "@/contexts/lang-context";

type SidebarProps = {
  userName: string;
  userRole: string;
  supplierStatus: Record<ConnectableSupplier, boolean>;
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

const BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 12px",
  paddingLeft: 10,
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
  background: "rgba(99,102,241,0.12)",
  color: "#A5B4FC",
  borderLeft: "2px solid #6366F1",
};

const SUB: React.CSSProperties = {
  display: "block",
  padding: "6px 12px 6px 38px",
  fontSize: 12.5,
  color: "var(--text-3)",
  textDecoration: "none",
  borderRadius: 6,
  transition: "background 100ms, color 100ms",
};

const SUB_ACTIVE: React.CSSProperties = {
  ...SUB,
  color: "#A5B4FC",
  background: "rgba(99,102,241,0.08)",
};

export function Sidebar({ userName, userRole, supplierStatus }: SidebarProps) {
  const pathname = usePathname();
  const { lang, t, setLang } = useLanguage();
  const [ordersOpen, setOrdersOpen] = useState(pathname.startsWith("/orders"));
  const [suppliersOpen, setSuppliersOpen] = useState(pathname.startsWith("/suppliers"));

  const isActive = (href: string) => pathname === href || pathname === href.split("?")[0];
  const startsWith = (prefix: string) => pathname.startsWith(prefix);

  const orderFilters = [
    { href: "/orders", label: t.nav_orders_all },
    { href: "/orders?status=PENDING", label: t.nav_orders_pending },
    { href: "/orders?status=SHIPPED", label: t.nav_orders_shipped },
    { href: "/orders?status=CANCELLED", label: t.nav_orders_cancelled },
    { href: "/orders?status=REFUNDED", label: t.nav_orders_refunded },
  ];

  return (
    <aside
      style={{
        position: "fixed",
        inset: "0 auto 0 0",
        width: 224,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-surface)",
        borderRight: "0.5px solid var(--border)",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 16px 16px" }}>
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

      <div style={{ height: "0.5px", background: "var(--border)", margin: "0 16px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>

        <Link href="/" style={isActive("/") ? ACTIVE : BASE}>
          <IconLayoutDashboard size={16} style={{ flexShrink: 0 }} />
          {t.nav_dashboard}
        </Link>

        {/* Orders */}
        <button
          onClick={() => setOrdersOpen((v) => !v)}
          style={startsWith("/orders") ? ACTIVE : BASE}
        >
          <IconShoppingCart size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{t.nav_orders}</span>
          <IconChevronDown
            size={13}
            style={{
              color: "var(--text-3)",
              transition: "transform 150ms",
              transform: ordersOpen ? "rotate(180deg)" : "none",
              flexShrink: 0,
            }}
          />
        </button>
        {ordersOpen && (
          <div style={{ marginBottom: 2 }}>
            {orderFilters.map((f) => (
              <Link key={f.href} href={f.href} style={isActive(f.href) ? SUB_ACTIVE : SUB}>
                {f.label}
              </Link>
            ))}
          </div>
        )}

        <Link href="/products" style={startsWith("/products") ? ACTIVE : BASE}>
          <IconPackage size={16} style={{ flexShrink: 0 }} />
          {t.nav_products}
        </Link>

        <Link href="/stores" style={startsWith("/stores") ? ACTIVE : BASE}>
          <IconWorld size={16} style={{ flexShrink: 0 }} />
          {t.nav_stores}
        </Link>

        {/* Suppliers */}
        <button
          onClick={() => setSuppliersOpen((v) => !v)}
          style={startsWith("/suppliers") ? ACTIVE : BASE}
        >
          <IconTruckDelivery size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{t.nav_suppliers}</span>
          <IconChevronDown
            size={13}
            style={{
              color: "var(--text-3)",
              transition: "transform 150ms",
              transform: suppliersOpen ? "rotate(180deg)" : "none",
              flexShrink: 0,
            }}
          />
        </button>
        {suppliersOpen && (
          <div style={{ marginBottom: 2 }}>
            {Object.entries(supplierLabels).map(([key, label]) => {
              const href = `/suppliers/${key.toLowerCase().replace("_dropshipping", "")}`;
              const connected = supplierStatus[key as ConnectableSupplier];
              return (
                <Link
                  key={key}
                  href={href}
                  style={{
                    ...(isActive(href) ? SUB_ACTIVE : SUB),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{label}</span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: connected ? "var(--success)" : "var(--danger)",
                      flexShrink: 0,
                    }}
                  />
                </Link>
              );
            })}
          </div>
        )}

        <Link href="/tracking" style={startsWith("/tracking") ? ACTIVE : BASE}>
          <IconMapPin size={16} style={{ flexShrink: 0 }} />
          {t.nav_tracking}
        </Link>

        <Link href="/team" style={startsWith("/team") ? ACTIVE : BASE}>
          <IconUsers size={16} style={{ flexShrink: 0 }} />
          {t.nav_team}
        </Link>

        <Link href="/analytics" style={startsWith("/analytics") ? ACTIVE : BASE}>
          <IconChartBar size={16} style={{ flexShrink: 0 }} />
          {t.nav_analytics}
        </Link>

        <Link href="/settings" style={startsWith("/settings") ? ACTIVE : BASE}>
          <IconSettings size={16} style={{ flexShrink: 0 }} />
          {t.nav_settings}
        </Link>
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "0.5px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Lang toggle */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              background: "var(--bg-card)",
              border: "0.5px solid var(--border)",
              borderRadius: 20,
              padding: 2,
            }}
          >
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "none",
                  background: lang === l ? "var(--accent)" : "transparent",
                  color: lang === l ? "#fff" : "var(--text-3)",
                  transition: "all 150ms",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              letterSpacing: "0.3px",
            }}
          >
            {initials(userName || "?")}
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-1)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.3,
              }}
            >
              {userName || "Admin"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.3,
              }}
            >
              {userRole || "Super Admin"}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            borderRadius: 7,
            border: "none",
            background: "transparent",
            color: "var(--danger)",
            fontSize: 13,
            cursor: "pointer",
            transition: "background 120ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <IconLogout size={15} style={{ flexShrink: 0 }} />
          {t.action_logout}
        </button>
      </div>
    </aside>
  );
}

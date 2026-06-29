"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  IconLayoutDashboard,
  IconShoppingCart,
  IconPackage,
  IconWorld,
  IconTruckDelivery,
  IconMapPin,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconChevronDown,
  IconLogout,
} from "@tabler/icons-react";
import fr from "@/i18n/fr.json";
import en from "@/i18n/en.json";
import { supplierLabels, type ConnectableSupplier } from "@/lib/suppliers";
import { Logo } from "@/components/brand/logo";
import { useSidebar } from "@/components/layout/sidebar-context";

type Translations = typeof fr;

type SidebarProps = {
  userName: string;
  userRole: string;
  supplierStatus: Record<ConnectableSupplier, boolean>;
};

const orderFilters = [
  { href: "/orders", key: "ordersAll" },
  { href: "/orders?status=PENDING", key: "ordersPending" },
  { href: "/orders?status=SHIPPED", key: "ordersShipped" },
  { href: "/orders?status=CANCELLED", key: "ordersCancelled" },
  { href: "/orders?status=REFUNDED", key: "ordersRefunded" },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({ userName, userRole, supplierStatus }: SidebarProps) {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [ordersOpen, setOrdersOpen] = useState(pathname.startsWith("/orders"));
  const [suppliersOpen, setSuppliersOpen] = useState(pathname.startsWith("/suppliers"));
  const t: Translations = lang === "fr" ? fr : en;

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[100] flex flex-col border-r-[0.5px] transition-transform duration-150 ease md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "var(--sidebar-width)",
          height: "100vh",
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="logo-wrap">
          <Logo size={36} showSubtext />
        </div>

        <div style={{ margin: "8px 0", borderTop: "0.5px solid var(--border)" }} />

        <nav className="flex-1 overflow-y-auto" style={{ padding: "12px 10px" }}>
          <Link href="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
            <IconLayoutDashboard className="icon" />
            {t.dashboard}
          </Link>

          <button
            onClick={() => setOrdersOpen(!ordersOpen)}
            className={`nav-item w-full justify-between ${pathname.startsWith("/orders") ? "active" : ""}`}
          >
            <span className="flex items-center gap-[10px]">
              <IconShoppingCart className="icon" />
              {t.orders}
            </span>
            <IconChevronDown size={14} className={`transition-transform duration-150 ${ordersOpen ? "rotate-180" : ""}`} />
          </button>
          {ordersOpen &&
            orderFilters.map((f) => (
              <Link key={f.href} href={f.href} className="nav-sub-item block">
                {t[f.key]}
              </Link>
            ))}

          <Link href="/products" className={`nav-item ${isActive("/products") ? "active" : ""}`}>
            <IconPackage className="icon" />
            {t.products}
          </Link>

          <Link href="/stores" className={`nav-item ${isActive("/stores") ? "active" : ""}`}>
            <IconWorld className="icon" />
            {t.stores}
          </Link>

          <button
            onClick={() => setSuppliersOpen(!suppliersOpen)}
            className={`nav-item w-full justify-between ${pathname.startsWith("/suppliers") ? "active" : ""}`}
          >
            <span className="flex items-center gap-[10px]">
              <IconTruckDelivery className="icon" />
              {t.suppliers}
            </span>
            <IconChevronDown size={14} className={`transition-transform duration-150 ${suppliersOpen ? "rotate-180" : ""}`} />
          </button>
          {suppliersOpen &&
            Object.entries(supplierLabels).map(([key, label]) => {
              const connected = supplierStatus[key as ConnectableSupplier];
              return (
                <Link
                  key={key}
                  href={`/suppliers/${key.toLowerCase().replace("_dropshipping", "")}`}
                  className="nav-sub-item flex items-center justify-between"
                >
                  <span>{label}</span>
                  <span className={`status-dot ${connected ? "connected" : "error"}`} />
                </Link>
              );
            })}

          <Link href="/tracking" className={`nav-item ${isActive("/tracking") ? "active" : ""}`}>
            <IconMapPin className="icon" />
            {t.tracking}
          </Link>

          <Link href="/team" className={`nav-item ${isActive("/team") ? "active" : ""}`}>
            <IconUsers className="icon" />
            {t.team}
          </Link>

          <Link href="/analytics" className={`nav-item ${isActive("/analytics") ? "active" : ""}`}>
            <IconChartBar className="icon" />
            {t.analytics}
          </Link>

          <Link href="/settings" className={`nav-item ${isActive("/settings") ? "active" : ""}`}>
            <IconSettings className="icon" />
            {t.settings}
          </Link>
        </nav>

        <div style={{ borderTop: "0.5px solid var(--border)", padding: "16px" }} className="space-y-3">
          <div className="lang-toggle">
            <button onClick={() => setLang("fr")} className={`lang-btn ${lang === "fr" ? "active" : ""}`}>
              FR
            </button>
            <button onClick={() => setLang("en")} className={`lang-btn ${lang === "en" ? "active" : ""}`}>
              EN
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white"
              style={{ background: "var(--accent-gradient)" }}
            >
              {initials(userName || "?")}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                {userName}
              </p>
              <p className="truncate text-[11px]" style={{ color: "var(--text-3)" }}>
                {userRole}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn btn-ghost w-full justify-start"
            style={{ color: "var(--danger)" }}
          >
            <IconLogout size={14} />
            {t.logout}
          </button>
        </div>
      </aside>
    </>
  );
}

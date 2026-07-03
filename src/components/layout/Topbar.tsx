"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  IconBell, IconChevronDown, IconSun, IconMoon,
  IconUser, IconSettings, IconLogout, IconSearch,
  IconShoppingCart, IconWorld, IconPackage,
  IconLayoutDashboard, IconTruckDelivery, IconMapPin,
  IconUsers, IconChartBar, IconArrowRight,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/contexts/lang-context";

/* ─── Page metadata ─── */
type PageMeta = { icon: React.ReactElement; color: string; bg: string };

const PAGE_META: { prefix: string; meta: PageMeta }[] = [
  { prefix: "/orders",    meta: { icon: <IconShoppingCart  size={18} />, color: "var(--info)",    bg: "var(--info-bg)"    } },
  { prefix: "/products",  meta: { icon: <IconPackage       size={18} />, color: "var(--success)", bg: "var(--success-bg)" } },
  { prefix: "/stores",    meta: { icon: <IconWorld         size={18} />, color: "var(--purple)",  bg: "var(--purple-bg)"  } },
  { prefix: "/suppliers", meta: { icon: <IconTruckDelivery size={18} />, color: "var(--warning)", bg: "var(--warning-bg)" } },
  { prefix: "/tracking",  meta: { icon: <IconMapPin        size={18} />, color: "var(--info)",    bg: "var(--info-bg)"    } },
  { prefix: "/team",      meta: { icon: <IconUsers         size={18} />, color: "var(--success)", bg: "var(--success-bg)" } },
  { prefix: "/analytics", meta: { icon: <IconChartBar      size={18} />, color: "var(--purple)",  bg: "var(--purple-bg)"  } },
  { prefix: "/settings",  meta: { icon: <IconSettings      size={18} />, color: "var(--text-2)",  bg: "var(--bg-hover)"   } },
];

const DEFAULT_META: PageMeta = {
  icon: <IconLayoutDashboard size={18} />,
  color: "var(--accent-light)",
  bg: "rgba(99,102,241,0.14)",
};

function getPageMeta(pathname: string): PageMeta {
  return PAGE_META.find((p) => pathname.startsWith(p.prefix))?.meta ?? DEFAULT_META;
}

/* ─── Search modal data ─── */
type SearchItem = { id: string; icon: React.ReactNode; title: string; subtitle?: string; href: string };

const QUICK_NAV: SearchItem[] = [
  { id: "n1", icon: <IconLayoutDashboard size={15} />, title: "Tableau de bord", href: "/" },
  { id: "n2", icon: <IconShoppingCart    size={15} />, title: "Commandes",       href: "/orders" },
  { id: "n3", icon: <IconPackage         size={15} />, title: "Produits",        href: "/products" },
  { id: "n4", icon: <IconWorld           size={15} />, title: "Boutiques",       href: "/stores" },
  { id: "n5", icon: <IconTruckDelivery   size={15} />, title: "Fournisseurs",    href: "/suppliers" },
  { id: "n6", icon: <IconMapPin          size={15} />, title: "Tracking",        href: "/tracking" },
  { id: "n7", icon: <IconUsers           size={15} />, title: "Équipe",          href: "/team" },
  { id: "n8", icon: <IconChartBar        size={15} />, title: "Analytique",      href: "/analytics" },
  { id: "n9", icon: <IconSettings        size={15} />, title: "Paramètres",      href: "/settings" },
];

const MOCK_ORDERS: SearchItem[] = [
  { id: "o1", icon: <IconShoppingCart size={15} />, title: "DEMO-1001", subtitle: "Jean Dupont · 94,99 $",   href: "/orders" },
  { id: "o2", icon: <IconShoppingCart size={15} />, title: "DEMO-1002", subtitle: "Marie Martin · 149,00 $", href: "/orders" },
  { id: "o3", icon: <IconShoppingCart size={15} />, title: "DEMO-1003", subtitle: "Paul Bernard · 67,50 $",  href: "/orders" },
];

const MOCK_STORES: SearchItem[] = [
  { id: "s1", icon: <IconWorld size={15} />, title: "Tech Store",    subtitle: "techstore.com · Actif",    href: "/stores" },
  { id: "s2", icon: <IconWorld size={15} />, title: "Mode Express",  subtitle: "modeexpress.com · Actif",  href: "/stores" },
];

const MOCK_NOTIFS = [
  { id: "1", message: "Nouvelle commande DEMO-1003", time: "il y a 5 min", read: false },
  { id: "2", message: "Boutique «Tech Store» activée", time: "il y a 1 h",  read: false },
  { id: "3", message: "CJ Dropshipping synchronisé",  time: "il y a 3 h",  read: true },
];

/* ─── SearchModal ─── */
function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const allItems = [...MOCK_ORDERS, ...MOCK_STORES, ...QUICK_NAV];
  const filtered = query.trim()
    ? allItems.filter(
        (i) =>
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          (i.subtitle?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : [];

  const groups = query.trim()
    ? [{ label: "Résultats", items: filtered }]
    : [
        { label: "Commandes récentes", items: MOCK_ORDERS },
        { label: "Boutiques",          items: MOCK_STORES },
        { label: "Navigation rapide",  items: QUICK_NAV  },
      ];

  const flatItems = groups.flatMap((g) => g.items);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelectedIdx(0); }, [query]);

  const navigate = useCallback((item: SearchItem) => { router.push(item.href); onClose(); }, [router, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")    { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, flatItems.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && flatItems[selectedIdx]) navigate(flatItems[selectedIdx]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flatItems, selectedIdx, navigate, onClose]);

  let gIdx = 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 120 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 14, width: 560, maxWidth: "calc(100vw - 32px)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "0.5px solid var(--border)" }}>
          <IconSearch size={18} style={{ color: "var(--text-3)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher commandes, produits, boutiques..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "var(--text-1)", fontFamily: "inherit" }}
          />
          <kbd onClick={onClose} style={{ background: "var(--bg-hover)", border: "0.5px solid var(--border)", borderRadius: 4, padding: "2px 7px", fontSize: 11, color: "var(--text-3)", fontFamily: "inherit", cursor: "pointer", flexShrink: 0 }}>Esc</kbd>
        </div>
        <div style={{ padding: 8, maxHeight: 400, overflowY: "auto" }}>
          {groups.map((group) => {
            if (!group.items.length) return null;
            return (
              <div key={group.label}>
                <p style={{ fontSize: 11, color: "var(--text-3)", padding: "8px 12px 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{group.label}</p>
                {group.items.map((item) => {
                  const idx = gIdx++;
                  const sel = idx === selectedIdx;
                  return (
                    <div key={item.id} onClick={() => navigate(item)} onMouseEnter={() => setSelectedIdx(idx)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: sel ? "var(--bg-hover)" : "transparent", transition: "background 80ms" }}>
                      <span style={{ color: "var(--text-3)", flexShrink: 0, display: "flex" }}>{item.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.3 }}>{item.title}</p>
                        {item.subtitle && <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{item.subtitle}</p>}
                      </div>
                      <IconArrowRight size={14} style={{ color: sel ? "var(--text-2)" : "transparent", flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            );
          })}
          {query.trim() && !filtered.length && (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "24px 0" }}>Aucun résultat pour «{query}»</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 16, padding: "10px 20px", borderTop: "0.5px solid var(--border)", background: "var(--bg-card)" }}>
          {[{ key: "↑↓", label: "naviguer" }, { key: "↵", label: "ouvrir" }, { key: "Esc", label: "fermer" }].map(({ key, label }) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
              <kbd style={{ background: "var(--bg-hover)", border: "0.5px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontSize: 11, fontFamily: "inherit", color: "var(--text-3)" }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Topbar ─── */
export function Topbar({
  userName,
  userInitials,
  userRole,
  userEmail,
}: {
  userName: string;
  userInitials: string;
  userRole?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isLight, setIsLight] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const [dateStr, setDateStr] = useState("");
  const adminRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const navTitles = [
    { prefix: "/orders",    label: t.nav_orders    },
    { prefix: "/products",  label: t.nav_products  },
    { prefix: "/stores",    label: t.nav_stores     },
    { prefix: "/suppliers", label: t.nav_suppliers  },
    { prefix: "/tracking",  label: t.nav_tracking   },
    { prefix: "/team",      label: t.nav_team       },
    { prefix: "/analytics", label: t.nav_analytics  },
    { prefix: "/settings",  label: t.nav_settings   },
  ];

  function pageTitle(p: string) {
    if (p === "/") return t.nav_dashboard;
    return navTitles.find((x) => p.startsWith(x.prefix))?.label ?? "VNK Hub";
  }

  const meta = getPageMeta(pathname);

  /* Date — client-only to avoid hydration mismatch */
  useEffect(() => {
    const d = new Date();
    const locale = "fr-CA";
    const formatted = d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    setDateStr(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setShowAdmin(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("vnkhub-theme", next ? "light" : "dark");
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  const iconBtn: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 8, border: "none",
    background: "transparent", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-2)", transition: "background 150ms",
    position: "relative", flexShrink: 0,
  };

  const panelStyle: React.CSSProperties = {
    position: "absolute", top: 48, right: 0,
    background: "var(--bg-surface)", border: "0.5px solid var(--border)",
    borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 200,
  };

  return (
    <>
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}

      <header
        style={{
          height: 56,
          background: "var(--bg-surface)",
          borderBottom: "0.5px solid var(--border)",
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
          gap: 16,
        }}
      >
        {/* ── LEFT : icon + title + date ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
          {/* Colored page icon */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: meta.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: meta.color,
              flexShrink: 0,
              transition: "background 200ms, color 200ms",
            }}
          >
            {meta.icon}
          </div>

          {/* Title + date */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-1)",
                letterSpacing: "-0.25px",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {pageTitle(pathname)}
            </div>
            {dateStr && (
              <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.3, marginTop: 1 }}>
                {dateStr}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>

          {/* Search trigger */}
          <button
            onClick={() => setShowSearch(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 12px",
              height: 32,
              marginRight: 8,
              background: "var(--bg-base)",
              border: "0.5px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-3)",
              fontSize: 12.5,
              cursor: "pointer",
              transition: "border-color 150ms, background 150ms",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-base)"; }}
          >
            <IconSearch size={13} style={{ flexShrink: 0 }} />
            <span>Rechercher...</span>
            <kbd style={{ marginLeft: 6, background: "var(--bg-hover)", border: "0.5px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontSize: 10.5, color: "var(--text-3)", fontFamily: "inherit" }}>⌘K</kbd>
          </button>

          {/* Theme */}
          <button onClick={toggleTheme} style={iconBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Thème">
            {isLight ? <IconMoon size={18} /> : <IconSun size={18} />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => { setShowNotifs((v) => !v); setShowAdmin(false); }}
              style={iconBtn}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              aria-label="Notifications"
            >
              <IconBell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: "var(--danger)", borderRadius: "50%", border: "1.5px solid var(--bg-surface)" }} />
              )}
            </button>

            {showNotifs && (
              <div style={{ ...panelStyle, width: 320, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: "0.5px solid var(--border)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Notifications</span>
                  <button onClick={() => setNotifs((p) => p.map((n) => ({ ...n, read: true })))}
                    style={{ fontSize: 11, color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer" }}>
                    Tout marquer lu
                  </button>
                </div>
                <div style={{ padding: 4 }}>
                  {notifs.map((n) => (
                    <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8, background: n.read ? "transparent" : "rgba(99,102,241,0.06)", cursor: "pointer", transition: "background 120ms" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : "rgba(99,102,241,0.06)")}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginTop: 4, background: n.read ? "transparent" : "var(--accent)" }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, color: "var(--text-1)", lineHeight: 1.45 }}>{n.message}</p>
                        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 16px", borderTop: "0.5px solid var(--border)", textAlign: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--accent-light)", cursor: "pointer" }}>Voir toutes les notifications</span>
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 8px" }} />

          {/* User */}
          <div ref={adminRef} style={{ position: "relative" }}>
            <button
              onClick={() => { setShowAdmin((v) => !v); setShowNotifs(false); }}
              style={{ display: "flex", alignItems: "center", gap: 9, height: 36, padding: "0 10px", borderRadius: 9, border: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Avatar with glow ring */}
              <div
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg,#3B82F6,#6366F1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                  boxShadow: "0 0 0 2px var(--bg-surface), 0 0 0 3.5px rgba(99,102,241,0.45)",
                }}
              >
                {userInitials}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, textAlign: "left" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", lineHeight: 1.25, whiteSpace: "nowrap" }}>{userName || "Admin"}</span>
                <span style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.25, whiteSpace: "nowrap" }}>{userRole || "Super Admin"}</span>
              </div>
              <IconChevronDown size={13} style={{ color: "var(--text-3)", transition: "transform 150ms", transform: showAdmin ? "rotate(180deg)" : "none", flexShrink: 0 }} />
            </button>

            {showAdmin && (
              <div style={{ ...panelStyle, minWidth: 220, padding: 8 }}>
                {/* Header */}
                <div style={{ padding: "10px 12px 13px", borderBottom: "0.5px solid var(--border)", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#3B82F6,#6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: "0 0 0 2px var(--bg-surface), 0 0 0 3.5px rgba(99,102,241,0.45)" }}>
                      {userInitials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.3 }}>{userName}</div>
                      {userEmail && <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.3, marginTop: 1 }}>{userEmail}</div>}
                      {userRole && (
                        <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.14)", color: "var(--accent-light)", fontWeight: 500, letterSpacing: "0.02em" }}>
                          {userRole}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {[
                  { href: "/settings#profile", icon: <IconUser size={14} />, label: "Mon profil" },
                  { href: "/settings",         icon: <IconSettings size={14} />, label: "Paramètres" },
                ].map(({ href, icon, label }) => (
                  <Link key={href} href={href} onClick={() => setShowAdmin(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, fontSize: 13, color: "var(--text-2)", textDecoration: "none", transition: "background 120ms" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ color: "var(--text-3)", display: "flex" }}>{icon}</span>
                    {label}
                  </Link>
                ))}

                <div style={{ borderTop: "0.5px solid var(--border)", margin: "4px 0" }} />

                <button
                  onClick={() => { setShowAdmin(false); signOut({ callbackUrl: "/login" }); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 7, border: "none", background: "transparent", fontSize: 13, color: "var(--danger)", cursor: "pointer", transition: "background 120ms", textAlign: "left" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <IconLogout size={14} style={{ flexShrink: 0 }} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

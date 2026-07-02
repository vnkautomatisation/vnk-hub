"use client";

import { usePathname } from "next/navigation";
import {
  IconBell, IconChevronDown, IconSun, IconMoon,
  IconUser, IconSettings, IconLogout, IconSearch,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/contexts/lang-context";

const MOCK_NOTIFS = [
  { id: "1", message: "Nouvelle commande DEMO-1003", time: "il y a 5 min", read: false },
  { id: "2", message: "Boutique «Tech Store» activée", time: "il y a 1 h", read: false },
  { id: "3", message: "CJ Dropshipping synchronisé", time: "il y a 3 h", read: true },
];

const panelStyle = {
  position: "absolute" as const,
  top: 48,
  background: "var(--bg-surface)",
  border: "0.5px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
  zIndex: 200,
};

const iconBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "var(--text-2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 150ms",
  position: "relative",
  flexShrink: 0,
};

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
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const adminRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const titles: { prefix: string; label: string }[] = [
    { prefix: "/orders", label: t.nav_orders },
    { prefix: "/products", label: t.nav_products },
    { prefix: "/stores", label: t.nav_stores },
    { prefix: "/suppliers", label: t.nav_suppliers },
    { prefix: "/tracking", label: t.nav_tracking },
    { prefix: "/team", label: t.nav_team },
    { prefix: "/analytics", label: t.nav_analytics },
    { prefix: "/settings", label: t.nav_settings },
  ];

  function pageTitle(p: string) {
    if (p === "/") return t.nav_dashboard;
    return titles.find((x) => p.startsWith(x.prefix))?.label ?? "VNK Hub";
  }

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
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

  return (
    <header
      className="flex shrink-0 items-center gap-4 border-b-[0.5px]"
      style={{
        height: "var(--topbar-height)",
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left — page title */}
      <div style={{ minWidth: 0, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-1)",
            letterSpacing: "-0.2px",
            whiteSpace: "nowrap",
          }}
        >
          {pageTitle(pathname)}
        </span>
      </div>

      {/* Center — search */}
      <div style={{ flex: 1, maxWidth: 420 }}>
        <div
          className="flex items-center gap-2"
          style={{
            height: 34,
            background: "var(--bg-base)",
            border: "0.5px solid var(--border)",
            borderRadius: 8,
            padding: "0 12px",
            cursor: "text",
            transition: "border-color 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <IconSearch size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--text-3)", flex: 1, userSelect: "none" }}>
            Rechercher...
          </span>
          <kbd
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              background: "var(--bg-surface)",
              border: "0.5px solid var(--border)",
              borderRadius: 4,
              padding: "1px 5px",
              fontFamily: "inherit",
              lineHeight: 1.6,
              flexShrink: 0,
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-0.5" style={{ marginLeft: "auto", flexShrink: 0 }}>

        {/* Theme */}
        <button onClick={toggleTheme} style={iconBtn} className="hover:bg-[var(--bg-hover)]" aria-label="Thème">
          {isLight ? <IconMoon size={17} /> : <IconSun size={17} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setShowNotifs((v) => !v); setShowAdmin(false); }}
            style={iconBtn}
            className="hover:bg-[var(--bg-hover)]"
            aria-label="Notifications"
          >
            <IconBell size={17} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 7, right: 7,
                width: 7, height: 7,
                background: "var(--danger)", borderRadius: "50%",
                border: "1.5px solid var(--bg-surface)",
              }} />
            )}
          </button>

          {showNotifs && (
            <div style={{ ...panelStyle, right: 0, width: 320, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: "0.5px solid var(--border)" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Notifications</span>
                <button
                  onClick={() => setNotifs((p) => p.map((n) => ({ ...n, read: true })))}
                  style={{ fontSize: 11, color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Tout marquer lu
                </button>
              </div>
              <div style={{ padding: 4 }}>
                {notifs.map((n) => (
                  <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`}>
                    {!n.read ? <div className="notif-dot" /> : <div style={{ width: 7, height: 7, flexShrink: 0 }} />}
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
        <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 8px" }} />

        {/* User */}
        <div ref={adminRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setShowAdmin((v) => !v); setShowNotifs(false); }}
            className="flex items-center gap-2 hover:bg-[var(--bg-hover)]"
            style={{ height: 34, padding: "0 8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--accent-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
              letterSpacing: "0.3px",
            }}>
              {userInitials}
            </div>
            <div className="hidden text-left sm:block" style={{ maxWidth: 120 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
              {userRole && <div style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.2 }}>{userRole}</div>}
            </div>
            <IconChevronDown size={13} style={{ color: "var(--text-3)", transition: "transform 150ms", transform: showAdmin ? "rotate(180deg)" : "none" }} />
          </button>

          {showAdmin && (
            <div style={{ ...panelStyle, right: 0, minWidth: 210, padding: 8 }}>
              <div style={{ padding: "8px 12px 12px", borderBottom: "0.5px solid var(--border)", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--accent-gradient)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {userInitials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
                  {userEmail && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{userEmail}</div>}
                  {userRole && <span className="badge badge-purple" style={{ fontSize: 10, marginTop: 4, display: "inline-block" }}>{userRole}</span>}
                </div>
              </div>

              <Link href="/settings#profile" className="dropdown-item" onClick={() => setShowAdmin(false)}>
                <IconUser size={14} /> Mon profil
              </Link>
              <Link href="/settings" className="dropdown-item" onClick={() => setShowAdmin(false)}>
                <IconSettings size={14} /> Paramètres
              </Link>

              <div style={{ borderTop: "0.5px solid var(--border)", margin: "4px 0" }} />

              <button
                className="dropdown-item"
                style={{ color: "var(--danger)" }}
                onClick={() => { setShowAdmin(false); signOut({ callbackUrl: "/login" }); }}
              >
                <IconLogout size={14} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

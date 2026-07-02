"use client";

import { usePathname } from "next/navigation";
import { IconBell, IconChevronDown, IconSun, IconMoon, IconUser, IconSettings, IconLogout } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

const titles: { prefix: string; label: string }[] = [
  { prefix: "/orders", label: "Commandes" },
  { prefix: "/products", label: "Produits" },
  { prefix: "/stores", label: "Boutiques" },
  { prefix: "/suppliers", label: "Fournisseurs" },
  { prefix: "/tracking", label: "Tracking" },
  { prefix: "/team", label: "Équipe" },
  { prefix: "/analytics", label: "Analytique" },
  { prefix: "/settings", label: "Paramètres" },
];

function pageTitle(pathname: string) {
  if (pathname === "/") return "Tableau de bord";
  const match = titles.find((t) => pathname.startsWith(t.prefix));
  return match?.label ?? "VNK Hub";
}

const MOCK_NOTIFS = [
  { id: "1", message: "Nouvelle commande DEMO-1003", time: "il y a 5 minutes", read: false },
  { id: "2", message: "Boutique «Tech Store» activée", time: "il y a 1 heure", read: false },
  { id: "3", message: "CJ Dropshipping synchronisé", time: "il y a 3 heures", read: true },
];

const panelStyle = {
  position: "absolute" as const,
  top: 52,
  background: "var(--bg-surface)",
  border: "0.5px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  zIndex: 200,
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
  const [isLight, setIsLight] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const adminRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  const iconBtnStyle: React.CSSProperties = {
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
  };

  return (
    <header
      className="flex shrink-0 items-center justify-between border-b-[0.5px]"
      style={{
        height: "var(--topbar-height)",
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left — breadcrumb + title */}
      <div className="flex items-center gap-3">
        <div>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>
            VNKHub / {pageTitle(pathname)}
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-1)", letterSpacing: "-0.3px", margin: 0, lineHeight: 1 }}>
            {pageTitle(pathname)}
          </h1>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={iconBtnStyle}
          className="hover:bg-[var(--bg-hover)]"
          aria-label="Basculer le thème"
        >
          {isLight ? <IconMoon size={18} /> : <IconSun size={18} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setShowNotifs((v) => !v); setShowAdmin(false); }}
            style={iconBtnStyle}
            className="hover:bg-[var(--bg-hover)]"
            aria-label="Notifications"
          >
            <IconBell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  background: "var(--danger)",
                  borderRadius: "50%",
                  border: "2px solid var(--bg-surface)",
                }}
              />
            )}
          </button>

          {showNotifs && (
            <div style={{ ...panelStyle, right: 0, width: 320, overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderBottom: "0.5px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>Notifications</span>
                <button
                  onClick={markAllRead}
                  style={{ fontSize: 11, color: "var(--accent-light)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Tout marquer lu
                </button>
              </div>
              <div style={{ padding: 4 }}>
                {notifs.map((n) => (
                  <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`}>
                    {!n.read ? <div className="notif-dot" /> : <div style={{ width: 8, height: 8, flexShrink: 0 }} />}
                    <div>
                      <p style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.4 }}>{n.message}</p>
                      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 16px", borderTop: "0.5px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontSize: 12, color: "var(--accent-light)", cursor: "pointer" }}>
                  Voir toutes les notifications
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 6px" }} />

        {/* Admin dropdown */}
        <div ref={adminRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setShowAdmin((v) => !v); setShowNotifs(false); }}
            className="flex items-center gap-2 hover:bg-[var(--bg-hover)]"
            style={{ padding: "4px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {userInitials}
            </div>
            <div className="hidden text-left sm:block">
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", lineHeight: 1.2 }}>{userName}</div>
              {userRole && <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.2 }}>{userRole}</div>}
            </div>
            <IconChevronDown
              size={14}
              style={{ color: "var(--text-3)", transition: "transform 150ms", transform: showAdmin ? "rotate(180deg)" : "none" }}
            />
          </button>

          {showAdmin && (
            <div style={{ ...panelStyle, right: 0, minWidth: 200, padding: 8 }}>
              {/* Profile header */}
              <div
                style={{
                  padding: "8px 12px 12px",
                  borderBottom: "0.5px solid var(--border)",
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--accent-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {userInitials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{userName}</div>
                  {userEmail && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{userEmail}</div>}
                  {userRole && (
                    <span className="badge badge-purple" style={{ fontSize: 10, marginTop: 3, display: "inline-block" }}>
                      {userRole}
                    </span>
                  )}
                </div>
              </div>

              <Link href="/settings#profile" className="dropdown-item" onClick={() => setShowAdmin(false)}>
                <IconUser size={15} />
                Mon profil
              </Link>
              <Link href="/settings" className="dropdown-item" onClick={() => setShowAdmin(false)}>
                <IconSettings size={15} />
                Paramètres
              </Link>

              <div style={{ borderTop: "0.5px solid var(--border)", margin: "4px 0" }} />

              <button
                className="dropdown-item"
                style={{ color: "var(--danger)" }}
                onClick={() => { setShowAdmin(false); signOut({ callbackUrl: "/login" }); }}
              >
                <IconLogout size={15} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

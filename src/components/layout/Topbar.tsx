"use client";

import { usePathname } from "next/navigation";
import { IconMenu2, IconBell, IconChevronDown, IconSun, IconMoon } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useSidebar } from "@/components/layout/sidebar-context";

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

export function Topbar({ userName, userInitials, userRole }: { userName: string; userInitials: string; userRole?: string }) {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const notificationCount = 0;
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("vnkhub-theme", next ? "light" : "dark");
  }

  const iconButtonStyle = {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "var(--text-2)",
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
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center rounded-lg md:hidden"
          style={iconButtonStyle}
          aria-label="Ouvrir le menu"
        >
          <IconMenu2 size={18} />
        </button>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>
            VNKHub / {pageTitle(pathname)}
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-1)", letterSpacing: "-0.3px", margin: 0, lineHeight: 1 }}>
            {pageTitle(pathname)}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center transition-colors duration-150 hover:bg-[var(--bg-hover)]"
          style={iconButtonStyle}
          aria-label="Basculer le thème clair/sombre"
        >
          {isLight ? <IconMoon size={18} /> : <IconSun size={18} />}
        </button>

        <button
          className="relative flex items-center justify-center transition-colors duration-150 hover:bg-[var(--bg-hover)]"
          style={iconButtonStyle}
          aria-label="Notifications"
        >
          <IconBell size={18} />
          {notificationCount > 0 && (
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

        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 6px" }} />

        <button
          className="flex items-center gap-2 transition-colors duration-150 hover:bg-[var(--bg-hover)]"
          style={{ padding: "4px 10px", borderRadius: 8, border: "none", background: "transparent" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: "var(--accent-gradient)", fontSize: 13, fontWeight: 600 }}
          >
            {userInitials}
          </div>
          <div className="hidden text-left sm:block">
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", lineHeight: 1.2 }}>{userName}</div>
            {userRole && <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.2 }}>{userRole}</div>}
          </div>
          <IconChevronDown size={14} style={{ color: "var(--text-3)" }} />
        </button>
      </div>
    </header>
  );
}

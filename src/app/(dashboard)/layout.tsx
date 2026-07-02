import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/ui/toast";
import { LangProvider } from "@/contexts/lang-context";
import { getLang } from "@/lib/i18n";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ConnectableSupplier } from "@/lib/suppliers";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const connections = await prisma.supplierConnection.findMany();
  const lang = getLang();

  const supplierStatus = connections.reduce(
    (acc, c) => ({ ...acc, [c.supplier]: c.connected }),
    {} as Record<ConnectableSupplier, boolean>
  );

  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const userRole = (session?.user as { role?: string })?.role ?? "";

  return (
    <LangProvider initial={lang}>
      <ToastProvider>
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
          <Sidebar userName={userName} userRole={userRole} supplierStatus={supplierStatus} />
          <div
            className="min-w-0"
            style={{
              flex: 1,
              marginLeft: "var(--sidebar-width)",
              display: "flex",
              flexDirection: "column",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <Topbar userName={userName} userInitials={initials(userName || "?")} userRole={userRole} userEmail={userEmail} />
            <main className="page-fade" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </LangProvider>
  );
}

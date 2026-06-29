import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ToastProvider } from "@/components/ui/toast";
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

  const supplierStatus = connections.reduce(
    (acc, c) => ({ ...acc, [c.supplier]: c.connected }),
    {} as Record<ConnectableSupplier, boolean>
  );

  const userName = session?.user?.name ?? "";
  const userRole = (session?.user as { role?: string })?.role ?? "";

  return (
    <SidebarProvider>
      <ToastProvider>
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
          <Sidebar userName={userName} userRole={userRole} supplierStatus={supplierStatus} />
          <div
            className="min-w-0 md:ml-[224px]"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <Topbar userName={userName} userInitials={initials(userName || "?")} userRole={userRole} />
            <main className="page-fade" style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </SidebarProvider>
  );
}

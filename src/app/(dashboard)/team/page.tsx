import { prisma } from "@/lib/prisma";
import { InviteForm } from "@/components/team/invite-form";
import { MemberCard } from "@/components/team/member-card";
import { ActivityTimeline } from "@/components/team/activity-timeline";
import { getT } from "@/lib/i18n";

export default async function TeamPage() {
  const t = getT();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [users, logs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    }),
    prisma.activityLog.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const orderCounts = await prisma.order.groupBy({
    by: ["assignedToId"],
    where: { createdAt: { gte: startOfMonth }, assignedToId: { not: null } },
    _count: true,
  });
  const orderCountMap = new Map(orderCounts.map((o) => [o.assignedToId, o._count]));

  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
            {t.team_title}
          </h1>
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {activeCount} {t.team_active_members}
          </p>
        </div>
        <InviteForm />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <MemberCard
            key={user.id}
            member={{ ...user, ordersThisMonth: orderCountMap.get(user.id) ?? 0 }}
          />
        ))}
      </div>

      <ActivityTimeline logs={logs} members={users.map((u) => ({ id: u.id, name: u.name }))} />
    </div>
  );
}

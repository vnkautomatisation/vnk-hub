import type { OrderStatus } from "@prisma/client";

const statusClass: Record<OrderStatus, string> = {
  PENDING: "badge-warning",
  CONFIRMED: "badge-info",
  DISPATCHED_TO_SUPPLIER: "badge-info",
  SHIPPED: "badge-info",
  IN_TRANSIT: "badge-purple",
  DELIVERED: "badge-success",
  CANCELLED: "badge-danger",
  REFUNDED: "badge-danger",
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return <span className={`badge ${statusClass[status]}`}>{label}</span>;
}

export type BadgeTone = "default" | "success" | "warning" | "info" | "danger" | "purple";

const toneClass: Record<BadgeTone, string> = {
  default: "badge-neutral",
  success: "badge-success",
  warning: "badge-warning",
  info: "badge-info",
  danger: "badge-danger",
  purple: "badge-purple",
};

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return <span className={`badge ${toneClass[tone]}`}>{children}</span>;
}

import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: string | number; color?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
        gap: 12,
      }}
    >
      <Icon size={48} color="var(--text-3)" />
      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-2)" }}>{title}</p>
      {description && <p style={{ fontSize: 13, color: "var(--text-3)", maxWidth: 300 }}>{description}</p>}
      {action}
    </div>
  );
}

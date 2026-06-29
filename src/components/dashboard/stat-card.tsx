import { Card } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
  change,
  changeColor,
}: {
  icon: React.ComponentType<{ size?: string | number }>;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
  change?: string;
  changeColor?: string;
}) {
  return (
    <Card className="transition-[transform,border-color] duration-200 hover:-translate-y-px hover:border-[var(--border-strong)]">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="mb-1 truncate text-[12px]" style={{ color: "var(--text-2)" }}>
            {label}
          </p>
          <p className="text-[26px] font-semibold leading-tight" style={{ color: "var(--text-1)" }}>
            {value}
          </p>
        </div>
      </div>
      {change && (
        <p className="mt-2 text-[11px]" style={{ color: changeColor ?? "var(--success)" }}>
          {change}
        </p>
      )}
    </Card>
  );
}

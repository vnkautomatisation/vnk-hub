export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={{ borderRadius: "var(--radius-sm)", ...style }} />;
}

export function SkeletonRows({ rows = 5, height = 40 }: { rows?: number; height?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} style={{ height, width: "100%" }} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} style={{ height: 140, width: "100%" }} />
      ))}
    </div>
  );
}

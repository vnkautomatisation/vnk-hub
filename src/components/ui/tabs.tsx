"use client";

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1" style={{ borderBottom: "0.5px solid var(--border)" }}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="px-4 py-2.5 text-[13px] font-medium transition-colors duration-150"
            style={{
              color: isActive ? "var(--accent-light)" : "var(--text-2)",
              borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--text-1)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--text-2)";
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

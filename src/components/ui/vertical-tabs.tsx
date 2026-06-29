"use client";

import { useState } from "react";

export function VerticalTabs({
  tabs,
}: {
  tabs: { key: string; label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const activeTab = tabs.find((t) => t.key === active);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[180px_1fr]">
      <nav className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`nav-item w-full text-left ${tab.key === active ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div>{activeTab?.content}</div>
    </div>
  );
}

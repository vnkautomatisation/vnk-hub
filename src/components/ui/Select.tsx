"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minWidth?: number | string;
  className?: string;
}

export function Select({ options, value, onChange, placeholder = "Sélectionner…", minWidth, className = "" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  const triggerStyle: React.CSSProperties = {
    height: 36,
    padding: "0 12px",
    background: "var(--bg-card)",
    border: open ? "0.5px solid var(--accent)" : "0.5px solid var(--border)",
    borderRadius: 8,
    fontSize: 13,
    color: selected ? "var(--text-1)" : "var(--text-2)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    outline: "none",
    whiteSpace: "nowrap",
    boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
    minWidth: minWidth ?? "auto",
    transition: "border-color 150ms, box-shadow 150ms",
  };

  return (
    <div ref={ref} className={`relative ${className}`} style={{ minWidth: minWidth ?? "auto" }}>
      <button type="button" style={triggerStyle} onClick={() => setOpen((v) => !v)}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {selected ? selected.label : placeholder}
        </span>
        <IconChevronDown
          size={14}
          style={{ color: "var(--text-3)", flexShrink: 0, transition: "transform 150ms", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            background: "var(--bg-surface)",
            border: "0.5px solid var(--border)",
            borderRadius: 10,
            padding: 4,
            boxShadow: "var(--shadow-lg)",
            zIndex: 200,
            animation: "select-fade-in 150ms ease",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  color: isSelected ? "var(--accent-light)" : "var(--text-1)",
                  background: isSelected ? "var(--bg-active)" : "transparent",
                  fontWeight: isSelected ? 500 : 400,
                  cursor: "pointer",
                  border: "none",
                  textAlign: "left",
                  transition: "background 100ms, color 100ms",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"; } }}
                onMouseLeave={(e) => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; } }}
              >
                {opt.label}
                {isSelected && <IconCheck size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

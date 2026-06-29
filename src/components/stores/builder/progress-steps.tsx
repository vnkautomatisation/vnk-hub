"use client";

import { IconCheck } from "@tabler/icons-react";

export function ProgressSteps({
  steps,
  current,
  onJump,
  canJump,
}: {
  steps: string[];
  current: number;
  onJump: (step: number) => void;
  canJump: (step: number) => boolean;
}) {
  return (
    <div className="flex items-center" style={{ marginBottom: 32 }}>
      {steps.map((label, i) => {
        const step = i + 1;
        const isComplete = step < current;
        const isActive = step === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-initial">
            <button
              type="button"
              disabled={!canJump(step)}
              onClick={() => onJump(step)}
              className="flex flex-col items-center gap-1.5"
              style={{ opacity: canJump(step) ? 1 : 0.5 }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium"
                style={
                  isComplete
                    ? { background: "var(--success)", color: "white" }
                    : isActive
                      ? { background: "var(--accent)", color: "white", boxShadow: "0 0 12px rgba(99,102,241,0.4)" }
                      : { background: "var(--bg-card)", border: "0.5px solid var(--border)", color: "var(--text-3)" }
                }
              >
                {isComplete ? <IconCheck size={16} /> : step}
              </div>
              <span
                className="text-[11px]"
                style={{ color: isComplete ? "var(--success)" : isActive ? "var(--accent-light)" : "var(--text-3)" }}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                className="mx-2"
                style={{ flexGrow: 1, height: 1, background: isComplete ? "var(--success)" : "var(--border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title = "Êtes-vous sûr ?",
  description,
  confirmLabel = "Confirmer",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420, padding: 24, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "var(--warning-bg)", color: "var(--warning)" }}
        >
          <IconAlertTriangle size={24} />
        </div>
        <h2 className="modal-title mb-1">{title}</h2>
        <p className="mb-5 text-[13px]" style={{ color: "var(--text-2)" }}>
          {description}
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

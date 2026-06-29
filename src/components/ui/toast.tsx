"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { IconCheck, IconInfoCircle, IconAlertTriangle } from "@tabler/icons-react";

type ToastTone = "success" | "error" | "info" | "warning";

type Toast = { id: number; tone: ToastTone; message: string };

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClass: Record<ToastTone, string> = {
  success: "toast-success",
  error: "toast-error",
  info: "toast-info",
  warning: "toast-warning",
};

const toneIcon: Record<ToastTone, typeof IconCheck> = {
  success: IconCheck,
  error: IconAlertTriangle,
  info: IconInfoCircle,
  warning: IconAlertTriangle,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone];
          return (
            <div key={toast.id} className={`toast ${toneClass[toast.tone]}`}>
              <Icon size={16} />
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

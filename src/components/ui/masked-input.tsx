"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";

export function MaskedInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-group">
      <Input {...props} type={visible ? "text" : "password"} style={{ paddingRight: 36 }} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}
        aria-label={visible ? "Masquer" : "Afficher"}
      >
        {visible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </button>
    </div>
  );
}

import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${className}`} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`input ${className}`} />;
}

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  danger: "btn btn-danger",
  ghost: "btn btn-ghost",
  icon: "btn btn-icon btn-secondary",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`${variantClasses[variant]} ${className}`} {...props} />;
}

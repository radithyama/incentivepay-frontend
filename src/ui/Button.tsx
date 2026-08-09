import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ip-primary text-white hover:bg-ip-primary-hover disabled:bg-slate-300",
  secondary: "bg-white text-ip-text border border-ip-border hover:bg-slate-50 disabled:text-slate-400",
  danger: "bg-white text-ip-danger border border-red-200 hover:bg-ip-danger-light disabled:text-slate-400",
  ghost: "bg-transparent text-ip-text-muted hover:bg-slate-100 disabled:text-slate-300",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold
        transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}

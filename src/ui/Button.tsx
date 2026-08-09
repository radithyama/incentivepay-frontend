import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-ip-primary text-white shadow-sm hover:bg-ip-primary-hover active:bg-ip-primary-hover disabled:bg-slate-300 disabled:shadow-none",
  secondary:
    "bg-white text-ip-text border border-ip-border hover:bg-slate-50 active:bg-slate-100 disabled:bg-white disabled:text-slate-400",
  danger:
    "bg-white text-ip-danger border border-red-200 hover:bg-ip-danger-light active:bg-red-100 disabled:bg-white disabled:text-slate-400 disabled:border-ip-border",
  ghost: "bg-transparent text-ip-text-muted hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-300",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold
        transition-all duration-100 active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ip-primary/40 focus-visible:ring-offset-1
        disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}

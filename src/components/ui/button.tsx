import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

const variants = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  secondary: "border border-border bg-surface text-text hover:bg-surface-muted",
  danger: "border border-danger bg-surface text-danger hover:bg-surface-muted",
  ghost: "text-text hover:bg-surface-muted",
} as const;

export type ButtonVariant = keyof typeof variants;

export function buttonClass(variant: ButtonVariant = "primary", size: "sm" | "md" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    size === "sm" ? "px-2.5 py-1 text-sm" : "px-4 py-2 text-sm",
    variants[variant],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
  return <button type={type} className={cn(buttonClass(variant, size), className)} {...props} />;
}

import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

const variants = {
  primary: "bg-accent text-accent-foreground shadow-card hover:bg-accent-hover",
  /** Gold, for calls to action on green (inverse) sections */
  highlight: "bg-highlight font-semibold text-highlight-foreground shadow-card hover:brightness-105",
  secondary: "border border-border bg-surface text-text hover:bg-surface-muted",
  danger: "border border-danger bg-surface text-danger hover:bg-surface-muted",
  ghost: "text-text hover:bg-surface-muted",
} as const;

const sizes = {
  sm: "px-2.5 py-1 text-sm",
  md: "px-4 py-2 text-sm",
  /** Full-size storefront actions: Add to cart, Checkout */
  lg: "min-h-12 px-6 py-3 text-base font-semibold",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    sizes[size],
    variants[variant],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={cn(buttonClass(variant, size), className)} {...props} />;
}

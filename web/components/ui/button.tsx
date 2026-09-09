import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "border-ink bg-ink text-card hover:bg-ink/90",
  accent: "border-ink bg-accent text-white hover:bg-accent/90",
  ghost: "border-ink bg-card text-ink hover:bg-canvas",
  danger: "border-ink bg-danger text-white hover:bg-danger/90",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`control-button border-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

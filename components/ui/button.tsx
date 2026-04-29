import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";
  const variants = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
    secondary:
      "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
    ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
  };
  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}

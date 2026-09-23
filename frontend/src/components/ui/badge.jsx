import React from "react";
import { cn } from "../../lib/utils";

const VARIANTS = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-gray-100 text-gray-700 border-gray-300",
  default: "bg-secondary text-secondary-foreground border-transparent"
};

export function Badge({ className, variant = "default", children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        VARIANTS[variant] || VARIANTS.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

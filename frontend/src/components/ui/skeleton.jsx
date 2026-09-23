import React from "react";
import { cn } from "../../lib/utils";

// Pulsing placeholder block — replaces the ~10x duplicated
// "spinner + Loading X..." pattern with something that better communicates
// the shape of the content about to appear (better perceived performance).
export function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

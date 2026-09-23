import React from "react";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

// Reusable "nothing here" placeholder — replaces the ~10x duplicated
// "No X found" text-only blocks scattered across list pages.
export default function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", description, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
    >
      <div className="rounded-full bg-muted p-3 mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
    </motion.div>
  );
}

import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "bg-color": ["bg-background", "bg-foreground", "bg-card", "bg-popover", "bg-primary", "bg-secondary", "bg-muted", "bg-accent", "bg-destructive", "bg-sidebar"],
      "text-color": ["text-background", "text-foreground", "text-card", "text-popover", "text-primary", "text-secondary", "text-muted", "text-accent", "text-destructive", "text-sidebar"],
      "border-color": ["border-background", "border-foreground", "border-card", "border-popover", "border-primary", "border-secondary", "border-muted", "border-accent", "border-destructive", "border-sidebar"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}

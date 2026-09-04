import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary border-primary/20",
      success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      destructive: "bg-destructive/10 text-destructive border-destructive/20",
      secondary: "bg-secondary text-secondary-foreground border-transparent",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

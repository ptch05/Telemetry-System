import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        default:
          "border-primary/40 bg-primary/10 text-primary dark:border-primary/50 dark:bg-primary/15 dark:shadow-[0_0_12px_oklch(0.58_0.22_25/0.2)]",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive:
          "border-red-600/30 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400 dark:shadow-[0_0_12px_oklch(0.58_0.24_25/0.25)]",
        outline: "border-border bg-transparent text-foreground",
        success:
          "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:border-lime-400/40 dark:bg-lime-400/10 dark:text-lime-400 dark:shadow-[0_0_12px_oklch(0.78_0.19_145/0.2)]",
        warning:
          "border-amber-600/30 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-400",
        info: "border-sky-600/30 bg-sky-50 text-sky-800 dark:border-cyan-400/40 dark:bg-cyan-400/10 dark:text-cyan-400",
        muted: "border-border/60 bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulseDot?: boolean;
}

function Badge({
  className,
  variant,
  dot,
  pulseDot,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot ? (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full bg-current",
            pulseDot && "live-pulse",
          )}
        />
      ) : null}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };

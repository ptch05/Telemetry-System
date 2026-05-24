import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/status";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: Status;
  helper?: string;
}

const accentClass: Record<Status, string> = {
  ok: "metric-accent-ok",
  warn: "metric-accent-warn",
  fault: "metric-accent-fault",
  info: "metric-accent-info",
  idle: "metric-accent-idle",
};

const iconClass: Record<Status, string> = {
  ok: "text-emerald-600 dark:text-lime-400",
  warn: "text-amber-600 dark:text-amber-400",
  fault: "text-red-600 dark:text-red-400",
  info: "text-sky-600 dark:text-cyan-400",
  idle: "text-muted-foreground",
};

export function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  status = "info",
  helper,
}: MetricCardProps) {
  return (
    <article
      className={cn(
        "group surface-card relative overflow-hidden transition-all duration-200",
        "hover:border-border hover:shadow-[0_0_24px_var(--metric-glow)]",
        accentClass[status],
      )}
    >
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: "var(--metric-accent)",
          boxShadow: "0 0 12px var(--metric-glow)",
        }}
        aria-hidden
      />
      <div
        className="absolute right-0 top-0 h-px w-16 bg-linear-to-l from-metric-accent to-transparent opacity-60"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3 p-4 pl-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="telemetry-value text-2xl font-bold text-foreground sm:text-[1.75rem]">
              {value}
            </span>
            {unit ? (
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {unit}
              </span>
            ) : null}
          </div>
          {helper ? (
            <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
          ) : null}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border/60 bg-muted/50">
          <Icon
            className={cn("size-4", iconClass[status])}
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
      </div>
    </article>
  );
}

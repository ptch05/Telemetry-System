import { Progress } from "@/components/ui/progress";
import { progressIndicatorClass, type Status } from "@/lib/status";
import { cn } from "@/lib/utils";

interface GaugeBarProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  warnAt?: number;
  faultAt?: number;
}

export function GaugeBar({
  label,
  value,
  min = 0,
  max = 100,
  unit = "%",
  warnAt = 75,
  faultAt = 90,
}: GaugeBarProps) {
  const pct = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const status: Status =
    value >= faultAt ? "fault" : value >= warnAt ? "warn" : "ok";

  return (
    <article className={cn("surface-card p-4", `metric-accent-${status}`)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-bold tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <Progress
        value={pct}
        className="h-1.5"
        indicatorClassName={progressIndicatorClass(status)}
      />
    </article>
  );
}

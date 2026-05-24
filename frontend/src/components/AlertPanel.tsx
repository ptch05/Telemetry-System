import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertItem } from "@/lib/types";

function alertStyles(severity: AlertItem["severity"]) {
  if (severity === "fault") {
    return {
      box: "border-red-300 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/5 dark:text-red-300",
      bar: "bg-red-600 dark:bg-red-500 dark:shadow-[0_0_12px_oklch(0.62_0.24_25/0.5)]",
    };
  }
  if (severity === "warning") {
    return {
      box: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-200",
      bar: "bg-amber-500 dark:bg-amber-400 dark:shadow-[0_0_12px_oklch(0.8_0.16_85/0.4)]",
    };
  }
  return {
    box: "border-sky-300 bg-sky-50 text-sky-900 dark:border-cyan-500/25 dark:bg-cyan-500/5 dark:text-cyan-100",
    bar: "bg-sky-500 dark:bg-cyan-400 dark:shadow-[0_0_12px_oklch(0.72_0.14_220/0.35)]",
  };
}

export function AlertPanel({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {alerts.slice(0, 3).map((alert, index) => {
        const style = alertStyles(alert.severity);
        return (
          <div
            key={`${alert.label}-${index}`}
            className={cn(
              "relative flex gap-3 overflow-hidden rounded-lg border p-4",
              style.box,
            )}
          >
            <div
              className={cn("absolute inset-y-0 left-0 w-1", style.bar)}
              aria-hidden
            />
            <AlertTriangle className="relative mt-0.5 size-4 shrink-0 opacity-90" />
            <div className="relative min-w-0 pl-1">
              <p className="text-xs font-bold uppercase tracking-wider">
                {alert.label}
              </p>
              <p className="telemetry-value mt-1 text-[11px] leading-relaxed opacity-85">
                {alert.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

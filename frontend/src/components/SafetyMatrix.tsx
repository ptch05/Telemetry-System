import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SafetyState } from "@/lib/types";
import type { Status } from "@/lib/status";
import { StatusBadge } from "./StatusBadge";

function statusFor(value: string): Status {
  if (["OK", "CLOSED", "COMPLETE", "ON"].includes(value)) return "ok";
  if (["WARN", "READY"].includes(value)) return "warn";
  return "fault";
}

export function SafetyMatrix({ safety }: { safety: SafetyState }) {
  const rows = [
    ["AMS", safety.ams],
    ["IMD", safety.imd],
    ["Shutdown Circuit", safety.sdc],
    ["Precharge", safety.precharge],
    ["AIR+", safety.air_positive],
    ["AIR-", safety.air_negative],
    ["Ready To Drive", safety.rtd],
  ] as const;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted-foreground" />
          EV Safety State
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
            <StatusBadge status={statusFor(value)}>{value}</StatusBadge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

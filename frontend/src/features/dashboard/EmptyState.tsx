import { RefreshCcw } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getConnectionDisplay, isConnectingStatus } from "@/lib/telemetry";
import { config } from "@/lib/config";
import type { DashboardPhase } from "@/features/dashboard/hooks/useDashboard";
import type { ConnectionState, HealthStatus } from "@/lib/types";

interface EmptyStateProps {
  phase: DashboardPhase;
  status: ConnectionState;
  error: string | null;
  isReplay: boolean;
  health: HealthStatus | null;
  onReturnToLive?: () => void;
}

export function EmptyState({
  phase,
  status,
  error,
  isReplay,
  health,
  onReturnToLive,
}: EmptyStateProps) {
  const connection = getConnectionDisplay(status);
  const spinning = isConnectingStatus(status);
  const backendUp = health?.status === "ok";

  const title =
    status === "replay_complete"
      ? "Replay finished"
      : phase === "connecting"
        ? "Connecting to live telemetry"
        : status === "reconnecting"
          ? "Reconnecting to telemetry"
          : backendUp
            ? "Connecting to live telemetry"
            : "Waiting for telemetry";

  const description =
    status === "replay_complete"
      ? "Press Return to Live to resume the mock stream."
      : phase === "waiting" && !backendUp
        ? `Start the backend on port 8000. Connects to ${config.telemetryWsUrl}.`
        : phase === "waiting" && backendUp
          ? `Backend is up. Opening ${config.telemetryWsUrl}…`
          : undefined;

  return (
    <div className="page-shell relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-4 top-4 md:right-6 md:top-6">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md border-border/60 text-center shadow-xl">
        <CardHeader className="items-center pb-2">
          <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-muted">
            <RefreshCcw
              className={`size-7 text-muted-foreground ${spinning ? "animate-spin" : ""}`}
            />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-center leading-relaxed">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-8">
          <StatusBadge
            status={connection.tone}
            pulse={connection.tone === "ok"}
          >
            {connection.label}
          </StatusBadge>
          {error ? (
            <Alert variant="destructive" className="w-full text-left">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {(isReplay || status === "replay_complete") && onReturnToLive ? (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={onReturnToLive}
            >
              Return to Live
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

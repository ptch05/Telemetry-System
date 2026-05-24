import { Flag, Pause, Play, Radio } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DASHBOARD_TABS } from "@/features/dashboard/tabs";
import { useDashboardContext } from "@/features/dashboard/context";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const {
    frame,
    connection,
    health,
    isReplay,
    isMock,
    recordingLabel,
    paused,
    togglePause,
    returnToLive,
  } = useDashboardContext();

  const recording = frame.logger.recording;

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div className="racing-logo relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                <div
                  className="racing-stripe absolute inset-0 opacity-30"
                  aria-hidden
                />
                <Flag
                  className="relative size-7 text-primary-foreground"
                  strokeWidth={2.5}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={connection.tone}
                    pulse={connection.tone === "ok"}
                  >
                    {connection.label}
                  </StatusBadge>
                  {isReplay ? (
                    <StatusBadge status="warn">REPLAY</StatusBadge>
                  ) : null}
                  {isMock && !isReplay ? (
                    <StatusBadge status="info">SIM</StatusBadge>
                  ) : null}
                  <StatusBadge
                    status={recording ? "ok" : "idle"}
                    pulse={recording}
                  >
                    {recordingLabel}
                  </StatusBadge>
                  <Badge
                    variant="outline"
                    className="border-primary/30 text-primary"
                  >
                    {frame.driving_state}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    Pit Wall Telemetry
                  </p>
                  <h1 className="font-display text-2xl leading-none text-foreground sm:text-3xl">
                    FS EV Live
                  </h1>
                  <p className="mt-1 max-w-xl text-sm font-medium text-muted-foreground">
                    {isReplay
                      ? "Session replay — recorded CAN stream"
                      : "Real-time tractive system & vehicle data"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <ThemeToggle />
              {isReplay ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={returnToLive}
                  className="rounded-sm border-primary/40 font-bold uppercase tracking-wider"
                >
                  <Radio />
                  Live
                </Button>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                onClick={togglePause}
                className="rounded-sm font-bold uppercase tracking-wider"
              >
                {paused ? <Play /> : <Pause />}
                {paused ? "Resume" : "Pause"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill label="Run ID" value={frame.run_id} mono />
            <StatPill label="Frame" value={String(frame.t)} mono highlight />
            <StatPill
              label="Sample rate"
              value={`${health?.sample_hz ?? "—"} Hz`}
              mono
            />
            <StatPill
              label="RSSI"
              value={`${frame.logger.telemetry_rssi} dBm`}
              mono
            />
          </div>

          <TabsList className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-md border border-border/80 bg-muted/40 p-0.5 scrollbar-none">
            {DASHBOARD_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="shrink-0 rounded-sm px-4 py-2 font-bold uppercase tracking-wider text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:tab-active-glow sm:text-xs"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
    </header>
  );
}

function StatPill({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-muted px-3 py-2.5",
        highlight && "border-primary/30",
      )}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-bold text-foreground",
          mono && "telemetry-value text-xs",
          highlight && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

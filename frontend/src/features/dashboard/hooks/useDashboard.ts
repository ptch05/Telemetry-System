import { useCallback, useMemo, useState } from "react";
import { DEFAULT_TAB, type TabId } from "@/features/dashboard/tabs";
import { replayWsUrl } from "@/lib/config";
import { isMockMode, recordingLabel } from "@/lib/status";
import { getConnectionDisplay } from "@/lib/telemetry";
import { buildAlerts, buildSignalRows, toChartPoint } from "@/lib/telemetry";
import type { ConnectionState, HealthStatus, TelemetryFrame } from "@/lib/types";
import { useTelemetry } from "@/hooks/useTelemetry";
import type { DashboardContextValue } from "@/features/dashboard/context";

export type DashboardPhase = "waiting" | "connecting" | "ready";

export interface DashboardState {
  phase: DashboardPhase;
  status: ConnectionState;
  error: string | null;
  health: HealthStatus | null;
  paused: boolean;
  togglePause: () => void;
  isReplay: boolean;
  returnToLive: () => void;
  ready: DashboardContextValue | null;
}

function resolvePhase(
  frame: TelemetryFrame | null,
  status: ConnectionState,
): DashboardPhase {
  if (frame) return "ready";
  if (
    status === "live" ||
    status === "connecting" ||
    status === "reconnecting"
  ) {
    return "connecting";
  }
  return "waiting";
}

export function useDashboard(): DashboardState {
  const [paused, setPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB);
  const [replayRunId, setReplayRunId] = useState<string | null>(null);

  const replayUrl = replayRunId ? replayWsUrl(replayRunId) : undefined;
  const telemetry = useTelemetry(paused, replayUrl);

  const phase = resolvePhase(telemetry.currentFrame, telemetry.status);
  const isReplay = replayRunId !== null;

  const startReplay = useCallback((runId: string) => {
    setReplayRunId(runId);
    setActiveTab(DEFAULT_TAB);
  }, []);

  const returnToLive = useCallback(() => {
    setReplayRunId(null);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((value) => !value);
  }, []);

  const ready = useMemo((): DashboardContextValue | null => {
    const frame = telemetry.currentFrame;
    if (!frame) return null;

    return {
      frame,
      chartData: telemetry.frames.map(toChartPoint),
      alerts: buildAlerts(frame, telemetry.connected),
      signalRows: buildSignalRows(frame),
      connection: getConnectionDisplay(telemetry.status),
      health: telemetry.health,
      paused,
      activeTab,
      setActiveTab,
      isReplay,
      isMock: isMockMode(frame.mode),
      recordingLabel: recordingLabel(frame),
      error: telemetry.error,
      togglePause,
      returnToLive,
      startReplay,
    };
  }, [
    telemetry.currentFrame,
    telemetry.frames,
    telemetry.connected,
    telemetry.status,
    telemetry.health,
    telemetry.error,
    paused,
    activeTab,
    isReplay,
    togglePause,
    returnToLive,
    startReplay,
  ]);

  return {
    phase,
    status: telemetry.status,
    error: telemetry.error,
    health: telemetry.health,
    paused,
    togglePause,
    isReplay,
    returnToLive,
    ready,
  };
}

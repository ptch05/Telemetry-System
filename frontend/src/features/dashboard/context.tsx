import { createContext, useContext, type ReactNode } from "react";
import type { ConnectionDisplay } from "@/lib/telemetry";
import type {
  AlertItem,
  ChartPoint,
  HealthStatus,
  SignalRow,
  TelemetryFrame,
} from "@/lib/types";
import type { TabId } from "@/features/dashboard/tabs";

export interface DashboardContextValue {
  frame: TelemetryFrame;
  chartData: ChartPoint[];
  alerts: AlertItem[];
  signalRows: SignalRow[];
  connection: ConnectionDisplay;
  health: HealthStatus | null;
  paused: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isReplay: boolean;
  isMock: boolean;
  recordingLabel: string;
  error: string | null;
  togglePause: () => void;
  returnToLive: () => void;
  startReplay: (runId: string) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue;
  children: ReactNode;
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error(
      "useDashboardContext must be used within DashboardProvider",
    );
  }
  return ctx;
}

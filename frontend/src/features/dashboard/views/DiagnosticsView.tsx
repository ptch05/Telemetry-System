import { Cpu, Database, Radio, Timer, Wifi } from "lucide-react";
import { ChartPanel } from "@/components/ChartPanel";
import { ChartGridTwo, TabPanel } from "@/components/layout/ChartGrid";
import { MetricGrid } from "@/components/layout/MetricGrid";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { MetricCard } from "@/components/MetricCard";
import { useDashboardContext } from "@/features/dashboard/context";
import {
  canBusLoadStatus,
  cpuTempStatus,
  droppedFramesStatus,
  packetLossStatus,
  storageStatus,
} from "@/lib/status";

export function DiagnosticsView() {
  const { frame, chartData, connection, health } = useDashboardContext();
  const { logger } = frame;

  return (
    <TabPanel>
      <SectionHeader
        title="Diagnostics"
        subtitle="Operational health of the data acquisition stack."
      />

      <MetricGrid>
        <MetricCard
          title="WebSocket"
          value={connection.label}
          icon={Wifi}
          status={connection.tone}
        />
        <MetricCard
          title="Sample Rate"
          value={health?.sample_hz ?? "—"}
          unit="Hz"
          icon={Timer}
        />
        <MetricCard
          title="Dropped Frames"
          value={logger.dropped_frames}
          icon={Database}
          status={droppedFramesStatus(logger.dropped_frames)}
        />
        <MetricCard
          title="Packet Loss"
          value={logger.packet_loss}
          unit="%"
          icon={Wifi}
          status={packetLossStatus(logger.packet_loss)}
        />
        <MetricCard
          title="CAN Bus Load"
          value={logger.can_bus_load}
          unit="%"
          icon={Radio}
          status={canBusLoadStatus(logger.can_bus_load)}
        />
        <MetricCard
          title="Logger Storage"
          value={logger.storage_gb_free}
          unit="GB free"
          icon={Database}
          status={storageStatus(logger.storage_gb_free)}
        />
        <MetricCard
          title="CPU Temp"
          value={logger.cpu_temp}
          unit="°C"
          icon={Cpu}
          status={cpuTempStatus(logger.cpu_temp)}
        />
        <MetricCard
          title="Backend Uptime"
          value={health?.uptime_seconds?.toFixed(0) ?? "—"}
          unit="s"
          icon={Timer}
        />
      </MetricGrid>

      <ChartGridTwo>
        <ChartPanel
          data={chartData}
          title="CAN Bus Load"
          lines={[{ key: "canBusLoad", name: "CAN Bus Load %" }]}
          domain={[0, 100]}
        />
        <ChartPanel
          data={chartData}
          title="Packet Loss"
          lines={[{ key: "packetLoss", name: "Packet Loss %" }]}
          domain={[0, 10]}
        />
      </ChartGridTwo>
    </TabPanel>
  );
}

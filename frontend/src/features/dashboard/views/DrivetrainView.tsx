import { Activity, Cpu, Thermometer, Timer } from "lucide-react";
import { ChartPanel } from "@/components/ChartPanel";
import { ChartGridTwo, TabPanel } from "@/components/layout/ChartGrid";
import { MetricGrid } from "@/components/layout/MetricGrid";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { MetricCard } from "@/components/MetricCard";
import { useDashboardContext } from "@/features/dashboard/context";
import { deratingStatus, inverterTempStatus } from "@/lib/status";

export function DrivetrainView() {
  const { frame, chartData } = useDashboardContext();
  const { drivetrain } = frame;

  return (
    <TabPanel>
      <SectionHeader
        title="Drivetrain"
        subtitle="Inverter state, torque delivery, motor speed, and thermal derating."
      />

      <MetricGrid>
        <MetricCard
          title="Inverter State"
          value={drivetrain.inverter_state}
          icon={Cpu}
          status={deratingStatus(drivetrain.derating)}
        />
        <MetricCard
          title="Motor RPM"
          value={drivetrain.motor_rpm}
          unit="rpm"
          icon={Timer}
        />
        <MetricCard
          title="Inverter Temp"
          value={drivetrain.inverter_temp}
          unit="°C"
          icon={Thermometer}
          status={inverterTempStatus(drivetrain.inverter_temp)}
        />
        <MetricCard
          title="Derating"
          value={drivetrain.derating ? "ACTIVE" : "OFF"}
          icon={Activity}
          status={deratingStatus(drivetrain.derating)}
        />
      </MetricGrid>

      <ChartGridTwo>
        <ChartPanel
          data={chartData}
          title="Torque Request vs Actual"
          lines={[
            { key: "torqueRequest", name: "Request Nm" },
            { key: "torqueActual", name: "Actual Nm" },
          ]}
          domain={[0, 230]}
        />
        <ChartPanel
          data={chartData}
          title="Powertrain Temperatures"
          lines={[
            { key: "motorTemp", name: "Motor °C" },
            { key: "inverterTemp", name: "Inverter °C" },
          ]}
          domain={[20, 95]}
        />
      </ChartGridTwo>
    </TabPanel>
  );
}

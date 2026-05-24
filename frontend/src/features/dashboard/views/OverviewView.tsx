import {
  Activity,
  BatteryCharging,
  Database,
  Gauge,
  Radio,
  Thermometer,
  Zap,
} from "lucide-react";
import { ChartPanel, PowerAreaPanel } from "@/components/ChartPanel";
import {
  ChartGridTwo,
  ChartGridWide,
  TabPanel,
} from "@/components/layout/ChartGrid";
import { MetricGrid } from "@/components/layout/MetricGrid";
import { MetricCard } from "@/components/MetricCard";
import { SafetyMatrix } from "@/components/SafetyMatrix";
import { useDashboardContext } from "@/features/dashboard/context";
import {
  cellTempStatus,
  deratingStatus,
  packPowerStatus,
  recordingStatus,
  motorTempStatus,
  safetyAmsDisplay,
  socStatus,
} from "@/lib/status";

export function OverviewView() {
  const { frame, chartData, recordingLabel } = useDashboardContext();
  const { battery, drivetrain, safety, logger } = frame;

  return (
    <TabPanel>
      <MetricGrid>
        <MetricCard
          title="Vehicle Speed"
          value={frame.vehicle.speed}
          unit="km/h"
          icon={Gauge}
        />
        <MetricCard
          title="Pack Power"
          value={battery.pack_power_kw}
          unit="kW"
          icon={Zap}
          status={packPowerStatus(battery.pack_power_kw)}
        />
        <MetricCard
          title="State of Charge"
          value={battery.soc}
          unit="%"
          icon={BatteryCharging}
          status={socStatus(battery.soc)}
        />
        <MetricCard
          title="Max Cell Temp"
          value={battery.max_cell_temp}
          unit="°C"
          icon={Thermometer}
          status={cellTempStatus(battery.max_cell_temp)}
        />
        <MetricCard
          title="Motor Temp"
          value={drivetrain.motor_temp}
          unit="°C"
          icon={Thermometer}
          status={motorTempStatus(drivetrain.motor_temp)}
        />
        <MetricCard
          title="Torque Actual"
          value={drivetrain.torque_actual}
          unit="Nm"
          icon={Activity}
          status={deratingStatus(drivetrain.derating)}
        />
        <MetricCard
          title="AMS"
          value={safety.ams}
          icon={Radio}
          status={safetyAmsDisplay(safety.ams)}
        />
        <MetricCard
          title="Recording"
          value={recordingLabel}
          icon={Database}
          status={recordingStatus(logger.recording)}
        />
      </MetricGrid>

      <ChartGridTwo>
        <PowerAreaPanel data={chartData} />
        <ChartPanel
          data={chartData}
          title="SOC and Speed"
          lines={[
            { key: "soc", name: "SOC %" },
            { key: "speed", name: "Speed km/h" },
          ]}
          domain={[0, 110]}
        />
      </ChartGridTwo>

      <ChartGridWide>
        <ChartPanel
          data={chartData}
          title="Thermal Trend"
          lines={[
            { key: "maxCellTemp", name: "Max Cell °C" },
            { key: "motorTemp", name: "Motor °C" },
            { key: "inverterTemp", name: "Inverter °C" },
          ]}
          domain={[20, 95]}
        />
        <SafetyMatrix safety={safety} />
      </ChartGridWide>
    </TabPanel>
  );
}

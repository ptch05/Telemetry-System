import {
  Activity,
  BatteryCharging,
  PlugZap,
  Radio,
  Thermometer,
  Zap,
} from "lucide-react";
import { ChartPanel } from "@/components/ChartPanel";
import { GaugeBar } from "@/components/GaugeBar";
import { ChartGridTwo, TabPanel } from "@/components/layout/ChartGrid";
import { MetricGrid } from "@/components/layout/MetricGrid";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { MetricCard } from "@/components/MetricCard";
import { useDashboardContext } from "@/features/dashboard/context";
import {
  amsStatus,
  cellDeltaStatus,
  socStatus,
  tsCurrentStatus,
} from "@/lib/status";

export function AccumulatorView() {
  const { frame, chartData } = useDashboardContext();
  const { battery, safety } = frame;

  return (
    <TabPanel>
      <SectionHeader
        title="Accumulator and Tractive System"
        subtitle="Cell voltage, thermal state, current draw, SOC, and AMS-facing indicators."
      />

      <MetricGrid>
        <MetricCard
          title="State of Charge"
          value={battery.soc}
          unit="%"
          icon={BatteryCharging}
          status={socStatus(battery.soc)}
        />
        <MetricCard
          title="TS Voltage"
          value={battery.ts_voltage}
          unit="V"
          icon={PlugZap}
        />
        <MetricCard
          title="TS Current"
          value={battery.ts_current}
          unit="A"
          icon={Zap}
          status={tsCurrentStatus(battery.ts_current)}
        />
        <MetricCard
          title="Cell Delta"
          value={battery.cell_delta_mv}
          unit="mV"
          icon={Activity}
          status={cellDeltaStatus(battery.cell_delta_mv)}
        />
        <MetricCard
          title="Min Cell V"
          value={battery.min_cell_voltage}
          unit="V"
          icon={PlugZap}
        />
        <MetricCard
          title="Max Cell V"
          value={battery.max_cell_voltage}
          unit="V"
          icon={PlugZap}
        />
        <MetricCard
          title="Min Cell Temp"
          value={battery.min_cell_temp}
          unit="°C"
          icon={Thermometer}
        />
        <MetricCard
          title="AMS"
          value={safety.ams}
          icon={Radio}
          status={amsStatus(safety.ams)}
        />
      </MetricGrid>

      <MetricGrid>
        <GaugeBar
          label="SOC"
          value={battery.soc}
          unit="%"
          warnAt={85}
          faultAt={96}
        />
        <GaugeBar
          label="Max Cell Temperature"
          value={battery.max_cell_temp}
          unit="°C"
          min={20}
          max={60}
          warnAt={50}
          faultAt={56}
        />
        <GaugeBar
          label="Cell Voltage Spread"
          value={battery.cell_delta_mv}
          unit=" mV"
          min={0}
          max={140}
          warnAt={90}
          faultAt={120}
        />
        <GaugeBar
          label="Pack Power"
          value={Math.abs(battery.pack_power_kw)}
          unit=" kW"
          min={0}
          max={120}
          warnAt={85}
          faultAt={105}
        />
      </MetricGrid>

      <ChartGridTwo>
        <ChartPanel
          data={chartData}
          title="Voltage and Current"
          lines={[
            { key: "tsVoltage", name: "TS Voltage V" },
            { key: "tsCurrent", name: "TS Current A" },
          ]}
        />
        <ChartPanel
          data={chartData}
          title="Cell Temperatures"
          lines={[
            { key: "maxCellTemp", name: "Max °C" },
            { key: "minCellTemp", name: "Min °C" },
          ]}
          domain={[20, 65]}
        />
      </ChartGridTwo>
    </TabPanel>
  );
}

import { Activity, CircleStop, Gauge, SlidersHorizontal } from "lucide-react";
import { ChartPanel } from "@/components/ChartPanel";
import { ChartGridTwo, TabPanel } from "@/components/layout/ChartGrid";
import { MetricGrid } from "@/components/layout/MetricGrid";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardContext } from "@/features/dashboard/context";

export function DynamicsView() {
  const { frame, chartData } = useDashboardContext();
  const { vehicle } = frame;

  return (
    <TabPanel>
      <SectionHeader
        title="Vehicle Dynamics"
        subtitle="Speed, APPS, brakes, steering, yaw rate, G-forces, and wheel speeds."
      />

      <MetricGrid>
        <MetricCard
          title="Speed"
          value={vehicle.speed}
          unit="km/h"
          icon={Gauge}
        />
        <MetricCard
          title="APPS"
          value={vehicle.apps}
          unit="%"
          icon={SlidersHorizontal}
        />
        <MetricCard
          title="Brake Front"
          value={vehicle.brake_front}
          unit="bar"
          icon={CircleStop}
        />
        <MetricCard
          title="Yaw Rate"
          value={vehicle.yaw_rate}
          unit="°/s"
          icon={Activity}
        />
        <MetricCard
          title="Steering"
          value={vehicle.steering_angle}
          unit="°"
          icon={Activity}
        />
        <MetricCard
          title="Lateral G"
          value={vehicle.lat_g}
          unit="g"
          icon={Gauge}
        />
        <MetricCard
          title="Longitudinal G"
          value={vehicle.long_g}
          unit="g"
          icon={Gauge}
        />
        <MetricCard
          title="Brake Rear"
          value={vehicle.brake_rear}
          unit="bar"
          icon={CircleStop}
        />
      </MetricGrid>

      <ChartGridTwo>
        <ChartPanel
          data={chartData}
          title="Speed and APPS"
          lines={[
            { key: "speed", name: "Speed km/h" },
            { key: "apps", name: "APPS %" },
          ]}
          domain={[0, 120]}
        />
        <ChartPanel
          data={chartData}
          title="Lateral / Longitudinal G"
          lines={[
            { key: "latG", name: "Lateral G" },
            { key: "longG", name: "Long G" },
          ]}
          domain={[-1.6, 1.6]}
        />
      </ChartGridTwo>

      <Card>
        <CardHeader>
          <CardTitle>Wheel Speeds</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricGrid>
            <MetricCard
              title="FL"
              value={vehicle.wheel_speed_fl}
              unit="km/h"
              icon={Gauge}
            />
            <MetricCard
              title="FR"
              value={vehicle.wheel_speed_fr}
              unit="km/h"
              icon={Gauge}
            />
            <MetricCard
              title="RL"
              value={vehicle.wheel_speed_rl}
              unit="km/h"
              icon={Gauge}
            />
            <MetricCard
              title="RR"
              value={vehicle.wheel_speed_rr}
              unit="km/h"
              icon={Gauge}
            />
          </MetricGrid>
        </CardContent>
      </Card>
    </TabPanel>
  );
}

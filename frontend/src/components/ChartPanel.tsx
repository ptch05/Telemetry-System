import type { CSSProperties } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartPoint } from "@/lib/types";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

const chartTooltipStyle: CSSProperties = {
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  boxShadow: "0 8px 24px var(--card-shadow)",
  fontSize: "11px",
  fontFamily: '"JetBrains Mono", monospace',
  padding: "8px 12px",
};

const chartGridProps = {
  strokeDasharray: "3 6",
  stroke: "var(--border)",
  vertical: false,
};

const chartAxisTick = {
  fontSize: 10,
  fill: "var(--muted-foreground)",
  fontFamily: "JetBrains Mono",
};

const chartCursorStroke = "var(--border)";

interface LineSpec {
  key: keyof ChartPoint;
  name: string;
}

interface ChartPanelProps {
  title: string;
  data: ChartPoint[];
  lines: LineSpec[];
  domain?: [number | "auto", number | "auto"];
}

export function ChartPanel({
  title,
  data,
  lines,
  domain = ["auto", "auto"],
}: ChartPanelProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid {...chartGridProps} />
              <XAxis
                dataKey="t"
                tickLine={false}
                axisLine={false}
                tick={chartAxisTick}
              />
              <YAxis
                domain={domain}
                tickLine={false}
                axisLine={false}
                tick={chartAxisTick}
                width={36}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ stroke: chartCursorStroke, strokeWidth: 1 }}
              />
              {lines.map((line, i) => (
                <Line
                  key={String(line.key)}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function PowerAreaPanel({ data }: { data: ChartPoint[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Pack Power and Speed</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid {...chartGridProps} />
              <XAxis
                dataKey="t"
                tickLine={false}
                axisLine={false}
                tick={chartAxisTick}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={chartAxisTick}
                width={36}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ stroke: chartCursorStroke, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="packPowerKw"
                name="Pack Power kW"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.15}
                strokeWidth={2.5}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="speed"
                name="Speed km/h"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.08}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

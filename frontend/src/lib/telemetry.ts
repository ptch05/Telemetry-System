import type { Status } from "@/lib/status";
import type {
  AlertItem,
  ChartPoint,
  ConnectionState,
  SignalRow,
  TelemetryFrame,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Lightweight runtime check before trusting WebSocket JSON as TelemetryFrame. */
export function parseTelemetryFrame(data: unknown): TelemetryFrame | null {
  if (!isRecord(data)) return null;
  if (typeof data.t !== "number" || typeof data.run_id !== "string")
    return null;
  if (!isRecord(data.battery) || !isRecord(data.drivetrain)) return null;
  if (
    !isRecord(data.vehicle) ||
    !isRecord(data.safety) ||
    !isRecord(data.logger)
  )
    return null;
  return data as unknown as TelemetryFrame;
}

export interface ConnectionDisplay {
  label: string;
  tone: Status;
}

export function getConnectionDisplay(
  status: ConnectionState,
): ConnectionDisplay {
  switch (status) {
    case "live":
      return { label: "LIVE", tone: "ok" };
    case "connecting":
      return { label: "CONNECTING", tone: "info" };
    case "reconnecting":
      return { label: "RECONNECTING", tone: "warn" };
    case "replay_complete":
      return { label: "REPLAY DONE", tone: "info" };
    default:
      return { label: "DISCONNECTED", tone: "fault" };
  }
}

export function isConnectingStatus(status: ConnectionState): boolean {
  return status === "connecting" || status === "reconnecting";
}

export function toChartPoint(frame: TelemetryFrame): ChartPoint {
  return {
    t: frame.t,
    speed: frame.vehicle.speed,
    apps: frame.vehicle.apps,
    brakeFront: frame.vehicle.brake_front,
    torqueRequest: frame.drivetrain.torque_request,
    torqueActual: frame.drivetrain.torque_actual,
    packPowerKw: frame.battery.pack_power_kw,
    maxCellTemp: frame.battery.max_cell_temp,
    minCellTemp: frame.battery.min_cell_temp,
    motorTemp: frame.drivetrain.motor_temp,
    inverterTemp: frame.drivetrain.inverter_temp,
    canBusLoad: frame.logger.can_bus_load,
    packetLoss: frame.logger.packet_loss,
    tsCurrent: frame.battery.ts_current,
    tsVoltage: frame.battery.ts_voltage,
    latG: frame.vehicle.lat_g,
    longG: frame.vehicle.long_g,
    soc: frame.battery.soc,
  };
}

export function buildAlerts(
  frame: TelemetryFrame | null,
  connected: boolean,
): AlertItem[] {
  if (!frame)
    return [
      {
        severity: "warning",
        label: "Waiting for telemetry",
        detail: "No frame has been received yet.",
      },
    ];

  const alerts: AlertItem[] = [];
  if (!connected)
    alerts.push({
      severity: "fault",
      label: "Telemetry disconnected",
      detail: "No live frames are being received.",
    });
  if (frame.battery.max_cell_temp > 52)
    alerts.push({
      severity: frame.battery.max_cell_temp > 56 ? "fault" : "warning",
      label: "Accumulator temperature high",
      detail: `${frame.battery.max_cell_temp} °C max cell temperature`,
    });
  if (frame.battery.cell_delta_mv > 90)
    alerts.push({
      severity: "warning",
      label: "Cell imbalance increasing",
      detail: `${frame.battery.cell_delta_mv} mV spread`,
    });
  if (frame.drivetrain.derating)
    alerts.push({
      severity: "warning",
      label: "Powertrain derating",
      detail: "Torque actual is being limited by thermal conditions.",
    });
  if (frame.safety.sdc !== "CLOSED")
    alerts.push({
      severity: "fault",
      label: "Shutdown circuit open",
      detail: "AIR state is open; car is not ready to drive.",
    });
  if (frame.logger.can_errors > 0)
    alerts.push({
      severity: "warning",
      label: "CAN errors detected",
      detail: `${frame.logger.can_errors} total CAN error events`,
    });
  if (frame.logger.storage_gb_free < 8)
    alerts.push({
      severity: "warning",
      label: "Logger storage low",
      detail: `${frame.logger.storage_gb_free} GB remaining`,
    });

  return alerts.length
    ? alerts
    : [
        {
          severity: "info",
          label: "Vehicle telemetry nominal",
          detail: "No active dashboard-level warnings.",
        },
      ];
}

export function buildSignalRows(frame: TelemetryFrame): SignalRow[] {
  return [
    {
      name: "BMS_StateOfCharge",
      group: "Accumulator",
      value: `${frame.battery.soc}%`,
      rate: "10 Hz",
      status: frame.battery.soc < 20 ? "warn" : "ok",
    },
    {
      name: "BMS_TSVoltage",
      group: "Accumulator",
      value: `${frame.battery.ts_voltage} V`,
      rate: "20 Hz",
      status: frame.battery.ts_voltage < 360 ? "warn" : "ok",
    },
    {
      name: "BMS_TSCurrent",
      group: "Accumulator",
      value: `${frame.battery.ts_current} A`,
      rate: "20 Hz",
      status: "ok",
    },
    {
      name: "BMS_MinCellVoltage",
      group: "Accumulator",
      value: `${frame.battery.min_cell_voltage} V`,
      rate: "10 Hz",
      status: frame.battery.min_cell_voltage < 3.45 ? "warn" : "ok",
    },
    {
      name: "BMS_MaxCellTemperature",
      group: "Accumulator",
      value: `${frame.battery.max_cell_temp} °C`,
      rate: "10 Hz",
      status: frame.battery.max_cell_temp > 52 ? "warn" : "ok",
    },
    {
      name: "INV_MotorRPM",
      group: "Drivetrain",
      value: `${frame.drivetrain.motor_rpm} rpm`,
      rate: "50 Hz",
      status: "ok",
    },
    {
      name: "INV_TorqueRequest",
      group: "Drivetrain",
      value: `${frame.drivetrain.torque_request} Nm`,
      rate: "50 Hz",
      status: "ok",
    },
    {
      name: "INV_TorqueActual",
      group: "Drivetrain",
      value: `${frame.drivetrain.torque_actual} Nm`,
      rate: "50 Hz",
      status: frame.drivetrain.derating ? "warn" : "ok",
    },
    {
      name: "INV_Temperature",
      group: "Drivetrain",
      value: `${frame.drivetrain.inverter_temp} °C`,
      rate: "10 Hz",
      status: frame.drivetrain.inverter_temp > 72 ? "warn" : "ok",
    },
    {
      name: "DRV_APPS",
      group: "Driver",
      value: `${frame.vehicle.apps}%`,
      rate: "100 Hz",
      status: "ok",
    },
    {
      name: "DRV_BrakePressureFront",
      group: "Driver",
      value: `${frame.vehicle.brake_front} bar`,
      rate: "100 Hz",
      status: "ok",
    },
    {
      name: "CHS_SteeringAngle",
      group: "Dynamics",
      value: `${frame.vehicle.steering_angle}°`,
      rate: "100 Hz",
      status: "ok",
    },
    {
      name: "GPS_Speed",
      group: "Dynamics",
      value: `${frame.vehicle.speed} km/h`,
      rate: "20 Hz",
      status: "ok",
    },
    {
      name: "IMU_YawRate",
      group: "Dynamics",
      value: `${frame.vehicle.yaw_rate} °/s`,
      rate: "100 Hz",
      status: "ok",
    },
    {
      name: "LOGGER_CANBusLoad",
      group: "Diagnostics",
      value: `${frame.logger.can_bus_load}%`,
      rate: "1 Hz",
      status: frame.logger.can_bus_load > 70 ? "warn" : "ok",
    },
    {
      name: "LOGGER_DroppedFrames",
      group: "Diagnostics",
      value: `${frame.logger.dropped_frames}`,
      rate: "1 Hz",
      status: frame.logger.dropped_frames > 0 ? "warn" : "ok",
    },
    {
      name: "LOGGER_PacketLoss",
      group: "Diagnostics",
      value: `${frame.logger.packet_loss}%`,
      rate: "1 Hz",
      status: frame.logger.packet_loss > 4 ? "warn" : "ok",
    },
  ];
}

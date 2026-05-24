export type SafetyStatus = "OK" | "WARN" | "FAULT";
export type OpenClosed = "OPEN" | "CLOSED";

export type ConnectionState =
  | "connecting"
  | "live"
  | "disconnected"
  | "reconnecting"
  | "replay_complete";

export interface BatteryState {
  soc: number;
  ts_voltage: number;
  ts_current: number;
  min_cell_voltage: number;
  max_cell_voltage: number;
  avg_cell_voltage: number;
  max_cell_temp: number;
  min_cell_temp: number;
  temp_spread: number;
  cell_delta_mv: number;
  pack_power_kw: number;
}

export interface DrivetrainState {
  motor_rpm: number;
  torque_request: number;
  torque_actual: number;
  inverter_temp: number;
  motor_temp: number;
  dc_bus_voltage: number;
  derating: boolean;
  inverter_state: string;
}

export interface VehicleState {
  speed: number;
  apps: number;
  brake_front: number;
  brake_rear: number;
  steering_angle: number;
  yaw_rate: number;
  lat_g: number;
  long_g: number;
  wheel_speed_fl: number;
  wheel_speed_fr: number;
  wheel_speed_rl: number;
  wheel_speed_rr: number;
}

export interface SafetyState {
  ams: SafetyStatus;
  imd: SafetyStatus;
  sdc: OpenClosed;
  precharge: string;
  air_positive: OpenClosed;
  air_negative: OpenClosed;
  rtd: "ON" | "OFF";
  active_faults: number;
}

export interface LoggerState {
  recording: boolean;
  storage_gb_free: number;
  cpu_temp: number;
  dropped_frames: number;
  can_bus_load: number;
  can_errors: number;
  telemetry_rssi: number;
  packet_loss: number;
}

export interface TelemetryFrame {
  t: number;
  timestamp: string;
  run_id: string;
  mode: string;
  driving_state: string;
  battery: BatteryState;
  drivetrain: DrivetrainState;
  vehicle: VehicleState;
  safety: SafetyState;
  logger: LoggerState;
}

export interface ChartPoint {
  t: number;
  speed: number;
  apps: number;
  brakeFront: number;
  torqueRequest: number;
  torqueActual: number;
  packPowerKw: number;
  maxCellTemp: number;
  minCellTemp: number;
  motorTemp: number;
  inverterTemp: number;
  canBusLoad: number;
  packetLoss: number;
  tsCurrent: number;
  tsVoltage: number;
  latG: number;
  longG: number;
  soc: number;
}

export interface SignalRow {
  name: string;
  group: string;
  value: string;
  rate: string;
  status: "ok" | "warn" | "fault" | "info" | "idle";
}

export interface AlertItem {
  severity: "info" | "warning" | "fault";
  label: string;
  detail: string;
}

export interface RunSummary {
  run_id: string;
  file: string;
  size_bytes: number;
  metadata: Record<string, unknown>;
}

export interface RunDetail extends RunSummary {
  frame_count: number;
}

export interface RecordingStatus {
  recording: boolean;
  run_id: string | null;
  frame_count: number;
  sample_hz: number;
}

export interface HealthStatus {
  status: string;
  telemetry_mode: string;
  sample_hz: number;
  websocket_clients: number;
  recording: boolean;
  recording_run_id: string | null;
  run_data_dir: string;
  uptime_seconds: number;
}

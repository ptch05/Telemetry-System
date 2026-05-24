import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";
import type { SafetyStatus, TelemetryFrame } from "@/lib/types";

export type Status = "ok" | "warn" | "fault" | "idle" | "info";

export function statusToBadgeVariant(
  status: Status,
): NonNullable<VariantProps<typeof badgeVariants>["variant"]> {
  switch (status) {
    case "ok":
      return "success";
    case "warn":
      return "warning";
    case "fault":
      return "destructive";
    case "info":
      return "info";
    default:
      return "muted";
  }
}

export function progressIndicatorClass(status: Status): string {
  switch (status) {
    case "ok":
      return "bg-emerald-600";
    case "warn":
      return "bg-amber-500";
    case "fault":
      return "bg-destructive";
    default:
      return "bg-primary";
  }
}

export function socStatus(soc: number): Status {
  return soc < 20 ? "warn" : "ok";
}

export function packPowerStatus(kw: number): Status {
  return kw > 85 ? "warn" : "ok";
}

export function cellTempStatus(temp: number, warn = 52): Status {
  return temp > warn ? "warn" : "ok";
}

export function motorTempStatus(temp: number, warn = 80): Status {
  return temp > warn ? "warn" : "ok";
}

export function inverterTempStatus(temp: number, warn = 72): Status {
  return temp > warn ? "warn" : "ok";
}

export function tsCurrentStatus(amps: number, warn = 240): Status {
  return amps > warn ? "warn" : "ok";
}

export function cellDeltaStatus(mv: number, warn = 90): Status {
  return mv > warn ? "warn" : "ok";
}

export function amsStatus(ams: SafetyStatus): Status {
  if (ams === "FAULT") return "fault";
  if (ams === "WARN") return "warn";
  return "ok";
}

export function safetyAmsDisplay(ams: SafetyStatus): Status {
  return ams === "OK" ? "ok" : "warn";
}

export function deratingStatus(derating: boolean): Status {
  return derating ? "warn" : "ok";
}

export function recordingStatus(recording: boolean): Status {
  return recording ? "ok" : "idle";
}

export function droppedFramesStatus(count: number): Status {
  return count > 0 ? "warn" : "ok";
}

export function packetLossStatus(percent: number, warn = 4): Status {
  return percent > warn ? "warn" : "ok";
}

export function canBusLoadStatus(percent: number, warn = 65): Status {
  return percent > warn ? "warn" : "ok";
}

export function storageStatus(gbFree: number, warn = 8): Status {
  return gbFree < warn ? "warn" : "ok";
}

export function cpuTempStatus(temp: number, warn = 70): Status {
  return temp > warn ? "warn" : "ok";
}

export function isMockMode(mode: string): boolean {
  return mode === "MOCK" || mode === "SIM";
}

export function recordingLabel(frame: TelemetryFrame): string {
  return frame.logger.recording ? "RECORDING" : "STANDBY";
}

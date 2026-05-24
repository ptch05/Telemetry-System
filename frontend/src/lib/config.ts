const DEFAULT_WS = "ws://localhost:8000/ws/telemetry";
const DEFAULT_HTTP = "http://localhost:8000";

export const config = {
  telemetryWsUrl: import.meta.env.VITE_TELEMETRY_WS_URL ?? DEFAULT_WS,
  backendHttpUrl: import.meta.env.VITE_BACKEND_HTTP_URL ?? DEFAULT_HTTP,
  maxFrameBuffer: 240,
  maxReconnectBackoffMs: 30_000,
  healthPollIntervalMs: 5_000,
} as const;

export function replayWsUrl(runId: string): string {
  const base = config.telemetryWsUrl.replace(/\/ws\/telemetry\/?$/, "");
  return `${base}/ws/replay/${encodeURIComponent(runId)}`;
}

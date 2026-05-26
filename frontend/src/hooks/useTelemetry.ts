import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { config } from "@/lib/config";
import { parseTelemetryFrame } from "@/lib/telemetry";
import type {
  ConnectionState,
  HealthStatus,
  TelemetryFrame,
} from "@/lib/types";

export function useTelemetry(paused: boolean, wsUrlOverride?: string) {
  const [status, setStatus] = useState<ConnectionState>("connecting");
  const [frames, setFrames] = useState<TelemetryFrame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const activeWsUrl = wsUrlOverride ?? config.telemetryWsUrl;

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch(`${config.backendHttpUrl}/health`);
      if (response.ok) {
        setHealth((await response.json()) as HealthStatus);
      }
    } catch {
      /* backend may be down while WS reconnects */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFrames([]);
    setError(null);
    setStatus("connecting");

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(
        1000 * 2 ** attemptRef.current,
        config.maxReconnectBackoffMs,
      );
      attemptRef.current += 1;
      setStatus("reconnecting");
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    function connect() {
      if (cancelled) return;
      clearReconnectTimer();
      setStatus((current) =>
        current === "reconnecting" ? "reconnecting" : "connecting",
      );
      setError(null);

      const socket = new WebSocket(activeWsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        setStatus("live");
        setError(null);
        void fetchHealth();
      };

      socket.onmessage = (event) => {
        if (pausedRef.current) return;
        try {
          const raw: unknown = JSON.parse(event.data as string);
          const frame = parseTelemetryFrame(raw);
          if (!frame) {
            setError("Received telemetry frame with unexpected shape");
            return;
          }
          setFrames((current) => [
            ...current.slice(-(config.maxFrameBuffer - 1)),
            frame,
          ]);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to parse telemetry frame",
          );
        }
      };

      socket.onerror = () => {
        setError(
          "WebSocket error. Check that the backend is running and CORS is configured.",
        );
      };

      socket.onclose = (event) => {
        if (cancelled) return;
        if (event.code === 4200) {
          setStatus("replay_complete");
          return;
        }
        setStatus("disconnected");
        scheduleReconnect();
      };
    }

    connect();
    const healthTimer = window.setInterval(
      () => void fetchHealth(),
      config.healthPollIntervalMs,
    );
    void fetchHealth();

    return () => {
      cancelled = true;
      clearReconnectTimer();
      window.clearInterval(healthTimer);
      socketRef.current?.close();
    };
  }, [fetchHealth, activeWsUrl]);

  const currentFrame = frames.length > 0 ? frames[frames.length - 1]! : null;
  const connected = status === "live";

  return useMemo(
    () => ({ status, frames, currentFrame, connected, error, health }),
    [status, frames, currentFrame, connected, error, health],
  );
}

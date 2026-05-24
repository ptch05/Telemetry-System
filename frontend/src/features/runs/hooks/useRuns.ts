import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { RecordingStatus, RunDetail, RunSummary } from "@/lib/types";

export interface RunFormState {
  driver: string;
  eventType: string;
  notes: string;
}

const DEFAULT_FORM: RunFormState = {
  driver: "",
  eventType: "test",
  notes: "",
};

export function useRuns(liveRecording: boolean) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selected, setSelected] = useState<RunDetail | null>(null);
  const [status, setStatus] = useState<RecordingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RunFormState>(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [runsList, recStatus] = await Promise.all([
        apiGet<RunSummary[]>("/api/runs"),
        apiGet<RecordingStatus>("/api/recording/status"),
      ]);
      setRuns(runsList);
      setStatus(recStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [refresh, liveRecording]);

  const loadRun = useCallback(async (runId: string) => {
    setError(null);
    try {
      setSelected(
        await apiGet<RunDetail>(`/api/runs/${encodeURIComponent(runId)}`),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load run");
    }
  }, []);

  const startRecording = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await apiPost("/api/recording/start", {
        driver: form.driver || undefined,
        event_type: form.eventType || undefined,
        notes: form.notes || undefined,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Start recording failed");
    } finally {
      setBusy(false);
    }
  }, [form, refresh]);

  const stopRecording = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await apiPost("/api/recording/stop");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stop recording failed");
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const updateForm = useCallback((patch: Partial<RunFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const recording = status?.recording ?? liveRecording;

  return {
    runs,
    selected,
    status,
    loading,
    error,
    form,
    busy,
    recording,
    refresh,
    loadRun,
    startRecording,
    stopRecording,
    updateForm,
  };
}

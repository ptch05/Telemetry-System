import { Download, Loader2, PlayCircle, RefreshCw, Square } from "lucide-react";
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { TabPanel } from "@/components/layout/ChartGrid";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRuns } from "@/features/runs/hooks/useRuns";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

interface RunsPanelProps {
  liveRecording: boolean;
  onReplay: (runId: string) => void;
}

export function RunsPanel({ liveRecording, onReplay }: RunsPanelProps) {
  const {
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
  } = useRuns(liveRecording);

  const httpBase = config.backendHttpUrl;

  return (
    <TabPanel className="space-y-6">
      <SectionHeader
        title="Runs / Recordings"
        subtitle="Start a mock telemetry recording, then list, inspect, replay, and download saved JSONL runs."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record new run</CardTitle>
          <CardDescription>
            Optional metadata is stored with the run for later review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="driver" label="Driver">
              <Input
                id="driver"
                value={form.driver}
                onChange={(e) => updateForm({ driver: e.target.value })}
                placeholder="e.g. Alex Kim"
              />
            </FormField>
            <FormField id="event-type" label="Event type">
              <Input
                id="event-type"
                value={form.eventType}
                onChange={(e) => updateForm({ eventType: e.target.value })}
                placeholder="test / endurance"
              />
            </FormField>
            <FormField id="notes" label="Notes" className="sm:col-span-2">
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => updateForm({ notes: e.target.value })}
                placeholder="Session notes"
              />
            </FormField>
          </div>
          <RecordingActions
            busy={busy}
            recording={recording}
            onStart={() => void startRecording()}
            onStop={() => void stopRecording()}
            onRefresh={() => void refresh()}
          />
          {status ? (
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              {status.recording
                ? `Recording ${status.run_id} (${status.frame_count} frames)`
                : "Idle"}
              {status.sample_hz ? ` · ${status.sample_hz} Hz` : ""}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <RunList
          runs={runs}
          loading={loading}
          selectedId={selected?.run_id}
          onSelect={(id) => void loadRun(id)}
        />
        <RunDetailCard
          selected={selected}
          httpBase={httpBase}
          onReplay={onReplay}
        />
      </div>
    </TabPanel>
  );
}

function FormField({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function RecordingActions({
  busy,
  recording,
  onStart,
  onStop,
  onRefresh,
}: {
  busy: boolean;
  recording: boolean;
  onStart: () => void;
  onStop: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        className="rounded-full"
        disabled={busy || recording}
        onClick={onStart}
      >
        <PlayCircle />
        Start recording
      </Button>
      <Button
        className="rounded-full"
        variant="destructive"
        disabled={busy || !recording}
        onClick={onStop}
      >
        <Square />
        Stop
      </Button>
      <Button className="rounded-full" variant="outline" onClick={onRefresh}>
        <RefreshCw />
        Refresh
      </Button>
    </div>
  );
}

function RunList({
  runs,
  loading,
  selectedId,
  onSelect,
}: {
  runs: { run_id: string; size_bytes: number }[];
  loading: boolean;
  selectedId?: string;
  onSelect: (runId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saved runs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading runs…
          </p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recorded runs yet. Start a recording while live telemetry is
            streaming.
          </p>
        ) : (
          <ScrollArea className="h-[360px] pr-3">
            <ul className="space-y-2">
              {runs.map((run) => (
                <li key={run.run_id}>
                  <button
                    type="button"
                    onClick={() => onSelect(run.run_id)}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/50 px-3 py-2.5 text-left text-sm transition-all hover:border-border hover:bg-muted/50",
                      selectedId === run.run_id &&
                        "border-primary/40 bg-accent shadow-sm",
                    )}
                  >
                    <span className="font-medium">{run.run_id}</span>
                    <span className="text-muted-foreground">
                      {(run.size_bytes / 1024).toFixed(1)} KB
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function RunDetailCard({
  selected,
  httpBase,
  onReplay,
}: {
  selected: {
    run_id: string;
    frame_count: number;
    size_bytes: number;
    metadata: Record<string, unknown>;
  } | null;
  httpBase: string;
  onReplay: (runId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Run details</CardTitle>
      </CardHeader>
      <CardContent>
        {!selected ? (
          <p className="text-sm text-muted-foreground">
            Select a run to view metadata, replay, or download.
          </p>
        ) : (
          <div className="space-y-4">
            <dl className="space-y-2 text-sm">
              <DetailRow label="Run ID" value={selected.run_id} />
              <DetailRow label="Frames" value={String(selected.frame_count)} />
              <DetailRow
                label="Size"
                value={`${(selected.size_bytes / 1024).toFixed(1)} KB`}
              />
              {metaString(selected.metadata, "driver") ? (
                <DetailRow
                  label="Driver"
                  value={metaString(selected.metadata, "driver")!}
                />
              ) : null}
              {metaString(selected.metadata, "event_type") ? (
                <DetailRow
                  label="Event"
                  value={metaString(selected.metadata, "event_type")!}
                />
              ) : null}
              {metaString(selected.metadata, "started_at") ? (
                <DetailRow
                  label="Started"
                  value={metaString(selected.metadata, "started_at")!}
                />
              ) : null}
              {metaString(selected.metadata, "ended_at") ? (
                <DetailRow
                  label="Ended"
                  value={metaString(selected.metadata, "ended_at")!}
                />
              ) : null}
            </dl>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-full"
                onClick={() => onReplay(selected.run_id)}
              >
                <PlayCircle />
                Replay
              </Button>
              <Button className="rounded-full" variant="outline" asChild>
                <a
                  href={`${httpBase}/api/runs/${encodeURIComponent(selected.run_id)}/download`}
                >
                  <Download />
                  ZIP
                </a>
              </Button>
              <Button className="rounded-full" variant="outline" asChild>
                <a
                  href={`${httpBase}/api/runs/${encodeURIComponent(selected.run_id)}/jsonl`}
                >
                  <Download />
                  JSONL
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function metaString(
  metadata: Record<string, unknown>,
  key: string,
): string | null {
  const value = metadata[key];
  return value != null && value !== "" ? String(value) : null;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

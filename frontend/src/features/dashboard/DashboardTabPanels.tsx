import { TabsContent } from "@/components/ui/tabs";
import { useDashboardContext } from "@/features/dashboard/context";
import { AccumulatorView } from "@/features/dashboard/views/AccumulatorView";
import { DiagnosticsView } from "@/features/dashboard/views/DiagnosticsView";
import { DrivetrainView } from "@/features/dashboard/views/DrivetrainView";
import { DynamicsView } from "@/features/dashboard/views/DynamicsView";
import { OverviewView } from "@/features/dashboard/views/OverviewView";
import { RunsPanel } from "@/features/runs/RunsPanel";
import { SignalTable } from "@/components/SignalTable";

export function DashboardTabPanels() {
  const { activeTab, signalRows, frame, startReplay } = useDashboardContext();

  return (
    <>
      <TabsContent value="overview">
        <OverviewView />
      </TabsContent>
      <TabsContent value="accumulator">
        <AccumulatorView />
      </TabsContent>
      <TabsContent value="drivetrain">
        <DrivetrainView />
      </TabsContent>
      <TabsContent value="dynamics">
        <DynamicsView />
      </TabsContent>
      <TabsContent value="diagnostics">
        <DiagnosticsView />
      </TabsContent>
      <TabsContent value="runs">
        <RunsPanel
          liveRecording={frame.logger.recording}
          onReplay={startReplay}
        />
      </TabsContent>

      {activeTab !== "runs" ? <SignalTable rows={signalRows} /> : null}
    </>
  );
}

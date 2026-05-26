import { DashboardShell } from "@/features/dashboard/DashboardShell";
import { EmptyState } from "@/features/dashboard/EmptyState";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";

export default function App() {
  const dashboard = useDashboard();

  if (dashboard.phase !== "ready" || !dashboard.ready) {
    return (
      <EmptyState
        phase={dashboard.phase}
        status={dashboard.status}
        error={dashboard.error}
        health={dashboard.health}
        isReplay={dashboard.isReplay}
        onReturnToLive={dashboard.returnToLive}
      />
    );
  }

  return <DashboardShell value={dashboard.ready} />;
}

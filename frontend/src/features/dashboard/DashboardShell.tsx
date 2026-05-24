import { AlertPanel } from "@/components/AlertPanel";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs } from "@/components/ui/tabs";
import {
  DashboardProvider,
  type DashboardContextValue,
} from "@/features/dashboard/context";
import { DashboardTabPanels } from "@/features/dashboard/DashboardTabPanels";

interface DashboardShellProps {
  value: DashboardContextValue;
}

export function DashboardShell({ value }: DashboardShellProps) {
  return (
    <DashboardProvider value={value}>
      <div className="page-shell">
        <Tabs
          value={value.activeTab}
          onValueChange={(tab) =>
            value.setActiveTab(tab as typeof value.activeTab)
          }
          className="flex min-h-screen flex-col"
        >
          <DashboardHeader />

          <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 py-6 md:px-6 lg:px-8">
            {value.error ? (
              <Alert variant="destructive">
                <AlertDescription>{value.error}</AlertDescription>
              </Alert>
            ) : null}

            <AlertPanel alerts={value.alerts} />

            <DashboardTabPanels />
          </main>
        </Tabs>
      </div>
    </DashboardProvider>
  );
}

export const DASHBOARD_TABS = [
  { id: "overview", label: "Overview" },
  { id: "accumulator", label: "Accumulator" },
  { id: "drivetrain", label: "Drivetrain" },
  { id: "dynamics", label: "Dynamics" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "runs", label: "Runs" },
] as const;

export type TabId = (typeof DASHBOARD_TABS)[number]["id"];

export const DEFAULT_TAB: TabId = "overview";

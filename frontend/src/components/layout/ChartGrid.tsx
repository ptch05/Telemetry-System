import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TAB_PANEL_CLASS = "mt-0 space-y-6 outline-none";

export function TabPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(TAB_PANEL_CLASS, className)}>{children}</div>;
}

export function ChartGridTwo({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-2">{children}</div>;
}

export function ChartGridWide({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">{children}</div>;
}

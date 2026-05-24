import { Badge } from "@/components/ui/badge";
import { statusToBadgeVariant, type Status } from "@/lib/status";

interface StatusBadgeProps {
  status: Status;
  children: string;
  pulse?: boolean;
}

export function StatusBadge({ status, children, pulse }: StatusBadgeProps) {
  return (
    <Badge variant={statusToBadgeVariant(status)} dot pulseDot={pulse}>
      {children}
    </Badge>
  );
}

export type { Status };

import { Database, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SignalRow } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function SignalTable({ rows }: { rows: SignalRow[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const groups = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((row) => row.group)))],
    [rows],
  );

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      row.name.toLowerCase().includes(q) ||
      row.group.toLowerCase().includes(q);
    const matchesGroup = group === "All" || row.group === group;
    return matchesQuery && matchesGroup;
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="size-4 text-muted-foreground" />
          Live Signals
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              className="h-9 rounded-full border-border/60 bg-muted/40 pl-9"
              aria-label="Search signals"
            />
          </div>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger
              className="h-9 w-[148px] rounded-full border-border/60 bg-muted/40"
              aria-label="Filter by group"
            >
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[380px] rounded-xl border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-widest">
                  Signal
                </TableHead>
                <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-widest">
                  Group
                </TableHead>
                <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-widest">
                  Value
                </TableHead>
                <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-widest">
                  Rate
                </TableHead>
                <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-widest">
                  State
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-28 text-center text-sm text-muted-foreground"
                  >
                    No signals match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.name} className="border-border/40">
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.group}
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums">
                      {row.value}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.rate}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status}>
                        {row.status.toUpperCase()}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <p className="mt-3 text-xs text-muted-foreground">
          {filtered.length} of {rows.length} signals
        </p>
      </CardContent>
    </Card>
  );
}

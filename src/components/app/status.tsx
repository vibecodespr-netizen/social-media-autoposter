import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { platformName } from "@/lib/platforms";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "border-amber-500/40 text-amber-300 bg-amber-500/10" },
  pending_approval: {
    label: "Pending approval",
    className: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  },
  scheduled: { label: "Scheduled", className: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10" },
  publishing: { label: "Publishing", className: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10" },
  published: {
    label: "Published",
    className: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  },
  failed: {
    label: "Failed",
    className: "border-destructive/50 text-destructive bg-destructive/10",
  },
  needs_integration: {
    label: "Needs integration",
    className: "border-orange-500/40 text-orange-300 bg-orange-500/10",
  },
  rejected: { label: "Rejected", className: "border-border text-muted-foreground bg-muted/40" },
  cancelled: { label: "Cancelled", className: "border-border text-muted-foreground bg-muted/40" },
  new: { label: "New", className: "border-primary/40 text-primary bg-primary/10" },
  used: { label: "Used", className: "border-border text-muted-foreground bg-muted/40" },
  success: {
    label: "Success",
    className: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  },
  error: { label: "Error", className: "border-destructive/50 text-destructive bg-destructive/10" },
  info: { label: "Info", className: "border-border text-muted-foreground bg-muted/40" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS_STYLES[status] ?? {
    label: status,
    className: "border-border text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

export function PlatformBadge({ id }: { id: string }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {platformName(id)}
    </Badge>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
      {Icon && <Icon className="mb-3 h-7 w-7 text-muted-foreground" />}
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-3xl font-bold", accent && "text-primary")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const suffix = diff >= 0 ? "ago" : "from now";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ${suffix}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ${suffix}`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ${suffix}`;
  return new Date(iso).toLocaleDateString();
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

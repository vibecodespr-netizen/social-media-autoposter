import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  CalendarClock,
  Inbox,
  Pause,
  Play,
  Radar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  PlatformBadge,
  StatCard,
  StatusBadge,
  formatDateTime,
  timeAgo,
} from "@/components/app/status";
import { useActivity, useBrand, useIdeas, usePosts, useUpdateBrand } from "@/hooks/use-brand";
import { runAutopilotNow } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: brand, isLoading } = useBrand();
  const { data: posts } = usePosts(brand?.id);
  const { data: ideas } = useIdeas(brand?.id);
  const { data: activity } = useActivity(brand?.id);
  const updateBrand = useUpdateBrand();
  const [running, setRunning] = useState(false);

  const stats = useMemo(() => {
    const list = posts ?? [];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = Date.now() - 7 * 864e5;
    return {
      publishedToday: list.filter(
        (p) => p.status === "published" && new Date(p.created_at) >= startOfToday,
      ).length,
      publishedWeek: list.filter(
        (p) => p.status === "published" && new Date(p.created_at).getTime() >= weekAgo,
      ).length,
      scheduled: list.filter((p) => p.status === "scheduled").length,
      pending: list.filter((p) => p.status === "draft" || p.status === "pending_approval").length,
      failed: list.filter((p) => p.status === "failed" || p.status === "needs_integration").length,
      newIdeas: (ideas ?? []).filter((i) => i.status === "new").length,
    };
  }, [posts, ideas]);

  const upcoming = useMemo(
    () =>
      (posts ?? [])
        .filter((p) => p.status === "scheduled" && p.scheduled_for)
        .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime())
        .slice(0, 5),
    [posts],
  );

  async function runNow() {
    if (!brand) return;
    setRunning(true);
    try {
      const res = await runAutopilotNow({ data: { brandId: brand.id } });
      if (res?.ok) toast.success(res.message);
      else toast.error(res?.message ?? "Run failed");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function toggleAutomation() {
    if (!brand) return;
    try {
      await updateBrand(brand.id, {
        automation_enabled: !brand.automation_enabled,
        paused_reason: null,
      });
      toast.success(brand.automation_enabled ? "Autopilot paused." : "Autopilot engaged.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (isLoading || !brand) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const paused = !!brand.paused_reason;
  const on = brand.automation_enabled && !paused;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Mission control</h1>
          <p className="mt-1 text-muted-foreground">
            {brand.name} ·{" "}
            <span
              className={
                paused ? "text-destructive" : on ? "text-primary" : "text-muted-foreground"
              }
            >
              {paused
                ? `paused — ${brand.paused_reason}`
                : on
                  ? "autopilot active"
                  : "autopilot off"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleAutomation}>
            {on ? (
              <>
                <Pause /> Pause
              </>
            ) : (
              <>
                <Play /> Resume
              </>
            )}
          </Button>
          <Button className="shadow-glow" onClick={runNow} disabled={running}>
            <Sparkles /> {running ? "Running…" : "Run now"}
          </Button>
        </div>
      </div>

      {paused && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Autopilot paused</p>
            <p className="text-muted-foreground">{brand.paused_reason}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Published today"
          value={stats.publishedToday}
          hint={`${stats.publishedWeek} this week`}
          accent
        />
        <StatCard label="Scheduled" value={stats.scheduled} hint="Queued to go out" />
        <StatCard label="Awaiting you" value={stats.pending} hint="Drafts & pending approval" />
        <StatCard label="New topics" value={stats.newIdeas} hint="Discovered, unused" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-4 w-4 text-primary" /> Upcoming
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/content">View queue</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length ? (
              <ul className="divide-y divide-border">
                {upcoming.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 py-3">
                    <div className="mt-0.5">
                      <PlatformBadge id={p.platform} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{p.content}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {formatDateTime(p.scheduled_for)}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Inbox}
                title="Nothing scheduled"
                hint="Run the autopilot or create a post in the Studio."
                action={
                  <Button size="sm" asChild>
                    <Link to="/studio">Open Studio</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ActivityIcon className="h-4 w-4 text-primary" /> Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity?.length ? (
              <ul className="space-y-3">
                {activity.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.kind === "error" ? "bg-destructive" : a.kind === "success" ? "bg-primary" : "bg-muted-foreground"}`}
                    />
                    <div className="min-w-0">
                      <p className="break-words">{a.message}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {timeAgo(a.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No activity yet. Run the autopilot to see events here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          to="/discovery"
          icon={Radar}
          title="Discovery"
          text={`${stats.newIdeas} new topics waiting`}
        />
        <QuickLink
          to="/content"
          icon={Inbox}
          title="Content queue"
          text={`${stats.pending} need review`}
        />
        <QuickLink
          to="/integrations"
          icon={AlertTriangle}
          title="Integrations"
          text="Publishing needs accounts"
        />
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  text,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </Link>
  );
}

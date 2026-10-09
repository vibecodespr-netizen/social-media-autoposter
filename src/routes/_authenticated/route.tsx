import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Inbox, Radar, PenLine, Plug, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/hooks/use-brand";
import { Logo } from "../index";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Shell,
});

const nav = [
  { to: "/dashboard", label: "Mission control", icon: LayoutDashboard },
  { to: "/content", label: "Content queue", icon: Inbox },
  { to: "/discovery", label: "Discovery", icon: Radar },
  { to: "/studio", label: "Studio", icon: PenLine },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Shell() {
  const { data: brand } = useBrand();
  const loc = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (brand && !brand.onboarded && loc.pathname !== "/onboarding") navigate({ to: "/onboarding" });
  }, [brand, loc.pathname, navigate]);

  if (loc.pathname === "/onboarding") return <Outlet />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <div className="px-2 py-2"><Logo /></div>
        {brand && (
          <div className="mt-6 rounded-xl border border-sidebar-border p-3">
            <div className="truncate text-sm font-semibold">{brand.name}</div>
            <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${brand.paused_reason ? "bg-destructive" : brand.automation_enabled ? "bg-primary animate-pulse-dot" : "bg-muted-foreground"}`} />
              {brand.paused_reason ? "paused" : brand.automation_enabled ? "autopilot on" : "autopilot off"}
            </div>
          </div>
        )}
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent text-primary" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <div className="flex-1">
        <div className="flex gap-1 overflow-x-auto border-b border-border p-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="shrink-0 rounded-md px-3 py-1.5 text-xs text-muted-foreground" activeProps={{ className: "bg-secondary text-primary" }}>{n.label}</Link>
          ))}
        </div>
        <main className="mx-auto max-w-6xl p-6 md:p-10"><Outlet /></main>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

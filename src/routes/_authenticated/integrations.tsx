import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Plug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS } from "@/lib/platforms";
import { useBrand } from "@/hooks/use-brand";
import { getIntegrationStatus } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/integrations")({
  component: Integrations,
});

function Integrations() {
  const { data: brand } = useBrand();
  const { data, isLoading } = useQuery({
    queryKey: ["integration-status"],
    queryFn: () => getIntegrationStatus(),
    retry: false,
  });

  const configured = new Set(data?.configured ?? []);
  const enabled = new Set(brand?.platforms ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Integrations</h1>
        <p className="mt-1 text-muted-foreground">
          Connect the networks the autopilot may publish to. Nothing is sent until a platform is
          fully configured.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-orange-500/40 bg-orange-500/10 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-400" />
        <div>
          <p className="font-medium text-orange-300">
            {isLoading
              ? "Checking configuration…"
              : configured.size
                ? `${configured.size} platform(s) configured`
                : "No platforms connected yet"}
          </p>
          <p className="text-muted-foreground">
            Publishing uses each network's official API and requires a developer app plus OAuth
            credentials. Until those are set, the autopilot researches and drafts content but posts
            are held in your queue as
            <span className="mx-1 font-mono text-xs">needs integration</span>.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS.map((p) => {
          const isConfigured = configured.has(p.id);
          const isEnabled = enabled.has(p.id);
          return (
            <Card key={p.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <Plug className="h-4 w-4 text-primary" /> {p.name}
                  </div>
                  {isConfigured ? (
                    <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-300 border-orange-500/40">
                      Awaiting configuration
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{p.needs}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={`h-2 w-2 rounded-full ${isEnabled ? "bg-primary" : "bg-muted-foreground/50"}`}
                  />
                  {isEnabled
                    ? "In your brand's posting platforms"
                    : "Not selected in brand settings"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-3 p-5 text-sm">
          <p className="font-medium">How to connect a platform</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              Create a developer app with the network and request the posting scopes listed above.
            </li>
            <li>Complete the network's app review / verification for publishing permissions.</li>
            <li>
              Provide the app credentials and OAuth callback to this deployment's environment.
            </li>
            <li>
              Return here and authorize the account — status flips to{" "}
              <span className="font-mono text-xs">Connected</span>.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            This build ships the publishing layer and status checks; live API calls are added per
            platform once credentials and approvals exist. No success is reported without a real API
            response.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

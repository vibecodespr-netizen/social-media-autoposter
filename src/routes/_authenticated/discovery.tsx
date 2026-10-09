import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Plus, Radar, Rss, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, StatusBadge, timeAgo } from "@/components/app/status";
import { useBrand, useIdeas, useSourceActions, useSources } from "@/hooks/use-brand";

export const Route = createFileRoute("/_authenticated/discovery")({
  component: Discovery,
});

function Discovery() {
  const { data: brand } = useBrand();
  const { data: sources } = useSources(brand?.id);
  const { data: ideas } = useIdeas(brand?.id);
  const actions = useSourceActions();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const newIdeas = useMemo(() => (ideas ?? []).filter((i) => i.status === "new"), [ideas]);
  const usedIdeas = useMemo(() => (ideas ?? []).filter((i) => i.status !== "new"), [ideas]);

  async function add() {
    const value = url.trim();
    if (!value) return;
    try {
      new URL(value);
    } catch {
      toast.error("Enter a valid URL");
      return;
    }
    setBusy(true);
    try {
      await actions.add(brand!.id, value);
      setUrl("");
      toast.success("Source added");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Discovery</h1>
        <p className="mt-1 text-muted-foreground">
          Feeds the autopilot watches and the topics it has surfaced.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rss className="h-4 w-4 text-primary" /> Content sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button onClick={add} disabled={busy}>
              <Plus /> Add
            </Button>
          </div>
          {sources?.length ? (
            <ul className="divide-y divide-border">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <Switch
                    checked={s.active}
                    onCheckedChange={(v) =>
                      actions.toggle(s.id, v).catch((e) => toast.error(e.message))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs">{s.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.last_error ? (
                        <span className="text-destructive">Error: {s.last_error}</span>
                      ) : s.last_fetched_at ? (
                        `Fetched ${timeAgo(s.last_fetched_at)}`
                      ) : (
                        "Not fetched yet"
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => actions.remove(s.id).catch((e) => toast.error(e.message))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Rss}
              title="No sources yet"
              hint="Add an RSS or Atom feed. The autopilot checks these on each run."
            />
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">New topics ({newIdeas.length})</TabsTrigger>
          <TabsTrigger value="used">Used ({usedIdeas.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="mt-4">
          <IdeaList
            ideas={newIdeas}
            empty="Run the autopilot to discover topics from your sources."
          />
        </TabsContent>
        <TabsContent value="used" className="mt-4">
          <IdeaList ideas={usedIdeas} empty="No topics have been turned into posts yet." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IdeaList({
  ideas,
  empty,
}: {
  ideas: {
    id: string;
    title: string;
    url: string;
    summary: string | null;
    status: string;
    published_at: string | null;
    created_at: string;
  }[];
  empty: string;
}) {
  if (!ideas.length) return <EmptyState icon={Radar} title="Nothing here" hint={empty} />;
  return (
    <Card>
      <CardContent className="divide-y divide-border py-2">
        {ideas.map((i) => (
          <div key={i.id} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{i.title}</p>
              {i.summary && (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{i.summary}</p>
              )}
              <div className="mt-1 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                <span>{timeAgo(i.published_at ?? i.created_at)}</span>
                {i.url && !i.url.startsWith("topic:") && (
                  <a
                    href={i.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            <StatusBadge status={i.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

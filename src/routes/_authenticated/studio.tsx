import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, PenLine, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PlatformBadge } from "@/components/app/status";
import { useBrand, usePostActions } from "@/hooks/use-brand";
import { PLATFORMS } from "@/lib/platforms";
import { generateStudioPosts } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/studio")({
  component: Studio,
});

type Draft = { platform: string; content: string; hashtags: string[]; image_prompt: string };

function Studio() {
  const { data: brand } = useBrand();
  const postActions = usePostActions();
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const selected = platforms.length ? platforms : (brand?.platforms ?? []);

  function toggle(id: string) {
    const base = platforms.length ? platforms : (brand?.platforms ?? []);
    setPlatforms(base.includes(id) ? base.filter((p) => p !== id) : [...base, id]);
  }

  async function generate() {
    if (!brand) return;
    if (topic.trim().length < 2) {
      toast.error("Enter a topic first");
      return;
    }
    if (!selected.length) {
      toast.error("Pick at least one platform");
      return;
    }
    setBusy(true);
    setDrafts([]);
    try {
      const res = await generateStudioPosts({
        data: {
          brandId: brand.id,
          topic: topic.trim(),
          instructions: instructions.trim() || undefined,
          platforms: selected,
        },
      });
      if (!res.ok) {
        toast.error(res.error ?? "Generation failed");
        return;
      }
      setDrafts(res.posts);
      if (!res.posts.length) toast.warning("The AI returned no posts for those platforms.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(draft: Draft, schedule: boolean) {
    if (!brand) return;
    try {
      await postActions.create([
        {
          brand_id: brand.id,
          user_id: "",
          platform: draft.platform,
          content: draft.content,
          hashtags: draft.hashtags.map((h) => h.replace(/^#/, "")),
          image_prompt: draft.image_prompt,
          status: schedule ? "scheduled" : "draft",
          scheduled_for: schedule ? new Date(Date.now() + 3600_000).toISOString() : null,
          created_by: "user",
        },
      ]);
      toast.success(schedule ? "Scheduled in 1 hour" : "Saved as draft");
      setDrafts((d) => d.filter((x) => x !== draft));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">Studio</h1>
        <p className="mt-1 text-muted-foreground">
          Generate original posts from a topic, then edit and save them to your queue.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wand2 className="h-4 w-4 text-primary" /> Compose
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Topic or angle</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Why warehouse robots pay for themselves in 18 months"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Extra instructions <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="Lead with a customer stat, keep it under 120 words…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const on = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}
                  >
                    {p.name}
                    {on && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
          <Button onClick={generate} disabled={busy} className="shadow-glow">
            <Sparkles /> {busy ? "Writing…" : "Generate posts"}
          </Button>
        </CardContent>
      </Card>

      {busy && <p className="text-sm text-muted-foreground">The AI is drafting your posts…</p>}

      {drafts.length > 0 && (
        <div className="space-y-4">
          {drafts.map((d, i) => (
            <Card key={i}>
              <CardHeader className="flex-row items-center justify-between">
                <PlatformBadge id={d.platform} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => save(d, false)}>
                    Save draft
                  </Button>
                  <Button size="sm" onClick={() => save(d, true)}>
                    Save & schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={d.content}
                  rows={6}
                  onChange={(e) =>
                    setDrafts((list) =>
                      list.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)),
                    )
                  }
                />
                {d.hashtags?.length > 0 && (
                  <p className="text-xs text-primary/80">
                    {d.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
                  </p>
                )}
                {d.image_prompt && (
                  <p className="text-xs text-muted-foreground">
                    <PenLine className="mr-1 inline h-3 w-3" />
                    image idea: {d.image_prompt}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!busy && !drafts.length && (
        <EmptyState
          icon={Sparkles}
          title="Nothing generated yet"
          hint="Enter a topic above and let the AI write platform-specific drafts."
        />
      )}
    </div>
  );
}

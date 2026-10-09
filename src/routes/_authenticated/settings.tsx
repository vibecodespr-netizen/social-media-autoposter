import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useBrand, useUpdateBrand } from "@/hooks/use-brand";
import { PLATFORMS, parseList } from "@/lib/platforms";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
});

function Settings() {
  const { data: brand, isLoading } = useBrand();
  const updateBrand = useUpdateBrand();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    industry: "",
    audience: "",
    tone: "",
    language: "",
    cta: "",
    topics: "",
    banned: "",
    platforms: [] as string[],
    require_approval: true,
    posts_per_run: 2,
    automation_enabled: false,
  });

  useEffect(() => {
    if (!brand) return;
    setForm({
      name: brand.name ?? "",
      description: brand.description ?? "",
      website: brand.website ?? "",
      industry: brand.industry ?? "",
      audience: brand.audience ?? "",
      tone: brand.tone ?? "",
      language: brand.language ?? "",
      cta: brand.cta ?? "",
      topics: (brand.topics ?? []).join(", "),
      banned: (brand.banned_topics ?? []).join(", "),
      platforms: brand.platforms ?? [],
      require_approval: brand.require_approval,
      posts_per_run: brand.posts_per_run,
      automation_enabled: brand.automation_enabled,
    });
  }, [brand]);

  if (isLoading || !brand) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const togglePlatform = (id: string) =>
    set(
      "platforms",
      form.platforms.includes(id)
        ? form.platforms.filter((p) => p !== id)
        : [...form.platforms, id],
    );

  async function save() {
    setSaving(true);
    try {
      await updateBrand(brand!.id, {
        name: form.name.trim() || "My brand",
        description: form.description,
        website: form.website,
        industry: form.industry,
        audience: form.audience,
        tone: form.tone || "friendly, expert",
        language: form.language || "English",
        cta: form.cta,
        topics: parseList(form.topics),
        banned_topics: parseList(form.banned),
        platforms: form.platforms,
        require_approval: form.require_approval,
        posts_per_run: Math.min(Math.max(form.posts_per_run, 1), 5),
        automation_enabled: form.automation_enabled,
      });
      toast.success("Settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const paused = !!brand.paused_reason;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Brand identity, voice, automation rules and publishing limits.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          <Check /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand profile</CardTitle>
          <CardDescription>Grounds everything the AI writes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Brand name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website">
              <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
            </Field>
            <Field label="Industry">
              <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} />
            </Field>
          </div>
          <Field label="Audience">
            <Input value={form.audience} onChange={(e) => set("audience", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voice & guardrails</CardTitle>
          <CardDescription>How it sounds and what it must never say.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tone">
              <Input value={form.tone} onChange={(e) => set("tone", e.target.value)} />
            </Field>
            <Field label="Language">
              <Input value={form.language} onChange={(e) => set("language", e.target.value)} />
            </Field>
          </div>
          <Field label="Preferred CTA">
            <Input value={form.cta} onChange={(e) => set("cta", e.target.value)} />
          </Field>
          <Field label="Never post about (comma separated)">
            <Textarea
              rows={2}
              value={form.banned}
              onChange={(e) => set("banned", e.target.value)}
            />
          </Field>
          <Field label="Topics (comma separated)">
            <Textarea
              rows={2}
              value={form.topics}
              onChange={(e) => set("topics", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation</CardTitle>
          <CardDescription>Control how the autopilot operates for this brand.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <div className="text-sm font-medium">Autopilot enabled</div>
              <div className="text-xs text-muted-foreground">
                Discover, write and queue content automatically.
              </div>
            </div>
            <Switch
              checked={form.automation_enabled}
              onCheckedChange={(v) => set("automation_enabled", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <div className="text-sm font-medium">Require approval</div>
              <div className="text-xs text-muted-foreground">
                Hold new content in the queue until you approve it.
              </div>
            </div>
            <Switch
              checked={form.require_approval}
              onCheckedChange={(v) => set("require_approval", v)}
            />
          </div>
          <Field label="Max posts per run" hint="1–5">
            <Input
              type="number"
              min={1}
              max={5}
              value={form.posts_per_run}
              onChange={(e) => set("posts_per_run", Number(e.target.value))}
              className="max-w-32"
            />
          </Field>
          <div className="space-y-2">
            <Label>Publishing platforms</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const on = form.platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}
                  >
                    {p.name}
                    {on && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
          <CardDescription>Pause everything or replay setup.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await updateBrand(brand.id, { paused_reason: paused ? null : "Paused manually" });
              toast.success(paused ? "Resumed" : "Paused");
            }}
          >
            {paused ? (
              <>
                <Play /> Resume autopilot
              </>
            ) : (
              <>
                <Pause /> Pause autopilot
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/onboarding">
              <RotateCcw /> Re-run setup wizard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

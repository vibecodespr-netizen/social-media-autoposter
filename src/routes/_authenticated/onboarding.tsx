import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "../index";
import { useBrand, useSourceActions, useSources, useUpdateBrand } from "@/hooks/use-brand";
import { PLATFORMS, parseList } from "@/lib/platforms";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const STEPS = ["Brand", "Voice", "Topics", "Sources", "Platforms", "Activate"];

function Onboarding() {
  const { data: brand, isLoading } = useBrand();
  const updateBrand = useUpdateBrand();
  const { data: sources } = useSources(brand?.id);
  const sourceActions = useSourceActions();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");

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

  if (isLoading || !brand) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>
    );
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const togglePlatform = (id: string) =>
    set(
      "platforms",
      form.platforms.includes(id)
        ? form.platforms.filter((p) => p !== id)
        : [...form.platforms, id],
    );

  async function save(patch: Partial<typeof form> = {}) {
    const merged = { ...form, ...patch };
    await updateBrand(brand!.id, {
      name: merged.name.trim() || "My brand",
      description: merged.description,
      website: merged.website,
      industry: merged.industry,
      audience: merged.audience,
      tone: merged.tone || "friendly, expert",
      language: merged.language || "English",
      cta: merged.cta,
      topics: parseList(merged.topics),
      banned_topics: parseList(merged.banned),
      platforms: merged.platforms,
      require_approval: merged.require_approval,
      posts_per_run: Math.min(Math.max(merged.posts_per_run, 1), 5),
      automation_enabled: merged.automation_enabled,
    });
  }

  async function next() {
    setSaving(true);
    try {
      await save();
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function finish(enableAutomation: boolean) {
    setSaving(true);
    try {
      await save({ automation_enabled: enableAutomation });
      await updateBrand(brand!.id, { onboarded: true, paused_reason: null });
      toast.success(enableAutomation ? "Autopilot is engaged." : "Setup saved. Automation is off.");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function addFeed() {
    const url = feedUrl.trim();
    if (!url) return;
    try {
      new URL(url);
      await sourceActions.add(brand!.id, url);
      setFeedUrl("");
    } catch {
      toast.error("Enter a valid feed URL");
    }
  }

  return (
    <div className="min-h-screen bg-background bg-signal px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <span className="font-mono text-xs text-muted-foreground">
            Step {step + 1} / {STEPS.length}
          </span>
        </div>
        <div className="mb-6 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{STEPS[step]}</CardTitle>
            <CardDescription>{STEP_HINT[step]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <Field label="Brand name">
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Acme Robotics"
                  />
                </Field>
                <Field label="What does your brand do?">
                  <Textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="We build warehouse robots for mid-size logistics teams."
                    rows={3}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Website">
                    <Input
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://acme.com"
                    />
                  </Field>
                  <Field label="Industry">
                    <Input
                      value={form.industry}
                      onChange={(e) => set("industry", e.target.value)}
                      placeholder="Logistics tech"
                    />
                  </Field>
                </div>
                <Field label="Target audience">
                  <Input
                    value={form.audience}
                    onChange={(e) => set("audience", e.target.value)}
                    placeholder="Ops managers at 3PL companies"
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Tone of voice" hint="e.g. confident, warm, technical, playful">
                  <Input
                    value={form.tone}
                    onChange={(e) => set("tone", e.target.value)}
                    placeholder="confident, practical, warm"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Language">
                    <Input
                      value={form.language}
                      onChange={(e) => set("language", e.target.value)}
                      placeholder="English"
                    />
                  </Field>
                  <Field label="Preferred call to action">
                    <Input
                      value={form.cta}
                      onChange={(e) => set("cta", e.target.value)}
                      placeholder="Book a demo"
                    />
                  </Field>
                </div>
                <Field
                  label="Never post about"
                  hint="Comma separated. The AI will filter out these topics."
                >
                  <Textarea
                    value={form.banned}
                    onChange={(e) => set("banned", e.target.value)}
                    placeholder="politics, competitor X, unverified claims"
                    rows={2}
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <Field
                label="Topics your audience cares about"
                hint="Comma separated. Used for research and evergreen posts."
              >
                <Textarea
                  value={form.topics}
                  onChange={(e) => set("topics", e.target.value)}
                  placeholder="warehouse automation, robotics ROI, supply chain trends"
                  rows={4}
                />
              </Field>
            )}

            {step === 3 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Add RSS or Atom feeds the autopilot should watch for fresh topics. Optional — you
                  can add more later.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    placeholder="https://example.com/feed.xml"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeed())}
                  />
                  <Button type="button" variant="secondary" onClick={addFeed}>
                    <Plus /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(sources ?? []).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-mono text-xs">{s.url}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => sourceActions.remove(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {!sources?.length && (
                    <p className="text-xs text-muted-foreground">No feeds yet.</p>
                  )}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PLATFORMS.map((p) => {
                    const on = form.platforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}
                      >
                        {p.name}
                        {on && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Max posts per run">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={form.posts_per_run}
                      onChange={(e) => set("posts_per_run", Number(e.target.value))}
                    />
                  </Field>
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">Require approval</div>
                      <div className="text-xs text-muted-foreground">
                        Review before anything publishes
                      </div>
                    </div>
                    <Switch
                      checked={form.require_approval}
                      onCheckedChange={(v) => set("require_approval", v)}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background/40 p-4 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4 text-primary" /> Ready to go
                  </div>
                  <ul className="mt-3 space-y-1 text-muted-foreground">
                    <li>Brand: {form.name || "My brand"}</li>
                    <li>
                      Platforms:{" "}
                      {form.platforms.length ? form.platforms.join(", ") : "none selected"}
                    </li>
                    <li>
                      Mode:{" "}
                      {form.require_approval ? "prepare & hold for approval" : "fully autonomous"}
                    </li>
                    <li>Feeds watched: {sources?.length ?? 0}</li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  Publishing requires connecting platform accounts. Until an integration is
                  configured, the autopilot will research and draft content but nothing is sent to a
                  network.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1 shadow-glow"
                    disabled={saving || !form.platforms.length}
                    onClick={() => finish(true)}
                  >
                    <Sparkles /> Engage autopilot
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={saving}
                    onClick={() => finish(false)}
                  >
                    Save without automation
                  </Button>
                </div>
              </div>
            )}

            {step < 5 && (
              <div className="flex justify-between pt-2">
                <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft /> Back
                </Button>
                <Button onClick={next} disabled={saving || (step === 0 && !form.name.trim())}>
                  Continue <ArrowRight />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const STEP_HINT: Record<number, string> = {
  0: "Tell us who you are. Everything the AI writes is grounded in this.",
  1: "Define how your brand sounds and what it must avoid.",
  2: "The subjects the autopilot should research and write about.",
  3: "Where should we look for fresh, relevant ideas?",
  4: "Choose where content goes and how much control you keep.",
  5: "Review and turn on your autopilot.",
};

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

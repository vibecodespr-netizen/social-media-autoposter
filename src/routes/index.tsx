import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Radar, PenLine, CalendarClock, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SocialPilot AI — Your social media on autopilot" },
      {
        name: "description",
        content:
          "Configure once. SocialPilot discovers topics, writes on-brand posts for every platform, and keeps your calendar full.",
      },
      { property: "og:title", content: "SocialPilot AI — Your social media on autopilot" },
      {
        property: "og:description",
        content:
          "AI that researches, writes and schedules your social posts — with you always in control.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Radar,
    title: "Discovers",
    text: "Watches your feeds and topics around the clock and surfaces what matters to your audience.",
  },
  {
    icon: PenLine,
    title: "Writes",
    text: "Drafts original, on-brand posts tailored to each platform's format and voice.",
  },
  {
    icon: CalendarClock,
    title: "Schedules",
    text: "Fills your calendar automatically, spaced out at the right rhythm.",
  },
  {
    icon: ShieldCheck,
    title: "You stay in control",
    text: "Approve, edit or pause anything. Nothing ships without the rules you set.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-signal">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6">
        <section className="grid-lines relative mt-10 overflow-hidden rounded-3xl border border-border px-8 py-24 md:px-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" /> autopilot engaged
          </div>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-[0.95] md:text-7xl">
            Your social media,
            <br />
            <span className="text-primary">running itself.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Set your brand voice once. SocialPilot researches, writes and schedules posts for every
            channel — while you watch, edit, or take the wheel any time.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" className="shadow-glow" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Start your autopilot <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
        <section className="grid gap-4 py-20 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <s.icon className="h-6 w-6 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-border py-8 text-center font-mono text-xs text-muted-foreground">
        SocialPilot AI
      </footer>
    </div>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        ◢
      </span>
      SocialPilot
    </Link>
  );
}

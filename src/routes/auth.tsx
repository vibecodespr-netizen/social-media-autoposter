import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { signInAsGuest } from "@/lib/guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./index";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup", "reset"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — SocialPilot AI" },
      { name: "description", content: "Sign in or create your SocialPilot AI account." },
      { property: "og:title", content: "Sign in — SocialPilot AI" },
      { property: "og:description", content: "Access your autonomous social media workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState(initial ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [guestBusy, setGuestBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Password reset link sent.");
      }
    } catch (err) {
      const msg = (err as Error).message;
      if (/weak|easy to guess|known to be/i.test(msg)) {
        toast.error(
          "That password is too easy to guess. Use a longer passphrase (e.g. 4 random words), or continue as a guest instead.",
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function guest() {
    setGuestBusy(true);
    const r = await signInAsGuest();
    setGuestBusy(false);
    if (r.error) toast.error(r.error);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background bg-signal px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="text-2xl font-bold">
            {mode === "signup"
              ? "Create your account"
              : mode === "reset"
                ? "Reset password"
                : "Welcome back"}
          </h1>
          {mode !== "reset" && (
            <>
              <Button variant="outline" className="mt-6 w-full" onClick={google}>
                Continue with Google
              </Button>
              <div className="my-4 text-center font-mono text-xs text-muted-foreground">or</div>
            </>
          )}
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mode !== "reset" && (
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "signup"
                ? "Create account"
                : mode === "reset"
                  ? "Send reset link"
                  : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 flex justify-between text-sm text-muted-foreground">
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="hover:text-foreground"
            >
              {mode === "signup" ? "Have an account? Sign in" : "New here? Sign up"}
            </button>
            {mode === "signin" && (
              <button onClick={() => setMode("reset")} className="hover:text-foreground">
                Forgot?
              </button>
            )}
          </div>
          {mode !== "reset" && (
            <>
              <div className="my-4 flex items-center gap-3 text-center font-mono text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={guest}
                disabled={guestBusy}
              >
                <Sparkles /> {guestBusy ? "Starting…" : "Continue as guest"}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                No account needed. Guest sessions are temporary.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

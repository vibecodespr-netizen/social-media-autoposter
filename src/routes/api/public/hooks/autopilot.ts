import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/autopilot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
        if (!token) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: valid } = await supabaseAdmin.rpc("verify_cron_token", { _token: token });
        if (!valid) return new Response("Unauthorized", { status: 401 });
        const { runAutopilot } = await import("@/lib/autopilot.server");
        const { data: brands } = await supabaseAdmin
          .from("brands")
          .select("id")
          .eq("automation_enabled", true)
          .eq("onboarded", true)
          .is("paused_reason", null)
          .order("last_run_at", { ascending: true, nullsFirst: true })
          .limit(10);
        const results = [];
        for (const b of brands ?? []) {
          try {
            results.push(await runAutopilot(supabaseAdmin, b.id));
          } catch (e) {
            results.push({ ok: false, message: (e as Error).message });
          }
        }
        return Response.json({ processed: results.length });
      },
    },
  },
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAutopilot, writePosts } from "./autopilot.server";
import { AiError } from "./ai.server";

export const runAutopilotNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ brandId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Manual run clears an earlier pause
    await context.supabase.from("brands").update({ paused_reason: null }).eq("id", data.brandId);
    try {
      return await runAutopilot(context.supabase, data.brandId, { manual: true });
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  });

export const generateStudioPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      brandId: z.string().uuid(),
      topic: z.string().min(2).max(500),
      instructions: z.string().max(1000).optional(),
      platforms: z.array(z.string()).min(1).max(7),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: brand, error } = await context.supabase.from("brands").select("*").eq("id", data.brandId).single();
    if (error || !brand) return { ok: false as const, error: "Brand not found", posts: [] };
    try {
      const posts = await writePosts(brand, { title: data.topic, extra: data.instructions }, data.platforms);
      return { ok: true as const, posts, error: null };
    } catch (e) {
      const msg = e instanceof AiError && e.status === 402 ? "AI credits exhausted — add credits to continue." : e instanceof AiError && e.status === 429 ? "Too many requests, try again in a minute." : (e as Error).message;
      return { ok: false as const, error: msg, posts: [] };
    }
  });

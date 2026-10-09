import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAutopilot, writePosts } from "./autopilot.server";
import { publishToPlatform, configuredPlatforms } from "./publishers.server";
import { AiError } from "./ai.server";

export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return { configured: configuredPlatforms() };
  });

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
    z
      .object({
        brandId: z.string().uuid(),
        topic: z.string().min(2).max(500),
        instructions: z.string().max(1000).optional(),
        platforms: z.array(z.string()).min(1).max(7),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: brand, error } = await context.supabase
      .from("brands")
      .select("*")
      .eq("id", data.brandId)
      .single();
    if (error || !brand) return { ok: false as const, error: "Brand not found", posts: [] };
    try {
      const posts = await writePosts(
        brand,
        { title: data.topic, extra: data.instructions },
        data.platforms,
      );
      return { ok: true as const, posts, error: null };
    } catch (e) {
      const msg =
        e instanceof AiError && e.status === 402
          ? "AI credits exhausted — add credits to continue."
          : e instanceof AiError && e.status === 429
            ? "Too many requests, try again in a minute."
            : (e as Error).message;
      return { ok: false as const, error: msg, posts: [] };
    }
  });

export const publishPostNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ postId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.supabase
      .from("posts")
      .select("*")
      .eq("id", data.postId)
      .single();
    if (error || !post)
      return { ok: false as const, status: "failed" as const, message: "Post not found" };

    const result = await publishToPlatform({
      id: post.id,
      platform: post.platform,
      content: post.content,
      hashtags: post.hashtags,
    });

    const status = result.status;
    await context.supabase.from("posts").update({ status }).eq("id", post.id);
    await context.supabase.from("activity_log").insert({
      user_id: post.user_id,
      brand_id: post.brand_id,
      kind:
        result.status === "published"
          ? "success"
          : result.status === "needs_integration"
            ? "info"
            : "error",
      message:
        result.status === "published"
          ? `Published to ${post.platform}${result.url ? `: ${result.url}` : ""}`
          : result.message,
    });

    return {
      ok: result.status === "published",
      status,
      message: result.status === "published" ? "Published" : result.message,
    };
  });

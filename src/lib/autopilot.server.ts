import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { aiJson, AiError } from "./ai.server";
import { fetchFeed } from "./rss.server";
import { publishToPlatform } from "./publishers.server";

type DB = SupabaseClient<Database>;
type Brand = Database["public"]["Tables"]["brands"]["Row"];

export const PLATFORM_RULES: Record<string, string> = {
  linkedin:
    "LinkedIn: professional, 600-1300 chars, short paragraphs, a hook first line, 3-5 hashtags.",
  x: "X: max 270 chars, punchy, 1-2 hashtags.",
  instagram: "Instagram caption: engaging, line breaks, emojis allowed, 8-15 hashtags.",
  facebook: "Facebook Page: conversational, 100-400 chars, ends with a question, 2-3 hashtags.",
  tiktok: "TikTok: write a 20-40s video script with hook, beats, CTA; 3-6 hashtags.",
  youtube: "YouTube Shorts: title line + short script; 3-5 hashtags.",
  pinterest: "Pinterest pin: keyword-rich title + description under 400 chars, 3-5 hashtags.",
};

const postSchema = {
  type: "object",
  additionalProperties: false,
  required: ["posts"],
  properties: {
    posts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["platform", "content", "hashtags", "image_prompt"],
        properties: {
          platform: { type: "string" },
          content: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          image_prompt: { type: "string" },
        },
      },
    },
  },
};

export type GeneratedPost = {
  platform: string;
  content: string;
  hashtags: string[];
  image_prompt: string;
};

export async function writePosts(
  brand: Brand,
  topic: {
    title: string;
    summary?: string | null | undefined;
    url?: string | null | undefined;
    extra?: string | null | undefined;
  },
  platforms: string[],
) {
  const system = `You are the social media lead for the brand "${brand.name}". Write ORIGINAL posts inspired by the topic — never copy source wording.
Brand: ${brand.description || "n/a"}. Industry: ${brand.industry || "n/a"}. Audience: ${brand.audience || "general"}.
Tone: ${brand.tone}. Language: ${brand.language}. Preferred CTA: ${brand.cta || "none"}.
Never mention or touch these topics: ${brand.banned_topics.join(", ") || "none"}. Make no unverifiable claims.
Hashtags without the # symbol. image_prompt: a vivid description for an accompanying image.
Return exactly one post per requested platform, using the platform id as given.`;
  const user = `Topic: ${topic.title}\n${topic.summary ? `Context: ${topic.summary}\n` : ""}${topic.url && !topic.url.startsWith("topic:") ? `Source: ${topic.url}\n` : ""}${topic.extra ? `Instructions: ${topic.extra}\n` : ""}
Platforms:\n${platforms.map((p) => `- ${p}: ${PLATFORM_RULES[p] ?? p}`).join("\n")}`;
  const out = await aiJson<{ posts: GeneratedPost[] }>({
    system,
    user,
    schemaName: "social_posts",
    schema: postSchema,
  });
  return out.posts.filter((p) => platforms.includes(p.platform));
}

async function log(db: DB, brand: Brand, message: string, kind = "info") {
  await db
    .from("activity_log")
    .insert({ user_id: brand.user_id, brand_id: brand.id, kind, message });
}

export async function runAutopilot(db: DB, brandId: string, opts: { manual?: boolean } = {}) {
  const now = new Date();
  const { data: locked } = await db
    .from("brands")
    .update({ lock_until: new Date(now.getTime() + 5 * 60_000).toISOString() })
    .eq("id", brandId)
    .or(`lock_until.is.null,lock_until.lt.${now.toISOString()}`)
    .select()
    .maybeSingle();
  if (!locked) return { ok: false, message: "A run is already in progress" };
  const brand = locked as Brand;
  let created = 0;
  let discovered = 0;
  try {
    if (brand.paused_reason && !opts.manual)
      return { ok: false, message: `Paused: ${brand.paused_reason}` };

    // 1. Discovery
    const { data: sources } = await db
      .from("sources")
      .select("*")
      .eq("brand_id", brand.id)
      .eq("active", true)
      .limit(8);
    for (const s of sources ?? []) {
      try {
        const items = await fetchFeed(s.url, 10);
        const banned = brand.banned_topics.map((b) => b.toLowerCase()).filter(Boolean);
        const rows = items
          .filter((i) => !banned.some((b) => `${i.title} ${i.summary}`.toLowerCase().includes(b)))
          .map((i) => ({ ...i, user_id: brand.user_id, brand_id: brand.id, source_id: s.id }));
        if (rows.length) {
          const { data: ins } = await db
            .from("ideas")
            .upsert(rows, { onConflict: "brand_id,url", ignoreDuplicates: true })
            .select("id");
          discovered += ins?.length ?? 0;
        }
        await db
          .from("sources")
          .update({ last_fetched_at: now.toISOString(), last_error: null })
          .eq("id", s.id);
      } catch (e) {
        await db
          .from("sources")
          .update({ last_fetched_at: now.toISOString(), last_error: (e as Error).message })
          .eq("id", s.id);
      }
    }
    // Evergreen ideas from topics when nothing fresh
    const { count: freshCount } = await db
      .from("ideas")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brand.id)
      .eq("status", "new");
    if (!freshCount && brand.topics.length) {
      const day = now.toISOString().slice(0, 10);
      const rows = brand.topics.slice(0, 3).map((t) => ({
        user_id: brand.user_id,
        brand_id: brand.id,
        title: t,
        url: `topic:${t}:${day}`,
        summary: "Evergreen topic from your brand settings",
      }));
      const { data: ins } = await db
        .from("ideas")
        .upsert(rows, { onConflict: "brand_id,url", ignoreDuplicates: true })
        .select("id");
      discovered += ins?.length ?? 0;
    }

    // 2. Writing
    const { data: ideas } = await db
      .from("ideas")
      .select("*")
      .eq("brand_id", brand.id)
      .eq("status", "new")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(Math.min(brand.posts_per_run, 5));
    let slot = 0;
    for (const idea of ideas ?? []) {
      try {
        const posts = await writePosts(brand, idea, brand.platforms);
        const rows = posts.map((p) => {
          slot++;
          return {
            user_id: brand.user_id,
            brand_id: brand.id,
            idea_id: idea.id,
            platform: p.platform,
            content: p.content,
            hashtags: p.hashtags.map((h) => h.replace(/^#/, "")),
            image_prompt: p.image_prompt,
            status: brand.require_approval ? "draft" : "scheduled",
            scheduled_for: new Date(now.getTime() + slot * 3 * 3600_000).toISOString(),
            created_by: "ai",
          };
        });
        await db.from("posts").insert(rows);
        await db.from("ideas").update({ status: "used" }).eq("id", idea.id);
        created += rows.length;
      } catch (e) {
        if (e instanceof AiError && [402, 403, 429].includes(e.status)) {
          const reason =
            e.status === 402
              ? "AI credits exhausted"
              : e.status === 429
                ? "AI rate limited — will retry next run"
                : e.message;
          if (e.status !== 429)
            await db.from("brands").update({ paused_reason: reason }).eq("id", brand.id);
          await log(db, brand, `Autopilot paused: ${reason}`, "error");
          break;
        }
        await log(
          db,
          brand,
          `Could not write posts for "${idea.title}": ${(e as Error).message}`,
          "error",
        );
      }
    }
    const msg = `${opts.manual ? "Manual run" : "Autopilot run"}: ${discovered} new ideas discovered, ${created} posts ${brand.require_approval ? "drafted for review" : "scheduled"}.`;
    await log(db, brand, msg, created ? "success" : "info");
    return { ok: true, message: msg, created, discovered };
  } finally {
    await db
      .from("brands")
      .update({ lock_until: null, last_run_at: new Date().toISOString() })
      .eq("id", brand.id);
  }
}

// Dispatch posts whose scheduled time has passed. Publishing adapters report
// `needs_integration` when no platform credentials exist, so due posts are left
// scheduled (not silently dropped) and a single note is written to the log.
export async function dispatchDuePosts(db: DB, brand: Brand) {
  if (brand.paused_reason) return { published: 0, blocked: 0, failed: 0 };
  const now = new Date().toISOString();
  const { data: due } = await db
    .from("posts")
    .select("*")
    .eq("brand_id", brand.id)
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .limit(20);
  if (!due?.length) return { published: 0, blocked: 0, failed: 0 };

  let published = 0;
  let blocked = 0;
  let failed = 0;
  let blockedMessage = "";
  for (const post of due) {
    const result = await publishToPlatform({
      id: post.id,
      platform: post.platform,
      content: post.content,
      hashtags: post.hashtags,
    });
    if (result.status === "published") {
      published++;
      await db.from("posts").update({ status: "published" }).eq("id", post.id);
      await db.from("activity_log").insert({
        user_id: post.user_id,
        brand_id: brand.id,
        kind: "success",
        message: `Published to ${post.platform}${result.url ? `: ${result.url}` : ""}`,
      });
    } else if (result.status === "needs_integration") {
      blocked++;
      blockedMessage = result.message;
    } else {
      failed++;
      await db.from("posts").update({ status: "failed" }).eq("id", post.id);
      await db.from("activity_log").insert({
        user_id: post.user_id,
        brand_id: brand.id,
        kind: "error",
        message: `Failed to publish to ${post.platform}: ${result.message}`,
      });
    }
  }
  if (blocked) {
    await log(db, brand, `${blocked} post(s) are due but were not sent. ${blockedMessage}`, "info");
  }
  return { published, blocked, failed };
}

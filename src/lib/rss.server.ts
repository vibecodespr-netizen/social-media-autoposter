export type FeedItem = { title: string; url: string; summary: string; published_at: string | null };

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}
function tag(block: string, name: string) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

export async function fetchFeed(url: string, limit = 10): Promise<FeedItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "SocialPilotAI/1.0 (+feed reader)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
  });
  if (!res.ok) throw new Error(`Feed returned ${res.status}`);
  const xml = (await res.text()).slice(0, 2_000_000);
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  for (const b of blocks.slice(0, limit)) {
    let link = tag(b, "link");
    if (!link) {
      const m = b.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = m?.[1] ?? "";
    }
    const title = tag(b, "title");
    if (!title || !link) continue;
    const summary = (tag(b, "description") || tag(b, "summary") || tag(b, "content")).slice(0, 600);
    const date = tag(b, "pubDate") || tag(b, "published") || tag(b, "updated");
    const d = date ? new Date(date) : null;
    items.push({ title: title.slice(0, 300), url: link.trim(), summary, published_at: d && !isNaN(+d) ? d.toISOString() : null });
  }
  if (!blocks.length) throw new Error("No RSS/Atom items found");
  return items;
}

export const PLATFORMS = [
  {
    id: "linkedin",
    name: "LinkedIn",
    needs:
      "LinkedIn developer app with Community Management API (w_member_social / w_organization_social)",
  },
  { id: "x", name: "X", needs: "X API Basic tier or higher with OAuth 2.0 write access" },
  {
    id: "instagram",
    name: "Instagram",
    needs:
      "Meta developer app + Instagram Business account, App Review for instagram_content_publish",
  },
  {
    id: "facebook",
    name: "Facebook Pages",
    needs: "Meta developer app, App Review for pages_manage_posts",
  },
  {
    id: "tiktok",
    name: "TikTok",
    needs: "TikTok for Developers app with Content Posting API approval",
  },
  {
    id: "youtube",
    name: "YouTube",
    needs: "Google Cloud project with YouTube Data API v3 + OAuth verification",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    needs: "Pinterest developer app with pins:write (Standard access)",
  },
] as const;

export const platformName = (id: string) => PLATFORMS.find((p) => p.id === id)?.name ?? id;

export const parseList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

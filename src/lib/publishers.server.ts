// Platform publishing adapters.
//
// Every adapter reports whether its official API credentials are configured via
// environment variables. When credentials are missing the adapter NEVER fakes a
// successful publish — it returns `needs_integration` so the UI can show the
// exact setup that is required. Real API calls must be added per platform once
// credentials and app review are in place.

import { PLATFORMS } from "./platforms";

export type PublishInput = {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
};

export type PublishResult =
  | { status: "published"; externalId: string; url: string | null }
  | { status: "needs_integration"; message: string }
  | { status: "failed"; message: string };

const ENV_KEYS: Record<string, string[]> = {
  linkedin: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  x: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
  instagram: ["META_APP_ID", "META_APP_SECRET"],
  facebook: ["META_APP_ID", "META_APP_SECRET"],
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  youtube: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  pinterest: ["PINTEREST_APP_ID", "PINTEREST_APP_SECRET"],
};

export function isPlatformConfigured(platform: string): boolean {
  const keys = ENV_KEYS[platform];
  if (!keys || !keys.length) return false;
  return keys.every((k) => !!process.env[k]);
}

export function platformSetup(platform: string): string {
  return PLATFORMS.find((p) => p.id === platform)?.needs ?? "Unknown platform";
}

export async function publishToPlatform(input: PublishInput): Promise<PublishResult> {
  if (!PLATFORMS.some((p) => p.id === input.platform)) {
    return { status: "failed", message: `Unsupported platform "${input.platform}"` };
  }
  if (!isPlatformConfigured(input.platform)) {
    return {
      status: "needs_integration",
      message: `${input.platform} is not connected yet. Required: ${platformSetup(input.platform)}`,
    };
  }
  // Credentials exist but no live API call is implemented in this build.
  return {
    status: "failed",
    message: `${input.platform} credentials are present but the live publishing call is not implemented in this build.`,
  };
}

export function configuredPlatforms(): string[] {
  return PLATFORMS.filter((p) => isPlatformConfigured(p.id)).map((p) => p.id);
}

const BOT_RE =
  /bot|crawler|spider|crawl|headless|lighthouse|slurp|facebookexternalhit|preview|scanner|python-requests|curl|wget|phantom|puppeteer|playwright/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true;
  return BOT_RE.test(ua);
}

export function parseDevice(
  ua: string | null | undefined,
): "mobile" | "desktop" {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua ?? "") ? "mobile" : "desktop";
}

export function capStr(v: unknown, max: number): string | null {
  if (typeof v !== "string" || v.length === 0) return null;
  return v.length > max ? v.slice(0, max) : v;
}

export function parseUtm(query: Record<string, unknown>): {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
} {
  return {
    utmSource: capStr(query["utm_source"], 128),
    utmMedium: capStr(query["utm_medium"], 128),
    utmCampaign: capStr(query["utm_campaign"], 128),
  };
}

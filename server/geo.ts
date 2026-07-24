const GEO_TIMEOUT_MS = 2000;

/**
 * Resolve an IP to a full country name (e.g. "Thailand") via ip-api.com —
 * the same source/format the analytics LanderSession already stores.
 * Best-effort: any failure (missing IP, timeout, network error, non-OK
 * status, rate limit, private/reserved IP "fail" payload) yields undefined.
 * Never throws — a geo lookup must never block or fail the caller.
 */
export async function countryFromIp(
  ip: string | null | undefined,
): Promise<string | undefined> {
  if (!ip) return undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`, {
      signal: controller.signal,
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      status?: string;
      country?: string;
    };
    if (data?.status === "fail") return undefined;
    return typeof data?.country === "string" && data.country !== ""
      ? data.country
      : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

import { randomUUID } from "crypto";

export const VISITOR_COOKIE = "oxy_vid";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface VisitorInfo {
  visitorId: string;
  isReturning: boolean;
}

// First-party per-domain visitor identity: "returning" means this browser has
// visited THIS domain before. Malformed cookies degrade to a new visitor.
export function resolveVisitor(cookieValue: string | undefined): VisitorInfo {
  if (typeof cookieValue === "string" && UUID_RE.test(cookieValue)) {
    return { visitorId: cookieValue, isReturning: true };
  }
  return { visitorId: randomUUID(), isReturning: false };
}

export function buildVisitorCookie(visitorId: string, secure: boolean): string {
  const parts = [
    `${VISITOR_COOKIE}=${visitorId}`,
    "Max-Age=31536000",
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

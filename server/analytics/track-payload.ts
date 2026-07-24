import { capStr } from "./visit-context";

export type ExitType = "clicked_through" | "back" | "closed" | "unknown";

export interface TrackPayload {
  sessionId: string;
  type: "click" | "step" | "exit" | "link";
  clickTarget: string | null;
  stepId: string | null;
  label: string | null;
  exitType: ExitType | null;
  timeOnPageMs: number | null;
  maxScrollPct: number | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = new Set(["click", "step", "exit", "link"]);
// The wire never carries clicked_through — that is only set server-side on a
// click event. Anything unexpected collapses to "unknown".
const WIRE_EXITS = new Set(["back", "closed", "unknown"]);

const EXIT_RANK: Record<ExitType, number> = {
  unknown: 0,
  closed: 1,
  back: 2,
  clicked_through: 3,
};

export function promoteExitType(
  current: ExitType,
  incoming: ExitType,
): ExitType {
  return EXIT_RANK[incoming] > EXIT_RANK[current] ? incoming : current;
}

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function parseTrackPayload(body: unknown): TrackPayload | null {
  let raw: any = body;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.sessionId !== "string" || !UUID_RE.test(raw.sessionId)) {
    return null;
  }
  if (typeof raw.type !== "string" || !TYPES.has(raw.type)) return null;

  const exitType: ExitType | null =
    raw.type === "exit"
      ? WIRE_EXITS.has(raw.exitType)
        ? (raw.exitType as ExitType)
        : "unknown"
      : null;

  return {
    sessionId: raw.sessionId,
    type: raw.type,
    clickTarget: capStr(raw.clickTarget, 512),
    stepId: capStr(raw.stepId, 128),
    label: capStr(raw.label, 256),
    exitType,
    timeOnPageMs: clampInt(raw.timeOnPageMs, 0, 86_400_000),
    maxScrollPct: clampInt(raw.maxScrollPct, 0, 100),
  };
}

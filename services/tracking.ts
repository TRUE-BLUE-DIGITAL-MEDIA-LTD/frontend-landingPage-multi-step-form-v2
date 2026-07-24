import { computeScrollPct, createExitState } from "./tracking-core";

export interface LanderTracker {
  trackClick(target: string): void;
  trackLink(target: string): void;
  trackStep(stepId: string, label?: string | null): void;
  destroy(): void;
}

const noop: LanderTracker = {
  trackClick() {},
  trackLink() {},
  trackStep() {},
  destroy() {},
};

export function initLanderTracking(opts: {
  sessionId: string;
}): LanderTracker {
  if (typeof window === "undefined") return noop;
  const { sessionId } = opts;
  const startedAt = Date.now();
  const exit = createExitState();
  let maxScroll = 0;
  let trapArmed = false;

  const post = (payload: Record<string, unknown>) => {
    try {
      void fetch("/api/track", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...payload }),
      }).catch(() => {
        /* tracking must never break the lander */
      });
    } catch {
      /* tracking must never break the lander */
    }
  };

  const sendExit = () => {
    const payload = {
      sessionId,
      type: "exit",
      exitType: exit.resolve(),
      timeOnPageMs: Date.now() - startedAt,
      maxScrollPct: maxScroll,
    };
    // Duplicate exits are fine: the server's exit-type precedence never
    // downgrades, and later time/scroll values are simply fresher.
    try {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      if (!navigator.sendBeacon?.("/api/track", blob)) post(payload);
    } catch {
      post(payload);
    }
  };

  const onScroll = () => {
    maxScroll = Math.max(
      maxScroll,
      computeScrollPct(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
      ),
    );
  };
  const onPageHide = () => sendExit();
  const onVisibility = () => {
    if (document.visibilityState === "hidden") sendExit();
  };
  const onPopState = () => {
    if (!trapArmed) return;
    trapArmed = false;
    exit.markBack();
    sendExit();
    // Let the back press actually leave the page.
    window.history.back();
  };

  try {
    if ((window.history.state as { oxyTrack?: boolean } | null)?.oxyTrack !== true) {
      window.history.pushState({ oxyTrack: true }, "", window.location.href);
    }
    trapArmed = true;
  } catch {
    /* history API unavailable — back detection degrades to "closed" */
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("popstate", onPopState);
  onScroll();

  return {
    trackClick(target: string) {
      exit.markClick();
      post({ type: "click", clickTarget: target });
    },
    trackLink(target: string) {
      post({ type: "link", clickTarget: target });
    },
    trackStep(stepId: string, label?: string | null) {
      post({ type: "step", stepId, label: label ?? null });
    },
    destroy() {
      trapArmed = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("popstate", onPopState);
    },
  };
}

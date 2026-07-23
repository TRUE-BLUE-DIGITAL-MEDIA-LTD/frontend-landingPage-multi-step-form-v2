import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyTrackEvent } from "./apply-track-event";
import type { TrackPayload } from "./track-payload";

const SID = "123e4567-e89b-42d3-a456-426614174000";

function payload(over: Partial<TrackPayload>): TrackPayload {
  return {
    sessionId: SID,
    type: "click",
    clickTarget: null,
    stepId: null,
    label: null,
    exitType: null,
    timeOnPageMs: null,
    maxScrollPct: null,
    ...over,
  };
}

function fakePrisma(session: any) {
  const updates: any[] = [];
  return {
    updates,
    landerSession: {
      findUnique: async () => session,
      update: async (args: any) => {
        updates.push(args);
        return args.data;
      },
    },
  } as any;
}

describe("applyTrackEvent", () => {
  it("click sets clickedMain, target, and clicked_through exit", async () => {
    const prisma = fakePrisma({ id: "1", exitType: "unknown", steps: null });
    await applyTrackEvent(prisma, payload({ type: "click", clickTarget: "https://x.com" }));
    const data = prisma.updates[0].data;
    assert.equal(data.clickedMain, true);
    assert.equal(data.clickTarget, "https://x.com");
    assert.equal(data.exitType, "clicked_through");
    assert.ok(data.clickedAt instanceof Date);
  });

  it("exit never downgrades clicked_through", async () => {
    const prisma = fakePrisma({ id: "1", exitType: "clicked_through", steps: null });
    await applyTrackEvent(
      prisma,
      payload({ type: "exit", exitType: "closed", timeOnPageMs: 5000, maxScrollPct: 80 }),
    );
    const data = prisma.updates[0].data;
    assert.equal(data.exitType, "clicked_through");
    assert.equal(data.timeOnPageMs, 5000);
    assert.equal(data.maxScrollPct, 80);
  });

  it("step appends to steps and caps at 50", async () => {
    const existing = Array.from({ length: 50 }, (_, i) => ({ stepId: `s${i}` }));
    const prisma = fakePrisma({ id: "1", exitType: "unknown", steps: existing });
    await applyTrackEvent(prisma, payload({ type: "step", stepId: "s50", label: "L" }));
    assert.equal(prisma.updates.length, 0); // capped: no write

    const prisma2 = fakePrisma({ id: "1", exitType: "unknown", steps: [{ stepId: "a" }] });
    await applyTrackEvent(prisma2, payload({ type: "step", stepId: "b", label: "B" }));
    const steps = prisma2.updates[0].data.steps;
    assert.equal(steps.length, 2);
    assert.equal(steps[1].stepId, "b");
    assert.equal(steps[1].label, "B");
    assert.equal(typeof steps[1].at, "string");
  });

  it("unknown session is a silent no-op", async () => {
    const prisma = fakePrisma(null);
    await applyTrackEvent(prisma, payload({ type: "click" }));
    assert.equal(prisma.updates.length, 0);
  });

  it("link appends a steps entry and never sets clickedMain", async () => {
    const prisma = fakePrisma({ id: "1", exitType: "unknown", steps: null });
    await applyTrackEvent(
      prisma,
      payload({ type: "link", clickTarget: "https://x.com/privacy" }),
    );
    assert.equal(prisma.updates.length, 1);
    const data = prisma.updates[0].data;
    assert.equal(data.clickedMain, undefined);
    assert.equal(data.exitType, undefined);
    assert.equal(data.steps.length, 1);
    assert.equal(data.steps[0].stepId, "link");
    assert.equal(data.steps[0].label, "https://x.com/privacy");
    assert.equal(typeof data.steps[0].at, "string");
  });

  it("link respects the 50-step cap", async () => {
    const existing = Array.from({ length: 50 }, (_, i) => ({ stepId: `s${i}` }));
    const prisma = fakePrisma({ id: "1", exitType: "unknown", steps: existing });
    await applyTrackEvent(prisma, payload({ type: "link", clickTarget: "https://x.com" }));
    assert.equal(prisma.updates.length, 0);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseTrackPayload, promoteExitType } from "./track-payload";

const SID = "123e4567-e89b-42d3-a456-426614174000";

describe("parseTrackPayload", () => {
  it("parses a JSON string body (sendBeacon)", () => {
    const p = parseTrackPayload(
      JSON.stringify({ sessionId: SID, type: "exit", exitType: "back", timeOnPageMs: 1200, maxScrollPct: 55 }),
    );
    assert.equal(p?.type, "exit");
    assert.equal(p?.exitType, "back");
    assert.equal(p?.timeOnPageMs, 1200);
    assert.equal(p?.maxScrollPct, 55);
  });
  it("parses an object body (fetch json)", () => {
    const p = parseTrackPayload({ sessionId: SID, type: "click", clickTarget: "https://x.com" });
    assert.equal(p?.type, "click");
    assert.equal(p?.clickTarget, "https://x.com");
  });
  it("rejects bad sessionId, bad type, and garbage", () => {
    assert.equal(parseTrackPayload({ sessionId: "nope", type: "click" }), null);
    assert.equal(parseTrackPayload({ sessionId: SID, type: "boom" }), null);
    assert.equal(parseTrackPayload("not json {"), null);
    assert.equal(parseTrackPayload(null), null);
  });
  it("clamps numbers and coerces invalid exitType to unknown", () => {
    const p = parseTrackPayload({
      sessionId: SID, type: "exit", exitType: "clicked_through", // client never sends this; must not be trusted
      timeOnPageMs: -5, maxScrollPct: 400,
    });
    assert.equal(p?.exitType, "unknown"); // only back|closed|unknown accepted from the wire
    assert.equal(p?.timeOnPageMs, 0);
    assert.equal(p?.maxScrollPct, 100);
  });
  it("caps step strings", () => {
    const p = parseTrackPayload({ sessionId: SID, type: "step", stepId: "s".repeat(300), label: "l".repeat(300) });
    assert.equal(p?.stepId?.length, 128);
    assert.equal(p?.label?.length, 256);
  });
  it("returns null for non-finite numeric inputs and type mismatches", () => {
    const p1 = parseTrackPayload({ sessionId: SID, type: "exit", timeOnPageMs: NaN, maxScrollPct: 50 });
    assert.equal(p1?.timeOnPageMs, null);
    assert.equal(p1?.maxScrollPct, 50);

    const p2 = parseTrackPayload({ sessionId: SID, type: "exit", timeOnPageMs: Infinity, maxScrollPct: 75 });
    assert.equal(p2?.timeOnPageMs, null);
    assert.equal(p2?.maxScrollPct, 75);

    const p3 = parseTrackPayload({ sessionId: SID, type: "exit", timeOnPageMs: 500, maxScrollPct: "50" });
    assert.equal(p3?.timeOnPageMs, 500);
    assert.equal(p3?.maxScrollPct, null);

    const p4 = parseTrackPayload({ sessionId: SID, type: "exit" });
    assert.equal(p4?.timeOnPageMs, null);
    assert.equal(p4?.maxScrollPct, null);
  });
});

describe("link payloads", () => {
  it("accepts type link with the URL in clickTarget", () => {
    const p = parseTrackPayload({
      sessionId: "123e4567-e89b-42d3-a456-426614174000",
      type: "link",
      clickTarget: "https://x.com/privacy",
    });
    assert.equal(p?.type, "link");
    assert.equal(p?.clickTarget, "https://x.com/privacy");
  });
});

describe("promoteExitType", () => {
  it("never downgrades", () => {
    assert.equal(promoteExitType("clicked_through", "closed"), "clicked_through");
    assert.equal(promoteExitType("back", "closed"), "back");
    assert.equal(promoteExitType("closed", "back"), "back");
    assert.equal(promoteExitType("unknown", "closed"), "closed");
    assert.equal(promoteExitType("unknown", "unknown"), "unknown");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeScrollPct, createExitState } from "./tracking-core";

describe("createExitState", () => {
  it("defaults to closed", () => {
    assert.equal(createExitState().resolve(), "closed");
  });
  it("back beats closed", () => {
    const s = createExitState();
    s.markBack();
    assert.equal(s.resolve(), "back");
  });
  it("click beats back", () => {
    const s = createExitState();
    s.markBack();
    s.markClick();
    assert.equal(s.resolve(), "clicked_through");
  });
});

describe("computeScrollPct", () => {
  it("computes viewport-bottom percentage", () => {
    assert.equal(computeScrollPct(0, 800, 2000), 40);
    assert.equal(computeScrollPct(1200, 800, 2000), 100);
  });
  it("clamps and survives zero heights", () => {
    assert.equal(computeScrollPct(99999, 800, 2000), 100);
    assert.equal(computeScrollPct(0, 800, 0), 0);
  });
});

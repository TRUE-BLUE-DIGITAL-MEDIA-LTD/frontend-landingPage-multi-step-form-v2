import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { isNewTabAnchor } from "./new-tab";

describe("isNewTabAnchor", () => {
  it("matches target=_blank", () => {
    assert.equal(isNewTabAnchor("_blank"), true);
  });

  it("tolerates case and whitespace variants authors may produce", () => {
    assert.equal(isNewTabAnchor(" _blank "), true);
    assert.equal(isNewTabAnchor("_BLANK"), true);
  });

  it("rejects same-tab and framed targets", () => {
    assert.equal(isNewTabAnchor("_self"), false);
    assert.equal(isNewTabAnchor("_parent"), false);
    assert.equal(isNewTabAnchor("_top"), false);
    assert.equal(isNewTabAnchor("my-frame"), false);
  });

  it("rejects missing targets", () => {
    assert.equal(isNewTabAnchor(""), false);
    assert.equal(isNewTabAnchor(null), false);
    assert.equal(isNewTabAnchor(undefined), false);
  });
});

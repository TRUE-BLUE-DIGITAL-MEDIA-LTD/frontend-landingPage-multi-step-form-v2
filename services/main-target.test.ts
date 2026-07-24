import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isMainTarget } from "./main-target";

const MAIN = "https://offer.example.com/go";

describe("isMainTarget", () => {
  it("matches the exact mainButton URL", () => {
    assert.equal(isMainTarget(MAIN, MAIN), true);
  });

  it("ignores query params (subids vary per placement)", () => {
    assert.equal(isMainTarget(`${MAIN}?sub1=abc&clickid=9`, MAIN), true);
    assert.equal(isMainTarget(MAIN, `${MAIN}?sub2=x`), true);
  });

  it("normalizes trailing slashes", () => {
    assert.equal(isMainTarget(`${MAIN}/`, MAIN), true);
    assert.equal(isMainTarget("https://offer.example.com", "https://offer.example.com/"), true);
  });

  it("rejects a different path on the same origin", () => {
    assert.equal(isMainTarget("https://offer.example.com/privacy", MAIN), false);
  });

  it("rejects a different origin with the same path", () => {
    assert.equal(isMainTarget("https://other.example.com/go", MAIN), false);
  });

  it("rejects malformed or missing URLs", () => {
    assert.equal(isMainTarget("not a url", MAIN), false);
    assert.equal(isMainTarget(MAIN, "not a url"), false);
    assert.equal(isMainTarget(null, MAIN), false);
    assert.equal(isMainTarget(MAIN, undefined), false);
    assert.equal(isMainTarget("", MAIN), false);
  });
});

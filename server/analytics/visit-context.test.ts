import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isBotUserAgent,
  parseDevice,
  parseUtm,
  capStr,
} from "./visit-context";

describe("isBotUserAgent", () => {
  it("flags missing UA as bot", () => {
    assert.equal(isBotUserAgent(undefined), true);
    assert.equal(isBotUserAgent(""), true);
  });
  it("flags common crawlers", () => {
    assert.equal(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
    assert.equal(isBotUserAgent("facebookexternalhit/1.1"), true);
    assert.equal(isBotUserAgent("HeadlessChrome/120.0"), true);
    assert.equal(isBotUserAgent("curl/8.0"), true);
  });
  it("passes real browsers", () => {
    assert.equal(
      isBotUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
      false,
    );
  });
});

describe("parseDevice", () => {
  it("detects mobile", () => {
    assert.equal(parseDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"), "mobile");
    assert.equal(parseDevice("Mozilla/5.0 (Linux; Android 14)"), "mobile");
  });
  it("defaults to desktop", () => {
    assert.equal(parseDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "desktop");
    assert.equal(parseDevice(undefined), "desktop");
  });
});

describe("parseUtm", () => {
  it("extracts string utm params", () => {
    assert.deepEqual(
      parseUtm({ utm_source: "fb", utm_medium: "cpc", utm_campaign: "july" }),
      { utmSource: "fb", utmMedium: "cpc", utmCampaign: "july" },
    );
  });
  it("returns nulls for missing/array values", () => {
    assert.deepEqual(parseUtm({ utm_source: ["a", "b"] }), {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    });
  });
});

describe("capStr", () => {
  it("caps long strings and nulls non-strings", () => {
    assert.equal(capStr("a".repeat(600), 512)?.length, 512);
    assert.equal(capStr(123, 512), null);
    assert.equal(capStr(null, 512), null);
    assert.equal(capStr("ok", 512), "ok");
  });
});

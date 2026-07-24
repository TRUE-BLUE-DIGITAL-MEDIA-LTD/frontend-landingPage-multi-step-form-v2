import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recordLanderView } from "./record-view";

const REAL_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";

function fakePrisma() {
  const calls: any[] = [];
  return {
    calls,
    landerSession: {
      create: async (args: any) => {
        calls.push(args);
        return args.data;
      },
    },
  } as any;
}

describe("recordLanderView", () => {
  it("creates a session and returns a UUID sessionId", async () => {
    const prisma = fakePrisma();
    const sessionId = await recordLanderView({
      prisma,
      landingPageId: "lp1",
      domainId: "d1",
      country: "United States",
      userAgent: REAL_UA,
      referrer: "https://t.co/xyz",
      query: { utm_source: "tw" },
      visitorId: "123e4567-e89b-42d3-a456-426614174000",
      isReturning: true,
    });
    assert.match(
      sessionId as string,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    const data = prisma.calls[0].data;
    assert.equal(data.landingPageId, "lp1");
    assert.equal(data.domainId, "d1");
    assert.equal(data.device, "desktop");
    assert.equal(data.utmSource, "tw");
    assert.equal(data.referrer, "https://t.co/xyz");
    assert.equal(data.visitorId, "123e4567-e89b-42d3-a456-426614174000");
    assert.equal(data.isReturning, true);
  });

  it("returns null for bots and does not write", async () => {
    const prisma = fakePrisma();
    const sessionId = await recordLanderView({
      prisma,
      landingPageId: "lp1",
      domainId: null,
      country: null,
      userAgent: "Googlebot/2.1",
      referrer: undefined,
      query: {},
      visitorId: "123e4567-e89b-42d3-a456-426614174000",
      isReturning: false,
    });
    assert.equal(sessionId, null);
    assert.equal(prisma.calls.length, 0);
  });

  it("returns null instead of throwing when the DB write fails", async () => {
    const prisma = {
      landerSession: {
        create: async () => {
          throw new Error("db down");
        },
      },
    } as any;
    const sessionId = await recordLanderView({
      prisma,
      landingPageId: "lp1",
      domainId: null,
      country: null,
      userAgent: REAL_UA,
      referrer: undefined,
      query: {},
      visitorId: null,
      isReturning: false,
    });
    assert.equal(sessionId, null);
  });
});

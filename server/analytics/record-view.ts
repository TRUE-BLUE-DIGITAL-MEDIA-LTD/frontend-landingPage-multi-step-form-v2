import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { capStr, isBotUserAgent, parseDevice, parseUtm } from "./visit-context";

export async function recordLanderView(dto: {
  prisma: PrismaClient;
  landingPageId: string;
  domainId: string | null;
  country: string | null;
  userAgent: string | undefined;
  referrer: string | undefined;
  query: Record<string, unknown>;
  visitorId: string | null;
  isReturning: boolean;
}): Promise<string | null> {
  try {
    if (isBotUserAgent(dto.userAgent)) return null;
    const sessionId = randomUUID();
    const utm = parseUtm(dto.query);
    await dto.prisma.landerSession.create({
      data: {
        sessionId,
        landingPageId: dto.landingPageId,
        domainId: dto.domainId,
        country: capStr(dto.country, 64),
        device: parseDevice(dto.userAgent),
        referrer: capStr(dto.referrer, 512),
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
        visitorId: dto.visitorId,
        isReturning: dto.isReturning,
      },
    });
    return sessionId;
  } catch (err) {
    console.error("[analytics] record view failed", err);
    return null;
  }
}

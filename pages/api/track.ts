import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { applyTrackEvent } from "@/server/analytics/apply-track-event";
import { parseTrackPayload } from "@/server/analytics/track-payload";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(204).end();
    return;
  }
  try {
    // sendBeacon posts a Blob; Next may deliver it as a string body.
    const payload = parseTrackPayload(req.body);
    if (payload) {
      await applyTrackEvent(prisma, payload);
    }
  } catch (err) {
    console.error("[analytics] track failed", err);
  }
  res.status(204).end();
}

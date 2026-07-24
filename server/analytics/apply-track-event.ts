import type { PrismaClient } from "@prisma/client";
import {
  ExitType,
  promoteExitType,
  TrackPayload,
} from "./track-payload";

const MAX_STEPS = 50;

export async function applyTrackEvent(
  prisma: PrismaClient,
  payload: TrackPayload,
): Promise<void> {
  const session = await prisma.landerSession.findUnique({
    where: { sessionId: payload.sessionId },
    select: { id: true, exitType: true, steps: true },
  });
  if (!session) return;

  const current = session.exitType as ExitType;

  if (payload.type === "click") {
    await prisma.landerSession.update({
      where: { id: session.id },
      data: {
        clickedMain: true,
        clickedAt: new Date(),
        clickTarget: payload.clickTarget,
        exitType: promoteExitType(current, "clicked_through"),
      },
    });
    return;
  }

  if (payload.type === "exit") {
    await prisma.landerSession.update({
      where: { id: session.id },
      data: {
        exitType: promoteExitType(current, payload.exitType ?? "unknown"),
        timeOnPageMs: payload.timeOnPageMs,
        maxScrollPct: payload.maxScrollPct,
      },
    });
    return;
  }

  if (payload.type === "link") {
    // Non-offer link click: kept as a step for visibility, but it must not
    // count as a main click or suppress bounce.
    const steps = Array.isArray(session.steps) ? (session.steps as any[]) : [];
    if (steps.length >= MAX_STEPS) return;
    await prisma.landerSession.update({
      where: { id: session.id },
      data: {
        steps: [
          ...steps,
          {
            stepId: "link",
            label: payload.clickTarget,
            at: new Date().toISOString(),
          },
        ],
      },
    });
    return;
  }

  // step
  const steps = Array.isArray(session.steps) ? (session.steps as any[]) : [];
  if (steps.length >= MAX_STEPS) return;
  await prisma.landerSession.update({
    where: { id: session.id },
    data: {
      steps: [
        ...steps,
        {
          stepId: payload.stepId ?? "step",
          label: payload.label,
          at: new Date().toISOString(),
        },
      ],
    },
  });
}

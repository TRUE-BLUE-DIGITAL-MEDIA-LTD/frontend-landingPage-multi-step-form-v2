import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import requestIp from "request-ip";
import { sanitizeFormAnswers } from "../../../../server/customers/form-answers";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {
    if (req.method !== "POST") {
      res.status(405).end();
      return;
    }
    const body = req.body ?? {};
    if (!body.email || !body.landingPageId) {
      res.status(400).end();
      return;
    }

    let formAnswers: Record<string, string> | undefined;
    if (body.formAnswers !== undefined) {
      const sanitized = sanitizeFormAnswers(body.formAnswers);
      if (sanitized === null) {
        res.status(400).end();
        return;
      }
      formAnswers = sanitized;
    }

    const ip = requestIp.getClientIp(req) ?? undefined;

    const customer = await prisma.customer.create({
      data: {
        email: body.email,
        name: body.name,
        landingPageId: body.landingPageId,
        ip,
        formAnswers,
      },
    });
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).end();
  }
}

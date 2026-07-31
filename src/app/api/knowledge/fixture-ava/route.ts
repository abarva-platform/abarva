/**
 * Real Claude-backed aVa reasoning for the FIXTURE preview only.
 *
 * This is the network hop AnthropicAvaReasoningProvider (consumption-client/
 * ava-provider.ts) calls into -- see src/lib/knowledge/consumption-server/
 * fixture-ava.ts's module header for why a real server route is required
 * here rather than a client-side SDK call.
 *
 * Gated the same way the fixture preview surface itself is gated
 * (src/app/(maestro)/knowledge-preview/page.tsx: "Fixture preview remains
 * platform-admin only") so this never becomes an open, unauthenticated way to
 * spend Anthropic API credits. Fails closed for any non-fixture tenantKey via
 * assertFixtureNamespace inside fixture-ava.ts -- this route can never be
 * pointed at a real tenant's data.
 */
import type { NextRequest } from "next/server";

import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import type {
  AvaIntent,
  AvaKnowledgePacket,
} from "@/lib/knowledge/consumption-contracts";
import {
  runFixtureAvaAsk,
  runFixtureAvaDraftIndustryContext,
  runFixtureAvaDraftInterpretation,
} from "@/lib/knowledge/consumption-server/fixture-ava";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body =
  | {
      action: "ask";
      tenantKey: string;
      intent: AvaIntent;
      question: string;
      packet: AvaKnowledgePacket;
    }
  | {
      action: "draftInterpretation";
      tenantKey: string;
      packet: AvaKnowledgePacket;
    }
  | {
      action: "draftIndustryContext";
      tenantKey: string;
      packet: AvaKnowledgePacket;
    };

export async function POST(req: NextRequest) {
  if (!(await isPlatformAdminSession())) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("action" in body) ||
    !("tenantKey" in body)
  ) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "ask": {
        const answer = await runFixtureAvaAsk({
          tenantKey: body.tenantKey,
          request: {
            intent: body.intent,
            question: body.question,
            packet: body.packet,
          },
        });
        return Response.json(answer, {
          headers: { "Cache-Control": "no-store" },
        });
      }
      case "draftInterpretation": {
        const draft = await runFixtureAvaDraftInterpretation({
          tenantKey: body.tenantKey,
          packet: body.packet,
        });
        return Response.json(draft, {
          headers: { "Cache-Control": "no-store" },
        });
      }
      case "draftIndustryContext": {
        const draft = await runFixtureAvaDraftIndustryContext({
          tenantKey: body.tenantKey,
          packet: body.packet,
        });
        return Response.json(draft, {
          headers: { "Cache-Control": "no-store" },
        });
      }
      default:
        return Response.json({ error: "unknown_action" }, { status: 400 });
    }
  } catch (err) {
    return Response.json(
      {
        error: "fixture_ava_failed",
        detail: String((err as Error)?.message ?? err),
      },
      { status: 500 },
    );
  }
}

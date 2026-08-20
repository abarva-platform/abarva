// GET/POST /api/v1/programs/:programId/risk-assessment
// Tenant-gated by `moves_risk_tier_scoring_v1` (default off). Persists the
// D1-D5/E1-E8 risk-tier INPUTS into engagements.charter (same isolated seam
// as charter-capture and p0-extended-intake-fields) and always returns the
// freshly-computed result alongside them — never a stored/stale score.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import {
  applyRiskTierInputsIfEnabled,
  readRiskTierInputsFromCharter,
} from "@/lib/programs/p2-risk-tier-fields";
import {
  computeRiskTier,
  type RiskTierInputs,
} from "@/lib/programs/risk-tier-scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIMENSION_LEVELS = new Set(["Low", "Moderate", "High", "Critical"]);
const ESCALATOR_SEVERITIES = new Set([
  "NotTriggered",
  "Moderate",
  "High",
  "Critical",
]);
const DIMENSION_KEYS: Array<keyof RiskTierInputs> = [
  "d1DataSensitivity",
  "d2HumanOversight",
  "d3IntegrationImpact",
  "d4BuildOrigin",
  "d5DomainBreadth",
];
const ESCALATOR_KEYS: Array<keyof RiskTierInputs> = [
  "e1PhiExposure",
  "e2AutonomousAction",
  "e3ClinicalDecisioning",
  "e4OrganizationReadiness",
  "e5CrossDomainIntegration",
  "e6PublicRegulatoryExposure",
  "e7BrandReputationRisk",
  "e8PatientFacingExposure",
];

function parseInputs(body: unknown): RiskTierInputs | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  for (const key of DIMENSION_KEYS) {
    if (!DIMENSION_LEVELS.has(record[key] as string)) return null;
  }
  for (const key of ESCALATOR_KEYS) {
    if (!ESCALATOR_SEVERITIES.has(record[key] as string)) return null;
  }
  return record as unknown as RiskTierInputs;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase("program_read");

    if (!isFeatureEnabled(ctx, "moves_risk_tier_scoring_v1")) {
      return Response.json({ error: "not_enabled" }, { status: 404 });
    }

    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const inputs = readRiskTierInputsFromCharter(
      program.charter as Record<string, unknown> | null,
    );
    return Response.json({
      ok: true,
      inputs,
      result: inputs ? computeRiskTier(inputs) : null,
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase("mutation");

    if (!isFeatureEnabled(ctx, "moves_risk_tier_scoring_v1")) {
      return Response.json({ error: "not_enabled" }, { status: 404 });
    }

    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const body = (await req.json().catch(() => null)) as {
      inputs?: unknown;
    } | null;
    const inputs = parseInputs(body?.inputs);
    if (!inputs) {
      return Response.json(
        {
          error: "bad_request",
          detail: "All 13 D1-D5/E1-E8 fields are required",
        },
        { status: 400 },
      );
    }

    const currentCharter = (program.charter ?? {}) as Record<string, unknown>;
    const merged = applyRiskTierInputsIfEnabled(currentCharter, inputs, true);

    const { error: chErr } = await supabase
      .from("engagements")
      .update({ charter: merged })
      .eq("id", programId);
    if (chErr) {
      return Response.json(
        { error: "charter_write_failed", detail: chErr.message },
        { status: 500 },
      );
    }

    return Response.json({ ok: true, inputs, result: computeRiskTier(inputs) });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}

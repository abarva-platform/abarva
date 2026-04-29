// GET /api/v1/programs · portfolio list
// POST /api/v1/programs · create program from origination result
// Returns view-model types only (ProgramSummary[] or { programId, redirectTo }).

import { NextRequest } from 'next/server';
import { getProgramPortfolio } from '@/lib/programs/queries';
import { originateProgram } from '@/lib/programs/mutations';
import { setModuleStatus, createMilestone } from '@/lib/programs/mutations';
import { buildProgramSummary } from '@/lib/programs/transformers';
import { logClassifierDecision } from '@/lib/programs/classifier';
import { raiseMaestroFlag } from '@/lib/programs/governance';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, tenancyErrorResponse } from './_auth';
import type {
  OriginSource,
  PatternClassifierMatch,
} from '@/lib/programs/types.db';
import type {
  ArchetypeKey,
  CreateProgramRequest,
  ProgramSummary,
} from '@/lib/programs/types.ui';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  try {
    const ctx = await requireTenancy();
    const programs = await getProgramPortfolio(ctx, { limit: 100 });
    const summaries: ProgramSummary[] = await Promise.all(programs.map(buildProgramSummary));
    return Response.json({ programs: summaries });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /api/v1/programs]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

interface CreateProgramPayload extends CreateProgramRequest {
  originSource?: OriginSource;
  originSourceRef?: string | null;
  topMatch?: PatternClassifierMatch;
}

// Strip secrets / large fields before logging the payload that triggered a 5xx.
// Keep enough to reproduce the request, drop anything that could be a token.
function redactPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const SENSITIVE = /(token|secret|password|key|authorization|cookie|api[_-]?key)/i;
  const trim = (v: unknown): unknown => {
    if (typeof v === 'string') return v.length > 500 ? `${v.slice(0, 500)}…<+${v.length - 500} chars>` : v;
    if (Array.isArray(v)) return v.map(trim);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v)) {
        out[k] = SENSITIVE.test(k) ? '[REDACTED]' : trim(val);
      }
      return out;
    }
    return v;
  };
  return trim(payload);
}

export async function POST(req: NextRequest) {
  let payload: CreateProgramPayload | null = null;
  try {
    const ctx = await requireTenancy();
    try {
      payload = (await req.json()) as CreateProgramPayload;
    } catch {
      return Response.json(
        { error: 'bad_request', detail: 'Request body was not valid JSON.' },
        { status: 400 },
      );
    }

    const form = payload?.originationFormResult;
    const missing: string[] = [];
    if (!form?.name?.trim()) missing.push('name');
    if (!form?.useCase?.trim()) missing.push('useCase');
    if (missing.length > 0) {
      return Response.json(
        {
          error: 'bad_request',
          detail: `Missing required field${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.`,
          fields: missing,
        },
        { status: 400 },
      );
    }

    const archetype = (payload!.shapeModifications?.shape === 'template' ? null : (deriveArchetype(form!.useCase) as ArchetypeKey | null));

    const program = await originateProgram(ctx, {
      name: form!.name,
      useCase: form!.useCase,
      archetype,
      originSource: payload!.originSource ?? 'user_initiated',
      originSourceRef: payload!.originSourceRef ?? null,
      acceptedPatternKey: payload!.acceptedPatternKey ?? null,
      industryHint: form!.industryHint,
    });

    const sb = getServerSupabase();

    // Seed participants from form. Failures here are non-fatal — the program
    // record exists; we surface a server-side warning but still return success
    // so the user lands on the program page rather than seeing internal_error
    // for what's effectively a soft attribution gap.
    if (form!.sponsorPersonId) {
      const { error: sponsorErr } = await sb.from('engagement_participants').insert({
        engagement_id: program.id,
        user_id: form!.sponsorPersonId,
        user_name: form!.sponsorPersonId,
        role: 'sponsor',
        approval_authority: 'sponsor',
      });
      if (sponsorErr) console.warn('[POST /api/v1/programs] sponsor participant insert failed', { programId: program.id, error: sponsorErr });
    }
    if (form!.leadPersonId && form!.leadPersonId !== form!.sponsorPersonId) {
      const { error: leadErr } = await sb.from('engagement_participants').insert({
        engagement_id: program.id,
        user_id: form!.leadPersonId,
        user_name: form!.leadPersonId,
        role: 'lead',
        approval_authority: 'approver',
      });
      if (leadErr) console.warn('[POST /api/v1/programs] lead participant insert failed', { programId: program.id, error: leadErr });
    }

    // Seed program_modules from canonical shape (if pattern accepted)
    if (payload.acceptedPatternKey) {
      const { data: topic } = await sb
        .from('engagement_topics')
        .select('title, canonical_shape_json, phase_playbook')
        .eq('topic_key', payload.acceptedPatternKey)
        .maybeSingle();
      const canonical = (topic as { canonical_shape_json: Record<string, unknown> | null } | null)?.canonical_shape_json ?? null;
      const moduleList: Array<{ moduleKey: string; name: string; phase: number }> = [];
      if (canonical && Array.isArray(canonical.modules)) {
        for (const m of canonical.modules as Array<{ moduleKey?: string; name?: string; phase?: number }>) {
          if (m.moduleKey && m.name != null && typeof m.phase === 'number') {
            moduleList.push({ moduleKey: m.moduleKey, name: m.name, phase: m.phase });
          }
        }
      }
      // Fallback: seed one placeholder per phase 1-5 so the UI has something
      if (moduleList.length === 0) {
        for (let p = 1; p <= 5; p += 1) {
          moduleList.push({ moduleKey: `phase_${p}_work`, name: `Phase ${p} deliverable`, phase: p });
        }
      }
      let order = 0;
      for (const m of moduleList) {
        await sb.from('program_modules').insert({
          engagement_id: program.id,
          module_key: m.moduleKey,
          module_name: m.name,
          phase_number: m.phase,
          module_order: order++,
          status: 'not_started',
        });
      }
    }

    // Log classifier decision if a top match was passed
    if (payload.topMatch) {
      await logClassifierDecision({
        programId: program.id,
        userId: ctx.userId,
        match: payload.topMatch,
        accepted: !!payload.acceptedPatternKey,
      });
    }

    // Raise a Maestro flag when founder approval is required but not sourced
    if (program.founderApprovalRequired) {
      await raiseMaestroFlag(ctx, program.id, {
        flagType: 'approval_needed',
        severity: 'info',
        raisedBy: 'system',
        headline: 'Founder approval required for this program',
      });
    }

    return Response.json({
      programId: program.id,
      redirectTo: `/programs/${program.id}`,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    // Log the offending payload (redacted) and the error so future failures
    // are diagnosable from server logs rather than just an internal_error chip.
    // TODO(observability): forward to Sentry/PostHog once an error sink is wired up.
    console.error('[POST /api/v1/programs]', {
      error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      payload: redactPayload(payload),
    });
    const detail =
      err instanceof Error && err.message
        ? `Steward couldn't create the program record (${err.message}). Try again or contact support.`
        : "Steward couldn't reach the program service. Try again or contact support.";
    return Response.json({ error: 'internal_error', detail }, { status: 500 });
  }
}

function deriveArchetype(useCase: string): string | null {
  const lc = useCase.toLowerCase();
  if (/(automation|workflow|process)/.test(lc)) return 'workflow_automation';
  if (/(platform|cloud|modernization|migration)/.test(lc)) return 'platform_modernization';
  if (/(ai product|copilot|agent|llm)/.test(lc)) return 'ai_product_enablement';
  if (/(cost|efficiency|optimization|opex)/.test(lc)) return 'operational_optimization';
  return 'strategic_transformation';
}

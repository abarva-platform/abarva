// POST /api/v1/programs/:programId/generate
//
// Full consulting-grade document generation for a program phase.
// This is NOT the chat interface. This is a single-call document generator
// that assembles ALL available context and asks Claude to produce a
// complete, professional deliverable — equivalent to a McKinsey phase output.
//
// No 6,000-character limit. No "concise markdown" constraint.
// The deliverable is saved to deliverable_versions and returned.
//
// Body: { phase: number, deliverableTypeKey: string, title?: string }
//
// What gets assembled and sent to Claude:
//   1. Engagement record (name, archetype, sponsor, current phase, charter)
//   2. Phase pack V2 (methodology, questions, anti-patterns, gate criteria)
//   3. Prior phase deliverables with FULL content (P1 charter, P2 root causes)
//   4. Tenant enterprise context chunks (client segments, personas, org data)
//   5. Pattern preload (canonical shape for the program's matched pattern)
//   6. Active flags and risks
//
// The generation prompt explicitly instructs Claude to produce:
//   - Structured sections matching the phase deliverable type
//   - Specific, client-named content (not generic placeholders)
//   - Mermaid diagrams where applicable (architecture, operating model)
//   - Quantitative estimates grounded in available context
//   - Consulting-grade prose (not bullet dump)

import 'server-only';
import { requireTenancy, tenancyErrorResponse } from '../../_auth';
import { getProgramById, getModuleState } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';
import { getServerSupabase } from '@/lib/supabase-server';
import { getPhasePackV2 } from '@/lib/programs/phase-packs';
import { formatPhasePackV2ForPrompt } from '@/lib/programs/phase-packs/format-v2';
import { buildTenantContextBlock } from '@/lib/intelligence/persistence';
import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { streamAgentTurn } from '@/lib/agent/stream';
import { draftModuleDeliverable } from '@/lib/programs/nexus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // full doc generation takes time

const PHASE_LABEL: Record<number, string> = {
  0: 'P0 Originate',
  1: 'P1 Charter',
  2: 'P2 Discover & Diagnose',
  3: 'P3 Design Future State',
  4: 'P4 Roadmap & Business Case',
  5: 'P5 Mobilize & Handoff',
};

// Deliverable type → generation spec
// Tells the prompt what sections to produce and what the document IS
const DELIVERABLE_SPECS: Record<string, {
  documentTitle: string;
  sections: string[];
  diagramType?: string;
  consultingAnalog: string;
}> = {
  // P1
  charter: {
    documentTitle: 'Program Charter',
    sections: [
      'Executive Summary (1 paragraph — problem, recommended approach, value hypothesis)',
      'Sponsor Commitment (named sponsor, role, decision rights, cadence)',
      'Stakeholder Map (decision-makers, contributors, blockers — named individuals)',
      'Success Metrics & Value Range (primary KPI with baseline, preliminary value range $M–$M with stated assumptions)',
      'Scope Boundary (in scope / out of scope — specific, not generic)',
      'Kill Criterion (specific observable condition that terminates the program)',
    ],
    consultingAnalog: 'McKinsey Engagement Scope & Charter Document',
  },
  // P2
  discovery_report: {
    documentTitle: 'Discovery & Diagnosis Report',
    sections: [
      'Current State Baseline (quantified metrics with sources — not placeholder ranges)',
      'Root Cause Analysis (3–5 root causes ranked by impact, each with evidence)',
      'Data & AI Readiness Assessment (specific gaps, data availability, governance posture)',
      'Continuation Verdict (CONTINUE_TO_P3 or DISCONTINUE with rationale)',
      'P2 Gate Evidence Summary (hard criteria met/not met)',
    ],
    consultingAnalog: 'McKinsey Diagnostic & Root Cause Report',
  },
  // P3
  p3_design: {
    documentTitle: 'Design Future State — Architecture & Operating Model',
    sections: [
      'Root Cause → Design Requirement Traceability Matrix (every root cause from P2 mapped to ≥1 design requirement)',
      'Architecture Options (3 options: Option A, B, C — each with capability description, integration approach, build/buy/configure decision, and explicit trade-offs)',
      'Recommended Architecture (chosen option with rationale tied to design requirements)',
      'Target State Architecture Diagram (Mermaid diagram showing components, integrations, data flows, AI/agent placement)',
      'Target Operating Model (Today vs Tomorrow: named roles, responsibilities, handoffs, decision rights, escalation paths)',
      'Sourcing Strategy (build/buy/configure/partner decision with vendor shortlist if applicable)',
      'Key Risks & Mitigations (5–7 named risks with likelihood, impact, mitigation)',
      'P3 Gate Readiness Summary (each gate criterion: met/at risk/not met)',
    ],
    diagramType: 'architecture',
    consultingAnalog: 'McKinsey Target Architecture & Operating Model Design Document',
  },
  // P4
  roadmap: {
    documentTitle: 'Execution Roadmap & Business Case',
    sections: [
      'Workstream Breakdown (named workstreams, leads, interdependencies)',
      'Timeline & Milestones (phased delivery plan with value realization milestones)',
      'Resource Model (FTEs by role and workstream, SI involvement)',
      'Business Case (implementation cost estimate, value realization timeline, NPV/IRR framework, sensitivity analysis)',
      'Risk Register (implementation risks with mitigation owners)',
      'Tower Monitoring Plan (KPIs Tower tracks post-handoff, measurement methodology)',
    ],
    consultingAnalog: 'McKinsey Implementation Roadmap & Business Case',
  },
  // P5
  handoff_package: {
    documentTitle: 'Mobilization & Tower Handoff Package',
    sections: [
      'Delivery RACI (named leads for every workstream — people, not roles)',
      'Change Management Plan (stakeholder readiness, communication plan, training approach)',
      'Tower Acceptance Criteria (explicit conditions for Tower acceptance — acknowledged ≠ accepted)',
      'Value Measurement Contract (committed outcomes, measurement methodology, accountable owner)',
      'Risk Handoff Register (open risks transferring to Tower)',
    ],
    consultingAnalog: 'McKinsey Mobilization & Handoff Package',
  },
};

// Fetch prior phase deliverable content (the actual markdown from previous phases)
async function fetchPriorPhaseContent(programId: string, maxPhase: number): Promise<string> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('deliverables_v2')
    .select(`
      deliverable_type_key,
      title,
      status,
      deliverable_versions!inner(content, version)
    `)
    .eq('engagement_id', programId)
    .order('updated_at', { ascending: false });

  if (!data || data.length === 0) return '';

  const lines: string[] = ['--- PRIOR PHASE DELIVERABLES ---'];

  for (const row of data as Array<{
    deliverable_type_key: string;
    title: string | null;
    status: string;
    deliverable_versions: Array<{ content: string | null; version: number }>;
  }>) {
    const versions = row.deliverable_versions ?? [];
    const latest = versions.reduce(
      (best, v) => (v.version > (best?.version ?? -1) ? v : best),
      null as { content: string | null; version: number } | null,
    );
    if (!latest?.content?.trim()) continue;

    const title = row.title || row.deliverable_type_key;
    lines.push(`\n## ${title} (${row.deliverable_type_key}, status: ${row.status})`);
    lines.push(latest.content.trim());
  }

  lines.push('--- END PRIOR DELIVERABLES ---');
  return lines.length > 3 ? lines.join('\n') : '';
}

// Fetch engagement record with full detail
async function fetchEngagementDetail(programId: string) {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('engagements')
    .select(`
      id, name, status, lifecycle_state, current_phase,
      program_archetype, maestro_oversight_level,
      sponsor_person_id, maestro_person_id, charter,
      program_milestones(id, name, status, target_date),
      program_risks(id, title, likelihood, impact, status)
    `)
    .eq('id', programId)
    .maybeSingle();

  if (!data) return null;

  const eng = data as Record<string, unknown>;
  const personIds = [eng.sponsor_person_id, eng.maestro_person_id].filter(Boolean) as string[];
  let sponsorName = '';
  let sponsorRole = '';
  let leadName = '';

  if (personIds.length > 0) {
    const { data: people } = await sb
      .from('persons')
      .select('id, name, role')
      .in('id', personIds);
    const personMap = new Map(
      ((people as Array<{ id: string; name: string; role: string | null }>) ?? [])
        .map((p) => [p.id, p]),
    );
    const sponsor = personMap.get(eng.sponsor_person_id as string);
    const lead = personMap.get(eng.maestro_person_id as string);
    if (sponsor) { sponsorName = sponsor.name; sponsorRole = sponsor.role ?? ''; }
    if (lead) leadName = lead.name;
  }

  return { eng, sponsorName, sponsorRole, leadName };
}

// Build the generation prompt — this is the core of the endpoint
function buildGenerationPrompt(args: {
  programName: string;
  archetype: string;
  tenantName: string;
  currentPhase: number;
  targetPhase: number;
  sponsorName: string;
  sponsorRole: string;
  leadName: string;
  charter: Record<string, unknown> | null;
  milestones: Array<{ name: string; status: string; target_date: string | null }>;
  risks: Array<{ title: string; likelihood: string; impact: string; status: string }>;
  phasePackBlock: string;
  priorContent: string;
  tenantContext: string;
  patternContext: string;
  deliverableSpec: typeof DELIVERABLE_SPECS[string];
  deliverableTypeKey: string;
  title: string;
}): string {
  const {
    programName, archetype, tenantName, targetPhase,
    sponsorName, sponsorRole, leadName, charter,
    milestones, risks,
    phasePackBlock, priorContent, tenantContext, patternContext,
    deliverableSpec, title,
  } = args;

  const charterContext = charter
    ? `Charter context: ${JSON.stringify(charter, null, 2).slice(0, 2000)}`
    : '';

  const milestonesText = milestones.length > 0
    ? `Program milestones: ${milestones.map((m) => `${m.name} (${m.status}${m.target_date ? `, due ${m.target_date}` : ''})`).join('; ')}`
    : '';

  const risksText = risks.length > 0
    ? `Known risks: ${risks.map((r) => `${r.title} (${r.likelihood} likelihood, ${r.impact} impact, ${r.status})`).join('; ')}`
    : '';

  return `You are a senior transformation consultant generating a complete, professional deliverable for a client engagement. This document will replace the equivalent McKinsey or Bain consulting output. Do not hedge. Do not use placeholder text. Generate specific, substantive content grounded in the context provided.

ENGAGEMENT:
- Program: ${programName}
- Client: ${tenantName}
- Archetype: ${archetype}
- Current Phase: ${PHASE_LABEL[args.currentPhase] ?? `P${args.currentPhase}`}
- Generating for: ${PHASE_LABEL[targetPhase] ?? `P${targetPhase}`}
- Executive Sponsor: ${sponsorName || 'Not assigned'}${sponsorRole ? ` (${sponsorRole})` : ''}
- Program Lead: ${leadName || 'Not assigned'}
${charterContext}
${milestonesText}
${risksText}

${tenantContext ? tenantContext + '\n' : ''}
${patternContext ? patternContext + '\n' : ''}
${priorContent ? priorContent + '\n' : ''}
${phasePackBlock ? '--- PHASE METHODOLOGY ---\n' + phasePackBlock + '\n--- END METHODOLOGY ---\n' : ''}

DELIVERABLE TO GENERATE: ${title}
Consulting analog: ${deliverableSpec.consultingAnalog}

Generate a complete, structured document with the following sections. Each section must contain specific, substantive content — not generic descriptions of what the section should contain. Use the client name, program name, sponsor name, and specific context from the engagement data above throughout the document.

REQUIRED SECTIONS:
${deliverableSpec.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${deliverableSpec.diagramType === 'architecture' ? `
ARCHITECTURE DIAGRAM REQUIREMENT:
Include a Mermaid diagram in the Target State Architecture section. Use graph TD or graph LR format. Show the key components, integration points, data flows, and AI/agent placement specific to this program and archetype. Label nodes with actual system names where known from context.
` : ''}

DOCUMENT QUALITY REQUIREMENTS:
- Every claim must be grounded in the engagement context above
- Use specific numbers, names, and dates from the available context
- Where the context does not provide specific data, use reasonable estimates and state assumptions explicitly
- Write in professional consulting prose, not bullet points alone
- The document should be self-contained — a new team member reading it should understand the program
- Length: comprehensive enough to be the authoritative phase record. Do not truncate.
- Where prior phase deliverables exist, build on them explicitly (reference root causes by name, reference baseline metrics)

Generate the complete document now. Start with a brief executive summary, then each required section.`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
): Promise<Response> {
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch { return Response.json({ error: 'internal_error' }, { status: 500 }); }
  }

  const { programId } = await params;
  const { supabase } = await getProgramsRouteSupabase('mutation');

  const program = await getProgramById(ctx, programId, { supabase });
  if (!program) return Response.json({ error: 'not_found' }, { status: 404 });

  let body: { phase?: number; deliverableTypeKey?: string; title?: string };
  try { body = await req.json(); } catch { return Response.json({ error: 'invalid_json' }, { status: 400 }); }

  const targetPhase = body.phase ?? program.currentPhase ?? 1;
  const deliverableTypeKey = body.deliverableTypeKey ?? `p${targetPhase}_package`;
  const title = body.title ?? `${PHASE_LABEL[targetPhase] ?? `Phase ${targetPhase}`} — ${program.name}`;

  // Get deliverable spec — fall back to a generic one if type not in registry
  const deliverableSpec = DELIVERABLE_SPECS[deliverableTypeKey] ?? DELIVERABLE_SPECS[`p${targetPhase}_design`] ?? {
    documentTitle: title,
    sections: [
      'Executive Summary',
      'Current Situation',
      'Analysis & Findings',
      'Recommendations',
      'Next Steps & Gate Readiness',
    ],
    consultingAnalog: 'Consulting Phase Deliverable',
  };

  // Assemble all context in parallel
  const [engDetail, priorContent, activeClient] = await Promise.all([
    fetchEngagementDetail(programId),
    fetchPriorPhaseContent(programId, targetPhase - 1),
    getActiveClientRow().catch(() => null),
  ]);

  if (!engDetail) return Response.json({ error: 'engagement_not_found' }, { status: 404 });

  const { eng, sponsorName, sponsorRole, leadName } = engDetail;

  // Tenant context (enterprise_context_chunks)
  const tenantInventoryKey = activeClient?.key
    ? clientKeyToInventorySubstrateKey(activeClient.key)
    : null;
  const [tenantContext, modules] = await Promise.all([
    buildTenantContextBlock(tenantInventoryKey).catch(() => null),
    getModuleState(ctx, programId, { supabase }).catch(() => []),
  ]);

  // Pattern preload from engagement topics
  const sb = getServerSupabase();
  const { data: patternMatch } = await sb
    .from('pattern_match_logs')
    .select('pattern_key')
    .eq('engagement_id', programId)
    .eq('acted_upon', true)
    .order('acted_upon_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let patternContext = '';
  if ((patternMatch as { pattern_key?: string } | null)?.pattern_key) {
    const { data: topic } = await sb
      .from('engagement_topics')
      .select('topic_key, title, canonical_shape_json, phase_playbook, diagnostic_questions, success_signals, failure_modes')
      .eq('topic_key', (patternMatch as { pattern_key: string }).pattern_key)
      .maybeSingle();
    if (topic) {
      const t = topic as Record<string, unknown>;
      patternContext = [
        '--- MATCHED PATTERN ---',
        `Pattern: ${t.title as string}`,
        t.phase_playbook ? `Phase playbook:\n${JSON.stringify(t.phase_playbook, null, 2).slice(0, 3000)}` : '',
        t.failure_modes ? `Known failure modes:\n${JSON.stringify(t.failure_modes, null, 2).slice(0, 2000)}` : '',
        t.success_signals ? `Success signals:\n${JSON.stringify(t.success_signals, null, 2).slice(0, 1000)}` : '',
        '--- END PATTERN ---',
      ].filter(Boolean).join('\n');
    }
  }

  // Phase pack
  const phasePack = getPhasePackV2(targetPhase);
  const phasePackBlock = phasePack ? formatPhasePackV2ForPrompt(phasePack) : '';

  const generationPrompt = buildGenerationPrompt({
    programName: program.name,
    archetype: program.archetype ?? 'strategic_transformation',
    tenantName: activeClient?.name ?? 'Client',
    currentPhase: program.currentPhase ?? targetPhase,
    targetPhase,
    sponsorName,
    sponsorRole,
    leadName,
    charter: eng.charter as Record<string, unknown> | null,
    milestones: (eng.program_milestones as Array<{ name: string; status: string; target_date: string | null }>) ?? [],
    risks: (eng.program_risks as Array<{ title: string; likelihood: string; impact: string; status: string }>) ?? [],
    phasePackBlock,
    priorContent,
    tenantContext: tenantContext ?? '',
    patternContext,
    deliverableSpec,
    deliverableTypeKey,
    title,
  });

  // Generate with Claude — no character limit, full document
  let content = '';
  try {
    for await (const chunk of streamAgentTurn({
      system: 'You are a senior transformation consultant generating a complete consulting deliverable. Be specific, substantive, and comprehensive. Do not truncate. Write as if this is the definitive record for the engagement.',
      messages: [{ role: 'user', content: generationPrompt }],
    })) {
      content += chunk;
    }
  } catch (err) {
    console.error('[generate/phase-package] generation error', err);
    return Response.json({ error: 'generation_failed', detail: err instanceof Error ? err.message : 'unknown' }, { status: 500 });
  }

  if (!content.trim()) {
    return Response.json({ error: 'empty_generation' }, { status: 500 });
  }

  // Save as deliverable
  let deliverableId: string | null = null;
  let versionId: string | null = null;
  try {
    const result = await draftModuleDeliverable(ctx, {
      programId,
      moduleKey: deliverableTypeKey,
      deliverableTypeKey,
      title,
      draftContent: content,
    });
    deliverableId = result.deliverableId;
    versionId = result.versionId;
  } catch (saveErr) {
    console.error('[generate/phase-package] save error', saveErr);
    // Return content even if save failed — don't lose the generation
  }

  void modules; // used in future for module status context

  return Response.json({
    deliverableId,
    versionId,
    deliverableTypeKey,
    title,
    content,
    saved: Boolean(deliverableId),
    phase: targetPhase,
    sections: deliverableSpec.sections,
  });
}

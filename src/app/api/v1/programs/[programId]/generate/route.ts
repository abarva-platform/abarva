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
// Context assembled per request:
//   1. Engagement record (name, archetype, sponsor, current phase, charter)
//   2. Phase pack V2 (methodology, frameworks, questions, anti-patterns)
//   3. Prior phase deliverables with FULL content
//   4. Tenant enterprise context chunks (segments, personas, org data)
//   5. Matched canonical pattern (shape, failure modes, success signals)
//   6. Deliverable spec from registry (sections, format, consulting analog)
//
// For Excel-format deliverables (financial_model), Claude generates
// structured markdown tables that the content-export route parses into
// a proper .xlsx workbook with formulas and editable assumption cells.

import "server-only";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getProgramById, getModuleState } from "@/lib/programs/queries";
import { azureRead } from "@/lib/data-plane/azureRead";
import { getPhasePackV2 } from "@/lib/programs/phase-packs";
import { formatPhasePackV2ForPrompt } from "@/lib/programs/phase-packs/format-v2";
import { buildTenantContextBlock } from "@/lib/intelligence/persistence";
import { getActiveClientRow } from "@/lib/active-client";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { streamAgentTurn } from "@/lib/agent/stream";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import {
  getDeliverableSpec,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // full doc generation takes 30–90s

const PHASE_LABEL: Record<number, string> = {
  0: "P0 Originate",
  1: "P1 Charter",
  2: "P2 Discover & Diagnose",
  3: "P3 Design Future State",
  4: "P4 Roadmap & Business Case",
  5: "P5 Mobilize & Handoff",
};

type PriorPhaseContentRow = {
  deliverable_type_key: string;
  title: string | null;
  status: string;
  content: string | null;
  version: number;
};

type EngagementGenerationRow = {
  id: string;
  name: string | null;
  status: string | null;
  lifecycle_state: string | null;
  current_phase: number | null;
  program_archetype: string | null;
  maestro_oversight_level: string | null;
  sponsor_person_id: string | null;
  maestro_person_id: string | null;
  charter: Record<string, unknown> | null;
};

type ProgramMilestonePromptRow = {
  id: string;
  name: string;
  status: string;
  target_date: string | null;
};

type ProgramRiskPromptRow = {
  id: string;
  title: string;
  likelihood: string;
  impact: string;
  status: string;
};

// ── Context assembly ──────────────────────────────────────────────────────────

async function fetchPriorPhaseContent(programId: string): Promise<string> {
  const rows = await azureRead.query<PriorPhaseContentRow>(
    `
      SELECT
        d.deliverable_type_key,
        d.title,
        d.status,
        v.content,
        v.version
      FROM deliverables_v2 d
      JOIN LATERAL (
        SELECT content, version
        FROM deliverable_versions
        WHERE deliverable_id = d.id
        ORDER BY version DESC
        LIMIT 1
      ) v ON TRUE
      WHERE d.engagement_id = $1
      ORDER BY d.updated_at DESC NULLS LAST
    `,
    [programId],
  );

  if (rows.length === 0) return "";

  const lines: string[] = ["--- PRIOR PHASE DELIVERABLES ---"];

  for (const row of rows) {
    if (!row.content?.trim()) continue;

    const title = row.title || row.deliverable_type_key;
    lines.push(
      `\n## ${title} (${row.deliverable_type_key}, status: ${row.status})`,
    );
    lines.push(row.content.trim());
  }

  lines.push("--- END PRIOR DELIVERABLES ---");
  return lines.length > 3 ? lines.join("\n") : "";
}

async function fetchEngagementDetail(programId: string) {
  const data = await azureRead.maybeSingle<EngagementGenerationRow>({
    table: "engagements",
    columns: [
      "id",
      "name",
      "status",
      "lifecycle_state",
      "current_phase",
      "program_archetype",
      "maestro_oversight_level",
      "sponsor_person_id",
      "maestro_person_id",
      "charter",
    ],
    where: { id: programId },
  });

  if (!data) return null;

  const [milestones, risks] = await Promise.all([
    azureRead.select<ProgramMilestonePromptRow>({
      table: "program_milestones",
      columns: ["id", "name", "status", "target_date"],
      where: { engagement_id: programId },
      orderBy: { column: "target_date", direction: "asc", nulls: "last" },
    }),
    azureRead.select<ProgramRiskPromptRow>({
      table: "program_risks",
      columns: ["id", "title", "likelihood", "impact", "status"],
      where: { engagement_id: programId },
      orderBy: { column: "created_at", direction: "desc" },
    }),
  ]);

  const eng: Record<string, unknown> = {
    ...data,
    program_milestones: milestones,
    program_risks: risks,
  };
  const personIds = [eng.sponsor_person_id, eng.maestro_person_id].filter(
    Boolean,
  ) as string[];
  let sponsorName = "";
  let sponsorRole = "";
  let leadName = "";

  if (personIds.length > 0) {
    const people = await azureRead.select<{
      id: string;
      name: string;
      role: string | null;
    }>({
      table: "persons",
      columns: ["id", "name", "role"],
      where: { id: { op: "in", value: personIds } },
    });
    const personMap = new Map(people.map((p) => [p.id, p]));
    const sponsor = personMap.get(eng.sponsor_person_id as string);
    const lead = personMap.get(eng.maestro_person_id as string);
    if (sponsor) {
      sponsorName = sponsor.name;
      sponsorRole = sponsor.role ?? "";
    }
    if (lead) leadName = lead.name;
  }

  return { eng, sponsorName, sponsorRole, leadName };
}

// ── Prompt builder ────────────────────────────────────────────────────────────

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
  milestones: Array<{
    name: string;
    status: string;
    target_date: string | null;
  }>;
  risks: Array<{
    title: string;
    likelihood: string;
    impact: string;
    status: string;
  }>;
  phasePackBlock: string;
  priorContent: string;
  tenantContext: string;
  patternContext: string;
  spec: DeliverableSpec;
  title: string;
}): string {
  const {
    programName,
    archetype,
    tenantName,
    targetPhase,
    sponsorName,
    sponsorRole,
    leadName,
    charter,
    milestones,
    risks,
    phasePackBlock,
    priorContent,
    tenantContext,
    patternContext,
    spec,
    title,
  } = args;

  const isExcel = spec.formatRecommendation === "excel";

  const charterContext = charter
    ? `Charter context:\n${JSON.stringify(charter, null, 2).slice(0, 2000)}`
    : "";

  const milestonesText =
    milestones.length > 0
      ? `Program milestones: ${milestones.map((m) => `${m.name} (${m.status}${m.target_date ? `, due ${m.target_date}` : ""})`).join("; ")}`
      : "";

  const risksText =
    risks.length > 0
      ? `Known risks: ${risks.map((r) => `${r.title} (${r.likelihood} likelihood, ${r.impact} impact, ${r.status})`).join("; ")}`
      : "";

  const hasArchDiagram = ["target_state_architecture"].includes(
    spec.deliverableTypeKey,
  );

  return `You are a senior transformation consultant generating a complete, professional deliverable for a client engagement. This document will replace the equivalent McKinsey, Bain, or BCG consulting output. Do not hedge. Do not use placeholder text. Generate specific, substantive content grounded in the context provided.

ENGAGEMENT:
- Program: ${programName}
- Client: ${tenantName}
- Archetype: ${archetype}
- Current Phase: ${PHASE_LABEL[args.currentPhase] ?? `P${args.currentPhase}`}
- Generating for: ${PHASE_LABEL[targetPhase] ?? `P${targetPhase}`}
- Executive Sponsor: ${sponsorName || "Not assigned"}${sponsorRole ? ` (${sponsorRole})` : ""}
- Program Lead: ${leadName || "Not assigned"}
${charterContext}
${milestonesText}
${risksText}

${tenantContext ? tenantContext + "\n" : ""}
${patternContext ? patternContext + "\n" : ""}
${priorContent ? priorContent + "\n" : ""}
${phasePackBlock ? "--- PHASE METHODOLOGY ---\n" + phasePackBlock + "\n--- END METHODOLOGY ---\n" : ""}

DELIVERABLE TO GENERATE: ${title}
Document type: ${spec.documentTitle}
Primary audience: ${spec.audiencePrimary}
Purpose: ${spec.documentPurpose}
Consulting analog: ${spec.consultingAnalog}

${
  isExcel
    ? `
EXCEL FORMAT DOCUMENT:
This deliverable will be exported as an Excel workbook. Generate ONLY structured markdown tables in the exact section format below.
Do NOT add narrative paragraphs. Do NOT add section intros or outros. Output ONLY the section headers and their tables.
Each section header must exactly match the ## heading specified.
Numbers must be realistic estimates grounded in the engagement context — do not use placeholder ranges like $X–$Y.
${spec.generationPromptHint ?? ""}

REQUIRED SECTIONS (output these exact headers and tables, nothing else):
${spec.sections.join("\n\n")}
`
    : `
Generate a complete, structured document with the following sections.
Each section must contain specific, substantive content grounded in the engagement above.
Use the client name, program name, sponsor name throughout the document.
Write in professional consulting prose — not pure bullet dumps.

${spec.generationPromptHint ? `ADDITIONAL GUIDANCE: ${spec.generationPromptHint}\n` : ""}

REQUIRED SECTIONS:
${spec.sections.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${
  hasArchDiagram
    ? `
MERMAID DIAGRAM REQUIREMENTS:
Include THREE Mermaid diagrams:
1. In the Conceptual Architecture section: a capability domain map (graph LR or graph TD)
2. In the Logical Architecture section: a component/integration diagram showing system relationships, data flows, and AI placement
3. In the Physical Architecture section: a deployment diagram showing infrastructure, cloud regions, and security zones
Use actual system names and component names that are relevant to the ${archetype} archetype and ${tenantName} context.
`
    : ""
}

DOCUMENT QUALITY REQUIREMENTS:
- Every claim grounded in the engagement context
- Specific numbers, names, dates — not generic placeholders
- Where context is absent, use reasonable estimates with explicit assumptions
- The document should be self-contained and authoritative
- Length: comprehensive enough to be the definitive phase record — do not truncate
- Reference prior phase deliverables explicitly (name root causes, cite baseline metrics)
`
}

Generate the complete document now.`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
): Promise<Response> {
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  }

  const { programId } = await params;

  const program = await getProgramById(ctx, programId);
  if (!program) return Response.json({ error: "not_found" }, { status: 404 });

  let body: { phase?: number; deliverableTypeKey?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const targetPhase = body.phase ?? program.currentPhase ?? 1;
  const deliverableTypeKey =
    body.deliverableTypeKey ?? `p${targetPhase}_package`;

  // Resolve spec from registry — fall back to a generic spec if unknown key
  const registrySpec = getDeliverableSpec(deliverableTypeKey);
  const spec: DeliverableSpec = registrySpec ?? {
    deliverableTypeKey,
    documentTitle: body.title ?? `Phase ${targetPhase} Deliverable`,
    phase: targetPhase,
    phaseLabel: PHASE_LABEL[targetPhase] ?? `P${targetPhase}`,
    audiencePrimary: "Program team",
    documentPurpose: "Phase deliverable",
    formatRecommendation: "html-word",
    gateArtifact: false,
    standAlone: true,
    sections: [
      "Executive Summary",
      "Current Situation",
      "Analysis & Findings",
      "Recommendations",
      "Next Steps & Gate Readiness",
    ],
    consultingAnalog: "Consulting Phase Deliverable",
  };

  const title = body.title ?? `${spec.documentTitle} — ${program.name}`;

  // Assemble all context in parallel
  const [engDetail, priorContent, activeClient] = await Promise.all([
    fetchEngagementDetail(programId),
    fetchPriorPhaseContent(programId),
    getActiveClientRow().catch(() => null),
  ]);

  if (!engDetail)
    return Response.json({ error: "engagement_not_found" }, { status: 404 });

  const { eng, sponsorName, sponsorRole, leadName } = engDetail;

  const tenantInventoryKey = activeClient?.key
    ? clientKeyToInventorySubstrateKey(activeClient.key)
    : null;

  const [tenantContext, modules] = await Promise.all([
    buildTenantContextBlock(tenantInventoryKey).catch(() => null),
    getModuleState(ctx, programId).catch(() => []),
  ]);

  // Matched pattern from engagement topics
  const patternMatch = await azureRead.maybeSingle<{
    pattern_key: string | null;
  }>({
    table: "pattern_match_logs",
    columns: ["pattern_key"],
    where: {
      engagement_id: programId,
      acted_upon: true,
    },
    orderBy: { column: "acted_upon_at", direction: "desc" },
  });

  let patternContext = "";
  if ((patternMatch as { pattern_key?: string } | null)?.pattern_key) {
    const topic = await azureRead.maybeSingle<Record<string, unknown>>({
      table: "engagement_topics",
      columns: [
        "topic_key",
        "title",
        "canonical_shape_json",
        "phase_playbook",
        "diagnostic_questions",
        "success_signals",
        "failure_modes",
      ],
      where: {
        topic_key: (patternMatch as { pattern_key: string }).pattern_key,
      },
    });
    if (topic) {
      const t = topic as Record<string, unknown>;
      patternContext = [
        "--- MATCHED PATTERN ---",
        `Pattern: ${t.title as string}`,
        t.phase_playbook
          ? `Phase playbook:\n${JSON.stringify(t.phase_playbook, null, 2).slice(0, 3000)}`
          : "",
        t.failure_modes
          ? `Known failure modes:\n${JSON.stringify(t.failure_modes, null, 2).slice(0, 2000)}`
          : "",
        t.success_signals
          ? `Success signals:\n${JSON.stringify(t.success_signals, null, 2).slice(0, 1000)}`
          : "",
        "--- END PATTERN ---",
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  const phasePack = getPhasePackV2(targetPhase);
  const phasePackBlock = phasePack ? formatPhasePackV2ForPrompt(phasePack) : "";

  const generationPrompt = buildGenerationPrompt({
    programName: program.name,
    archetype: program.archetype ?? "strategic_transformation",
    tenantName: activeClient?.name ?? "Client",
    currentPhase: program.currentPhase ?? targetPhase,
    targetPhase,
    sponsorName,
    sponsorRole,
    leadName,
    charter: eng.charter as Record<string, unknown> | null,
    milestones:
      (eng.program_milestones as Array<{
        name: string;
        status: string;
        target_date: string | null;
      }>) ?? [],
    risks:
      (eng.program_risks as Array<{
        title: string;
        likelihood: string;
        impact: string;
        status: string;
      }>) ?? [],
    phasePackBlock,
    priorContent,
    tenantContext: tenantContext ?? "",
    patternContext,
    spec,
    title,
  });

  // Generate with Claude — no character limit
  let content = "";
  try {
    for await (const chunk of streamAgentTurn({
      system:
        "You are a senior transformation consultant generating a complete consulting deliverable. Be specific, substantive, and comprehensive. Do not truncate.",
      messages: [{ role: "user", content: generationPrompt }],
      aiEgress: {
        tenantId: ctx.clientId, // audit column is UUID — clientKey ('skyharbor') breaks the egress write
        userId: /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(ctx.userId ?? "")
          ? ctx.userId
          : undefined,
        workflow: "programs-deliverable-generate-stream",
        dataClass: "confidential",
        artifactId: programId,
        artifactType: "program",
        metadata: { targetPhase, deliverableTypeKey },
      },
    })) {
      content += chunk;
    }
  } catch (err) {
    console.error("[generate] generation error", err);
    return Response.json(
      {
        error: "generation_failed",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }

  if (!content.trim()) {
    return Response.json({ error: "empty_generation" }, { status: 500 });
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
    console.error("[generate] save error", saveErr);
    // Return content even if save failed
  }

  void modules;

  return Response.json({
    deliverableId,
    versionId,
    deliverableTypeKey,
    title,
    content,
    saved: Boolean(deliverableId),
    phase: targetPhase,
    format: spec.formatRecommendation,
    audiencePrimary: spec.audiencePrimary,
  });
}

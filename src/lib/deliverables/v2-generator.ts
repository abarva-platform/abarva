import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { ContentBlock, TextBlock } from "@/lib/integrations/ai-egress";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { getEngagementById } from "@/lib/db/engagement";
import {
  getActivePatterns,
  getPeerDecisionsForPhase,
} from "@/lib/graph/retrieval";
import { assembleTopicIntelligenceBlock } from "@/lib/agent/prompts/_shared/topic-intelligence";
import { getRecentTurns } from "@/lib/db/turn";
import {
  buildStructuredDeliverableData,
  type StructuredDeliverableData,
} from "./structured";

// Pack L Phase 4 · deliverable generation pipeline. Takes {engagementId,
// deliverable_type_key}; returns generated content + quality score + any
// remaining issues. Structured as a sequence of discrete steps so each one
// is testable / inspectable / traceable:
//
//   1. loadDeliverableType(key)           — the spec
//   2. validateRequiredInputs()           — refuse if critical data missing
//   3. assembleGenerationContext()        — pull everything the template needs
//   4. interpolateTemplate()              — fill prompt template
//   5. generateDraft()                    — Claude Opus 4.7, temperature 0.3
//   6. reviewAgainstRubric()              — separate Opus call scoring rubric
//   7. reviseIfBelowThreshold()           — one-shot revision if total_score<70
//   8. persistVersion()                   — writes to deliverable_versions
//
// Empty-safe at every step: missing inputs produce a [MISSING - ...] blocker
// rather than fabricating. The caller sees the gaps in the returned `issues`
// array.

// ── Types ────────────────────────────────────────────────────────────────

export interface DeliverableTypeRow {
  id: string;
  type_key: string;
  title: string;
  description: string | null;
  applicable_phases: number[];
  applicable_topics: string[];
  template_structure: Record<string, unknown>;
  required_data_inputs: Record<string, unknown>;
  quality_rubric: Record<string, unknown> | Array<Record<string, unknown>>;
  generation_prompt_template: string | null;
  output_format: string;
  maturity: string;
}

export interface GenerationContext {
  engagement: {
    id: string;
    name: string;
    industry_code: string;
    current_phase: number;
    objective_code: string;
    function_code: string;
  };
  sponsor: { name: string; role: string; decision_authority?: string } | null;
  client: { id: string; name: string; industry: string | null } | null;
  topic: {
    topic_key: string;
    title: string;
    vendor_landscape: Record<string, unknown>;
    success_signals: string[];
    failure_modes: string[];
    phase_playbook: Record<string, unknown>;
  } | null;
  activePatterns: Array<{ code: string; name: string; failure_rate: number }>;
  peerDecisions: Array<{
    choice: string;
    engagement_count: number;
    avg_outcome_usd: number;
  }>;
  topicIntelligenceBlock: string;
  recentTurnSummary: string;
  deliverableSummaries: Record<string, string>;
}

export interface QualityScoreDimension {
  name: string;
  score: number;
  specific_evidence?: string;
  issues?: string[];
  recommendations?: string[];
}

export interface QualityReview {
  total_score: number;
  scores: QualityScoreDimension[];
  critical_issues: string[];
  remaining_issues: string[];
}

export interface GenerateResult {
  deliverable_type_key: string;
  engagement_id: string;
  content: string;
  structured_data: StructuredDeliverableData | null;
  quality: QualityReview;
  issues: string[];
  persisted: { deliverable_id: string; version: number } | null;
}

interface DeliverableAiEgressContext {
  tenantId: string;
  workflow: string;
  artifactId?: string;
  artifactType?: string;
  metadata?: Record<string, unknown>;
}

function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === "text";
}

// ── Step 1 · Load spec ───────────────────────────────────────────────────

export async function loadDeliverableType(
  typeKey: string,
): Promise<DeliverableTypeRow | null> {
  const { data, error } = await getAzureWriteFluentClient()
    .from("deliverable_types")
    .select("*")
    .eq("type_key", typeKey)
    .maybeSingle();
  if (error) {
    console.warn("[loadDeliverableType]", error.message);
    return null;
  }
  return (data as DeliverableTypeRow | null) ?? null;
}

// ── Step 2 · Validate required inputs ────────────────────────────────────

export interface ValidationResult {
  ok: boolean;
  criticalGaps: string[];
  dataGaps: string[];
}

export async function validateRequiredInputs(
  engagementId: string,
  requiredInputs: Record<string, unknown>,
): Promise<ValidationResult> {
  const criticalGaps: string[] = [];
  const dataGaps: string[] = [];

  const engagement = await getEngagementById(engagementId);
  if (!engagement) {
    criticalGaps.push("engagement not found");
    return { ok: false, criticalGaps, dataGaps };
  }

  const engagementReq =
    (requiredInputs.engagement as string[] | undefined) ?? [];
  for (const path of engagementReq) {
    if (path.startsWith("phase_1.") || path.startsWith("phase_2.")) {
      const phaseNum = Number(path.split(".")[0].replace("phase_", ""));
      if (engagement.current_phase < phaseNum) {
        dataGaps.push(
          `${path} · engagement still in phase ${engagement.current_phase}`,
        );
      }
    }
  }

  const clientReq = (requiredInputs.client as string[] | undefined) ?? [];
  for (const req of clientReq) {
    if (req.toLowerCase().includes("financial")) {
      dataGaps.push(
        `client.${req} · not always available without Pack H enterprise data`,
      );
    }
  }

  return { ok: criticalGaps.length === 0, criticalGaps, dataGaps };
}

// ── Step 3 · Assemble generation context ─────────────────────────────────

export async function assembleGenerationContext(
  engagementId: string,
  preferredTopicKey?: string,
): Promise<GenerationContext> {
  const sb = getAzureWriteFluentClient();
  const engagement = await getEngagementById(engagementId);
  if (!engagement) throw new Error(`engagement not found: ${engagementId}`);

  // Sponsor + client
  let sponsor: GenerationContext["sponsor"] = null;
  let client: GenerationContext["client"] = null;

  if (engagement.sponsor_person_id) {
    const { data: sp } = await sb
      .from("persons")
      .select("name, role, communication_style")
      .eq("id", engagement.sponsor_person_id)
      .maybeSingle();
    if (sp) {
      const style = (
        sp as { communication_style?: { decision_authority?: string } }
      ).communication_style;
      sponsor = {
        name: (sp as { name: string }).name,
        role: (sp as { role: string }).role,
        decision_authority: style?.decision_authority,
      };
    }
  }

  const { data: engClient } = await sb
    .from("engagements")
    .select("client:clients(id, name, industry_code)")
    .eq("id", engagement.id)
    .maybeSingle();
  const clientRow = (
    engClient as {
      client: { id: string; name: string; industry_code: string | null } | null;
    } | null
  )?.client;
  if (clientRow) {
    client = {
      id: clientRow.id,
      name: clientRow.name,
      industry: clientRow.industry_code,
    };
  }

  // Topic · prefer the caller-specified topic_key, else fall back to primary-assigned
  let topic: GenerationContext["topic"] = null;
  try {
    const topicKey =
      preferredTopicKey ?? (await loadPrimaryTopicKey(engagementId));
    if (topicKey) {
      const { data } = await sb
        .from("engagement_topics")
        .select(
          "topic_key, title, vendor_landscape, success_signals, failure_modes, phase_playbook",
        )
        .eq("topic_key", topicKey)
        .maybeSingle();
      if (data) topic = data as GenerationContext["topic"];
    }
  } catch (err) {
    console.warn("[assembleGenerationContext.topic]", err);
  }

  // Patterns + peer decisions (via graph)
  const [activePatterns, peerDecisions, recentTurns] = await Promise.all([
    getActivePatterns(engagement.graph_node_id).catch(() => []),
    getPeerDecisionsForPhase(
      engagement.graph_node_id,
      engagement.current_phase,
    ).catch(() => []),
    getRecentTurns(engagement.id, 30).catch(() => []),
  ]);

  // Topic intelligence block · reused from v2 · already handles empty-safe
  const topicIntelligenceBlock = await assembleTopicIntelligenceBlock({
    engagementId: engagement.id,
    currentPhase: engagement.current_phase,
    recentTurns: recentTurns.map((t) => ({ sender: t.sender, text: t.text })),
  }).catch(() => "");

  // Recent turn summary · last 10 turns compacted
  const recentTurnSummary = recentTurns
    .slice(-10)
    .map(
      (t, index) =>
        `[turn ${String(index + 1).padStart(2, "0")} | ${t.sender} | phase ${t.phase}] ${t.text.slice(0, 240)}`,
    )
    .join("\n");

  const deliverableSummaries = await loadDeliverableSummaries(engagement.id);

  return {
    engagement: {
      id: engagement.id,
      name: engagement.name,
      industry_code: engagement.industry_code,
      current_phase: engagement.current_phase,
      objective_code: engagement.objective_code,
      function_code: engagement.function_code,
    },
    sponsor,
    client,
    topic,
    activePatterns: activePatterns.map((p) => ({
      code: p.code,
      name: p.name,
      failure_rate: p.failure_rate,
    })),
    peerDecisions: peerDecisions.map((d) => ({
      choice: d.choice,
      engagement_count: d.engagement_count,
      avg_outcome_usd: d.avg_outcome_usd,
    })),
    topicIntelligenceBlock,
    recentTurnSummary,
    deliverableSummaries,
  };
}

async function loadDeliverableSummaries(
  engagementId: string,
): Promise<Record<string, string>> {
  const sb = getAzureWriteFluentClient();
  const { data: deliverables } = await sb
    .from("deliverables_v2")
    .select("id, deliverable_type_key, current_version")
    .eq("engagement_id", engagementId);

  const rows =
    (deliverables as Array<{
      id: string;
      deliverable_type_key: string;
      current_version: number;
    }> | null) ?? [];
  if (rows.length === 0) return {};

  const summaries: Record<string, string> = {};

  for (const row of rows) {
    const { data: latest } = await sb
      .from("deliverable_versions")
      .select("content")
      .eq("deliverable_id", row.id)
      .eq("version", row.current_version)
      .maybeSingle();

    const content = (latest as { content?: string } | null)?.content?.trim();
    if (!content) continue;
    summaries[row.deliverable_type_key] = content.slice(0, 1800);
  }

  return summaries;
}

async function loadPrimaryTopicKey(
  engagementId: string,
): Promise<string | null> {
  const { data } = await getAzureWriteFluentClient()
    .from("engagement_topics_map")
    .select("topic_key")
    .eq("engagement_id", engagementId)
    .eq("is_primary", true)
    .maybeSingle();
  return (data as { topic_key: string } | null)?.topic_key ?? null;
}

// ── Step 4 · Interpolate template ────────────────────────────────────────

export function interpolateTemplate(
  template: string,
  ctx: GenerationContext,
  spec: DeliverableTypeRow,
): string {
  const phase1Summary =
    ctx.deliverableSummaries.diagnostic_charter ??
    ctx.deliverableSummaries.charter;
  const phase2Summary = ctx.deliverableSummaries.design_brief;
  const phase3Summary = ctx.deliverableSummaries.execution_plan;
  const tenantCurrentStateEvidence = [
    ctx.topicIntelligenceBlock,
    ctx.recentTurnSummary,
    phase1Summary,
    phase2Summary,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n\n");
  const currentStateOrMissing =
    tenantCurrentStateEvidence ||
    "[MISSING - tenant current-state context is not loaded]";

  const replacements: Record<string, string> = {
    "${engagement.id}": ctx.engagement.id,
    "${client.name}": ctx.client?.name ?? "[DATA GAP: client]",
    "${topic.title}": ctx.topic?.title ?? "[DATA GAP: no topic assigned]",
    "${sponsor.name}": ctx.sponsor?.name ?? "[DATA GAP: sponsor]",
    "${sponsor.decision_authority}":
      ctx.sponsor?.decision_authority ?? "[DATA GAP: decision authority]",
    "${structure_as_outline}": renderStructureOutline(spec.template_structure),
    "${client.financial_profile}":
      "[DATA GAP: financial profile — load from clients.financial_columns when Pack H depth seeded]",
    "${current_state_baseline_from_phase_1}":
      phase1Summary ??
      (ctx.recentTurnSummary.length > 0
        ? ctx.recentTurnSummary
        : "[DATA GAP: no phase-1 findings recorded in turns]"),
    "${target_state_from_phase_2}":
      phase2Summary ??
      "[DATA GAP: phase-2 design — derive from deliverables or turn history]",
    "${topic.vendor_landscape}": ctx.topic
      ? JSON.stringify(ctx.topic.vendor_landscape, null, 2)
      : "[DATA GAP: no topic]",
    "${topic.success_signals}": ctx.topic
      ? ctx.topic.success_signals.join("\n- ")
      : "[DATA GAP: no topic]",
    "${topic.failure_modes}": ctx.topic
      ? ctx.topic.failure_modes.join("\n- ")
      : "[DATA GAP: no topic]",
    "${industry_benchmarks_retrieved}":
      "[DATA GAP: benchmarks not yet integrated — use knowledge_sources content_type=benchmark]",
    "${quality_rubric.criteria}": renderRubricCriteria(spec.quality_rubric),
    "${active_patterns_with_confidence}":
      ctx.activePatterns.length === 0
        ? "[none active]"
        : ctx.activePatterns
            .map(
              (p) =>
                `${p.code} ${p.name} · ${Math.round(p.failure_rate * 100)}% historical failure`,
            )
            .join("\n"),
    "${peer_cohort_summary}":
      ctx.peerDecisions.length === 0
        ? "[no peer decisions available]"
        : ctx.peerDecisions
            .map(
              (d) =>
                `"${d.choice.replace(/_/g, " ")}" · ${d.engagement_count} engagements · avg $${Math.round(d.avg_outcome_usd / 1_000_000)}M`,
            )
            .join("\n"),
    "${engagement.phase_1_findings}":
      phase1Summary ??
      (ctx.recentTurnSummary.length > 0
        ? ctx.recentTurnSummary
        : "[DATA GAP: no phase-1 findings]"),
    "${engagement.phase_2_design_decisions}":
      phase2Summary ??
      "[DATA GAP: phase-2 design — see engagement deliverables or ask the sponsor for the locked design]",
    "${engagement.phase_1_requirements}":
      ctx.deliverableSummaries.charter ?? "[DATA GAP: phase-1 requirements]",
    "${engagement.phase_2_design}":
      phase2Summary ?? "[DATA GAP: phase-2 design]",
    "${client.tech_stack}": currentStateOrMissing,
    "${client.data_sources}": currentStateOrMissing,
    "${client.cost_breakdown}": currentStateOrMissing,
    "${client.benchmarks}": currentStateOrMissing,
    "${client.security_requirements}": currentStateOrMissing,
    "${client.compliance_requirements}": currentStateOrMissing,
    "${current_state_summary}":
      ctx.recentTurnSummary.length > 0
        ? ctx.recentTurnSummary
        : "[DATA GAP: no current state summary]",
    "${topic.phase_playbook}": ctx.topic
      ? JSON.stringify(ctx.topic.phase_playbook, null, 2)
      : "[DATA GAP: no topic]",
    "${delivery_history}":
      phase3Summary ?? phase2Summary ?? phase1Summary ?? ctx.recentTurnSummary,
  };

  let out = template;
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(k).join(v);
  }
  return out;
}

function renderStructureOutline(structure: Record<string, unknown>): string {
  const sections =
    (structure.sections as Array<Record<string, unknown>> | undefined) ?? [];
  return sections
    .map((s, i) => {
      const key = (s.key as string) ?? `section_${i}`;
      const title = (s.title as string) ?? key;
      const required = s.required === true ? " (required)" : " (optional)";
      const length = Array.isArray(s.length_words)
        ? ` · ${(s.length_words as number[]).join("-")} words`
        : "";
      const components = Array.isArray(s.components)
        ? ` · components: ${JSON.stringify(s.components)}`
        : "";
      const description =
        typeof s.description === "string" ? ` · ${s.description}` : "";
      const example =
        typeof s.example_completed === "string"
          ? ` · example: ${s.example_completed}`
          : "";
      return `${i + 1}. ${title}${required}${length}${components}${description}${example}`;
    })
    .join("\n");
}

function renderRubricCriteria(
  rubric: Record<string, unknown> | Array<Record<string, unknown>>,
): string {
  const dims = Array.isArray(rubric)
    ? rubric
    : ((rubric.dimensions as Array<Record<string, unknown>> | undefined) ?? []);
  return dims
    .map((d, i) => {
      const name =
        (d.criterion as string) ?? (d.name as string) ?? `criterion_${i + 1}`;
      const rationale = (d.rationale as string) ?? (d.criteria as string) ?? "";
      const severity =
        (d.severity as string) ??
        (typeof d.weight === "number" ? `weight ${d.weight}` : null);
      return `- ${name}${severity ? ` [${severity}]` : ""}: ${rationale}`;
    })
    .join("\n");
}

// ── Step 5 · Generate draft ──────────────────────────────────────────────

export async function generateDraft(
  prompt: string,
  aiContext: DeliverableAiEgressContext,
): Promise<string> {
  const { client } = await getAuditedAnthropicClient({
    tenantId: aiContext.tenantId,
    workflow: aiContext.workflow,
    model: "claude-opus-4-8",
    prompt,
    dataClass: "confidential",
    artifactId: aiContext.artifactId,
    artifactType: aiContext.artifactType,
    metadata: aiContext.metadata,
  });
  const resp = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 32_000,
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
  });
  const text = resp.content
    .filter(isTextBlock)
    .map((block) => block.text)
    .join("\n");
  return text;
}

// ── Step 6 · Review against rubric ───────────────────────────────────────

const RUBRIC_REVIEW_SYSTEM = `You are reviewing a deliverable against a quality rubric. Score it honestly — your job is to raise the quality bar, not to approve mediocre work.`;

export async function reviewAgainstRubric(args: {
  content: string;
  rubric: Record<string, unknown> | Array<Record<string, unknown>>;
  aiContext: DeliverableAiEgressContext;
}): Promise<QualityReview> {
  const prompt = `DELIVERABLE CONTENT
${args.content}

RUBRIC
${JSON.stringify(args.rubric, null, 2)}

For each rubric dimension, provide:
- score: 0-100
- specific_evidence: quotes or paragraph references showing why
- issues: specific gaps
- recommendations: how to fix each issue

Also return:
- critical_issues: dealbreakers that require revision (zero-tolerance items failing)
- total_score: weighted average

Return JSON only with schema:
{
  "scores": [{"name": str, "score": int, "specific_evidence": str, "issues": [str], "recommendations": [str]}],
  "total_score": int,
  "critical_issues": [str],
  "remaining_issues": [str]
}`;

  try {
    const { client } = await getAuditedAnthropicClient({
      tenantId: args.aiContext.tenantId,
      workflow: `${args.aiContext.workflow}:rubric-review`,
      model: "claude-opus-4-8",
      prompt: [RUBRIC_REVIEW_SYSTEM, prompt].join("\n\n"),
      dataClass: "confidential",
      artifactId: args.aiContext.artifactId,
      artifactType: args.aiContext.artifactType,
      metadata: args.aiContext.metadata,
    });
    const resp = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4_000,
      system: RUBRIC_REVIEW_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content
      .filter(isTextBlock)
      .map((block) => block.text)
      .join("\n");

    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      total_score: Number(parsed.total_score ?? 0),
      scores: Array.isArray(parsed.scores) ? parsed.scores : [],
      critical_issues: Array.isArray(parsed.critical_issues)
        ? parsed.critical_issues
        : [],
      remaining_issues: Array.isArray(parsed.remaining_issues)
        ? parsed.remaining_issues
        : [],
    };
  } catch (err) {
    console.warn("[reviewAgainstRubric]", err);
    return {
      total_score: 0,
      scores: [],
      critical_issues: [
        `Rubric review failed: ${err instanceof Error ? err.message : "unknown"}`,
      ],
      remaining_issues: [],
    };
  }
}

// ── Step 7 · Revise if below threshold ───────────────────────────────────

export async function reviseIfBelowThreshold(args: {
  draft: string;
  review: QualityReview;
  spec: DeliverableTypeRow;
  aiContext: DeliverableAiEgressContext;
  threshold?: number;
}): Promise<string> {
  const threshold = args.threshold ?? 70;
  if (
    args.review.total_score >= threshold &&
    args.review.critical_issues.length === 0
  ) {
    return args.draft;
  }

  const issueSummary = [
    ...args.review.critical_issues.map((c) => `CRITICAL: ${c}`),
    ...args.review.remaining_issues,
  ].join("\n");

  const recommendations = args.review.scores
    .flatMap((s) => s.recommendations ?? [])
    .slice(0, 10)
    .map((r) => `- ${r}`)
    .join("\n");

  const prompt = `You produced the following deliverable draft:

${args.draft}

A quality reviewer scored it ${args.review.total_score}/100 and flagged:
${issueSummary}

Concrete recommendations:
${recommendations}

Revise the deliverable to address these issues. Keep the sections that scored well; rewrite only what failed the rubric. Output the full revised deliverable — not just the changes.

Rubric (for reference):
${renderRubricCriteria(args.spec.quality_rubric)}`;

  const { client } = await getAuditedAnthropicClient({
    tenantId: args.aiContext.tenantId,
    workflow: `${args.aiContext.workflow}:revision`,
    model: "claude-opus-4-8",
    prompt,
    dataClass: "confidential",
    artifactType: args.aiContext.artifactType,
    metadata: args.aiContext.metadata,
  });
  const resp = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 32_000,
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
  });
  const text = resp.content
    .filter(isTextBlock)
    .map((block) => block.text)
    .join("\n");
  return text;
}

// ── Step 8 · Persist version ─────────────────────────────────────────────

export async function persistVersion(args: {
  engagementId: string;
  deliverableTypeKey: string;
  content: string;
  qualityReview: QualityReview;
  structuredData?: Record<string, unknown> | null;
  title?: string;
}): Promise<{ deliverable_id: string; version: number } | null> {
  const sb = getAzureWriteFluentClient();

  // Find or create the deliverable_v2 row
  const { data: existing } = await sb
    .from("deliverables_v2")
    .select("id, current_version")
    .eq("engagement_id", args.engagementId)
    .eq("deliverable_type_key", args.deliverableTypeKey)
    .maybeSingle();

  let deliverableId: string;
  let nextVersion: number;

  if (existing) {
    deliverableId = (existing as { id: string; current_version: number }).id;
    nextVersion = (existing as { current_version: number }).current_version + 1;
    const { error: updErr } = await sb
      .from("deliverables_v2")
      .update({ current_version: nextVersion, status: "draft" })
      .eq("id", deliverableId);
    if (updErr) {
      console.warn("[persistVersion.update]", updErr.message);
      return null;
    }
  } else {
    const { data: inserted, error: insErr } = await sb
      .from("deliverables_v2")
      .insert({
        engagement_id: args.engagementId,
        deliverable_type_key: args.deliverableTypeKey,
        title: args.title ?? args.deliverableTypeKey.replace(/_/g, " "),
        status: "draft",
        current_version: 1,
        created_by: "nexus",
      })
      .select("id")
      .single();
    if (insErr || !inserted) {
      console.warn("[persistVersion.insert]", insErr?.message);
      return null;
    }
    deliverableId = (inserted as { id: string }).id;
    nextVersion = 1;
  }

  const { error: verErr } = await sb.from("deliverable_versions").insert({
    deliverable_id: deliverableId,
    version: nextVersion,
    content: args.content,
    structured_data: args.structuredData ?? null,
    quality_score: args.qualityReview.scores,
    quality_issues: {
      critical: args.qualityReview.critical_issues,
      remaining: args.qualityReview.remaining_issues,
      total_score: args.qualityReview.total_score,
    },
  });

  if (verErr) {
    console.warn("[persistVersion.version]", verErr.message);
    return null;
  }

  return { deliverable_id: deliverableId, version: nextVersion };
}

// ── Orchestrator ─────────────────────────────────────────────────────────

export async function generateDeliverable(args: {
  engagementId: string;
  deliverableTypeKey: string;
  preferredTopicKey?: string;
  persist?: boolean;
}): Promise<GenerateResult> {
  const spec = await loadDeliverableType(args.deliverableTypeKey);
  if (!spec) {
    throw new Error(
      `deliverable_type not found: ${args.deliverableTypeKey}. Apply migration 040 + seed deliverable-types.`,
    );
  }

  const validation = await validateRequiredInputs(
    args.engagementId,
    spec.required_data_inputs,
  );
  if (!validation.ok) {
    throw new Error(
      `cannot generate · critical gaps: ${validation.criticalGaps.join(", ")}`,
    );
  }

  const ctx = await assembleGenerationContext(
    args.engagementId,
    args.preferredTopicKey,
  );
  if (!ctx.client?.id) {
    throw new Error(
      `cannot generate · engagement ${args.engagementId} has no client id for AI egress policy`,
    );
  }
  const aiContext: DeliverableAiEgressContext = {
    tenantId: ctx.client.id,
    workflow: `deliverable:${args.deliverableTypeKey}`,
    artifactType: "deliverable_v2",
    metadata: {
      engagementId: args.engagementId,
      deliverableTypeKey: args.deliverableTypeKey,
      clientName: ctx.client.name,
    },
  };

  if (!spec.generation_prompt_template) {
    throw new Error(
      `deliverable_type ${args.deliverableTypeKey} has no generation_prompt_template`,
    );
  }
  const prompt = interpolateTemplate(
    spec.generation_prompt_template,
    ctx,
    spec,
  );

  const draft = await generateDraft(prompt, aiContext);
  const review = await reviewAgainstRubric({
    content: draft,
    rubric: spec.quality_rubric,
    aiContext,
  });
  const finalContent = await reviseIfBelowThreshold({
    draft,
    review,
    spec,
    aiContext,
  });

  // Re-review if we revised
  const finalReview =
    finalContent === draft
      ? review
      : await reviewAgainstRubric({
          content: finalContent,
          rubric: spec.quality_rubric,
          aiContext,
        });
  const structuredData = buildStructuredDeliverableData({
    content: finalContent,
    deliverableTypeKey: args.deliverableTypeKey,
    title: `${spec.title} · ${ctx.topic?.title ?? ctx.engagement.name}`,
    templateStructure: spec.template_structure,
  });

  const persisted =
    args.persist !== false
      ? await persistVersion({
          engagementId: args.engagementId,
          deliverableTypeKey: args.deliverableTypeKey,
          content: finalContent,
          qualityReview: finalReview,
          structuredData: structuredData as unknown as Record<string, unknown>,
          title: `${spec.title} · ${ctx.topic?.title ?? ctx.engagement.name}`,
        })
      : null;

  return {
    deliverable_type_key: args.deliverableTypeKey,
    engagement_id: args.engagementId,
    content: finalContent,
    structured_data: structuredData,
    quality: finalReview,
    issues: [...validation.dataGaps, ...finalReview.remaining_issues],
    persisted,
  };
}

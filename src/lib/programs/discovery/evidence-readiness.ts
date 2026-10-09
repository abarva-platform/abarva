import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import {
  resolveDeclaredDiscoveryBlueprint,
  resolveDiscoveryBlueprintWithBasis,
  type DiscoveryBlueprint,
  type DiscoveryBlueprintBasis,
  type EvidenceFamily,
} from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  familyReviewBacklogFromDecisionRows,
  type FamilyAwaitingReview,
  type FamilyReviewDecisionRow,
  type FamilyWithRejectedEvidence,
} from "@/lib/programs/evidence-readiness/pending-review-next-action";
import { getProgramById } from "@/lib/programs/queries";
import { isP1CharterEvidenceFamily } from "@/lib/programs/p1-charter-evidence";
import { gapRemediationSentence } from "@/lib/programs/evidence-readiness/evidence-waiver-availability";
import {
  inferenceReachReport,
  isAnchoredFamilyMatch,
  type FamilyMatchSignal,
  type InferenceReachReport,
} from "@/lib/programs/discovery/family-inference-anchor";

export interface DiscoveryEvidenceReadinessItem {
  id: string;
  title: string;
  summary: string;
  evidenceType: string;
  phase: number | null;
  confidence: number | string | null;
  createdAt: string | null;
  /**
   * The evidence family the uploader declared for this item, when it was
   * uploaded against one. Declared identity outranks anything inferred from
   * the item's text.
   */
  declaredFamilyKey?: string | null;
}

export interface DiscoveryFamilyCoverage {
  familyId: string;
  label: string;
  required: boolean;
  status: "covered" | "missing";
  evidenceIds: string[];
  evidenceTitles: string[];
}

export interface DiscoveryGapRegisterItem {
  familyId: string;
  label: string;
  required: boolean;
  likelySource: string;
  format: string;
  grounds: string;
  remediation: string;
}

export interface DiscoveryEvidenceReadiness {
  blueprintId: string;
  blueprintVersion: string;
  archetypeLabel: string;
  /**
   * What decided the archetype this readiness pack grades evidence against.
   * Anything other than a declared basis means no human chose it, so the gap
   * register is an opinion about an inferred archetype.
   */
  blueprintBasis: DiscoveryBlueprintBasis;
  /**
   * The declaration that was supplied and did not name a catalog archetype, so
   * it was discarded. Non-null means the pack is grading against an archetype
   * nobody declared; show it rather than presenting the archetype as declared.
   */
  unknownDeclaredArchetype: string | null;
  requiredTotal: number;
  requiredCovered: number;
  requiredMissing: number;
  optionalCovered: number;
  readinessScore: number;
  readyForP3: boolean;
  families: DiscoveryFamilyCoverage[];
  gapRegister: DiscoveryGapRegisterItem[];
  /**
   * Families that have evidence loaded and awaiting a human review decision
   * (`program_evidence_reviews.decision = 'pending'`).
   *
   * Coverage above is graded on APPROVED rows only, so without this an
   * uncovered family cannot be told apart from one whose evidence is already
   * sitting in the reviewer's queue, and every consumer asks for an upload that
   * has already happened. Nothing gate-bearing may read this field: pending is
   * not approved. Optional so a readiness object built before it existed, or
   * one that crossed an API boundary without it, reads as "nothing pending".
   */
  familiesAwaitingReview?: FamilyAwaitingReview[];
  /**
   * Families whose provided evidence was rejected in review
   * (`program_evidence_reviews.decision = 'rejected'`).
   *
   * The third value of that column was read by nothing. A rejection takes the
   * row out of the pending queue without ever making it approved, and the
   * review update is itself filtered `decision = 'pending'`, so no control can
   * re-decide it — which silently restored the bare "upload" instruction for a
   * family whose file is already in the cabinet. Like the pending list this is
   * wording only: nothing gate-bearing may read it, and a rejected family
   * stays uncovered. Optional for the same reason as the field above.
   */
  familiesWithRejectedEvidence?: FamilyWithRejectedEvidence[];
}

const FAMILY_KEYWORDS: Record<string, string[]> = {
  disruption_ops_data: [
    "disruption",
    "irops",
    "recovery",
    "event",
    "delay",
    "cancellation",
    "ops",
    "volume",
    "cause",
  ],
  it_systems_landscape: [
    "system",
    "application",
    "cmdb",
    "architecture",
    "integration",
    "landscape",
    "platform",
  ],
  data_analytics_estate: [
    "data",
    "analytics",
    "warehouse",
    "lake",
    "databricks",
    "snowflake",
    "cdp",
    "profile",
    "batch",
    "real-time",
    "realtime",
  ],
  cost_pools: ["cost", "finance", "fp&a", "goodwill", "compensation", "roi"],
  contact_center_analytics: [
    "contact",
    "call",
    "aht",
    "ccaas",
    "speech",
    "deflect",
  ],
  segment_value_data: ["segment", "loyalty", "churn", "customer value", "tier"],
  inventory_rules: [
    "inventory",
    "fulfilment",
    "fulfillment",
    "fare",
    "rule",
    "guardrail",
  ],
  core_system_throughput: [
    "throughput",
    "transaction",
    "latency",
    "limit",
    "throttle",
    "queue",
  ],
  channel_consent: [
    "notification",
    "channel",
    "consent",
    "sms",
    "mobile",
    "email",
  ],
  policy_entitlement: [
    "policy",
    "entitlement",
    "legal",
    "regulatory",
    "jurisdiction",
    "compliance",
  ],
  current_state_runbook: [
    "runbook",
    "process",
    "current state",
    "as-is",
    "operating",
    "workflow",
  ],
  workforce_model: ["workforce", "role", "staff", "capacity", "change"],
  current_state_process: [
    "process",
    "current state",
    "as-is",
    "workflow",
    "operating",
  ],
  kpi_baseline: ["kpi", "metric", "baseline", "target", "success"],
  cost_baseline: ["cost", "finance", "budget", "run-rate", "baseline"],
  org_workforce: ["org", "workforce", "role", "raci", "capacity"],
  current_state_workflow_map: [
    "workflow",
    "process map",
    "current state",
    "member service",
    "agent journey",
    "call flow",
    "handoff",
  ],
  contact_center_kpis: [
    "aht",
    "average handle time",
    "first call resolution",
    "fcr",
    "transfer",
    "repeat contact",
    "after-call",
    "after call",
    "csat",
    "cost per contact",
    "metric",
    "kpi",
    "baseline",
  ],
  crm_contact_center_system_map: [
    "crm",
    "ccaas",
    "genesys",
    "nice",
    "servicenow",
    "contact center",
    "call center",
    "system map",
    "integration",
    "application",
  ],
  claims_eligibility_benefits_data_access: [
    "claim",
    "claims",
    "eligibility",
    "benefits",
    "prior auth",
    "authorization",
    "pharmacy",
    "data access",
    "source",
  ],
  knowledge_base_ownership_freshness: [
    "knowledge",
    "policy",
    "freshness",
    "owner",
    "content",
    "article",
    "knowledge base",
  ],
  call_recording_transcript_availability: [
    "transcript",
    "recording",
    "speech",
    "intent",
    "retention",
    "call sample",
  ],
  phi_privacy_security_controls: [
    "phi",
    "hipaa",
    "privacy",
    "security",
    "audit",
    "access",
    "control",
  ],
  human_in_loop_model: [
    "human",
    "approval",
    "review",
    "escalation",
    "decision rights",
    "clinical decision",
  ],
  model_risk_responsible_ai_controls: [
    "model risk",
    "responsible ai",
    "ai governance",
    "guardrail",
    "hallucination",
    "evaluation",
  ],
  measurement_owner_cadence: [
    "measurement",
    "owner",
    "cadence",
    "metric owner",
    "tower",
    "scorecard",
  ],
  finance_baseline_value_plan: [
    "finance",
    "baseline",
    "value",
    "cost",
    "business case",
    "savings",
  ],
  change_adoption_owner: [
    "training",
    "adoption",
    "change",
    "workforce",
    "supervisor",
    "raci",
  ],
};

function evidenceText(item: DiscoveryEvidenceReadinessItem): string {
  return `${item.title}\n${item.summary}\n${item.evidenceType}`.toLowerCase();
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

interface DiscoveryBlueprintProgramInput {
  functionPackKey?: string | null;
  archetype?: string | null;
  name?: string | null;
  problemStatement?: string | null;
  targetOutcome?: string | null;
  charter?: unknown;
}

/**
 * The DECLARED archetype id for a program, if any — functionPackKey or the
 * charter's declared classification. This is the authoritative identity the
 * blueprint resolver honors (identity is declared, never inferred). Returns
 * null when nothing is declared, so resolution falls back to inference.
 */
export function resolveDeclaredProgramArchetypeId(
  program: DiscoveryBlueprintProgramInput | null | undefined,
): string | null {
  const charter =
    typeof program?.charter === "object" && program.charter !== null
      ? (program.charter as Record<string, unknown>)
      : {};
  const charterClassification = charter.classification;
  const charterArchetype =
    typeof charterClassification === "object" && charterClassification !== null
      ? nonEmptyString((charterClassification as Record<string, unknown>).archetype)
      : null;
  const charterClassificationText =
    typeof charterClassification === "string" ? charterClassification : null;
  const candidates = [
    program?.functionPackKey,
    charterArchetype,
    program?.archetype,
    charterClassificationText,
  ]
    .map((value) => nonEmptyString(value))
    .filter((value): value is string => Boolean(value));
  // Prefer the first candidate that names a KNOWN catalog archetype. A declared
  // identity then wins regardless of field order, so a `functionPackKey` that is
  // not an archetype cannot shadow an archetype declared in the charter
  // classification, and `program.archetype` (which drives phase logic) need not
  // be overloaded to declare a discovery blueprint. When no candidate matches
  // the catalog, the first non-empty value is returned as the inference seed —
  // identical to the prior behavior.
  const declaredArchetype = candidates.find(
    (candidate) => resolveDeclaredDiscoveryBlueprint(candidate) != null,
  );
  return declaredArchetype ?? candidates[0] ?? null;
}

export function buildDiscoveryBlueprintInputFromProgram(
  program: DiscoveryBlueprintProgramInput | null | undefined,
): string {
  const charter =
    typeof program?.charter === "object" && program.charter !== null
      ? (program.charter as Record<string, unknown>)
      : {};

  return [
    resolveDeclaredProgramArchetypeId(program) ?? "STRATEGIC_MOVE",
    program?.name,
    program?.problemStatement,
    program?.targetOutcome,
    charter.problem_statement,
    charter.value_hypothesis,
    charter.scope_boundary,
    charter.evidence_family,
  ]
    .map((value) => nonEmptyString(value))
    .filter(Boolean)
    .join(" ");
}

/**
 * Score one (item, family) pair, and report WHAT matched alongside the number.
 *
 * The score alone cannot say whether a win is specific to the family or was
 * taken by default off one generic word; `signal` carries that, and
 * `familyMatchAnchor` decides.
 *
 * Only AUTHORED keyword hits are reported as keywords. Today the derived
 * fallback list is exactly the two strings `phraseMatched` already tests, so
 * reporting it as well would change nothing — a mutation that drops this guard
 * is inert, not untested. It is here so the two signals stay separate channels
 * if either side is edited, and the derived fallback can never read as keyword
 * corroboration of itself.
 */
function familyMatch(
  item: DiscoveryEvidenceReadinessItem,
  family: EvidenceFamily,
): { score: number; signal: FamilyMatchSignal } {
  const text = evidenceText(item);
  const authored = FAMILY_KEYWORDS[family.id];
  const keywords = authored ?? [
    family.id.replace(/_/g, " "),
    family.label.toLowerCase(),
  ];
  let score = 0;
  const matchedAuthoredKeywords: string[] = [];
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      score += 2;
      if (authored) matchedAuthoredKeywords.push(keyword);
    }
  }
  const idPhraseMatched = text.includes(family.id.replace(/_/g, " "));
  const labelPhraseMatched = text.includes(family.label.toLowerCase());
  if (idPhraseMatched) score += 3;
  if (labelPhraseMatched) score += 3;

  if (item.evidenceType === "architecture_inventory") {
    if (
      family.id === "it_systems_landscape" ||
      family.id === "data_analytics_estate"
    ) {
      score += 2;
    }
  }
  if (item.evidenceType === "baseline_evidence") {
    if (
      family.id === "kpi_baseline" ||
      family.id === "cost_baseline" ||
      family.id === "cost_pools" ||
      family.id === "disruption_ops_data" ||
      family.id === "contact_center_analytics"
    ) {
      score += 2;
    }
  }
  if (item.evidenceType === "decision_log") {
    if (family.id === "policy_entitlement" || family.id === "inventory_rules") {
      score += 1;
    }
  }
  if (
    item.evidenceType === "meeting_notes" ||
    item.evidenceType === "workshop_output"
  ) {
    if (
      family.id === "current_state_process" ||
      family.id === "current_state_runbook" ||
      family.id === "org_workforce" ||
      family.id === "workforce_model"
    ) {
      score += 1;
    }
  }
  return {
    score,
    signal: {
      matchedAuthoredKeywords,
      phraseMatched: idPhraseMatched || labelPhraseMatched,
    },
  };
}

/**
 * Declared upload family → the discovery families it evidences.
 *
 * The readiness map a file is uploaded against and the discovery blueprint the
 * build gate reads are two taxonomies of the same archetype. They were joined
 * only by re-inferring a family from keywords in the item's title and summary,
 * one family per item. A workflow walkthrough whose rows mention claims and
 * eligibility outscores its own family and is filed under data access, so the
 * workflow map reads as missing while the approved file that is the workflow
 * map sits in the Move. The uploader already said what the file is; this table
 * carries that statement across instead of discarding it.
 *
 * A key maps to more than one family where its label covers both.
 */
const DECLARED_FAMILY_CROSSWALK: Record<string, readonly string[]> = {
  member_service_process_map: ["current_state_workflow_map"],
  member_service_metrics_baseline: ["contact_center_kpis"],
  member_service_systems_data_landscape: [
    "crm_contact_center_system_map",
    "claims_eligibility_benefits_data_access",
  ],
  knowledge_policy_content_inventory: ["knowledge_base_ownership_freshness"],
  contact_center_transcripts_intents: [
    "call_recording_transcript_availability",
  ],
  phi_controls_and_human_approval: [
    "phi_privacy_security_controls",
    "human_in_loop_model",
  ],
  member_service_org_change_readiness: ["change_adoption_owner"],
};

/**
 * The blueprint families an item's DECLARED family evidences, or an empty list
 * when it declared none this blueprint recognises. A declared key that is
 * itself a blueprint family id maps to that family.
 */
export function declaredDiscoveryFamilies(
  item: DiscoveryEvidenceReadinessItem,
  blueprint: DiscoveryBlueprint,
): string[] {
  const declared = item.declaredFamilyKey?.trim();
  if (!declared) return [];
  const blueprintIds = new Set(
    blueprint.evidenceFamilies.map((family) => family.id),
  );
  if (blueprintIds.has(declared)) return [declared];
  return (DECLARED_FAMILY_CROSSWALK[declared] ?? []).filter((id) =>
    blueprintIds.has(id),
  );
}

/**
 * Validate an evidence family an uploader declared for a file.
 *
 * Empty means nothing was declared (null). A key the Move's discovery does not
 * require is refused: silently falling back to inference would record the
 * upload as if nothing had been declared, and the uploader would have no way
 * to know their statement was dropped.
 */
export function resolveDeclaredEvidenceFamily(
  raw: unknown,
  blueprint: DiscoveryBlueprint,
): { ok: true; familyKey: string | null } | { ok: false; detail: string } {
  const declared = typeof raw === "string" ? raw.trim() : "";
  if (!declared) return { ok: true, familyKey: null };
  const known = blueprint.evidenceFamilies.some(
    (family) => family.id === declared,
  );
  return known
    ? { ok: true, familyKey: declared }
    : {
        ok: false,
        detail: `'${declared}' is not an evidence family this Move requires.`,
      };
}

/**
 * Which of a blueprint's required families keyword inference can actually
 * reach, for the one keyword table this product has.
 *
 * Exposed so a surface or report can say that a blueprint's families are mostly
 * unreachable by inference, instead of presenting an inferred coverage map as
 * if every family had an equal chance of being matched. See
 * `inferenceReachReport` for why a MIXED blueprint is the biased case.
 */
export function discoveryInferenceReach(
  blueprint: DiscoveryBlueprint,
): InferenceReachReport {
  return inferenceReachReport(
    blueprint.evidenceFamilies,
    new Set(Object.keys(FAMILY_KEYWORDS)),
  );
}

export function mapEvidenceToDiscoveryFamily(
  item: DiscoveryEvidenceReadinessItem,
  blueprint: DiscoveryBlueprint,
): string | null {
  let best: { id: string; score: number; signal: FamilyMatchSignal } | null =
    null;
  for (const family of blueprint.evidenceFamilies) {
    const { score, signal } = familyMatch(item, family);
    // A family whose match is not anchored cannot be the winner at all, rather
    // than winning and then being discarded: a weak generic hit must not shut
    // out a weaker-scoring but anchored family behind it.
    if (!isAnchoredFamilyMatch(signal)) continue;
    if (!best || score > best.score) best = { id: family.id, score, signal };
  }
  return best && best.score >= 2 ? best.id : null;
}

export function evaluateDiscoveryEvidenceReadiness(args: {
  blueprint: DiscoveryBlueprint;
  evidenceItems: DiscoveryEvidenceReadinessItem[];
  /**
   * What decided `blueprint`, from `resolveDiscoveryBlueprintWithBasis`.
   * Optional so existing callers that only have a blueprint keep working; they
   * are reported as not-declared, which is what they can honestly claim.
   */
  blueprintBasis?: DiscoveryBlueprintBasis;
  /** A supplied declaration that named no catalog archetype, if any. */
  unknownDeclaredArchetype?: string | null;
}): DiscoveryEvidenceReadiness {
  const coverage = new Map<string, DiscoveryEvidenceReadinessItem[]>();
  for (const item of args.evidenceItems) {
    // What the uploader declared wins. Keyword inference is the fallback for
    // items that declared nothing this blueprint recognises — it never
    // overrides, and never adds to, a declaration.
    const declared = declaredDiscoveryFamilies(item, args.blueprint);
    const inferred =
      declared.length > 0 ||
      isP1CharterEvidenceFamily(item.declaredFamilyKey)
        ? null
        : mapEvidenceToDiscoveryFamily(item, args.blueprint);
    const familyIds = declared.length > 0 ? declared : inferred ? [inferred] : [];
    for (const familyId of familyIds) {
      const items = coverage.get(familyId) ?? [];
      items.push(item);
      coverage.set(familyId, items);
    }
  }

  const families = args.blueprint.evidenceFamilies.map((family) => {
    const items = coverage.get(family.id) ?? [];
    return {
      familyId: family.id,
      label: family.label,
      required: family.required,
      status: items.length > 0 ? "covered" : "missing",
      evidenceIds: items.map((item) => item.id),
      evidenceTitles: items.map((item) => item.title),
    } satisfies DiscoveryFamilyCoverage;
  });

  const requiredFamilies = families.filter((family) => family.required);
  const requiredCovered = requiredFamilies.filter(
    (family) => family.status === "covered",
  ).length;
  const gapRegister = args.blueprint.evidenceFamilies
    .filter((family) => family.required && !coverage.has(family.id))
    .map((family) => ({
      familyId: family.id,
      label: family.label,
      required: family.required,
      likelySource: family.likelySource,
      format: family.format,
      grounds: family.grounds,
      remediation: gapRemediationSentence(family.format, family.likelySource),
    }));

  return {
    blueprintId: args.blueprint.blueprintId,
    blueprintVersion: args.blueprint.blueprintVersion,
    archetypeLabel: args.blueprint.archetypeLabel,
    // Absent an explicit basis the caller did not resolve through the
    // basis-aware path, so the honest answer is that it was not declared here.
    blueprintBasis: args.blueprintBasis ?? "inferred",
    unknownDeclaredArchetype: args.unknownDeclaredArchetype ?? null,
    requiredTotal: requiredFamilies.length,
    requiredCovered,
    requiredMissing: gapRegister.length,
    optionalCovered: families.filter(
      (family) => !family.required && family.status === "covered",
    ).length,
    readinessScore:
      requiredFamilies.length === 0
        ? 100
        : Math.round((requiredCovered / requiredFamilies.length) * 100),
    readyForP3: gapRegister.length === 0,
    families,
    gapRegister,
  };
}

export async function loadDiscoveryEvidenceReadiness(
  ctx: TenancyCtx,
  programId: string,
): Promise<DiscoveryEvidenceReadiness> {
  const program = await getProgramById(ctx, programId);
  const resolution = resolveDiscoveryBlueprintWithBasis(
    buildDiscoveryBlueprintInputFromProgram(program),
    resolveDeclaredProgramArchetypeId(program),
  );
  const blueprint = resolution.blueprint;
  // Match any representation of the tenant (app client key + its canonical
  // substrate alias), so approved evidence loaded under either is counted. The
  // alias set is per-tenant, so this cannot widen to another tenant.
  const tenantKeys = tenantAliasesFor(ctx.clientKey ?? "");
  const rows = await azureRead
    .query<{
      id: string;
      title: string | null;
      summary: string | null;
      evidence_type: string | null;
      phase: number | null;
      confidence: number | string | null;
      created_at: string | null;
      family_key: string | null;
    }>(
      `
        SELECT
          pei.id,
          pei.title,
          pei.summary,
          pei.evidence_type,
          pei.phase,
          pei.confidence,
          pei.created_at,
          per.family_key
        FROM program_evidence_reviews per
        INNER JOIN program_evidence_items pei
          ON pei.id = per.evidence_id
        WHERE per.program_id = $1
          AND per.tenant_key = ANY($2)
          AND per.decision = 'approved'
          AND pei.program_id = per.program_id
          AND pei.tenant_key = per.tenant_key
        ORDER BY COALESCE(per.reviewed_at, per.updated_at, per.created_at) DESC
        LIMIT 200
      `,
      [programId, tenantKeys],
      { missingTable: "empty" },
    )
    .catch(() => []);
  // The undecided/refused backlog is read SEPARATELY from the approved rows,
  // deliberately. Folding it into the query above would let these rows crowd
  // out approved ones inside its LIMIT and change what counts as covered;
  // coverage must keep grading on approved rows alone. This read only ever
  // adds wording, so a failure degrades to "no backlog" rather than failing
  // the readiness load.
  //
  // Both non-approved decisions come back in ONE grouped read. `rejected` is
  // the third and last value of the column's CHECK constraint and was read by
  // nothing, which left a rejected family presenting the bare "upload"
  // instruction for a file already in the cabinet.
  const backlogRows = await azureRead
    .query<FamilyReviewDecisionRow>(
      `
        SELECT
          per.family_key,
          per.decision,
          COUNT(*) AS decision_count
        FROM program_evidence_reviews per
        WHERE per.program_id = $1
          AND per.tenant_key = ANY($2)
          AND per.decision IN ('pending', 'rejected')
          AND per.family_key IS NOT NULL
        GROUP BY per.family_key, per.decision
      `,
      [programId, tenantKeys],
      { missingTable: "empty" },
    )
    .catch(() => []);
  const { familiesAwaitingReview, familiesWithRejectedEvidence } =
    familyReviewBacklogFromDecisionRows(backlogRows);

  return {
    ...evaluateDiscoveryEvidenceReadiness({
      blueprint,
      blueprintBasis: resolution.basis,
      unknownDeclaredArchetype: resolution.unknownDeclaration,
      evidenceItems: rows.map((row) => ({
        id: row.id,
        title: row.title ?? "Untitled evidence",
        summary: row.summary ?? "",
        evidenceType: row.evidence_type ?? "uploaded_artifact",
        phase: row.phase,
        confidence: row.confidence,
        createdAt: row.created_at,
        declaredFamilyKey: row.family_key,
      })),
    }),
    familiesAwaitingReview,
    familiesWithRejectedEvidence,
  };
}

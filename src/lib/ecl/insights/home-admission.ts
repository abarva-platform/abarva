import { z } from "zod";
import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";
import {
  GovernedObjectSchema,
  evaluateGovernedObject,
  POLICY_VERSION,
} from "@/lib/governance/context-corpus-policy";
import {
  namesAPerson,
  resolveServingApproval,
} from "@/lib/governance/dataset-manifest";
import { insightHash, insightUuid, INSIGHT_RULES } from "./engine";
import type { InsightPlan, InsightRuleKey } from "./types";
import type {
  ChapterId,
  HomeReviewBundle,
  HomeRecordRenderSource,
} from "@/lib/home/preview/types";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const HomeInsightReviewSchema = z
  .object({
    contractVersion: z.literal("home-insight-review/v1"),
    tenantKey: z.string(),
    assessmentId: z.string(),
    releaseId: z.string().uuid(),
    loadVersionHash: hash,
    baseHomeRecordToken: hash,
    reviewedBy: z
      .string()
      .refine(namesAPerson, "A named human reviewer is required"),
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    findings: z.array(
      z
        .object({
          findingId: z.string().uuid(),
          findingHash: hash,
          governance: GovernedObjectSchema,
        })
        .strict(),
    ),
  })
  .strict();
export type HomeInsightReview = z.infer<typeof HomeInsightReviewSchema>;

export interface HomeInsightAdmission {
  plan: InsightPlan;
  review: HomeInsightReview;
  manifest: unknown;
}

export function validateHomeInsightAdmission(args: {
  admission: HomeInsightAdmission;
  tenantKey: string;
  assessmentId: string;
  baseHomeRecordToken: string;
}): void {
  const { plan, manifest } = args.admission;
  const review = HomeInsightReviewSchema.parse(args.admission.review);
  if (
    plan.tenantKey !== args.tenantKey ||
    plan.assessmentId !== args.assessmentId ||
    review.tenantKey !== args.tenantKey ||
    review.assessmentId !== args.assessmentId ||
    review.releaseId !== plan.releaseId ||
    review.loadVersionHash !== plan.loadVersionHash ||
    review.baseHomeRecordToken !== args.baseHomeRecordToken
  ) {
    throw new Error(
      "Insight review is not bound to this tenant, candidate and Home record",
    );
  }
  if (
    insightHash({
      findings: plan.findings,
      evaluations: plan.evaluations,
      inventory: plan.inventory,
      excluded: plan.excluded,
    }) !== plan.resultHash ||
    insightHash(INSIGHT_RULES) !== plan.ruleSetHash ||
    insightHash({
      sourceSetHash: plan.sourceSetHash,
      ruleSetHash: plan.ruleSetHash,
      resultHash: plan.resultHash,
    }) !== plan.loadVersionHash ||
    insightUuid({
      tenant: plan.tenantKey,
      assessment: plan.assessmentId,
      sourceSetHash: plan.sourceSetHash,
      ruleSetHash: plan.ruleSetHash,
    }) !== plan.releaseId
  ) {
    throw new Error("Insight result content or rule version changed");
  }
  const approval = resolveServingApproval([manifest], {
    dataset_id: (manifest as { dataset_id?: string })?.dataset_id ?? "",
    tenant_key: args.tenantKey,
    assessment_id: args.assessmentId,
    source_set_hash: plan.loadVersionHash,
    object_count: plan.findings.length,
    ingestion_method: "operator_aca_job",
    surface: "home",
  });
  if (!approval.approved)
    throw new Error(
      `Insight serving approval refused: ${approval.reasons.join("; ")}`,
    );
  if (
    new Set(review.findings.map((item) => item.findingId)).size !==
      review.findings.length ||
    review.findings.length !== plan.findings.length ||
    plan.findings.length === 0
  ) {
    throw new Error(
      "Every candidate needs exactly one review; empty releases are not admitted",
    );
  }
  for (const finding of plan.findings) {
    const item = review.findings.find((row) => row.findingId === finding.id);
    const governed = item?.governance;
    const references = finding.sourceRecordIds
      .map((id) => `ecl_source.source_record:${id}`)
      .sort();
    if (
      !item ||
      item.findingHash !== insightHash(finding) ||
      !governed ||
      governed.id !== finding.id ||
      governed.tenant_id !== args.tenantKey ||
      governed.client_key !== args.tenantKey ||
      governed.object_type !== "enterprise_insight" ||
      governed.source_layer !== "signal" ||
      governed.policy_version !== POLICY_VERSION ||
      governed.contract_hash !== item.findingHash ||
      governed.source_basis !==
        `deterministic:${finding.ruleKey}:${plan.ruleSetHash}` ||
      governed.provenance?.source_file !==
        `canonical-assessment:${plan.assessmentId}:${plan.sourceSetHash}` ||
      !governed.confidence_rationale ||
      !governed.last_reviewed_at ||
      !["low", "medium", "high"].includes(governed.confidence_level ?? "") ||
      insightHash([...governed.source_references].sort()) !==
        insightHash(references) ||
      references.length === 0 ||
      !evaluateGovernedObject(governed).agentReady
    ) {
      throw new Error(
        "Insight review lacks exact content, lineage or earned agent readiness",
      );
    }
    const validated = buildValidatedAgentContextBundle(
      [{ ...governed, citations: governed.source_references }],
      { requireAgentReady: true },
    );
    if (validated.usable.length !== 1)
      throw new Error("Insight excluded by the validated context policy");
  }
}

const chapterForRule: Record<InsightRuleKey, ChapterId> = {
  "priority-delivery-links": "strategy_value_creation",
  "program-forecast-budget": "performance_value",
  "ai-target-actual-gap": "performance_value",
  "risk-critical-dependency": "what_needs_attention",
  "compatible-benchmark": "performance_value",
};
const domainsForRule: Record<InsightRuleKey, string[]> = {
  "priority-delivery-links": ["strategic_priority", "program"],
  "program-forecast-budget": ["program", "metric"],
  "ai-target-actual-gap": ["ai_use_case", "metric"],
  "risk-critical-dependency": ["risk", "application", "infrastructure"],
  "compatible-benchmark": ["metric", "external_benchmark"],
};

/** The original narrative packet hashes stay intact; the separate admission hash versions this addition. */
export function attachHomeInsightAdmission(
  bundle: HomeReviewBundle,
  source: HomeRecordRenderSource,
  baseHomeRecordToken: string,
  admission: HomeInsightAdmission,
): { bundle: HomeReviewBundle; recordSource: HomeRecordRenderSource } {
  if (
    source.kind !== "ecl_serving_projection" ||
    source.contextVersion?.coherence !== "coherent" ||
    !source.contextVersion.sourceSetHash
  )
    throw new Error("Insights require a coherent live Home record");
  validateHomeInsightAdmission({
    admission,
    tenantKey: bundle.tenantKey,
    assessmentId: source.contextVersion.assessmentId,
    baseHomeRecordToken,
  });
  const admissionHash = insightHash(admission);
  const signals = admission.plan.findings.map((finding) => ({
    id: `sig_integrated_${finding.id.replaceAll("-", "_")}`,
    kind: "dependency" as const,
    statement: [finding.headline, finding.detail, ...finding.caveats].join(" "),
    domains: domainsForRule[finding.ruleKey],
    evidenceRefs: finding.sourceRecordIds,
  }));
  const chapters = bundle.chapters.map((chapter) => ({
    ...chapter,
    key_insights: [
      ...chapter.key_insights,
      ...admission.plan.findings
        .filter(
          (finding) => chapterForRule[finding.ruleKey] === chapter.chapterId,
        )
        .map((finding) => ({
          claim_ref: `integrated:${finding.id}`,
          statement: [
            finding.headline,
            finding.detail,
            ...finding.caveats,
          ].join(" "),
          evidence_ids: [`sig_integrated_${finding.id.replaceAll("-", "_")}`],
          confidence: admission.review.findings.find(
            (item) => item.findingId === finding.id,
          )!.governance.confidence_level as "low" | "medium" | "high",
          claim_type: "OBSERVATION" as const,
        })),
    ],
  }));
  const contextVersion = {
    ...source.contextVersion,
    integratedInsightHash: admissionHash,
  };
  return {
    recordSource: { ...source, contextVersion },
    bundle: {
      ...bundle,
      contextVersion,
      chapters,
      thesis: {
        ...bundle.thesis,
        signalPacket: {
          ...bundle.thesis.signalPacket,
          signals: [...bundle.thesis.signalPacket.signals, ...signals],
        },
      },
    },
  };
}

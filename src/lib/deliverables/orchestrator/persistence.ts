// Persistence — save a completed deliverable through the existing artifacts repository.
//
// Maps an OrchestrationResult (passed plan gate + quality gate) into the repository's
// BoardPackRenderInput/Result contract and persists to generated_artifacts. The save
// function is injectable so the mapping is unit-tested without the data plane. A result
// that did not pass the gates is refused — the quality gate is integrated here too.

import "server-only";

import { createHash } from "node:crypto";
import type { TenantAiPolicy } from "@/lib/integrations/ai-egress";
import type {
  BoardPackRenderInput,
  BoardPackRenderResult,
  GeneratedArtifactFormat,
  GeneratedArtifactType,
} from "@/lib/artifacts/types";
import {
  saveGeneratedArtifact,
  type GeneratedArtifactRecord,
} from "@/lib/artifacts/repository";
import { prescribedFormatForDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import { renderDeliverableHtml } from "./renderers";
import { humanizeSourceFamily } from "./source-register";
import { buildDeckHtmlFromDocument } from "@/lib/deliverables/deck-from-result";
import type { OrchestrationResult } from "./orchestrator";
import { assessClientDeliverable } from "@/lib/deliverables/quality/assess-deliverable";
import {
  buildContractInput,
  deliverableKeyForRegistryKey,
  deliverableKeyForOrchestratorType,
} from "@/lib/deliverables/quality/deliverable-key-map";
import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";
import {
  renderArchitectureHtml,
  ARCHITECTURE_RENDERED_EXHIBITS,
  deriveArchitectureContractSignals,
  type ArchitectureContractSignals,
} from "@/lib/visual-system/architecture-html-renderer";
import type { ArchitectureModel } from "@/lib/visual-system/architecture-model";
import type { DeliverablePlan } from "@/lib/deliverables/planning/deliverable-plan";
import { sanitizeClientFacingArtifactHtml } from "@/lib/deliverables/client-facing-artifact-sanitize";
import {
  renderDeckHtml,
  deckExhibits,
  type StorylineDeck,
} from "@/lib/visual-system/storyline-deck";
import type {
  DeliverableKey,
  ExhibitId,
} from "@/lib/deliverables/profiles/types";
import type { OutputFormat, QualityValidationResult } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STRUCTURED_ARCHITECTURE_KEYS = new Set<DeliverableKey>([
  "target_state_architecture",
]);

function usesStructuredArchitecturePreview(
  deliverableKey: DeliverableKey | undefined,
): boolean {
  return !!deliverableKey && STRUCTURED_ARCHITECTURE_KEYS.has(deliverableKey);
}

export interface PersistDeliverableOptions {
  clientId: string;
  renderedBy: string;
  /** the move / source-event id this deliverable was generated for. */
  sourceArtifactRef: string;
  tenantPolicy: TenantAiPolicy;
  outputFormat?: GeneratedArtifactFormat; // default 'docx'
  /** governed evidence ledger ids used (for the artifact's audit trail). */
  evidenceLedgerIds?: string[];
  /** Canonical deliverables_v2 registry key, when it differs from the orchestrator type. */
  deliverableTypeKey?: string;
  userId?: string;
  /**
   * When true (the `moves_decision_storytelling` flag), render the artifact as the exhibit-led
   * executive deck (HTML) instead of the prose HTML. Caller evaluates the tenant flag; this stays
   * flag-system-decoupled. Any error falls back to the prose render — generation never breaks.
   */
  renderAsDeck?: boolean;
  /** Tenant key for the deck's tenant line (only used when renderAsDeck). */
  tenantKey?: string;
  /**
   * Deliverable Quality Contract enforcement. The contract ALWAYS runs (its
   * result state is recorded); when this is true, a non-`client_ready` artifact
   * is persisted as an internal draft (quarantined) rather than client-ready.
   * Staged per tenant via flag during rollout, then platform-default.
   */
  enforceQualityContract?: boolean;
  /** Tenant-specific terms the artifact should use (client-specificity check). */
  tenantTerms?: ReadonlyArray<string>;
  /** Whether stage-3 egress/data governance passed (for the contract). */
  governanceOk?: boolean;
  /**
   * Structured exhibit models the generation passes produced (stage 4). When
   * present and `renderViaProfile` is on, the renderer is selected by the
   * profile (e.g. html_architecture draws the ArchitectureModel).
   */
  structuredModels?: {
    architectureModel?: ArchitectureModel;
    storylineDeck?: StorylineDeck;
    /** Persisted P3b assembly input generated before Target Architecture. */
    structuredArchitectureBrief?: DeliverablePlan;
  };
  /** Select the renderer by profile (stage 6). Staged per tenant via flag. */
  renderViaProfile?: boolean;
  generationLineage?: Record<string, unknown>;
}

export interface PersistDeps {
  save?: typeof saveGeneratedArtifact;
}

function artifactTypeFor(module: string): GeneratedArtifactType {
  if (module === "source") return "source_board_pack";
  if (module === "moves") return "move_board_pack";
  return "dossier_board_pack";
}

const COMPOSITION_SIGNAL_REASON =
  "a pass/fail composition signal whose failure already reaches the record as a blocker or warning and is counted there; persisting the signal itself is a metric-series change, declared here rather than shown by absence";

/** Quality → 0..1 score: starts at 1.0, small penalty per advisory warning. */
function qualityScore(result: OrchestrationResult): number {
  const warnings = result.quality?.warnings.length ?? 0;
  return Math.max(0.5, Math.round((1 - warnings * 0.1) * 100) / 100);
}

type QualityMetrics = QualityValidationResult["metrics"];

/**
 * Whether a quality metric is written to the per-generation metrics record, and
 * when it is not, the reason — stated here rather than shown by absence.
 */
export type QualityMetricPersistence =
  | { readonly persist: true }
  | { readonly persist: false; readonly reason: string };

/**
 * The persistence policy for every field the quality gate measures.
 *
 * This is a `Record<keyof QualityMetrics, …>`, so a field added to the metrics
 * type and not named here does not compile. That is the point of the shape. The
 * previous writer was a hand-written object literal naming ten fields, and an
 * allowlist over a growing type cannot fail: three fields were added to the
 * metrics type for the expected-exhibit shortfall and were dropped here in
 * silence, so a generation that asked for three exhibits and received one
 * recorded a docked `qualityScore` and an incremented `warningCount` with no
 * record of how many were asked for or which did not arrive — the omission rate
 * was not trendable. The mechanism, not that instance, is what this closes: the
 * next field added to the metrics type must state its intent here or fail the
 * build, and a field deliberately not persisted says so in one place.
 */
export const QUALITY_METRIC_PERSISTENCE: Readonly<
  Record<keyof QualityMetrics, QualityMetricPersistence>
> = {
  sectionCount: { persist: true },
  bodyWordCount: { persist: true },
  tableCount: { persist: true },
  readingTimeMinutes: { persist: true },
  manualEditNeeded: { persist: true },
  wordBand: { persist: true },

  // How many exhibits the brief asked for, how many of those arrived, and which
  // did not. Persisted so the omission rate can be trended: the synthesis pass
  // may legitimately omit an exhibit rather than emit a placeholder one, so an
  // absence nobody counted reads exactly like a deliverable that never wanted
  // the visual.
  expectedExhibitCount: { persist: true },
  receivedExpectedExhibitCount: { persist: true },
  missingExpectedExhibits: { persist: true },

  // The values ARE the leaked internal identifiers. Persisting them would copy
  // internal tags into a stored artifact record, which is the thing the check
  // exists to keep out of one; the count of the leak reaches the record through
  // `blockerCount`.
  leakedInternalTags: {
    persist: false,
    reason:
      "the values are the leaked internal identifiers themselves; persisting them would copy internal tags into a stored artifact record",
  },

  // Composition checks. Each one that fails raises a blocker or a warning, and
  // that failure is already counted in `blockerCount` / `warningCount` and
  // docked from `qualityScore`. Persisting the individual signal is a
  // metric-series change and is outside the item that introduced this policy;
  // it is named here so the omission is declared rather than silent.
  hasSourceRegister: { persist: false, reason: COMPOSITION_SIGNAL_REASON },
  hasDecisionSection: { persist: false, reason: COMPOSITION_SIGNAL_REASON },
  hasRecommendation: { persist: false, reason: COMPOSITION_SIGNAL_REASON },
  hasRiskTable: { persist: false, reason: COMPOSITION_SIGNAL_REASON },
  hasCentralTension: { persist: false, reason: COMPOSITION_SIGNAL_REASON },
  hasOptionsConsidered: { persist: false, reason: COMPOSITION_SIGNAL_REASON },
  hasEvidenceGapsNoted: { persist: false, reason: COMPOSITION_SIGNAL_REASON },
  clientCompleteCount: { persist: false, reason: COMPOSITION_SIGNAL_REASON },
  unsupportedClaimCount: { persist: false, reason: COMPOSITION_SIGNAL_REASON },
  requiredEvidenceSignalCount: {
    persist: false,
    reason: COMPOSITION_SIGNAL_REASON,
  },
  missingRequiredEvidenceSignalCount: {
    persist: false,
    reason: COMPOSITION_SIGNAL_REASON,
  },
};

/**
 * Per-generation metrics captured on every artifact, regardless of pass/block
 * outcome — so a real sample of Charters (and other artifact types) can be
 * reviewed empirically before the word-count bands are tightened further
 * (see advisoryBandMax in quality-bar-registry.ts). `pageEstimate` is a rough
 * ~500-words-per-executive-page heuristic, not a real pagination result.
 *
 * The metric fields are copied by walking QUALITY_METRIC_PERSISTENCE rather
 * than by naming them, so this function cannot drift from the type again.
 */
function buildGenerationMetrics(
  result: OrchestrationResult,
): Record<string, unknown> | undefined {
  const m = result.quality?.metrics;
  if (!m) return undefined;

  const persisted: Record<string, unknown> = {};
  for (const key of Object.keys(QUALITY_METRIC_PERSISTENCE) as Array<
    keyof QualityMetrics
  >) {
    if (!QUALITY_METRIC_PERSISTENCE[key].persist) continue;
    const value = m[key];
    // Absent stays absent. A brief that declared no expected exhibits must not
    // record `expectedExhibitCount: 0` — "not measured" and "measured, none
    // expected" are different facts, and a zero here reads as the second.
    if (value === undefined) continue;
    persisted[key] = value;
  }

  return {
    ...persisted,
    pageEstimate: Math.max(1, Math.ceil(m.bodyWordCount / 500)),
    qualityScore: qualityScore(result),
    warningCount: result.quality?.warnings.length ?? 0,
    blockerCount: result.quality?.blockers.length ?? 0,
  };
}

function renderedVisualsPresent(html: string): boolean {
  return /<(?:svg|img|table)\b/i.test(html);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function deckExhibitsRenderedAsVisual(
  html: string,
  deck: StorylineDeck,
): ExhibitId[] {
  return deckExhibits(deck).filter((exhibitId) => {
    const pattern = new RegExp(
      `<div\\b[^>]*\\bdata-exhibit=["']${escapeRegExp(exhibitId)}["'][^>]*>[\\s\\S]*?<\\/div>`,
      "i",
    );
    const match = html.match(pattern);
    return match ? renderedVisualsPresent(match[0]) : false;
  });
}

function visibleTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function persistDeliverable(
  result: OrchestrationResult,
  opts: PersistDeliverableOptions,
  deps: PersistDeps = {},
): Promise<GeneratedArtifactRecord> {
  if (!result.ok || !result.document) {
    throw new Error(
      `cannot persist deliverable: ${result.blockedReason ?? "generation did not pass the gates"}`,
    );
  }
  const doc = result.document;
  const artifactType = artifactTypeFor(result.brief.module);
  // The prescribed primary format follows the deliverable type: most narrative
  // documents are Word/DOCX; the financial model (orchestrator 'estimate_model')
  // is an Excel workbook. An explicit caller override (opts.outputFormat) wins so
  // existing callers can still force a format; otherwise we resolve from the brief.
  const prescribedFormat = prescribedFormatForDeliverableType(
    result.brief.deliverableType,
  );
  let html = renderDeliverableHtml(doc);
  const outputFormat: GeneratedArtifactFormat =
    opts.outputFormat ?? prescribedFormat;
  const deliverableKey = deliverableKeyForOrchestratorType(
    result.brief.deliverableType,
  );
  const contractDeliverableKey =
    deliverableKeyForRegistryKey(opts.deliverableTypeKey) ?? deliverableKey;
  const resolvedDeliverableTypeKey =
    opts.deliverableTypeKey ?? deliverableKey ?? result.brief.deliverableType;
  let profileRenderedHtml = false;
  // True whenever a profile/deck renderer creates an HTML preview of the SAME
  // governed document. The persisted outputFormat remains the prescribed final
  // format (DOCX/PPTX/XLSX); HTML is only the browser review surface.
  let htmlPreviewRendered = false;

  // ── Stage 6: renderer selection by profile (flag-gated rollout) ──
  // When the generation passes produced structured models, render the profile's
  // renderer (e.g. the premium HTML architecture exhibit) instead of prose.
  if (opts.renderViaProfile && contractDeliverableKey) {
    const profile = DELIVERABLE_PROFILES[contractDeliverableKey];
    const models = opts.structuredModels;
    if (
      usesStructuredArchitecturePreview(contractDeliverableKey) &&
      models?.architectureModel
    ) {
      html = renderArchitectureHtml(models.architectureModel);
      profileRenderedHtml = true;
      htmlPreviewRendered = true;
    } else if (profile.renderer === "pptx_storyline" && models?.storylineDeck) {
      // HTML storyline deck is the browser preview; native PPTX remains the
      // governed final download format.
      html = renderDeckHtml(models.storylineDeck);
      htmlPreviewRendered = true;
    }
  }

  // Flag-gated (moves_decision_storytelling): emit the exhibit-led executive deck (HTML) from the
  // SAME governed document instead of the prose HTML. Any failure falls back to the prose render —
  // a deck-render error must never fail a generation that already passed the gates.
  if (opts.renderAsDeck && !profileRenderedHtml) {
    try {
      const deck = buildDeckHtmlFromDocument({
        doc,
        deliverableType: result.brief.deliverableType,
        moveId: opts.sourceArtifactRef,
        ...(result.brief.decisionToSupport
          ? { decisionContext: result.brief.decisionToSupport }
          : {}),
        nowIso: new Date().toISOString(),
        tenantLabel: doc.clientDisplayName,
        ...(opts.tenantKey ? { tenantKey: opts.tenantKey } : {}),
      });
      if (deck) {
        html = deck;
        htmlPreviewRendered = true;
      }
    } catch (err) {
      console.error(
        "[persistDeliverable] decision-storytelling deck render failed; using prose",
        err,
      );
    }
  }

  html = sanitizeClientFacingArtifactHtml(html);

  // ── Stage 5: Deliverable Quality Contract (blocking gate before persistence) ──
  // Always runs and records the result state. When enforcement is on, a
  // non-`client_ready` artifact is quarantined (saved as internal draft) so it
  // cannot be served as client-ready. Tenant-agnostic; runs for every tenant.
  let qualityQuarantined = false;
  let qualityQuarantineReason: string | null = null;
  if (contractDeliverableKey) {
    const profile = DELIVERABLE_PROFILES[contractDeliverableKey];
    const architectureSignals: Partial<ArchitectureContractSignals> =
      profileRenderedHtml && opts.structuredModels?.architectureModel
        ? deriveArchitectureContractSignals(
            opts.structuredModels.architectureModel,
            html,
          )
        : {};
    // Exhibits the structured generation passes produced (stage 4) count toward
    // the contract's exhibit-enforcement check only when the FINAL persisted
    // HTML still contains real rendered architecture visuals. This prevents a
    // later prose/deck fallback from getting credit for diagrams that no longer
    // exist in the artifact the client sees.
    const additionalExhibits: ExhibitId[] = [];
    if (architectureSignals.exhibitsRenderedAsVisual === true)
      additionalExhibits.push(...ARCHITECTURE_RENDERED_EXHIBITS);
    const renderedDeckExhibits = opts.structuredModels?.storylineDeck
      ? deckExhibitsRenderedAsVisual(html, opts.structuredModels.storylineDeck)
      : [];
    additionalExhibits.push(...renderedDeckExhibits);

    const contractInput = buildContractInput({
      doc,
      deliverableKey: contractDeliverableKey,
      outputFormat: outputFormat as OutputFormat,
      additionalExhibits,
      // Evaluate the same sanitized visible text that will be persisted and
      // shown to reviewers. The structured doc can contain draft-era mechanical
      // wording that the final client-facing HTML has already normalized.
      narrativeTextOverride: visibleTextFromHtml(html),
      ...(opts.tenantTerms ? { tenantTerms: opts.tenantTerms } : {}),
      ...(opts.governanceOk !== undefined
        ? { governanceOk: opts.governanceOk }
        : {}),
    });
    const assessment = assessClientDeliverable({
      ...contractInput,
      exhibitsRenderedAsVisual:
        architectureSignals.exhibitsRenderedAsVisual ??
        (opts.structuredModels?.storylineDeck
          ? renderedDeckExhibits.length > 0
          : renderedVisualsPresent(html)),
      ...architectureSignals,
      deliverableKey: contractDeliverableKey,
    });
    if (!assessment.clientReady) {
      const blockingFindings = assessment.quality.findings.filter(
        (f) => f.severity === "block",
      );
      const reasons = blockingFindings.map((f) => f.dimension).join(", ");
      // TEMPORARY DIAGNOSTIC (2026-07-09): non_mechanical_writing has recurred live
      // post-fix on a DIFFERENT term than the FIN-BASE-P2 collision already fixed, and
      // a blocked run's draft text is never persisted anywhere retrievable — so the
      // exact leaked term could not be inspected from outside the running process.
      // Log only the matched term + a short surrounding snippet (never the full
      // document) so the next occurrence is diagnosable from ACA logs. Remove once
      // the residual leak class is understood and fixed, or keep as a standing
      // diagnostic if it proves broadly useful.
      for (const f of blockingFindings) {
        if (f.dimension !== "non_mechanical_writing" || !f.detail?.length)
          continue;
        for (const term of f.detail) {
          const bareTerm = term.replace(/\s*×\d+$/, "");
          const idx = contractInput.narrativeText
            .toLowerCase()
            .indexOf(bareTerm.toLowerCase());
          const snippet =
            idx >= 0
              ? contractInput.narrativeText.slice(
                  Math.max(0, idx - 60),
                  idx + bareTerm.length + 60,
                )
              : null;
          console.warn(
            `[persistDeliverable][non_mechanical_writing] matchedTerm=${JSON.stringify(term)} ` +
              `deliverableKey=${contractDeliverableKey} clientId=${opts.clientId} sourceArtifactRef=${opts.sourceArtifactRef}` +
              (snippet
                ? ` snippet=${JSON.stringify(snippet)}`
                : " snippet=<not found in narrativeText>"),
          );
        }
      }
      console.warn(
        `[persistDeliverable] quality contract: ${assessment.state} (${reasons || "n/a"})` +
          (opts.enforceQualityContract
            ? " — persisting as internal_draft"
            : " — observe-only"),
      );
      if (opts.enforceQualityContract || profile.visualRendererRequired) {
        qualityQuarantined = true;
        qualityQuarantineReason = `${assessment.state}: ${reasons}`;
      }
    }
  }

  const facts: BoardPackRenderInput["facts"] = doc.sourceRegister.map((r) => ({
    id: `cite-${r.citationNumber}`,
    label: r.label,
    value: `${humanizeSourceFamily(r.evidenceFamily)} (${r.confidence}${r.asOf ? `, ${r.asOf}` : ""})`,
    evidenceLedgerId: String(r.citationNumber),
  }));
  const sections: BoardPackRenderInput["sections"] = doc.generatedSections.map(
    (s) => ({
      id: s.key,
      title: s.title,
      claims: [s.bodyMarkdown.slice(0, 500)],
    }),
  );

  const input: BoardPackRenderInput = {
    clientId: opts.clientId,
    sourceArtifactRef: opts.sourceArtifactRef,
    artifactType,
    outputFormat,
    renderEngine: "internal",
    renderedBy: opts.renderedBy,
    title: doc.title,
    sections,
    facts,
    tenantPolicy: opts.tenantPolicy,
    ...(opts.userId !== undefined ? { userId: opts.userId } : {}),
  };

  const rendered: BoardPackRenderResult = {
    artifactType,
    sourceArtifactRef: opts.sourceArtifactRef,
    renderEngine: "internal",
    outputFormat,
    html,
    blobUrl: "",
    blobSha256: createHash("sha256").update(html).digest("hex"),
    qualityScore: qualityScore(result),
    evidenceLedgerIds:
      opts.evidenceLedgerIds ??
      doc.sourceRegister.map((r) => String(r.citationNumber)),
    // generation_egress_audit is a single UUID FK to ai_egress_audit(id). Pass responseIds
    // are Anthropic message ids (msg_…), not audit UUIDs — and the decomposed flow makes many
    // calls, so a joined string would never be one valid UUID. Link the first pass whose
    // responseId is a genuine audit UUID, else null (the per-call audit rows persist
    // independently in ai_egress_audit regardless).
    generationEgressAudit:
      result.passTrace
        .map((t) => t.responseId)
        .find((r): r is string => !!r && UUID_RE.test(r)) ?? null,
    quarantined: qualityQuarantined,
    quarantineReason: qualityQuarantineReason,
  };

  const save = deps.save ?? saveGeneratedArtifact;
  const renderableDocWithType = {
    ...doc,
    deliverableTypeKey: resolvedDeliverableTypeKey,
    deliverableType: result.brief.deliverableType,
  };

  // Persist the FULL structured document alongside the canonical deliverable
  // key so later human approval writes back to the correct deliverables_v2 slot
  // without guessing from a generated title.
  const generationMetrics = buildGenerationMetrics(result);

  return save(input, rendered, {
    deliverableTypeKey: resolvedDeliverableTypeKey,
    deliverableType: result.brief.deliverableType,
    registryKey: resolvedDeliverableTypeKey,
    renderableDoc: renderableDocWithType,
    ...(htmlPreviewRendered ? { htmlPreviewFormat: "html" } : {}),
    ...(generationMetrics ? { generationMetrics } : {}),
    ...(opts.generationLineage
      ? { generationLineage: opts.generationLineage }
      : {}),
    ...(opts.structuredModels?.architectureModel
      ? { architectureModel: opts.structuredModels.architectureModel }
      : {}),
    ...(opts.structuredModels?.structuredArchitectureBrief
      ? {
          structuredArchitectureBrief:
            opts.structuredModels.structuredArchitectureBrief,
        }
      : {}),
  });
}

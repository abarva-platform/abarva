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
import { buildDeckHtmlFromDocument } from "@/lib/deliverables/deck-from-result";
import type { OrchestrationResult } from "./orchestrator";
import { assessClientDeliverable } from "@/lib/deliverables/quality/assess-deliverable";
import {
  buildContractInput,
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
import {
  renderDeckHtml,
  deckExhibits,
  type StorylineDeck,
} from "@/lib/visual-system/storyline-deck";
import type { ExhibitId } from "@/lib/deliverables/profiles/types";
import type { OutputFormat } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PersistDeliverableOptions {
  clientId: string;
  renderedBy: string;
  /** the move / source-event id this deliverable was generated for. */
  sourceArtifactRef: string;
  tenantPolicy: TenantAiPolicy;
  outputFormat?: GeneratedArtifactFormat; // default 'docx'
  /** governed evidence ledger ids used (for the artifact's audit trail). */
  evidenceLedgerIds?: string[];
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
  };
  /** Select the renderer by profile (stage 6). Staged per tenant via flag. */
  renderViaProfile?: boolean;
}

export interface PersistDeps {
  save?: typeof saveGeneratedArtifact;
}

function artifactTypeFor(module: string): GeneratedArtifactType {
  if (module === "source") return "source_board_pack";
  if (module === "moves") return "move_board_pack";
  return "dossier_board_pack";
}

/** Quality → 0..1 score: starts at 1.0, small penalty per advisory warning. */
function qualityScore(result: OrchestrationResult): number {
  const warnings = result.quality?.warnings.length ?? 0;
  return Math.max(0.5, Math.round((1 - warnings * 0.1) * 100) / 100);
}

function renderedVisualsPresent(html: string): boolean {
  return (
    /class=["'][^"']*\bvisual-exhibit\b/i.test(html) ||
    /<svg\b/i.test(html) ||
    /<table\b/i.test(html) ||
    /data-exhibit=/i.test(html) ||
    /class=["'][^"']*\bdeck-exhibit\b/i.test(html)
  );
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
  let outputFormat: GeneratedArtifactFormat =
    opts.outputFormat ?? prescribedFormat;
  const deliverableKey = deliverableKeyForOrchestratorType(
    result.brief.deliverableType,
  );
  let profileRenderedHtml = false;

  // ── Stage 6: renderer selection by profile (flag-gated rollout) ──
  // When the generation passes produced structured models, render the profile's
  // renderer (e.g. the premium HTML architecture exhibit) instead of prose.
  if (opts.renderViaProfile && deliverableKey) {
    const profile = DELIVERABLE_PROFILES[deliverableKey];
    const models = opts.structuredModels;
    if (profile.renderer === "html_architecture" && models?.architectureModel) {
      html = renderArchitectureHtml(models.architectureModel);
      outputFormat = "html";
      profileRenderedHtml = true;
    } else if (profile.renderer === "pptx_storyline" && models?.storylineDeck) {
      // HTML storyline deck now; native PPTX export is the same model later.
      html = renderDeckHtml(models.storylineDeck);
      outputFormat = "html";
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
        outputFormat = "html";
      }
    } catch (err) {
      console.error(
        "[persistDeliverable] decision-storytelling deck render failed; using prose",
        err,
      );
    }
  }

  // ── Stage 5: Deliverable Quality Contract (blocking gate before persistence) ──
  // Always runs and records the result state. When enforcement is on, a
  // non-`client_ready` artifact is quarantined (saved as internal draft) so it
  // cannot be served as client-ready. Tenant-agnostic; runs for every tenant.
  let qualityQuarantined = false;
  let qualityQuarantineReason: string | null = null;
  if (deliverableKey) {
    const profile = DELIVERABLE_PROFILES[deliverableKey];
    const architectureSignals: Partial<ArchitectureContractSignals> = opts
      .structuredModels?.architectureModel
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
    if (opts.structuredModels?.storylineDeck)
      additionalExhibits.push(
        ...deckExhibits(opts.structuredModels.storylineDeck),
      );

    const contractInput = buildContractInput({
      doc,
      deliverableKey,
      outputFormat: outputFormat as OutputFormat,
      additionalExhibits,
      ...(opts.tenantTerms ? { tenantTerms: opts.tenantTerms } : {}),
      ...(opts.governanceOk !== undefined
        ? { governanceOk: opts.governanceOk }
        : {}),
    });
    const assessment = assessClientDeliverable({
      ...contractInput,
      exhibitsRenderedAsVisual:
        architectureSignals.exhibitsRenderedAsVisual ??
        renderedVisualsPresent(html),
      ...architectureSignals,
      deliverableKey,
    });
    if (!assessment.clientReady) {
      const reasons = assessment.quality.findings
        .filter((f) => f.severity === "block")
        .map((f) => f.dimension)
        .join(", ");
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
    value: `${r.evidenceFamily} (${r.confidence}${r.asOf ? `, ${r.asOf}` : ""})`,
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
  // Persist the FULL structured document alongside the HTML so the download route
  // can render any prescribed format (docx/xlsx/html) on demand without re-running
  // the orchestrator. Backward-compatible: older artifacts lack this and fall back
  // to the stored HTML.
  return save(input, rendered, { renderableDoc: doc });
}

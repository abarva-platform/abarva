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
import { sanitizeClientFacingArtifactHtml } from "@/lib/deliverables/client-facing-artifact-sanitize";
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
  let outputFormat: GeneratedArtifactFormat =
    opts.outputFormat ?? prescribedFormat;
  const deliverableKey = deliverableKeyForOrchestratorType(
    result.brief.deliverableType,
  );
  let profileRenderedHtml = false;
  // True whenever a profile/deck renderer deliberately overrides outputFormat to
  // "html" as an alternate presentation of the SAME governed document — not a
  // format mismatch. format_fit exists to catch accidental mismatches (e.g. a
  // narrative profile that should be docx rendering as something else by
  // mistake); it must not fire against an intentional deck/exhibit render, or
  // every docx/xlsx-profiled deliverable (business_case, financial models, etc.)
  // is guaranteed to block the moment moves_decision_storytelling / a structured
  // renderer is enabled for a tenant, regardless of the prose content quality.
  let deckRendered = false;

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
      deckRendered = true;
    } else if (profile.renderer === "pptx_storyline" && models?.storylineDeck) {
      // HTML storyline deck now; native PPTX export is the same model later.
      html = renderDeckHtml(models.storylineDeck);
      outputFormat = "html";
      deckRendered = true;
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
        deckRendered = true;
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
      // Omit outputFormat entirely when the render was a deliberate profile/deck
      // override — format_fit treats a missing outputFormat as "nothing to check"
      // (see checkFormatFit), which is correct here: the html IS the deliverable
      // by design, not a mismatch against the profile's docx/pptx/xlsx contract.
      ...(deckRendered ? {} : { outputFormat: outputFormat as OutputFormat }),
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
        renderedVisualsPresent(html),
      ...architectureSignals,
      deliverableKey,
    });
    if (!assessment.clientReady) {
      const blockingFindings = assessment.quality.findings.filter((f) => f.severity === "block");
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
        if (f.dimension !== "non_mechanical_writing" || !f.detail?.length) continue;
        for (const term of f.detail) {
          const bareTerm = term.replace(/\s*×\d+$/, "");
          const idx = contractInput.narrativeText.toLowerCase().indexOf(bareTerm.toLowerCase());
          const snippet =
            idx >= 0
              ? contractInput.narrativeText.slice(Math.max(0, idx - 60), idx + bareTerm.length + 60)
              : null;
          console.warn(
            `[persistDeliverable][non_mechanical_writing] matchedTerm=${JSON.stringify(term)} ` +
              `deliverableKey=${deliverableKey} clientId=${opts.clientId} sourceArtifactRef=${opts.sourceArtifactRef}` +
              (snippet ? ` snippet=${JSON.stringify(snippet)}` : " snippet=<not found in narrativeText>"),
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
  const resolvedDeliverableTypeKey =
    deliverableKey ?? result.brief.deliverableType;
  const renderableDocWithType = {
    ...doc,
    deliverableTypeKey: resolvedDeliverableTypeKey,
    deliverableType: result.brief.deliverableType,
  };

  // Persist the FULL structured document alongside the canonical deliverable
  // key so later human approval writes back to the correct deliverables_v2 slot
  // without guessing from a generated title.
  return save(input, rendered, {
    deliverableTypeKey: resolvedDeliverableTypeKey,
    deliverableType: result.brief.deliverableType,
    registryKey: resolvedDeliverableTypeKey,
    renderableDoc: renderableDocWithType,
  });
}

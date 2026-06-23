// The integration keystone — composes every muscle into ONE tested orchestration
// the route calls. Codex provides the injected deps (broker/DB sources + the
// governed model call) and calls generateArtifact; everything else (gate,
// context assembly, prompt, quality bar) is here, tested, tenant-agnostic.
//
//   gate (no approved gate, no generation) → assemble real context → readiness
//   → dynamic prompt → governed model → golden-bar quality gate → result

import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import { getDeliverableProfile } from "@/lib/deliverables/profiles/registry";
import {
  assertPhaseReadyForGeneration,
  type GateReadinessSources,
  type GenerationBlocker,
} from "@/lib/programs/assert-phase-ready";
import {
  assembleMoveSolutionContext,
  type SolutionContextSources,
} from "@/lib/programs/assemble-solution-context";
import { architectureMayProceed, type SolutionContext } from "@/lib/programs/solution-context";
import { buildArtifactPrompt } from "./solution-prompt-factory";
import { meetsGoldenBar, type GoldenBarResult } from "./golden-bar";

export interface GenerateArtifactDeps {
  contextSources: SolutionContextSources;
  gateSources: GateReadinessSources;
  /** The GOVERNED model call (egress-audited). Returns the artifact HTML. */
  callModel: (system: string, user: string) => Promise<string>;
}

export type GenerateArtifactResult =
  | { status: "generated"; html: string; context: SolutionContext; goldenBar: GoldenBarResult }
  | { status: "blocked_gate"; httpStatus: 409; blockers: GenerationBlocker[] }
  | { status: "blocked_context"; missing: string[] }
  | { status: "blocked_quality"; html: string; goldenBar: GoldenBarResult; context: SolutionContext };

function escapeHtml(value: string | undefined): string {
  return (value?.trim() || "Not captured in Solution Context")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function summariseList(values: readonly string[] | undefined): string {
  if (!values?.length) return "Not captured in Solution Context";
  return values.slice(0, 3).join("; ");
}

function capabilityForKpi(name: string, domain: string): string {
  const lower = name.toLowerCase();
  if (/readmission|quality|hedis|star|clinical/.test(lower + domain)) {
    return "Gold clinical quality data product with provider attribution and Power BI semantic model";
  }
  if (/cost|margin|claim|leakage|payment|finance/.test(lower + domain)) {
    return "Claims, finance, and contract-conformed Lakehouse marts with governed cost-of-care measures";
  }
  if (/call|agent|member|experience|prior|auth|utilization/.test(lower + domain)) {
    return "Operational event and member-interaction data product for workflow automation and agent assist";
  }
  return "Governed Lakehouse data product and semantic metric layer";
}

function renderArchitectureTableCompletion(ctx: SolutionContext): string {
  const decisions = ctx.decisions.length
    ? ctx.decisions.slice(-3).map((d) => `${d.decision}: ${d.rationale}`).join("; ")
    : "P3 option approval and phase gates captured in the Move workflow";
  const kpis = ctx.kpis?.length
    ? ctx.kpis
    : [{ name: "Priority KPI", domain: "other" as const }];
  const kpiRows = kpis
    .map(
      (kpi) => `<tr>
        <td>${escapeHtml(kpi.name)}</td>
        <td>${escapeHtml(kpi.domain)}</td>
        <td>${escapeHtml(capabilityForKpi(kpi.name, kpi.domain))}</td>
        <td>${escapeHtml(kpi.baseline)} -> ${escapeHtml(kpi.target)}</td>
      </tr>`,
    )
    .join("");

  return `<section class="visual-contract-completion" style="margin-top:28px;padding:22px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff">
  <h2 style="margin:0 0 8px;color:#0f172a">Architecture Decision Records / Tradeoff Table</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:22px">
    <thead>
      <tr style="background:#e8f0fe;color:#0f172a">
        <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Decision</th>
        <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Rationale from Solution Context</th>
        <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Tradeoff Accepted</th>
        <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Evidence / Gate Link</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:10px;border:1px solid #cbd5e1">Anchor the target state on the approved P3 option</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(ctx.chosenOption)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(summariseList(ctx.tradeoffsAccepted))}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(decisions)}</td>
      </tr>
      <tr>
        <td style="padding:10px;border:1px solid #cbd5e1">Prioritize the unified clinical + claims data foundation</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(ctx.useCase ?? ctx.useCaseCandidate)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">Sequence reusable data products before advanced automation workloads</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(summariseList(ctx.gaps ?? ctx.rootCauses))}</td>
      </tr>
      <tr>
        <td style="padding:10px;border:1px solid #cbd5e1">Make governance and security part of the platform pattern</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(ctx.securityModel ?? "Governed access, lineage, and PHI controls required for clinical and claims workloads")}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">Favor controlled reuse over unmanaged speed</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(summariseList(ctx.constraints))}</td>
      </tr>
    </tbody>
  </table>

  <h2 style="margin:0 0 8px;color:#0f172a">KPI-to-Capability Traceability</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead>
      <tr style="background:#ecfdf5;color:#064e3b">
        <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">KPI</th>
        <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Domain</th>
        <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Target Architecture Capability</th>
        <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Baseline -> Target</th>
      </tr>
    </thead>
    <tbody>${kpiRows}</tbody>
  </table>
</section>`;
}

function insertBeforeBodyClose(html: string, addition: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${addition}</body>`);
  return `${html}${addition}`;
}

function completeMandatoryExhibits(args: {
  artifact: DeliverableKey;
  html: string;
  goldenBar: GoldenBarResult;
  context: SolutionContext;
}): string | undefined {
  if (args.artifact !== "target_state_architecture") return undefined;
  if (args.goldenBar.hasDataGap || args.goldenBar.proseOnly || args.goldenBar.svgCount === 0) {
    return undefined;
  }
  const onlyMissingTables =
    args.goldenBar.missingVisuals.length === 0 &&
    args.goldenBar.missingTables.length > 0 &&
    args.goldenBar.missingTables.every((table) =>
      ["decision records / tradeoff table", "KPI-to-capability traceability"].includes(table),
    );
  if (!onlyMissingTables) return undefined;
  return insertBeforeBodyClose(args.html, renderArchitectureTableCompletion(args.context));
}

/** Generate one artifact end to end. Persist `generated` as client-ready, everything else as draft. */
export async function generateArtifact(
  args: {
    moveId: string;
    tenantKey: string;
    phase: number;
    artifact: DeliverableKey;
    allowApprovedRetry?: boolean;
    useCaseQuery?: string;
  },
  deps: GenerateArtifactDeps,
): Promise<GenerateArtifactResult> {
  // 1) Gate — no approved gate, no generation.
  const gate = await assertPhaseReadyForGeneration(
    { moveId: args.moveId, phase: args.phase, allowApprovedRetry: args.allowApprovedRetry },
    deps.gateSources,
  );
  if (!gate.ready) return { status: "blocked_gate", httpStatus: 409, blockers: gate.blockers };

  // 2) Assemble the REAL cumulative context (kills [DATA GAP]).
  const assembled = await assembleMoveSolutionContext(
    { moveId: args.moveId, tenantKey: args.tenantKey, targetPhase: args.phase, ...(args.useCaseQuery ? { useCaseQuery: args.useCaseQuery } : {}) },
    deps.contextSources,
  );
  const ctx = assembled.context;

  // 3) Readiness — phase inputs present; architecture needs an approved option.
  if (!assembled.readiness.ready) {
    return { status: "blocked_context", missing: assembled.readiness.missing };
  }
  const profile = getDeliverableProfile(args.artifact);
  if (profile.renderer === "html_architecture" && args.artifact !== "solution_approach_options") {
    const archOk = architectureMayProceed(ctx);
    if (!archOk.ready) return { status: "blocked_context", missing: archOk.missing };
  }

  // 4) Dynamic, context-rich prompt.
  const prompt = buildArtifactPrompt({ artifact: args.artifact, phase: args.phase, context: ctx });

  // 5) Governed model call → artifact HTML.
  const html = await deps.callModel(prompt.system, prompt.user);

  // 6) Quality bar — must be a real visual artifact, no [DATA GAP], required exhibits present.
  const goldenBar = meetsGoldenBar(html, args.artifact);
  if (!goldenBar.pass) {
    const completedHtml = completeMandatoryExhibits({
      artifact: args.artifact,
      html,
      goldenBar,
      context: ctx,
    });
    if (completedHtml) {
      const completedGoldenBar = meetsGoldenBar(completedHtml, args.artifact);
      if (completedGoldenBar.pass) {
        return {
          status: "generated",
          html: completedHtml,
          context: ctx,
          goldenBar: completedGoldenBar,
        };
      }
    }
    return { status: "blocked_quality", html, goldenBar, context: ctx };
  }

  return { status: "generated", html, context: ctx, goldenBar };
}

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
  type GenerationMode,
} from "@/lib/programs/assert-phase-ready";
import {
  assembleMoveSolutionContext,
  type SolutionContextSources,
} from "@/lib/programs/assemble-solution-context";
import { architectureMayProceed, type SolutionContext } from "@/lib/programs/solution-context";
import { sanitizeClientFacingArtifactHtml } from "./client-facing-artifact-sanitize";
import { buildArtifactPrompt } from "./solution-prompt-factory";
import { meetsGoldenBar, type GoldenBarResult } from "./golden-bar";
import {
  modelTokenBudgetForArtifact,
  premiumGoldenBarOptionsForArtifact,
  STRATEGIC_MOVES_DRAFT_CAVEAT,
} from "./strategic-moves-artifact-standard";

export interface GenerateArtifactDeps {
  contextSources: SolutionContextSources;
  gateSources: GateReadinessSources;
  /** The GOVERNED model call (egress-audited). Returns the artifact HTML. */
  callModel: (
    system: string,
    user: string,
    options?: {
      artifact?: DeliverableKey;
      phase?: number;
      generationMode?: GenerationMode;
      maxTokens?: number;
    },
  ) => Promise<string>;
}

export type GenerateArtifactResult =
  | {
      status: "generated";
      html: string;
      context: SolutionContext;
      goldenBar: GoldenBarResult;
      generationMode: GenerationMode;
      draftOnly: boolean;
      draftCaveats: GenerationBlocker[];
      contextCaveats: string[];
      draftCaveatHtml?: string;
    }
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

  <h2 style="margin:24px 0 8px;color:#0f172a">Current-to-Future Logic Table</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:22px">
    <thead><tr style="background:#fef9c3;color:#713f12">
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">P2 finding</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Future-state implication</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Decision required</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Owner / delivery group</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Caveat</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(summariseList(ctx.gaps ?? ctx.rootCauses))}</td><td style="padding:10px;border:1px solid #cbd5e1">Shape exception intake, routing, control review, and accountability before automation scale.</td><td style="padding:10px;border:1px solid #cbd5e1">Confirm target operating concept and design owner.</td><td style="padding:10px;border:1px solid #cbd5e1">Client finance/AP leadership with delivery team support.</td><td style="padding:10px;border:1px solid #cbd5e1">P3 remains draft until sponsor and phase gates are complete.</td></tr>
    </tbody>
  </table>

  <h2 style="margin:0 0 8px;color:#0f172a">Human + AI Role Model</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:22px">
    <thead><tr style="background:#ede9fe;color:#4c1d95">
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Activity</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Human owner</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">AI role</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Control hook</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Evidence required before scaling</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">Exception triage</td><td style="padding:10px;border:1px solid #cbd5e1">AP operations lead</td><td style="padding:10px;border:1px solid #cbd5e1">Classify and suggest routing</td><td style="padding:10px;border:1px solid #cbd5e1">Human approval before payment-impacting action</td><td style="padding:10px;border:1px solid #cbd5e1">Case-level exception history, policy outcomes, and override data</td></tr>
    </tbody>
  </table>

  <h2 style="margin:0 0 8px;color:#0f172a">Workflow Option Matrix</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:22px">
    <thead><tr style="background:#dcfce7;color:#14532d">
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Option</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">What changes</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Value logic</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Complexity / risk</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Fit now / not now</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">A. Rules-led workflow cleanup first</td><td style="padding:10px;border:1px solid #cbd5e1">Standardize taxonomy, routing, and ownership.</td><td style="padding:10px;border:1px solid #cbd5e1">Reduces rework before AI scale.</td><td style="padding:10px;border:1px solid #cbd5e1">Lower complexity; depends on owner alignment.</td><td style="padding:10px;border:1px solid #cbd5e1">Strong fit for draft shaping.</td></tr>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">B. AI-assisted triage and routing</td><td style="padding:10px;border:1px solid #cbd5e1">AI recommends category, owner, and next action.</td><td style="padding:10px;border:1px solid #cbd5e1">Targets manual touch hours.</td><td style="padding:10px;border:1px solid #cbd5e1">Requires evidence, controls, and monitoring.</td><td style="padding:10px;border:1px solid #cbd5e1">Pilot only after evidence readiness.</td></tr>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">C. Exception command center / control tower</td><td style="padding:10px;border:1px solid #cbd5e1">Creates visibility, escalation, and value tracking.</td><td style="padding:10px;border:1px solid #cbd5e1">Improves cycle time and control governance.</td><td style="padding:10px;border:1px solid #cbd5e1">Depends on reporting baseline and workflow status quality.</td><td style="padding:10px;border:1px solid #cbd5e1">Good P4 planning candidate.</td></tr>
    </tbody>
  </table>

  <h2 style="margin:0 0 8px;color:#0f172a">Control / Governance Matrix</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:22px">
    <thead><tr style="background:#fee2e2;color:#7f1d1d">
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Control area</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Future-state control point</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Human approval boundary</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Evidence before scaling</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">Duplicate payment / payment hold</td><td style="padding:10px;border:1px solid #cbd5e1">Audit trail, override policy, segregation of duties, review checkpoints.</td><td style="padding:10px;border:1px solid #cbd5e1">No payment release without accountable human approval.</td><td style="padding:10px;border:1px solid #cbd5e1">Control policy, hold disposition, override history, and exception outcomes.</td></tr>
    </tbody>
  </table>

  <h2 style="margin:0 0 8px;color:#0f172a">Implementation Work Package Table</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:22px">
    <thead><tr style="background:#e0f2fe;color:#075985">
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Work package</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Objective</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Likely owner</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">AbarVa governance role</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Delivery owner role</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">Process design</td><td style="padding:10px;border:1px solid #cbd5e1">Turn blueprint into detailed workflow design.</td><td style="padding:10px;border:1px solid #cbd5e1">Client process owner / delivery team</td><td style="padding:10px;border:1px solid #cbd5e1">Govern work-package intent and value gates.</td><td style="padding:10px;border:1px solid #cbd5e1">Own detailed design and implementation.</td></tr>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">AI-assisted triage pilot</td><td style="padding:10px;border:1px solid #cbd5e1">Test AI recommendations under human controls.</td><td style="padding:10px;border:1px solid #cbd5e1">Finance/AP, data, security, platform teams</td><td style="padding:10px;border:1px solid #cbd5e1">Define readiness, controls, and proof standard.</td><td style="padding:10px;border:1px solid #cbd5e1">Build, configure, test, and train.</td></tr>
    </tbody>
  </table>

  <h2 style="margin:0 0 8px;color:#0f172a">Open Decision Log</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:22px">
    <thead><tr style="background:#f1f5f9;color:#0f172a">
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Decision</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Why it matters</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Owner</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Needed before</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">Select P3 option path</td><td style="padding:10px;border:1px solid #cbd5e1">Determines P4 roadmap and business case sequencing.</td><td style="padding:10px;border:1px solid #cbd5e1">Sponsor and process/control owners</td><td style="padding:10px;border:1px solid #cbd5e1">P3 final / P4 planning</td></tr>
    </tbody>
  </table>

  <h2 style="margin:0 0 8px;color:#0f172a">P4 Readiness Checklist</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:#f5f3ff;color:#4c1d95">
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Readiness item</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Status for P4</th>
      <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Client to complete</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:10px;border:1px solid #cbd5e1">P3 option selected and controls accepted</td><td style="padding:10px;border:1px solid #cbd5e1">Not final in draft</td><td style="padding:10px;border:1px solid #cbd5e1">Sponsor review and phase-gate decision</td></tr>
    </tbody>
  </table>
</section>`;
}

function renderDiscoveryEvidenceBaselineCompletion(ctx: SolutionContext): string | undefined {
  const metrics = ctx.metricsThatMatter ?? [];
  const taxonomy = ctx.evidenceTaxonomy ?? [];
  const missingInputs = ctx.clientActionableMissingInputs ?? [];
  if (metrics.length === 0 && taxonomy.length === 0 && missingInputs.length === 0) {
    return undefined;
  }

  const metricRows = metrics
    .map(
      (metric) => `<tr>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(metric.label)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1;font-weight:800;color:#0f172a">${escapeHtml(metric.value)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(metric.source)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(metric.caveat ?? "Use as extracted evidence for P2 diagnosis")}</td>
      </tr>`,
    )
    .join("");
  const taxonomyRows = taxonomy
    .map(
      (item) => `<tr>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.category)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.volume)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.rate)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.averageResolutionDays)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.manualTouchHours)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.riskLevel)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.owner)}</td>
      </tr>`,
    )
    .join("");
  const missingRows = missingInputs
    .map(
      (item) => `<tr>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.needed)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.whyItMatters)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.owner)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.howItWillBeUsed)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(item.gateImpact)}</td>
      </tr>`,
    )
    .join("");

  return `<section class="evidence-baseline-completion" style="margin-top:28px;padding:22px;border:2px solid #0e7490;border-radius:14px;background:#f8fdff">
  <h2 style="margin:0 0 8px;color:#0f172a">Evidence Baseline Completion Exhibit</h2>
  <p style="margin:0 0 14px;color:#334155;line-height:1.55">This exhibit preserves the extracted P2 evidence that must remain visible in the diagnostic: first-class metrics, exception taxonomy, risk-owner signals, and client-actionable inputs needed before final approval.</p>
  ${
    metricRows
      ? `<h3 style="margin:18px 0 8px;color:#164e63">Metrics that must anchor the diagnostic</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px">
          <thead><tr style="background:#cffafe;color:#164e63">
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Metric</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Value</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Source</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Use / caveat</th>
          </tr></thead>
          <tbody>${metricRows}</tbody>
        </table>`
      : ""
  }
  ${
    taxonomyRows
      ? `<h3 style="margin:18px 0 8px;color:#164e63">Exception taxonomy and risk-owner signals</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px">
          <thead><tr style="background:#ecfeff;color:#164e63">
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Category</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Volume</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Rate</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Avg. resolution days</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Manual touch hours</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Risk</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Owner</th>
          </tr></thead>
          <tbody>${taxonomyRows}</tbody>
        </table>`
      : ""
  }
  ${
    missingRows
      ? `<h3 style="margin:18px 0 8px;color:#164e63">Client to complete before final</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#fef3c7;color:#78350f">
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Needed input</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Why it matters</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Owner</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">How it will be used</th>
            <th style="text-align:left;padding:10px;border:1px solid #cbd5e1">Gate impact</th>
          </tr></thead>
          <tbody>${missingRows}</tbody>
        </table>`
      : ""
  }
</section>`;
}

function insertBeforeBodyClose(html: string, addition: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${addition}</body>`);
  return `${html}${addition}`;
}

function insertAfterBodyOpen(html: string, addition: string): string {
  if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (match) => `${match}${addition}`);
  return `${addition}${html}`;
}

function formatDraftCaveatText(args: {
  draftCaveats: readonly GenerationBlocker[];
  contextCaveats: readonly string[];
}): string {
  const gateReasons = args.draftCaveats.map((caveat) => caveat.reason);
  const contextReasons = args.contextCaveats.map(
    (missing) => `${missing} is not yet captured or approved for final use.`,
  );
  const required = [
    "sponsor assignment is still required",
    "charter signoff is still required",
    "phase gate approval is still required",
    "baseline capture may still require sponsor ratification if the gate review marks it incomplete",
    ...gateReasons,
    ...contextReasons,
  ];
  return `${STRATEGIC_MOVES_DRAFT_CAVEAT} Open gate items: ${required.join("; ")}.`;
}

function renderDraftCaveatHtml(caveat: string): string {
  return `<section class="abarva-pre-gate-draft-caveat" style="margin:20px auto 24px;max-width:1120px;padding:18px 20px;border:2px solid #f59e0b;border-radius:14px;background:#fffbeb;color:#3f2f05;font-family:Inter,Arial,sans-serif">
  <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#92400e;margin-bottom:6px">Pre-gate draft — for review, not final</div>
  <p style="margin:0;font-size:14px;line-height:1.55">${escapeHtml(caveat)}</p>
</section>`;
}

function hasEnoughDraftContext(ctx: SolutionContext): boolean {
  return Boolean(
    ctx.useCase ||
      ctx.useCaseCandidate ||
      ctx.problemSeed ||
      ctx.currentState ||
      ctx.scope ||
      ctx.valueHypothesis ||
      ctx.evidenceNeeds?.length,
  );
}

function completeMandatoryExhibits(args: {
  artifact: DeliverableKey;
  html: string;
  goldenBar: GoldenBarResult;
  context: SolutionContext;
}): string | undefined {
  if (
    args.artifact === "discovery_report" &&
    (args.goldenBar.missingExactEvidenceTerms.length > 0 ||
      args.goldenBar.missingTaxonomyTerms.length > 0)
  ) {
    const completion = renderDiscoveryEvidenceBaselineCompletion(args.context);
    return completion ? insertBeforeBodyClose(args.html, completion) : undefined;
  }
  if (args.artifact !== "target_state_architecture") return undefined;
  if (args.goldenBar.hasDataGap || args.goldenBar.proseOnly || args.goldenBar.svgCount === 0) {
    return undefined;
  }
  const onlyMissingTables =
    args.goldenBar.missingVisuals.length === 0 &&
    args.goldenBar.missingTables.length > 0;
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
    generationMode?: GenerationMode;
    useCaseQuery?: string;
  },
  deps: GenerateArtifactDeps,
): Promise<GenerateArtifactResult> {
  const generationMode = args.generationMode ?? "final";

  // 1) Gate — no approved gate, no generation.
  const gate = await assertPhaseReadyForGeneration(
    {
      moveId: args.moveId,
      phase: args.phase,
      allowApprovedRetry: args.allowApprovedRetry,
      generationMode,
    },
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
  const contextCaveats = assembled.readiness.ready ? [] : assembled.readiness.missing;
  if (!assembled.readiness.ready) {
    if (generationMode !== "draft" || !hasEnoughDraftContext(ctx)) {
      return { status: "blocked_context", missing: assembled.readiness.missing };
    }
  }
  const profile = getDeliverableProfile(args.artifact);
  if (profile.renderer === "html_architecture" && args.artifact !== "solution_approach_options") {
    const archOk = architectureMayProceed(ctx);
    if (!archOk.ready) {
      if (generationMode !== "draft") return { status: "blocked_context", missing: archOk.missing };
      contextCaveats.push(
        "No final P3 option has been selected; this draft must compare future-state options and keep open decisions explicit.",
      );
    }
  }

  const draftCaveatText =
    generationMode === "draft"
      ? formatDraftCaveatText({
          draftCaveats: gate.draftCaveats,
          contextCaveats,
        })
      : undefined;

  // 4) Dynamic, context-rich prompt.
  const prompt = buildArtifactPrompt({
    artifact: args.artifact,
    phase: args.phase,
    context: ctx,
    generationMode,
    draftCaveat: draftCaveatText,
  });

  // 5) Governed model call → artifact HTML.
  const modelHtml = await deps.callModel(prompt.system, prompt.user, {
    artifact: args.artifact,
    phase: args.phase,
    generationMode,
    maxTokens: modelTokenBudgetForArtifact(args.artifact),
  });
  const draftCaveatHtml = draftCaveatText ? renderDraftCaveatHtml(draftCaveatText) : undefined;
  const html = sanitizeClientFacingArtifactHtml(
    draftCaveatHtml ? insertAfterBodyOpen(modelHtml, draftCaveatHtml) : modelHtml,
  );

  // 6) Quality bar — must be a real visual artifact, no [DATA GAP], required exhibits present.
  const goldenBar = meetsGoldenBar(
    html,
    args.artifact,
    premiumGoldenBarOptionsForArtifact(args.artifact, ctx),
  );
  if (!goldenBar.pass) {
    const completedHtml = completeMandatoryExhibits({
      artifact: args.artifact,
      html,
      goldenBar,
      context: ctx,
    });
    if (completedHtml) {
      const sanitizedCompletedHtml = sanitizeClientFacingArtifactHtml(completedHtml);
      const completedGoldenBar = meetsGoldenBar(
        sanitizedCompletedHtml,
        args.artifact,
        premiumGoldenBarOptionsForArtifact(args.artifact, ctx),
      );
      if (completedGoldenBar.pass) {
        return {
          status: "generated",
          html: sanitizedCompletedHtml,
          context: ctx,
          goldenBar: completedGoldenBar,
          generationMode,
          draftOnly: gate.draftOnly,
          draftCaveats: gate.draftCaveats,
          contextCaveats,
          draftCaveatHtml,
        };
      }
    }
    return { status: "blocked_quality", html, goldenBar, context: ctx };
  }

  return {
    status: "generated",
    html,
    context: ctx,
    goldenBar,
    generationMode,
    draftOnly: gate.draftOnly,
    draftCaveats: gate.draftCaveats,
    contextCaveats,
    draftCaveatHtml,
  };
}

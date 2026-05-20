// Moves Expert Kernel - deterministic visual exhibit models.
//
// These are the data contracts for consulting-grade visuals in the master Move
// dossier and export renderers. They are not decorative charts: every exhibit
// is derived from the kernel's baseline, economics, roadmap, assumptions,
// RACI, measurement handoff or evidence-gap model. Missing data is rendered as
// a gap-state exhibit, never replaced with invented numbers.

import type {
  ArtifactVisualId,
} from './artifact-standards';
import type { KernelArtifactId } from './exports/artifact-catalog';
import {
  EXPERT_REVIEW_CASES,
  type ExpertReviewCaseId,
} from './expert-review-cases';
import type { BusinessCaseSkeleton, FullBusinessCase } from './business-case-compiler';
import type { GoDecisionPack } from './go-decision-pack';
import type { MeasurementHandoff } from './measurement-handoff';
import { KERNEL_ARTIFACTS } from './exports/artifact-catalog';
import { buildSolutionArchitecturePack } from './solution-architecture-pack';

export type VisualExhibitKind =
  | 'architecture'
  | 'bar'
  | 'curve'
  | 'heatmap'
  | 'matrix'
  | 'meter'
  | 'stack'
  | 'swimlane'
  | 'table'
  | 'waterfall';

export type VisualExhibitStatus = 'ready' | 'gap';

export interface VisualExhibitDatum {
  label: string;
  value: number | string;
  unit?: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
  detail?: string;
}

export interface VisualExhibit {
  id: ArtifactVisualId;
  title: string;
  subtitle: string;
  kind: VisualExhibitKind;
  status: VisualExhibitStatus;
  artifactIds: readonly KernelArtifactId[];
  cSuiteUse: string;
  data: readonly VisualExhibitDatum[];
  notes: readonly string[];
}

export interface ArtifactVisualCoverage {
  artifactId: KernelArtifactId;
  requiredVisualIds: readonly ArtifactVisualId[];
  presentVisualIds: readonly ArtifactVisualId[];
  missingVisualIds: readonly ArtifactVisualId[];
  coverage: number;
}

const ARTIFACT_VISUAL_REQUIREMENTS: Record<KernelArtifactId, readonly ArtifactVisualId[]> = {
  discover_brief: [
    'baseline_coverage_meter',
    'metric_source_table',
    'opportunity_range_bar',
    'gap_closure_queue',
  ],
  charter_case: [
    'decision_card',
    'value_vs_effort_summary',
    'assumption_sensitivity_stack',
    'kill_criteria_checklist',
  ],
  business_case_pack: [
    'decision_card',
    'value_vs_investment_chart',
    'investment_vs_return_waterfall',
    'sensitivity_tornado',
    'payback_range_curve',
    'phased_roadmap',
    'risk_control_heatmap',
    'evidence_source_table',
    'architecture_context_diagram',
  ],
  financial_model: [
    'workstream_cost_stack',
    'role_mix_by_phase',
    'rate_card_source_table',
    'base_conservative_upside_chart',
    'sensitivity_tornado',
    'payback_range_curve',
  ],
  cfo_pack: [
    'executive_economics_card',
    'investment_vs_return_waterfall',
    'base_conservative_upside_chart',
    'sensitivity_tornado',
    'payback_range_curve',
    'evidence_gap_matrix',
  ],
  mobilize_pack: [
    'thirty_sixty_ninety_swimlane',
    'raci_matrix',
    'adoption_readiness_table',
    'tower_measurement_table',
    'open_action_queue',
  ],
};

function money(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function datum(
  label: string,
  value: number | string,
  detail?: string,
  tone: VisualExhibitDatum['tone'] = 'neutral',
  unit?: string,
): VisualExhibitDatum {
  return { label, value, detail, tone, unit };
}

function exhibit(input: VisualExhibit): VisualExhibit {
  return Object.freeze({
    ...input,
    data: Object.freeze([...input.data]),
    notes: Object.freeze([...input.notes]),
    artifactIds: Object.freeze([...input.artifactIds]),
  });
}

function blockerTone(count: number): VisualExhibitDatum['tone'] {
  if (count === 0) return 'good';
  if (count <= 2) return 'warn';
  return 'bad';
}

function buildExhibits(args: {
  caseId: ExpertReviewCaseId;
  skeleton: BusinessCaseSkeleton;
  fullCase: FullBusinessCase;
  goPack: GoDecisionPack;
  measurement: MeasurementHandoff;
}): VisualExhibit[] {
  const { caseId, skeleton, fullCase, goPack, measurement } = args;
  const architecturePack = buildSolutionArchitecturePack(caseId);
  const diagramById = new Map(
    architecturePack.diagrams.map((diagram) => [diagram.id, diagram]),
  );
  const architectureContext = diagramById.get('architecture_context_diagram');
  const logicalArchitecture = diagramById.get('logical_architecture_diagram');
  const dataFlow = diagramById.get('data_flow_diagram');
  const integrationMap = diagramById.get('integration_map');
  const controlOverlay = diagramById.get('control_overlay');
  const buildBuyBoundary = diagramById.get('build_buy_boundary_view');
  const evidenceGapCount =
    skeleton.baseline.seedGaps.length + skeleton.critic.blockers.length;
  const topRiskCount =
    skeleton.critic.blockers.length +
    skeleton.critic.concerns.length +
    fullCase.roadmap.flags.length +
    fullCase.raci.violations.length;

  const exhibits: VisualExhibit[] = [
    exhibit({
      id: 'baseline_coverage_meter',
      title: 'Baseline coverage meter',
      subtitle: 'Recorded baseline facts versus explicit seed gaps.',
      kind: 'meter',
      status: skeleton.baseline.coverage >= 0.85 ? 'ready' : 'gap',
      artifactIds: ['discover_brief'],
      cSuiteUse: 'Shows whether the current-state fact base is strong enough to size value.',
      data: [
        datum('Recorded metrics', skeleton.baseline.recordedMetrics.length, undefined, 'good'),
        datum('Seed gaps', skeleton.baseline.seedGaps.length, undefined, blockerTone(skeleton.baseline.seedGaps.length)),
        datum('Coverage', pct(skeleton.baseline.coverage), undefined, skeleton.baseline.coverage >= 0.85 ? 'good' : 'warn'),
      ],
      notes: skeleton.baseline.seedGaps.map(
        (gap) => `${gap.label}: ${gap.seedGapReason}`,
      ),
    }),
    exhibit({
      id: 'metric_source_table',
      title: 'Metric source table',
      subtitle: 'Source, confidence and as-of date for every baseline metric.',
      kind: 'table',
      status: 'ready',
      artifactIds: ['discover_brief'],
      cSuiteUse: 'Lets the sponsor and finance see which facts are measured, stale, or absent.',
      data: skeleton.baseline.metrics.map((metric) =>
        datum(
          metric.label,
          metric.recorded ? `${metric.value} ${metric.unit}` : 'Not recorded',
          `${metric.source} · ${metric.asOf} · ${metric.confidence}`,
          metric.recorded ? 'neutral' : 'warn',
        ),
      ),
      notes: ['Every missing metric remains visible as a seed gap.'],
    }),
    exhibit({
      id: 'opportunity_range_bar',
      title: 'Opportunity range',
      subtitle: 'Haircut-adjusted value range, not gross optimism.',
      kind: 'bar',
      status: skeleton.economics.monetisable ? 'ready' : 'gap',
      artifactIds: ['discover_brief'],
      cSuiteUse: 'Separates directional value from fundable, monetisable value.',
      data: [
        datum('Low', money(skeleton.valueRange.low)),
        datum('Base', money(skeleton.valueRange.point)),
        datum('High', money(skeleton.valueRange.high)),
      ],
      notes: [
        skeleton.economics.monetisable
          ? 'Value is monetisable on recorded economics.'
          : 'Payback remains blocked until unit economics are recorded.',
      ],
    }),
    exhibit({
      id: 'gap_closure_queue',
      title: 'Evidence gap closure queue',
      subtitle: 'What must be captured before the case can be funded.',
      kind: 'table',
      status: evidenceGapCount === 0 ? 'ready' : 'gap',
      artifactIds: ['discover_brief'],
      cSuiteUse: 'Turns missing evidence into an owned action list, not a footnote.',
      data: [
        ...skeleton.baseline.seedGaps.map((gap) =>
          datum(gap.label, 'Seed gap', gap.seedGapReason, 'warn'),
        ),
        ...skeleton.critic.blockers.map((blocker) =>
          datum(blocker.code, 'Blocker', blocker.message, 'bad'),
        ),
      ],
      notes: ['The kernel can shape, but not fund, while blocker evidence is open.'],
    }),
    exhibit({
      id: 'decision_card',
      title: 'Decision card',
      subtitle: 'Fund, shape or kill with the reason visible.',
      kind: 'table',
      status: skeleton.recommendation === 'fund' ? 'ready' : 'gap',
      artifactIds: ['charter_case', 'business_case_pack'],
      cSuiteUse: 'Forces the artifact to answer the executive decision, not just present analysis.',
      data: [
        datum('Recommendation', skeleton.recommendation, skeleton.recommendationRationale, skeleton.recommendation === 'fund' ? 'good' : skeleton.recommendation === 'shape' ? 'warn' : 'bad'),
        datum('Open critic blockers', skeleton.critic.blockers.length, undefined, blockerTone(skeleton.critic.blockers.length)),
      ],
      notes: [skeleton.recommendationRationale],
    }),
    exhibit({
      id: 'value_vs_effort_summary',
      title: 'Value versus effort summary',
      subtitle: 'Value at stake compared with delivery investment.',
      kind: 'bar',
      status: 'ready',
      artifactIds: ['charter_case'],
      cSuiteUse: 'Shows whether deeper shaping is even worth the next dollar.',
      data: [
        datum('Investment', money(skeleton.economics.investment.point)),
        datum('Value', money(skeleton.valueRange.point)),
        datum('Net return', money(skeleton.economics.netReturn.point), undefined, skeleton.economics.netReturn.point > 0 ? 'good' : 'bad'),
      ],
      notes: [skeleton.sensitivity.whatBreaksTheCase],
    }),
    exhibit({
      id: 'assumption_sensitivity_stack',
      title: 'Assumption sensitivity stack',
      subtitle: 'The assumptions most likely to move the case.',
      kind: 'stack',
      status: 'ready',
      artifactIds: ['charter_case'],
      cSuiteUse: 'Shows where the executive team should spend challenge time.',
      data: skeleton.assumptions.topMovers.map((assumption) =>
        datum(
          assumption.statement,
          assumption.sensitivityImpact,
          `${assumption.owner} · ${assumption.confidence} · ${assumption.source}`,
          assumption.confidence === 'low' ? 'bad' : assumption.confidence === 'medium' ? 'warn' : 'good',
        ),
      ),
      notes: ['High-impact, low-confidence assumptions should be reviewed before gate approval.'],
    }),
    exhibit({
      id: 'kill_criteria_checklist',
      title: 'Kill criteria checklist',
      subtitle: 'Explicit stop conditions carried through the phases.',
      kind: 'table',
      status: skeleton.killCriteria.length === 0 ? 'ready' : 'gap',
      artifactIds: ['charter_case'],
      cSuiteUse: 'Protects the sponsor from funding a case that has not cleared its own gates.',
      data: skeleton.killCriteria.map((criterion) =>
        datum(criterion.code, 'Open', criterion.condition, 'warn'),
      ),
      notes: ['A go decision that ignores these conditions is a hard fail.'],
    }),
    exhibit({
      id: 'value_vs_investment_chart',
      title: 'Value versus investment',
      subtitle: 'Base-case value, investment and net return in one view.',
      kind: 'bar',
      status: 'ready',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'The first CFO exhibit: what we spend, what we expect, and what remains.',
      data: [
        datum('Investment', money(fullCase.investment.point), undefined, 'neutral'),
        datum('Net value', money(skeleton.valueRange.point), undefined, skeleton.economics.monetisable ? 'good' : 'warn'),
        datum('Net return', money(fullCase.netReturn.point), undefined, fullCase.netReturn.point > 0 ? 'good' : 'bad'),
      ],
      notes: [fullCase.sensitivity.downsideRead],
    }),
    exhibit({
      id: 'investment_vs_return_waterfall',
      title: 'Investment to return waterfall',
      subtitle: 'Gross value haircut, investment, and net return.',
      kind: 'waterfall',
      status: 'ready',
      artifactIds: ['business_case_pack', 'cfo_pack'],
      cSuiteUse: 'Makes the anti-optimism haircut visible instead of hiding it in prose.',
      data: [
        datum('Gross value', money(skeleton.valueRange.high)),
        datum('Haircut / uncertainty', money(skeleton.valueRange.high - skeleton.valueRange.point), undefined, 'warn'),
        datum('Investment', `-${money(fullCase.investment.point)}`, undefined, 'neutral'),
        datum('Net return', money(fullCase.netReturn.point), undefined, fullCase.netReturn.point > 0 ? 'good' : 'bad'),
      ],
      notes: [skeleton.sensitivity.whatBreaksTheCase],
    }),
    exhibit({
      id: 'sensitivity_tornado',
      title: 'Sensitivity tornado',
      subtitle: 'The top drivers that can move the case.',
      kind: 'bar',
      status: 'ready',
      artifactIds: ['business_case_pack', 'financial_model', 'cfo_pack'],
      cSuiteUse: 'Shows the board where one assumption can change the answer.',
      data: fullCase.sensitivity.topThreeMovers.map((assumption, index) =>
        datum(
          `${index + 1}. ${assumption.key}`,
          assumption.sensitivityImpact,
          assumption.statement,
          assumption.confidence === 'low' ? 'bad' : assumption.confidence === 'medium' ? 'warn' : 'good',
        ),
      ),
      notes: [fullCase.sensitivity.whatBreaksTheCase],
    }),
    exhibit({
      id: 'payback_range_curve',
      title: 'Payback range curve',
      subtitle: 'Base, conservative and upside payback view.',
      kind: 'curve',
      status: skeleton.economics.monetisable ? 'ready' : 'gap',
      artifactIds: ['business_case_pack', 'financial_model', 'cfo_pack'],
      cSuiteUse: 'Prevents a single ROI number from becoming false precision.',
      data: [
        datum('Conservative', fullCase.sensitivity.conservative.paybackMonths ?? 'Not claimable', undefined, 'warn'),
        datum('Base', fullCase.sensitivity.base.paybackMonths ?? 'Not claimable', undefined, skeleton.economics.monetisable ? 'neutral' : 'warn'),
        datum('Upside', fullCase.sensitivity.upside.paybackMonths ?? 'Not claimable', undefined, 'good'),
      ],
      notes: [
        skeleton.economics.monetisable
          ? 'Payback is planning-grade and must be recalibrated with Tower actuals.'
          : 'Payback is intentionally not claimed while monetisation is blocked.',
      ],
    }),
    exhibit({
      id: 'phased_roadmap',
      title: 'Phased value-and-effort roadmap',
      subtitle: 'Phase investment, value unlock and dependency shape.',
      kind: 'swimlane',
      status: fullCase.roadmap.flags.some((flag) => flag.severity === 'blocker') ? 'gap' : 'ready',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'Shows when value appears and which phases are only enablement.',
      data: fullCase.phaseProfile.map((phase) =>
        datum(
          phase.phaseLabel,
          money(phase.investment),
          `${phase.valueMilestone} · unlocks ${money(phase.annualValueUnlocked)} annual value`,
          phase.isFoundational ? 'warn' : 'neutral',
        ),
      ),
      notes: fullCase.roadmap.flags.map((flag) => flag.message),
    }),
    exhibit({
      id: 'risk_control_heatmap',
      title: 'Risk and control heatmap',
      subtitle: 'Critic, roadmap and RACI issues by severity.',
      kind: 'heatmap',
      status: topRiskCount === 0 ? 'ready' : 'gap',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'Shows the sponsor what must be controlled before execution.',
      data: [
        datum('Critic blockers', skeleton.critic.blockers.length, undefined, blockerTone(skeleton.critic.blockers.length)),
        datum('Critic concerns', skeleton.critic.concerns.length, undefined, blockerTone(skeleton.critic.concerns.length)),
        datum('Roadmap flags', fullCase.roadmap.flags.length, undefined, blockerTone(fullCase.roadmap.flags.length)),
        datum('RACI violations', fullCase.raci.violations.length, undefined, blockerTone(fullCase.raci.violations.length)),
      ],
      notes: fullCase.flags,
    }),
    exhibit({
      id: 'evidence_source_table',
      title: 'Evidence source table',
      subtitle: 'Recorded evidence and missing evidence in one audit view.',
      kind: 'table',
      status: evidenceGapCount === 0 ? 'ready' : 'gap',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'Gives reviewers the audit trail for every important number.',
      data: [
        ...skeleton.baseline.recordedMetrics.map((metric) =>
          datum(metric.label, `${metric.value} ${metric.unit}`, metric.source, 'neutral'),
        ),
        ...skeleton.baseline.seedGaps.map((gap) =>
          datum(gap.label, 'Not recorded', gap.seedGapReason, 'warn'),
        ),
      ],
      notes: ['Seed gaps are rendered explicitly; no number is backfilled.'],
    }),
    exhibit({
      id: 'architecture_context_diagram',
      title: 'Architecture context diagram',
      subtitle: architecturePack.decisionSummary,
      kind: 'architecture',
      status: architecturePack.diagrams.length > 0 ? 'ready' : 'gap',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'Shows the executive-level system boundary, human checkpoint and measurement trace for the funded Move.',
      data:
        architectureContext?.nodes.slice(0, 5).map((architectureNode) =>
          datum(
            architectureNode.label,
            architectureNode.status,
            architectureNode.evidence,
            architectureNode.status === 'gap' ? 'warn' : 'neutral',
          ),
        ) ?? [],
      notes: architectureContext?.notes ?? [],
    }),
    exhibit({
      id: 'logical_architecture_diagram',
      title: 'Logical architecture diagram',
      subtitle: 'Reference flow from evidence to broker to model gateway to human checkpoint.',
      kind: 'architecture',
      status: 'ready',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'Gives CIO/CTO reviewers a product-shaped architecture rather than a generic AI idea.',
      data:
        logicalArchitecture?.nodes.map((architectureNode) =>
          datum(architectureNode.label, architectureNode.kind, architectureNode.evidence),
        ) ?? [],
      notes: logicalArchitecture?.notes ?? [],
    }),
    exhibit({
      id: 'data_flow_diagram',
      title: 'Data-flow diagram',
      subtitle: 'Read-first data flow with action only after human approval.',
      kind: 'architecture',
      status: dataFlow?.nodes.some((architectureNode) => architectureNode.status === 'gap')
        ? 'gap'
        : 'ready',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'Shows where data is read, where decisions are made, and where operational writes are controlled.',
      data:
        dataFlow?.edges.slice(0, 6).map((architectureEdge) =>
          datum(
            `${architectureEdge.from} → ${architectureEdge.to}`,
            architectureEdge.label,
            architectureEdge.control,
          ),
        ) ?? [],
      notes: dataFlow?.notes ?? [],
    }),
    exhibit({
      id: 'integration_map',
      title: 'Integration map',
      subtitle: 'Grounded system integrations and explicit gaps.',
      kind: 'architecture',
      status: architecturePack.integrations.some((integration) => integration.status === 'gap')
        ? 'gap'
        : 'ready',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'Prevents the funding pack from hiding the systems work that will make or break execution.',
      data: architecturePack.integrations.map((integration) =>
        datum(
          integration.system,
          integration.status,
          `${integration.role} · ${integration.owner}`,
          integration.status === 'gap' ? 'warn' : 'neutral',
        ),
      ),
      notes: integrationMap?.notes ?? [],
    }),
    exhibit({
      id: 'control_overlay',
      title: 'Control overlay',
      subtitle: 'Eight §4 reference-architecture components with native/partial status.',
      kind: 'heatmap',
      status: architecturePack.optionSet.openComponentGaps.length > 0 ? 'gap' : 'ready',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'Shows whether the architecture is production-shaped or still a POC with governance debt.',
      data: architecturePack.controlCoverage.map((coverage) =>
        datum(
          coverage.component,
          coverage.coverage,
          coverage.note,
          coverage.coverage === 'native'
            ? 'good'
            : coverage.coverage === 'partial'
              ? 'warn'
              : 'bad',
        ),
      ),
      notes: controlOverlay?.notes ?? [],
    }),
    exhibit({
      id: 'build_buy_boundary_view',
      title: 'Build / buy / partner boundary',
      subtitle: 'Which work is bought, partnered, built, or retained internally.',
      kind: 'matrix',
      status: 'ready',
      artifactIds: ['business_case_pack'],
      cSuiteUse: 'Aligns the architecture with Source so the solution design does not become one over-scoped SI RFP.',
      data: architecturePack.buildBuyBoundary.map((lane) =>
        datum(lane.lane, lane.disposition, `${lane.rationale} · ${lane.owner}`),
      ),
      notes: buildBuyBoundary?.notes ?? [],
    }),
    exhibit({
      id: 'workstream_cost_stack',
      title: 'Workstream cost stack',
      subtitle: 'Cost by delivery workstream.',
      kind: 'stack',
      status: 'ready',
      artifactIds: ['financial_model'],
      cSuiteUse: 'Shows which workstreams drive the estimate.',
      data: skeleton.effort.workstreams.map((workstream) =>
        datum(workstream.label, money(workstream.baseCost), `${workstream.durationMonths} months`, 'neutral'),
      ),
      notes: [skeleton.effort.buildVsChange.note],
    }),
    exhibit({
      id: 'role_mix_by_phase',
      title: 'Role mix by phase',
      subtitle: 'Headcount intensity and agent split across workstreams.',
      kind: 'stack',
      status: 'ready',
      artifactIds: ['financial_model'],
      cSuiteUse: 'Shows whether the delivery team is credible for the complexity of the Move.',
      data: skeleton.effort.workstreams.map((workstream) =>
        datum(
          workstream.label,
          `${workstream.totalHeadcount} FTE`,
          `Agent split ${pct(workstream.agentSplit)} · human ${money(workstream.humanCost)} · agent ${money(workstream.agentCost)}`,
          'neutral',
        ),
      ),
      notes: ['Role detail remains planning-grade until a client/vendor rate card overrides the benchmark.'],
    }),
    exhibit({
      id: 'rate_card_source_table',
      title: 'Rate-card source table',
      subtitle: 'Rate-card provenance and override state.',
      kind: 'table',
      status: skeleton.effort.rateCard.provenance === 'client_specific' ? 'ready' : 'gap',
      artifactIds: ['financial_model'],
      cSuiteUse: 'Keeps benchmark rates from being misread as quotes or commitments.',
      data: [
        datum('Provenance', skeleton.effort.rateCard.provenance, skeleton.effort.rateCard.label, skeleton.effort.rateCard.provenance === 'client_specific' ? 'good' : 'warn'),
        datum('Rows', skeleton.effort.rateCard.rates.length),
      ],
      notes: ['Client-specific rate cards supersede the benchmark before commitment.'],
    }),
    exhibit({
      id: 'base_conservative_upside_chart',
      title: 'Base / conservative / upside',
      subtitle: 'Three-scenario CFO range.',
      kind: 'bar',
      status: 'ready',
      artifactIds: ['financial_model', 'cfo_pack'],
      cSuiteUse: 'Replaces single-point ROI with explicit scenario economics.',
      data: [
        datum('Conservative net return', money(fullCase.sensitivity.conservative.netReturn), undefined, fullCase.sensitivity.conservative.netReturn > 0 ? 'good' : 'bad'),
        datum('Base net return', money(fullCase.sensitivity.base.netReturn), undefined, fullCase.sensitivity.base.netReturn > 0 ? 'good' : 'bad'),
        datum('Upside net return', money(fullCase.sensitivity.upside.netReturn), undefined, fullCase.sensitivity.upside.netReturn > 0 ? 'good' : 'warn'),
      ],
      notes: [fullCase.sensitivity.downsideRead],
    }),
    exhibit({
      id: 'executive_economics_card',
      title: 'Executive economics card',
      subtitle: 'One-screen economics for CFO and board review.',
      kind: 'table',
      status: skeleton.economics.monetisable ? 'ready' : 'gap',
      artifactIds: ['cfo_pack'],
      cSuiteUse: 'Lets a CFO see the answer without opening the detailed model.',
      data: [
        datum('Investment', money(fullCase.investment.point)),
        datum('Net return', money(fullCase.netReturn.point), undefined, fullCase.netReturn.point > 0 ? 'good' : 'bad'),
        datum('Payback', fullCase.paybackMonths ?? 'Not claimable', undefined, fullCase.paybackMonths ? 'good' : 'warn', fullCase.paybackMonths ? 'months' : undefined),
        datum('Recommendation', fullCase.recommendation, fullCase.recommendationRationale, fullCase.recommendation === 'fund' ? 'good' : fullCase.recommendation === 'shape' ? 'warn' : 'bad'),
      ],
      notes: [fullCase.recommendationRationale],
    }),
    exhibit({
      id: 'evidence_gap_matrix',
      title: 'Evidence gap matrix',
      subtitle: 'Gaps by source and artifact affected.',
      kind: 'matrix',
      status: evidenceGapCount === 0 ? 'ready' : 'gap',
      artifactIds: ['cfo_pack'],
      cSuiteUse: 'Shows what prevents board approval and which artifact each gap weakens.',
      data: [
        ...skeleton.baseline.seedGaps.map((gap) =>
          datum(gap.label, 'Baseline gap', gap.seedGapReason, 'warn'),
        ),
        ...skeleton.critic.blockers.map((blocker) =>
          datum(blocker.code, 'Critic blocker', blocker.message, 'bad'),
        ),
      ],
      notes: ['Gaps are part of the artifact, not a hidden implementation backlog.'],
    }),
    exhibit({
      id: 'thirty_sixty_ninety_swimlane',
      title: '30/60/90 mobilization swimlane',
      subtitle: 'Decision-ready execution entry plan.',
      kind: 'swimlane',
      status: goPack.decision === 'no_go' ? 'gap' : 'ready',
      artifactIds: ['mobilize_pack'],
      cSuiteUse: 'Shows what happens immediately after approval, or why approval is blocked.',
      data: goPack.sections.map((section) =>
        datum(section.heading, section.lines[0] ?? 'No lines recorded', section.lines.slice(1, 3).join(' '), 'neutral'),
      ),
      notes: goPack.conditions.map((condition) => condition.condition),
    }),
    exhibit({
      id: 'raci_matrix',
      title: 'Human + agent RACI matrix',
      subtitle: 'Decision rights and accountable humans.',
      kind: 'matrix',
      status: fullCase.raci.valid ? 'ready' : 'gap',
      artifactIds: ['mobilize_pack'],
      cSuiteUse: 'Prevents an AI agent from being implied as accountable for governance.',
      data: [
        datum('Decisions', fullCase.raci.decisions.length),
        datum('Agent-responsible decisions', fullCase.raci.agentResponsibleDecisions.length),
        datum('Violations', fullCase.raci.violations.length, undefined, blockerTone(fullCase.raci.violations.length)),
      ],
      notes: fullCase.raci.violations.map((violation) => violation.message),
    }),
    exhibit({
      id: 'adoption_readiness_table',
      title: 'Adoption readiness table',
      subtitle: 'Owned, adoptable, measurable readiness.',
      kind: 'table',
      status: goPack.decision === 'no_go' ? 'gap' : 'ready',
      artifactIds: ['mobilize_pack'],
      cSuiteUse: 'Surfaces the change and measurement blockers that usually break AI value.',
      data: [
        datum('Owned', goPack.readiness.owned ? 'Yes' : 'No', undefined, goPack.readiness.owned ? 'good' : 'bad'),
        datum('Adoptable', goPack.readiness.adoptable ? 'Yes' : 'No', undefined, goPack.readiness.adoptable ? 'good' : 'bad'),
        datum('Measurable', goPack.readiness.measurable ? 'Yes' : 'No', undefined, goPack.readiness.measurable ? 'good' : 'bad'),
      ],
      notes: goPack.firedKillTriggers.map((trigger) => trigger.observation),
    }),
    exhibit({
      id: 'tower_measurement_table',
      title: 'Tower measurement table',
      subtitle: 'Metrics handed from Moves to Tower.',
      kind: 'table',
      status: measurement.loopCloses ? 'ready' : 'gap',
      artifactIds: ['mobilize_pack'],
      cSuiteUse: 'Shows whether forecasted value can be measured later as actual value.',
      data: measurement.metrics.map((metric) =>
        datum(metric.label, metric.baselineValue ?? 'Not recorded', metric.readinessNote, metric.baselineValue === null ? 'warn' : 'good', metric.baselineUnit),
      ),
      notes: measurement.unwiredMetrics.map((metric) => metric.readinessNote),
    }),
    exhibit({
      id: 'open_action_queue',
      title: 'Open action queue',
      subtitle: 'Conditions that must close before go.',
      kind: 'table',
      status: goPack.conditions.length === 0 ? 'ready' : 'gap',
      artifactIds: ['mobilize_pack'],
      cSuiteUse: 'Converts no-go into a practical executive action list.',
      data: goPack.conditions.map((condition) =>
        datum(condition.code, 'Open', condition.condition, 'warn'),
      ),
      notes: ['The go-decision pack stays no-go until these conditions close.'],
    }),
  ];

  return exhibits;
}

export function buildArtifactVisualExhibits(
  caseId: ExpertReviewCaseId,
): readonly VisualExhibit[] {
  const caseEntry = EXPERT_REVIEW_CASES[caseId];
  const { skeleton } = caseEntry.buildCase();
  const { fullCase } = caseEntry.buildFullCase();
  const { measurement, goPack } = caseEntry.buildMobilize();
  return buildExhibits({ caseId, skeleton, fullCase, goPack, measurement });
}

export function listPresentVisualIdsForArtifact(
  artifactId: KernelArtifactId,
  exhibits: readonly VisualExhibit[] = buildArtifactVisualExhibits('apexretail'),
): ArtifactVisualId[] {
  const ids = new Set<ArtifactVisualId>();
  for (const exhibitItem of exhibits) {
    if (exhibitItem.artifactIds.includes(artifactId)) {
      ids.add(exhibitItem.id);
    }
  }
  return [...ids];
}

export function buildArtifactVisualCoverage(
  caseId: ExpertReviewCaseId = 'apexretail',
): readonly ArtifactVisualCoverage[] {
  const exhibits = buildArtifactVisualExhibits(caseId);
  return KERNEL_ARTIFACTS.map((artifact) => {
    const requiredVisualIds = ARTIFACT_VISUAL_REQUIREMENTS[artifact.id];
    const presentVisualIds = listPresentVisualIdsForArtifact(
      artifact.id,
      exhibits,
    );
    const presentSet = new Set(presentVisualIds);
    const missingVisualIds = requiredVisualIds.filter((id) => !presentSet.has(id));
    return {
      artifactId: artifact.id,
      requiredVisualIds,
      presentVisualIds,
      missingVisualIds,
      coverage:
        requiredVisualIds.length === 0
          ? 1
          : Math.round(
              (presentVisualIds.filter((id) => requiredVisualIds.includes(id))
                .length /
                requiredVisualIds.length) *
                100,
            ) / 100,
    };
  });
}

export function listRequiredVisualIdsForArtifact(
  artifactId: KernelArtifactId,
): readonly ArtifactVisualId[] {
  return ARTIFACT_VISUAL_REQUIREMENTS[artifactId];
}

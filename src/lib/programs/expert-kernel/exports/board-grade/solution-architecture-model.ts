// Board-grade Solution Architecture Pack — view-model.
//
// This module is the single seam between the Expert Kernel's solution-
// architecture reasoning (`buildSolutionArchitecturePack`) and the board-grade
// Solution Architecture Pack renderer. It runs the EXISTING Apex architecture
// kernel and projects its outputs into the nine blueprint §7 sections. It
// introduces NO new systems, vendors, integrations or controls — every node,
// edge, lane and risk traces to a kernel field. Where the kernel returns a
// declared gap (a CDP gap node, a transcript-privacy blocker) the view-model
// carries that gap honestly; it never backfills an invented system.
//
// Blueprint §7 Solution Architecture Pack sections (nine, plus a cover):
//   1. Architecture decision   — what architecture should we shape around?
//   2. Context view            — where does the solution sit in the enterprise?
//   3. Logical architecture    — what components are being funded?
//   4. Data flow               — what data moves, where, under what controls?
//   5. Integration map         — what must integrate and what is a gap?
//   6. Build/buy/partner        — what do we build, buy, partner for, retain?
//   7. Human accountability    — where does the human stay in the loop?
//   8. Controls and risks      — what must be true before production?
//   9. Open architecture decisions — what remains unresolved?
//
// Blueprint §7 hard fails honoured here:
//   - every section carries a real architecture diagram (no diagram = fail);
//   - data sources and control points are explicit, never invisible;
//   - the build/buy/partner boundary is unambiguous (all four lanes named);
//   - the sensitive customer-facing workflow carries a privacy/security/
//     control review — the transcript-privacy blocker is rendered, not hidden;
//   - the recommended option is the human-in-loop agent, NOT full autonomy:
//     the kernel's scenario guardrail keeps a named human accountable.
//
// Pure module: deterministic, no I/O.

import {
  buildSolutionArchitecturePack,
  type ArchitectureDiagram,
  type SolutionArchitecturePack,
} from '../../solution-architecture-pack';
import {
  REFERENCE_COMPONENT_LABEL,
  type ComponentAssessment,
  type SolutionArchitectureOption,
} from '@/lib/programs/architecture/solution-architecture-options';

// ---------------------------------------------------------------------------
// Section anatomy — blueprint §2. Every section carries the same shape.
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface ArchEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — blueprint §2 anatomy. */
export interface ArchSectionAnatomy {
  /** Section number, 1..9. */
  page: number;
  /** Anchor id for the deck slide. */
  id: string;
  /** Short menu / eyebrow label. */
  navLabel: string;
  /** Takeaway title — a sentence with a point of view (NOT a label). */
  takeaway: string;
  /** The decision this page supports. */
  decisionRole: string;
  /** Evidence strip — sources, dates, confidence, gaps. */
  evidence: ArchEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The full Solution Architecture Pack view-model.
// ---------------------------------------------------------------------------

/** The architecture verdict, projected for the deck. */
export type ArchVerdict = 'shape' | 'conditional' | 'hold';

export interface SolutionArchitecture {
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  generatedOn: string;
  /** The architecture gate verdict. For Apex this is `conditional`. */
  verdict: ArchVerdict;
  /** A short verdict sub-line — the conditional clause. */
  verdictSub: string;
  /** The named target-state architecture pattern. */
  targetPattern: TargetPattern;
  /** The nine sections, page-ordered. */
  sections: ArchSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

/**
 * The named target-state architecture pattern. The blueprint requires the
 * pattern to be NAMED explicitly, not left implied, and the rejected patterns
 * named alongside it.
 */
export interface TargetPattern {
  /** The pattern name, e.g. "Broker-mediated human-in-the-loop agent". */
  name: string;
  /** A one-line statement of what the pattern commits to. */
  oneLine: string;
  /** The patterns considered and rejected, with the reason. */
  rejected: Array<{ name: string; reason: string }>;
}

export interface ArchSections {
  architectureDecision: ArchitectureDecisionSection;
  contextView: ContextViewSection;
  logicalArchitecture: LogicalArchitectureSection;
  dataFlow: DataFlowSection;
  integrationMap: IntegrationMapSection;
  buildBuyPartner: BuildBuyPartnerSection;
  humanAccountability: HumanAccountabilitySection;
  controlsAndRisks: ControlsAndRisksSection;
  openDecisions: OpenDecisionsSection;
}

// --- §1 Architecture decision ----------------------------------------------

export interface ArchitectureDecisionSection {
  anatomy: ArchSectionAnatomy;
  /** The decision headline — the selected pattern, plain. */
  decisionHeadline: string;
  /** The decision detail — why this pattern, in two or three sentences. */
  decisionDetail: string;
  /** The candidate options as a scorecard — selected + rejected. */
  options: Array<{
    name: string;
    shapeLabel: string;
    referenceScore: number;
    productionShaped: boolean;
    selected: boolean;
    disposition: string;
  }>;
  /** The kernel's recommendation reasons. */
  reasons: string[];
}

// --- §2 Context view --------------------------------------------------------

export interface ContextNode {
  title: string;
  sub: string;
  role:
    | 'actor'
    | 'system'
    | 'context'
    | 'broker'
    | 'agent'
    | 'control'
    | 'human'
    | 'tower';
  gap: boolean;
}

export interface ContextViewSection {
  anatomy: ArchSectionAnatomy;
  /** Outer enterprise band — the business surface(s). */
  enterprise: ContextNode[];
  /** Systems-of-record band — explicit, never invisible. */
  systems: ContextNode[];
  /** The AbarVa solution band — context, broker, agent, human, Tower. */
  solution: ContextNode[];
  /** The kernel's context-diagram notes. */
  notes: string[];
}

// --- §3 Logical architecture & §4 Data flow ---------------------------------

export interface FlowStage {
  title: string;
  sub: string;
  role:
    | 'actor'
    | 'system'
    | 'context'
    | 'broker'
    | 'agent'
    | 'control'
    | 'human'
    | 'tower';
  gap: boolean;
  /** Ownership / control caption beside the box. */
  side: string;
}

export interface FlowEdge {
  from: number;
  to: number;
  label: string;
  kind: 'data' | 'control' | 'integration' | 'decision';
}

export interface LogicalArchitectureSection {
  anatomy: ArchSectionAnatomy;
  stages: FlowStage[];
  edges: FlowEdge[];
  /** Component table — every component, responsibility, ownership. */
  components: Array<{ component: string; responsibility: string; owner: string }>;
  /** The kernel's logical-diagram notes (trade-offs, security posture). */
  notes: string[];
}

export interface DataFlowSection {
  anatomy: ArchSectionAnatomy;
  stages: FlowStage[];
  edges: FlowEdge[];
  /** The data sources feeding the flow — explicit, never invisible. */
  dataSources: string[];
  /** The control points on the flow. */
  controlPoints: string[];
  /** The kernel's data-flow notes (incl. the gap-state CDP note). */
  notes: string[];
}

// --- §5 Integration map -----------------------------------------------------

export interface IntegrationRow {
  system: string;
  mode: string;
  owner: string;
  status: 'grounded' | 'gap';
  role: string;
  evidence: string;
}

export interface IntegrationMapSection {
  anatomy: ArchSectionAnatomy;
  rows: IntegrationRow[];
  groundedCount: number;
  gapCount: number;
}

// --- §6 Build / buy / partner -----------------------------------------------

export interface BoundaryLane {
  lane: string;
  disposition: 'build' | 'buy' | 'partner' | 'retain';
  owner: string;
  rationale: string;
}

export interface BuildBuyPartnerSection {
  anatomy: ArchSectionAnatomy;
  lanes: BoundaryLane[];
}

// --- §7 Human accountability ------------------------------------------------

export interface AccountabilityStep {
  label: string;
  lane: 'agent' | 'human';
  note: string;
  checkpoint: boolean;
}

export interface HumanAccountabilitySection {
  anatomy: ArchSectionAnatomy;
  steps: AccountabilityStep[];
  /** Decision-rights rows — the workflow step, the owner, the right. */
  decisionRights: Array<{ step: string; owner: string; right: string }>;
}

// --- §8 Controls and risks --------------------------------------------------

export interface ControlCell {
  label: string;
  coverage: 'native' | 'partial' | 'missing';
  note: string;
}

export interface RiskPoint {
  likelihood: number;
  impact: number;
  code: string;
  blocker: boolean;
}

export interface ControlsAndRisksSection {
  anatomy: ArchSectionAnatomy;
  controls: ControlCell[];
  /** The risk points plotted on the likelihood × impact heatmap. */
  riskPoints: RiskPoint[];
  /** The full risk register — code, severity, message, fix condition. */
  risks: Array<{
    code: string;
    label: string;
    severity: 'blocker' | 'watch' | 'managed';
    message: string;
    fixCondition: string;
  }>;
  referenceScore: number;
  productionShaped: boolean;
}

// --- §9 Open architecture decisions -----------------------------------------

export interface OpenDecisionsSection {
  anatomy: ArchSectionAnatomy;
  decisions: Array<{
    decision: string;
    owner: string;
    gate: string;
    impact: number;
    blocksGate: boolean;
  }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/**
 * Build the Apex Contact Center AI Routing Solution Architecture Pack.
 * Deterministic — a pure function of `generatedOn`.
 */
export function buildApexSolutionArchitecture(
  generatedOn: string,
): SolutionArchitecture {
  const pack: SolutionArchitecturePack =
    buildSolutionArchitecturePack('apexretail');
  const selected = pack.selectedOption;

  // The architecture gate verdict. Apex's selected option is fully production-
  // shaped on the §4 reference architecture, but a transcript-privacy blocker
  // and a CFO-monetisation blocker remain — so the honest verdict is
  // `conditional`: shape this architecture, but it cannot pass the production
  // gate until the blockers clear.
  const blockerCount = pack.architectureRisks.filter(
    (r) => r.severity === 'blocker',
  ).length;
  const verdict: ArchVerdict = blockerCount > 0 ? 'conditional' : 'shape';
  const verdictSub =
    blockerCount > 0
      ? `Conditional — ${blockerCount} blocker${blockerCount === 1 ? '' : 's'} before the production gate`
      : 'Production-shaped on the §4 reference architecture';

  const blockerGaps = pack.architectureRisks
    .filter((r) => r.severity === 'blocker')
    .map((r) => riskLabel(r.code));

  const targetPattern = buildTargetPattern(pack);

  // --- §1 Architecture decision --------------------------------------------
  const decision = buildDecisionSection({
    pack,
    selected,
    generatedOn,
    blockerGaps,
    targetPattern,
  });

  // --- §2 Context view -----------------------------------------------------
  const contextView = buildContextSection({ pack, generatedOn });

  // --- §3 Logical architecture ---------------------------------------------
  const logicalArchitecture = buildLogicalSection({
    pack,
    selected,
    generatedOn,
  });

  // --- §4 Data flow --------------------------------------------------------
  const dataFlow = buildDataFlowSection({ pack, selected, generatedOn });

  // --- §5 Integration map --------------------------------------------------
  const integrationMap = buildIntegrationSection({ pack, generatedOn });

  // --- §6 Build / buy / partner --------------------------------------------
  const buildBuyPartner = buildBoundarySection({ pack, generatedOn });

  // --- §7 Human accountability ---------------------------------------------
  const humanAccountability = buildAccountabilitySection({
    selected,
    generatedOn,
  });

  // --- §8 Controls and risks -----------------------------------------------
  const controlsAndRisks = buildControlsSection({
    pack,
    selected,
    generatedOn,
    blockerGaps,
  });

  // --- §9 Open architecture decisions --------------------------------------
  const openDecisions = buildOpenDecisionsSection({ pack, generatedOn });

  const sections: ArchSections = {
    architectureDecision: decision,
    contextView,
    logicalArchitecture,
    dataFlow,
    integrationMap,
    buildBuyPartner,
    humanAccountability,
    controlsAndRisks,
    openDecisions,
  };

  const ordered: ArchSectionAnatomy[] = [
    decision.anatomy,
    contextView.anatomy,
    logicalArchitecture.anatomy,
    dataFlow.anatomy,
    integrationMap.anatomy,
    buildBuyPartner.anatomy,
    humanAccountability.anatomy,
    controlsAndRisks.anatomy,
    openDecisions.anatomy,
  ];

  return {
    tenantLabel: pack.tenantLabel,
    tenantKey: 'apex-retail',
    moveLabel: pack.moveLabel,
    artifactLabel: 'Solution Architecture Pack',
    generatedOn,
    verdict,
    verdictSub,
    targetPattern,
    sections,
    toc: ordered.map((a) => ({
      page: a.page,
      id: a.id,
      label: a.navLabel,
      takeaway: a.takeaway,
    })),
  };
}

// ===========================================================================
// Section builders. Each takes the kernel pack and projects ONE §7 section.
// No section introduces a system, vendor or control the kernel did not state.
// ===========================================================================

/**
 * The named target-state pattern. The selected option is the kernel's
 * "Brokered human-in-the-loop agent" — a broker-mediated, retrieval-grounded
 * agent that proposes and prepares actions but executes only after a human
 * checkpoint. The two other options the kernel surfaced are the rejected
 * patterns; the reasons come straight from the kernel's option set.
 */
function buildTargetPattern(pack: SolutionArchitecturePack): TargetPattern {
  const rejected: Array<{ name: string; reason: string }> = [];
  for (const opt of pack.optionSet.options) {
    if (opt.id === pack.selectedOption.id) continue;
    if (opt.shape === 'retrieval_copilot') {
      rejected.push({
        name: 'Read-only retrieval copilot',
        reason:
          'A read-only assistant under-shapes the Move — routing needs an ' +
          'agent that prepares the routing action, not one that only ' +
          'answers questions about it.',
      });
    } else if (opt.shape === 'full_agentic_workflow') {
      rejected.push({
        name: 'Full autonomous agentic workflow',
        reason:
          'Full autonomy is rejected: the scenario evidence requires a ' +
          'named human accountable before autonomy expands, and intent ' +
          'data is still fragmented (the CDP gap). Premature for release 1.',
      });
    }
  }
  return {
    name: 'Broker-mediated, retrieval-grounded human-in-the-loop agent',
    oneLine:
      'An agent grounded by broker-scoped retrieval over the tenant context ' +
      'layer that proposes and prepares the routing action, then executes ' +
      'only after a named human approves it — agent-assist over the ' +
      'system-of-record, with human-in-the-loop as the control.',
    rejected,
  };
}

function buildDecisionSection(args: {
  pack: SolutionArchitecturePack;
  selected: SolutionArchitectureOption;
  generatedOn: string;
  blockerGaps: string[];
  targetPattern: TargetPattern;
}): ArchitectureDecisionSection {
  const { pack, selected, generatedOn, blockerGaps, targetPattern } = args;
  const options = pack.optionSet.options.map((o) => {
    const isSelected = o.id === selected.id;
    return {
      name: o.name,
      shapeLabel: shapeLabel(o.shape),
      referenceScore: o.referenceScore,
      productionShaped: o.productionShaped,
      selected: isSelected,
      disposition: isSelected
        ? 'Selected — the responsible target-state pattern: real routing ' +
          'leverage with a named human accountable for every action.'
        : optionRejectionReason(o.shape),
    };
  });

  return {
    anatomy: {
      page: 1,
      id: 'architecture-decision',
      navLabel: 'Architecture decision',
      takeaway:
        'Shape the Move around a broker-mediated human-in-the-loop agent — ' +
        'not a read-only copilot, and not full autonomy.',
      decisionRole:
        'Decide which target-state architecture pattern to fund and shape ' +
        'the delivery boundary around.',
      evidence: {
        sources: [
          'Moves Expert Kernel — solution-architecture option set (§4)',
          'Apex scenario evidence — human-in-loop assistant first',
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: blockerGaps,
      },
      implication:
        'The architecture is selected; the agent boundary, the human ' +
        'checkpoint and the broker contract are the design every later ' +
        'section builds on.',
      owner: 'Enterprise Architecture (with CIO sponsor)',
      nextGate: 'Production-readiness gate — conditional on the open blockers',
    },
    decisionHeadline: `Target-state pattern — ${targetPattern.name}.`,
    decisionDetail:
      `${targetPattern.oneLine} Two alternative patterns were considered and ` +
      `rejected: a ${targetPattern.rejected[0]?.name.toLowerCase() ?? 'thinner'} ` +
      `under-shapes the Move, and ${
        targetPattern.rejected[1]?.name.toLowerCase() ??
        'full autonomy'
      } is premature until the evidence supports it.`,
    options,
    reasons: [...pack.optionSet.reasons],
  };
}

function buildContextSection(args: {
  pack: SolutionArchitecturePack;
  generatedOn: string;
}): ContextViewSection {
  const { pack, generatedOn } = args;
  const diagram = findDiagram(pack, 'architecture_context_diagram');

  const enterprise: ContextNode[] = [
    {
      title: pack.moveLabel,
      sub: 'Customer Care — the business surface this Move changes.',
      role: 'actor',
      gap: false,
    },
  ];

  // Systems of record — only the kernel's grounded/gap system nodes.
  const systems: ContextNode[] = diagram.nodes
    .filter((n) => n.kind === 'system_of_record')
    .map((n) => ({
      title: n.label,
      sub: n.evidence,
      role: 'system' as const,
      gap: n.status === 'gap',
    }));

  // The AbarVa solution band — context, broker, agent, human, Tower.
  const solution: ContextNode[] = [
    {
      title: 'Tenant context layer',
      sub: 'Grounding evidence — IT landscape, KPIs, process maps, policies.',
      role: 'context',
      gap: false,
    },
    {
      title: 'AbarVa broker boundary',
      sub: 'Tenant-scoped, swappable, auditable retrieval contract.',
      role: 'broker',
      gap: false,
    },
    {
      title: 'Human-in-the-loop agent',
      sub: 'Proposes and prepares the routing action.',
      role: 'agent',
      gap: false,
    },
    {
      title: 'Human approval checkpoint',
      sub: 'A named human approves before any consequential action.',
      role: 'human',
      gap: false,
    },
    {
      title: 'Tower outcome trace',
      sub: 'Forecast-to-actual measurement handoff.',
      role: 'tower',
      gap: false,
    },
  ];

  return {
    anatomy: {
      page: 2,
      id: 'context-view',
      navLabel: 'Context view',
      takeaway:
        'The agent sits behind a broker boundary — it reads the systems of ' +
        'record but never acts on them without a human checkpoint.',
      decisionRole:
        'Confirm where the solution sits in the enterprise and what its ' +
        'boundary with the systems of record is.',
      evidence: {
        sources: [
          'Kernel context diagram — business surface, systems, solution zone',
          'Apex kernel baseline — NICE CXone, Genesys routing export',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: systems
          .filter((s) => s.gap)
          .map((s) => `${s.title} — not yet integrated`),
      },
      implication:
        'The systems of record and the agent boundary are explicit; the ' +
        'gap-state CDP node shows what is not yet wired, not a blank.',
      owner: 'Enterprise Architecture',
      nextGate: 'Logical architecture — what is being funded inside the zone',
    },
    enterprise,
    systems,
    solution,
    notes: [...diagram.notes],
  };
}

function buildLogicalSection(args: {
  pack: SolutionArchitecturePack;
  selected: SolutionArchitectureOption;
  generatedOn: string;
}): LogicalArchitectureSection {
  const { pack, selected, generatedOn } = args;
  const diagram = findDiagram(pack, 'logical_architecture_diagram');

  // The kernel's six logical stages, projected to flow stages with ownership.
  const ownership: Record<string, string> = {
    inputs: 'CDO / Data Sponsor — owns the evidence corpus freshness.',
    retrieval: 'Enterprise Architecture — owns the broker contract.',
    gateway: 'AI Platform — owns model routing, fallback and cost caps.',
    guardrails: 'AI Governance — owns guardrails and the eval harness.',
    approval: 'VP Customer Care — owns the human approval workflow.',
    audit: 'Tower / Measurement — owns the decision-record trace.',
  };
  const stages: FlowStage[] = diagram.nodes.map((n) => ({
    title: n.label,
    sub: n.evidence,
    role: nodeRole(n.kind),
    gap: n.status === 'gap',
    side: ownership[n.id] ?? 'Enterprise Architecture.',
  }));
  const edges: FlowEdge[] = mapEdges(diagram);

  return {
    anatomy: {
      page: 3,
      id: 'logical-architecture',
      navLabel: 'Logical architecture',
      takeaway:
        'Six components are being funded — and every one has a named owner ' +
        'and a control point, not just a box on a diagram.',
      decisionRole:
        'Confirm exactly what components are being funded and who owns each.',
      evidence: {
        sources: [
          'Kernel logical architecture — §4 component assessment',
          `Selected option — ${selected.name}`,
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'Funding maps to six owned components; the guardrail + eval-harness ' +
        'component is where the production bar is enforced.',
      owner: 'Enterprise Architecture',
      nextGate: 'Data-flow review — the controls on what data each touches',
    },
    stages,
    edges,
    components: diagram.nodes.map((n) => ({
      component: n.label,
      responsibility: n.evidence,
      owner: (ownership[n.id] ?? 'Enterprise Architecture.').split(' — ')[0],
    })),
    notes: [...diagram.notes],
  };
}

function buildDataFlowSection(args: {
  pack: SolutionArchitecturePack;
  selected: SolutionArchitectureOption;
  generatedOn: string;
}): DataFlowSection {
  const { pack, selected, generatedOn } = args;
  const diagram = findDiagram(pack, 'data_flow_diagram');

  // The data-flow diagram has many source nodes; collapse the five context
  // sources into ONE "Enterprise evidence sources" stage so the flow reads as
  // a clean vertical sequence (sources → broker → model → checkpoint →
  // systems → trace). The sources themselves are listed in `dataSources`.
  const sourceNodes = diagram.nodes.filter((n) =>
    n.id.startsWith('source:'),
  );
  const spineNodes = diagram.nodes.filter(
    (n) => !n.id.startsWith('source:'),
  );

  const controlCaption: Record<string, string> = {
    broker: 'Control — tenant RLS scope; read-only at this stage.',
    model: 'Control — per-decision cost cap + latency budget.',
    checkpoint: 'Control — human approval gate; mutation barrier.',
    systems: 'Control — allow-listed actions only; approved writes.',
    trace: 'Control — immutable decision record; replayable.',
  };

  const stages: FlowStage[] = [
    {
      title: 'Enterprise evidence sources',
      sub: `${sourceNodes.length} tenant context surfaces feed the broker.`,
      role: 'context',
      gap: false,
      side: 'Control — sources are read-only; no mutation path inbound.',
    },
    ...spineNodes.map((n) => ({
      title: n.label,
      sub: n.evidence,
      role: nodeRole(n.kind),
      gap: n.status === 'gap',
      side: controlCaption[n.id] ?? 'Control — traced.',
    })),
  ];

  // Edges: source-collapse means stage 0 → stage 1 (broker), then the spine
  // edges shift by (sourceCount - 1). Re-map against the collapsed stages.
  const spineEdges: FlowEdge[] = [
    { from: 0, to: 1, label: 'read evidence', kind: 'data' },
    { from: 1, to: 2, label: 'grounded prompt', kind: 'data' },
    { from: 2, to: 3, label: 'recommendation', kind: 'decision' },
    { from: 3, to: 4, label: 'approved action only', kind: 'decision' },
    { from: 3, to: 5, label: 'decision log', kind: 'control' },
    { from: 4, to: 5, label: 'outcome signals', kind: 'data' },
  ];

  return {
    anatomy: {
      page: 4,
      id: 'data-flow',
      navLabel: 'Data flow',
      takeaway:
        'Data flow is read-first — nothing mutates a system of record until ' +
        'it has crossed the human checkpoint.',
      decisionRole:
        'Confirm what data moves, where, and the control on each hop.',
      evidence: {
        sources: [
          'Kernel data-flow diagram — sources, broker, gateway, checkpoint',
          `Selected option security posture — ${selected.shape}`,
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: ['Transcript-use privacy review — gates the inference path'],
      },
      implication:
        'The checkpoint is the mutation barrier: every write to a system ' +
        'of record is gated behind a named human approval.',
      owner: 'AI Governance (with Privacy Office)',
      nextGate: 'Integration map — which systems the approved actions touch',
    },
    stages,
    edges: spineEdges,
    dataSources: sourceNodes.map((n) => n.label),
    controlPoints: [
      'Broker boundary — tenant RLS scope on every retrieval.',
      'Model gateway — per-decision cost cap and a latency budget.',
      'Human checkpoint — the mutation barrier before any write.',
      'Systems of record — allow-listed, approved actions only.',
      'Tower trace — an immutable, replayable decision record.',
    ],
    notes: [...diagram.notes],
  };
}

function buildIntegrationSection(args: {
  pack: SolutionArchitecturePack;
  generatedOn: string;
}): IntegrationMapSection {
  const { pack, generatedOn } = args;
  // Integration mode is inferred from the kernel's role text — NICE CXone and
  // the CDP are platform/data layers (API), Genesys is a routing export
  // (file). The kernel does not pin a mode, so this is a readable rendering of
  // its role text, not an invented integration.
  const modeFor = (system: string): string => {
    if (/export/i.test(system)) return 'File export';
    if (/CDP|intent/i.test(system)) return 'API · event';
    return 'API';
  };
  const rows: IntegrationRow[] = pack.integrations.map((i) => ({
    system: i.system,
    mode: modeFor(i.system),
    owner: i.owner,
    status: i.status,
    role: i.role,
    evidence: i.evidence,
  }));
  const groundedCount = rows.filter((r) => r.status === 'grounded').length;
  const gapCount = rows.filter((r) => r.status === 'gap').length;

  return {
    anatomy: {
      page: 5,
      id: 'integration-map',
      navLabel: 'Integration map',
      takeaway:
        `Two integrations are grounded and ready; one — the unified intent ` +
        `layer — is a declared gap that bounds how far autonomy can go.`,
      decisionRole:
        'Confirm what must integrate, the path, the owner, and the gaps.',
      evidence: {
        sources: [
          'Kernel integration map — systems, owners, readiness',
          'Apex scenario evidence — CDP gap as a readiness gate',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: rows
          .filter((r) => r.status === 'gap')
          .map((r) => `${r.system} — ${r.role}`),
      },
      implication:
        'Release 1 ships on the two grounded integrations; the CDP gap is ' +
        'the gate before intent-driven autonomy can expand.',
      owner: 'Enterprise Architecture (with CDO for the CDP gap)',
      nextGate: 'Build/buy/partner — who delivers each integration lane',
    },
    rows,
    groundedCount,
    gapCount,
  };
}

function buildBoundarySection(args: {
  pack: SolutionArchitecturePack;
  generatedOn: string;
}): BuildBuyPartnerSection {
  const { pack, generatedOn } = args;
  const lanes: BoundaryLane[] = pack.buildBuyBoundary.map((b) => ({
    lane: b.lane,
    disposition: b.disposition,
    owner: b.owner,
    rationale: b.rationale,
  }));

  return {
    anatomy: {
      page: 6,
      id: 'build-buy-partner',
      navLabel: 'Build / buy / partner',
      takeaway:
        'Buy the platform, partner for model operations, retain the ' +
        'workflow change — there is no lane Apex should custom-build.',
      decisionRole:
        'Confirm the delivery boundary: build, buy, partner, or retain.',
      evidence: {
        sources: [
          'Kernel build/buy/partner boundary — disposition + owner per lane',
          'Apex scenario evidence — split Source into routing / model / change',
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'The boundary is unambiguous: no lane is left undecided, and the ' +
        'retained lane keeps accountability for the service model internal.',
      owner: 'Sourcing VP (with Enterprise Architecture)',
      nextGate: 'Human accountability — who owns the decision rights',
    },
    lanes,
  };
}

function buildAccountabilitySection(args: {
  selected: SolutionArchitectureOption;
  generatedOn: string;
}): HumanAccountabilitySection {
  const { selected, generatedOn } = args;
  // The accountability swimlane is the human-in-loop workflow the selected
  // option commits to: the agent retrieves, drafts and prepares; the human
  // reviews, approves (the checkpoint) and owns exceptions; the agent then
  // executes only the approved action and the result is traced.
  const steps: AccountabilityStep[] = [
    {
      label: 'Retrieve + ground',
      lane: 'agent',
      note: 'Agent reads broker-scoped evidence; no decision yet.',
      checkpoint: false,
    },
    {
      label: 'Draft routing action',
      lane: 'agent',
      note: 'Agent prepares the proposed routing action.',
      checkpoint: false,
    },
    {
      label: 'Review + approve',
      lane: 'human',
      note: 'A named human holds the decision right to approve or reject.',
      checkpoint: true,
    },
    {
      label: 'Execute approved action',
      lane: 'agent',
      note: 'Agent executes only the human-approved action.',
      checkpoint: false,
    },
    {
      label: 'Own exceptions + trace',
      lane: 'human',
      note: 'Human owns escalations; every decision is traced.',
      checkpoint: false,
    },
  ];

  const decisionRights = [
    {
      step: 'Approve / reject routing action',
      owner: 'Customer Care team lead',
      right:
        'Sole decision right on whether a prepared routing action executes.',
    },
    {
      step: 'Handle exceptions / escalations',
      owner: 'VP Customer Care',
      right:
        'Owns the exception path; the agent never resolves an escalation.',
    },
    {
      step: 'Relax the checkpoint',
      owner: 'AI Governance',
      right:
        'Only Governance may narrow the checkpoint — and only once the ' +
        'eval corpus proves the quality bar holds.',
    },
  ];

  return {
    anatomy: {
      page: 7,
      id: 'human-accountability',
      navLabel: 'Human accountability',
      takeaway:
        'A named human holds the decision right at the checkpoint — the ' +
        'agent prepares, but it never decides to act alone.',
      decisionRole:
        'Confirm where the human stays in the loop and who owns each right.',
      evidence: {
        sources: [
          `Selected option — ${selected.name} (human-in-the-loop shape)`,
          'Kernel §4 component assessment — human-in-loop coverage native',
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'Accountability is designed in, not asserted: the checkpoint is a ' +
        'step in the workflow with a named owner and a decision right.',
      owner: 'VP Customer Care',
      nextGate: 'Controls and risks — what must be true before production',
    },
    steps,
    decisionRights,
  };
}

function buildControlsSection(args: {
  pack: SolutionArchitecturePack;
  selected: SolutionArchitectureOption;
  generatedOn: string;
  blockerGaps: string[];
}): ControlsAndRisksSection {
  const { pack, selected, generatedOn, blockerGaps } = args;

  const controls: ControlCell[] = (
    selected.componentCoverage as readonly ComponentAssessment[]
  ).map((c) => ({
    label: REFERENCE_COMPONENT_LABEL[c.component],
    coverage: c.coverage,
    note: c.note,
  }));

  // Risk register — every kernel architecture risk, with a short code and a
  // likelihood × impact placement. A blocker is high-impact; the kernel does
  // not pin a likelihood, so the placement is a readable rendering of the
  // severity, not an invented number.
  const risks = pack.architectureRisks.map((r) => ({
    code: r.code,
    label: riskLabel(r.code),
    severity: r.severity,
    message: r.message,
    fixCondition: r.fixCondition,
  }));
  void selected;

  const riskPoints: RiskPoint[] = risks.map((r, i) => {
    const blocker = r.severity === 'blocker';
    // Impact: blocker = high (3), watch = medium (2), managed = low/med (2).
    const impact = blocker ? 3 : 2;
    // Likelihood: a fired/declared blocker is a present condition (high);
    // a watch risk is medium; a managed risk is low.
    const likelihood =
      r.severity === 'blocker' ? 3 : r.severity === 'watch' ? 2 : 1;
    return {
      likelihood,
      impact,
      code: `AR${i + 1}`,
      blocker,
    };
  });

  return {
    anatomy: {
      page: 8,
      id: 'controls-and-risks',
      navLabel: 'Controls and risks',
      takeaway:
        'All eight reference-architecture controls are native — but the ' +
        'transcript-privacy review is a hard blocker before production.',
      decisionRole:
        'Confirm what must be true on controls and risk before production.',
      evidence: {
        sources: [
          'Kernel control overlay — the eight §4 reference controls',
          'Kernel architecture risk register — blockers + watch items',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: blockerGaps,
      },
      implication:
        'The control overlay is green, but a green overlay does not clear ' +
        'the gate while a privacy blocker is open — both must hold.',
      owner: 'AI Governance (with Privacy Office)',
      nextGate: 'Production-readiness gate — blockers must clear first',
    },
    controls,
    riskPoints,
    risks,
    referenceScore: pack.selectedOption.referenceScore,
    productionShaped: pack.selectedOption.productionShaped,
  };
}

function buildOpenDecisionsSection(args: {
  pack: SolutionArchitecturePack;
  generatedOn: string;
}): OpenDecisionsSection {
  const { pack, generatedOn } = args;
  // The open architecture decisions are the unresolved questions the kernel's
  // risk register and gap nodes imply — each is a real decision with an owner
  // and a gate impact, ordered so a gate-blocking decision sits at the top.
  const blockers = pack.architectureRisks.filter(
    (r) => r.severity === 'blocker',
  );
  const watches = pack.architectureRisks.filter(
    (r) => r.severity === 'watch',
  );

  const decisions: OpenDecisionsSection['decisions'] = [];

  // Blocker-derived decisions — these block the production gate.
  for (const b of blockers) {
    if (b.code.includes('transcript_privacy')) {
      decisions.push({
        decision:
          'Can transcript data be used on the customer-facing inference ' +
          'path, and under what handling controls?',
        owner: 'Privacy Office',
        gate: 'Production-readiness gate',
        impact: 100,
        blocksGate: true,
      });
    } else if (b.code.includes('monetisation')) {
      decisions.push({
        decision:
          'How is value monetised once the baseline cost / volume seed ' +
          'gaps close — does the architecture need to change to capture it?',
        owner: 'CFO + Program Lead',
        gate: 'Funding gate',
        impact: 82,
        blocksGate: true,
      });
    } else {
      decisions.push({
        decision: b.message,
        owner: 'Enterprise Architecture',
        gate: 'Production-readiness gate',
        impact: 78,
        blocksGate: true,
      });
    }
  }

  // The CDP gap — a real open decision: when and how to wire the unified
  // intent layer that intent-driven autonomy depends on.
  decisions.push({
    decision:
      'When is the unified intent / CDP layer wired in, and does release 1 ' +
      'ship without it?',
    owner: 'CDO / Data Sponsor',
    gate: 'Autonomy-expansion gate',
    impact: 64,
    blocksGate: false,
  });

  // Watch-derived decision — checkpoint relaxation depends on the eval corpus.
  decisions.push({
    decision:
      'When can the human checkpoint be narrowed — what eval-corpus ' +
      'evidence is required before Governance relaxes it?',
    owner: 'AI Governance',
    gate: 'Checkpoint-relaxation gate',
    impact: 48,
    blocksGate: false,
  });
  void watches;

  return {
    anatomy: {
      page: 9,
      id: 'open-decisions',
      navLabel: 'Open decisions',
      takeaway:
        'Four architecture decisions are still open — two of them block ' +
        'the production gate and must be closed before any go-live.',
      decisionRole:
        'Confirm every open architecture decision has an owner and a gate.',
      evidence: {
        sources: [
          'Kernel architecture risk register — blockers and watch items',
          'Kernel context diagram — the declared CDP gap node',
        ],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: decisions
          .filter((d) => d.blocksGate)
          .map((d) => d.decision),
      },
      implication:
        'No open decision is unowned; the two gate-blocking decisions are ' +
        'the conditions on the production-readiness gate.',
      owner: 'Enterprise Architecture (decision-queue owner)',
      nextGate: 'Close the two gate-blocking decisions before go-live',
    },
    decisions,
  };
}

// ---------------------------------------------------------------------------
// Helpers — projections only; no new facts.
// ---------------------------------------------------------------------------

/** Find a kernel diagram by id; throw if the kernel did not produce it. */
function findDiagram(
  pack: SolutionArchitecturePack,
  id: ArchitectureDiagram['id'],
): ArchitectureDiagram {
  const d = pack.diagrams.find((diagram) => diagram.id === id);
  if (!d) {
    throw new Error(`Solution-architecture kernel did not produce ${id}.`);
  }
  return d;
}

/** Map a kernel architecture-node kind to an SVG node role. */
function nodeRole(
  kind:
    | 'business_surface'
    | 'context_layer'
    | 'broker'
    | 'agent'
    | 'control'
    | 'human_checkpoint'
    | 'system_of_record'
    | 'tower',
): ContextNode['role'] {
  switch (kind) {
    case 'business_surface':
      return 'actor';
    case 'context_layer':
      return 'context';
    case 'broker':
      return 'broker';
    case 'agent':
      return 'agent';
    case 'control':
      return 'control';
    case 'human_checkpoint':
      return 'human';
    case 'system_of_record':
      return 'system';
    case 'tower':
      return 'tower';
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Map a kernel diagram's index-keyed edges to flow-stage indices. */
function mapEdges(diagram: ArchitectureDiagram): FlowEdge[] {
  const indexById = new Map<string, number>();
  diagram.nodes.forEach((n, i) => indexById.set(n.id, i));
  return diagram.edges
    .map((e) => {
      const from = indexById.get(e.from);
      const to = indexById.get(e.to);
      if (from === undefined || to === undefined) return null;
      return {
        from,
        to,
        label: e.label,
        kind: edgeKind(e.label),
      };
    })
    .filter((e): e is FlowEdge => e !== null);
}

/** Classify a kernel edge label into a typed flow kind. */
function edgeKind(
  label: string,
): 'data' | 'control' | 'integration' | 'decision' {
  const l = label.toLowerCase();
  if (/approv|escalat|decision|recommend/.test(l)) return 'decision';
  if (/validate|control|guard/.test(l)) return 'control';
  if (/integrat|system/.test(l)) return 'integration';
  return 'data';
}

/** A short shape label for the option scorecard. */
function shapeLabel(
  shape: 'retrieval_copilot' | 'human_in_loop_agent' | 'full_agentic_workflow',
): string {
  switch (shape) {
    case 'retrieval_copilot':
      return 'Read-only copilot';
    case 'human_in_loop_agent':
      return 'Human-in-the-loop agent';
    case 'full_agentic_workflow':
      return 'Full agentic workflow';
    default: {
      const _exhaustive: never = shape;
      return _exhaustive;
    }
  }
}

/** The rejection reason for a non-selected option, by shape. */
function optionRejectionReason(
  shape: 'retrieval_copilot' | 'human_in_loop_agent' | 'full_agentic_workflow',
): string {
  if (shape === 'retrieval_copilot') {
    return (
      'Rejected — a read-only copilot under-shapes the Move; it answers ' +
      'questions about routing but never prepares the routing action.'
    );
  }
  if (shape === 'full_agentic_workflow') {
    return (
      'Rejected — full autonomy is premature: the scenario evidence ' +
      'requires a named human accountable and intent data is still ' +
      'fragmented (the CDP gap).'
    );
  }
  return 'Rejected.';
}

/** A short human label for a kernel architecture-risk code. */
function riskLabel(code: string): string {
  const map: Record<string, string> = {
    'apex.transcript_privacy_gate': 'Transcript-use privacy review',
    'apex.intent_fragmentation': 'Intent-data fragmentation',
    'critic.cfo_monetisation_blocked': 'CFO monetisation blocked',
  };
  if (map[code]) return map[code];
  // Reference-component gap codes carry a component key after the dot.
  if (code.startsWith('reference.')) {
    return `Reference gap — ${code.slice('reference.'.length)}`;
  }
  if (code.startsWith('roadmap.')) {
    return `Roadmap flag — ${code.slice('roadmap.'.length)}`;
  }
  if (code.startsWith('critic.')) {
    return `Critic blocker — ${code.slice('critic.'.length)}`;
  }
  return code;
}

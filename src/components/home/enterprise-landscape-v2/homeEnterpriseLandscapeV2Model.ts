export type HomeLandscapeTabId =
  | "summary"
  | "patterns"
  | "economics"
  | "posture"
  | "coherence"
  | "trajectory"
  | "watchlist"
  | "evidence";

export type SignalTone = "blue" | "teal" | "amber" | "slate" | "red";

export interface MetricAnchor {
  label: string;
  value: string;
  detail: string;
  tone: SignalTone;
  ratio: number;
}

export interface StandoutSignal {
  label: string;
  title: string;
  body: string;
}

export interface PatternSignal {
  title: string;
  body: string;
  tone: SignalTone;
}

export interface EconomicRow {
  label: string;
  value: string;
  detail: string;
  ratio: number;
  tone: SignalTone;
}

export interface PostureRow {
  domain: string;
  evidence: string;
  authority: string;
  valueState: string;
  attention: string;
}

export interface CoherenceNode {
  label: string;
  detail: string;
  x: number;
  y: number;
  tone: SignalTone;
}

export interface TrajectoryRow {
  area: string;
  current: string;
  potential: string;
  authority: string;
  gate: string;
  route: string;
}

export interface WatchItem {
  severity: string;
  title: string;
  body: string;
  route: string;
}

export interface EvidenceItem {
  label: string;
  value: string;
  detail: string;
  tone: SignalTone;
}

export interface HomeEnterpriseLandscapeV2Model {
  tenantName: string;
  subtitle: string;
  status: string;
  executiveRead: string;
  anchors: MetricAnchor[];
  standouts: StandoutSignal[];
  patterns: PatternSignal[];
  economics: EconomicRow[];
  posture: PostureRow[];
  coherence: CoherenceNode[];
  trajectory: TrajectoryRow[];
  watchlist: WatchItem[];
  evidence: EvidenceItem[];
}

export const HOME_LANDSCAPE_TABS: Array<{
  id: HomeLandscapeTabId;
  label: string;
}> = [
  { id: "summary", label: "Summary" },
  { id: "patterns", label: "Patterns" },
  { id: "economics", label: "Economics" },
  { id: "posture", label: "Posture" },
  { id: "coherence", label: "Coherence" },
  { id: "trajectory", label: "Trajectory" },
  { id: "watchlist", label: "Watchlist" },
  { id: "evidence", label: "Evidence" },
];

export const SKYHARBOR_HOME_ENTERPRISE_LANDSCAPE_V2: HomeEnterpriseLandscapeV2Model =
  {
    tenantName: "SkyHarbor Global",
    subtitle: "Synthetic current-state package | Aug 2, 2026",
    status: "Planning-grade | Directional confidence | As of Aug 2, 2026",
    executiveRead:
      "SkyHarbor is a large, operations-intensive airline with substantial modernization activity across its operating, commercial, technology, and data estate. The current landscape points to execution alignment across critical platforms, measures, portfolio dependencies, and commercial commitments as the central management challenge.",
    anchors: [
      {
        label: "Technology budget",
        value: "$2.35B",
        detail: "FY2027, governed scope",
        tone: "blue",
        ratio: 1,
      },
      {
        label: "Prior-year actual",
        value: "$2.18B",
        detail: "FY2026 technology spend",
        tone: "teal",
        ratio: 0.93,
      },
      {
        label: "Committed base",
        value: "$1.48B",
        detail: "Annual contract value",
        tone: "amber",
        ratio: 0.63,
      },
      {
        label: "Contract register",
        value: "119",
        detail: "Annual-value contracts",
        tone: "slate",
        ratio: 0.78,
      },
    ],
    standouts: [
      {
        label: "Strength to preserve",
        title: "Investment capacity",
        body: "The governed budget and prior-year spend show material technology capacity that can support enterprise-level modernization.",
      },
      {
        label: "Structural constraint",
        title: "Committed economics",
        body: "The annual contracted base is large enough to make commercial timing, rights, and flexibility a management issue.",
      },
      {
        label: "Transformation in motion",
        title: "Outcome proof still maturing",
        body: "AI activity is visible, but value evidence remains a specialist Tower validation question rather than the Home thesis.",
      },
    ],
    patterns: [
      {
        title: "Operations-heavy enterprise",
        body: "Core airline operations, commercial channels, loyalty, workforce, maintenance, and airport execution are all in scope for the current landscape.",
        tone: "blue",
      },
      {
        title: "Hybrid technology estate",
        body: "Modernization activity spans core systems, cloud platforms, data products, integration paths, and analytics tooling rather than a single-platform migration.",
        tone: "teal",
      },
      {
        title: "Control evidence matters",
        body: "The management read depends on scope, ownership, evidence depth, and module-specific validation instead of broad transformation labels.",
        tone: "amber",
      },
    ],
    economics: [
      {
        label: "FY2027 technology budget",
        value: "$2.35B",
        detail: "Governed planning scope",
        ratio: 1,
        tone: "blue",
      },
      {
        label: "FY2026 actual technology spend",
        value: "$2.18B",
        detail: "Prior-year actual",
        ratio: 0.93,
        tone: "teal",
      },
      {
        label: "Annual contracted base",
        value: "$1.48B",
        detail: "63% of FY2027 budget",
        ratio: 0.63,
        tone: "amber",
      },
      {
        label: "Estimated AI use cost",
        value: "$170.2M",
        detail: "Specialist Tower validation lane",
        ratio: 0.07,
        tone: "slate",
      },
    ],
    posture: [
      {
        domain: "Business operations",
        evidence: "Broad",
        authority: "Current state",
        valueState: "Observed",
        attention: "Workflow alignment",
      },
      {
        domain: "Applications and platforms",
        evidence: "Broad",
        authority: "Current state",
        valueState: "Derived",
        attention: "Dependency gravity",
      },
      {
        domain: "Vendors and contracts",
        evidence: "Governed",
        authority: "Current state",
        valueState: "Observed",
        attention: "Commercial flexibility",
      },
      {
        domain: "AI and automation",
        evidence: "Specialist",
        authority: "Tower routed",
        valueState: "Not generalized",
        attention: "Outcome proof",
      },
    ],
    coherence: [
      {
        label: "Operating model",
        detail: "Airline workflows and ownership",
        x: 14,
        y: 42,
        tone: "blue",
      },
      {
        label: "Core platforms",
        detail: "Applications, cloud, data, integration",
        x: 40,
        y: 28,
        tone: "teal",
      },
      {
        label: "Commercial base",
        detail: "Vendors, contracts, renewal choices",
        x: 66,
        y: 44,
        tone: "amber",
      },
      {
        label: "Value proof",
        detail: "Tower-routed outcome validation",
        x: 86,
        y: 64,
        tone: "slate",
      },
    ],
    trajectory: [
      {
        area: "Enterprise modernization",
        current: "Multiple active domains",
        potential: "Coordinated enterprise roadmap",
        authority: "Planning hypothesis",
        gate: "Approved target-state source",
        route: "Intelligence",
      },
      {
        area: "Commercial flexibility",
        current: "Large committed base",
        potential: "Renegotiated rights and timing",
        authority: "Source owned",
        gate: "Clause-level evidence",
        route: "Source",
      },
      {
        area: "AI value realization",
        current: "Activity visible",
        potential: "Finance-recognized outcomes",
        authority: "Tower owned",
        gate: "Baseline and attestation",
        route: "Tower",
      },
    ],
    watchlist: [
      {
        severity: "Material",
        title: "Contract-backed run economics",
        body: "The committed annual base is large enough to constrain near-term portfolio flexibility if renewal, rights, and service scope are not managed.",
        route: "Source",
      },
      {
        severity: "Material",
        title: "Outcome proof separation",
        body: "Home should not turn AI activity into enterprise value claims. Tower remains the validation lane for claimability and finance recognition.",
        route: "Tower",
      },
      {
        severity: "Watch",
        title: "Future-state authority",
        body: "Current-to-future language needs approved strategy, approved Moves, declared target state, or explicit planning-hypothesis status.",
        route: "Moves",
      },
    ],
    evidence: [
      {
        label: "Design contract",
        value: "V0.2.3",
        detail: "Summary hierarchy corrected",
        tone: "blue",
      },
      {
        label: "Deterministic layer",
        value: "Required",
        detail: "HomeEnterpriseEvidenceV2 is the next binding gate",
        tone: "amber",
      },
      {
        label: "Claude result",
        value: "Required",
        detail: "One validated home_enterprise_context_v2 synthesis",
        tone: "amber",
      },
      {
        label: "Runtime posture",
        value: "Planning-grade",
        detail: "No new Claude response is claimed by this render",
        tone: "slate",
      },
    ],
  };


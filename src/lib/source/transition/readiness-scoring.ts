import {
  buildTransitionReadinessView,
  type TransitionGoNoGoItem,
  type TransitionReadinessStatus,
  type TransitionReadinessView,
  type TransitionRiskItem,
} from "../transition-readiness-view";

export type SourceTransitionMilestoneStatus =
  | "complete"
  | "active"
  | "at_risk"
  | "blocked"
  | "next";

export interface SourceTransitionMilestone {
  id: string;
  phase: "Discovery" | "Shadow" | "Reverse Shadow" | "Cutover" | "Hypercare";
  window: string;
  status: SourceTransitionMilestoneStatus;
  owner: string;
  evidence: string;
  nextAction: string;
}

export interface SourceTransitionWorkstream {
  id: string;
  label: "Infrastructure" | "Knowledge transfer" | "Vendor staffing" | "Incumbent exit";
  status: "green" | "amber" | "red";
  owner: string;
  signal: string;
  blocker?: string;
}

export interface SourceTransitionSigner {
  id: string;
  name: string;
  role: "CIO" | "CDO" | "Vendor PM";
  status: "signed" | "pending";
  requirement: string;
}

export interface SourceTransitionReadinessModel {
  view: TransitionReadinessView;
  milestones: SourceTransitionMilestone[];
  workstreams: SourceTransitionWorkstream[];
  signers: SourceTransitionSigner[];
  goNoGoCriteria: TransitionGoNoGoItem[];
  risks: TransitionRiskItem[];
  readinessPercent: number;
  activeBlocker: string;
  apxDependency: string;
}

const MILESTONES: SourceTransitionMilestone[] = [
  {
    id: "kt-discovery",
    phase: "Discovery",
    window: "Weeks 1-2",
    status: "complete",
    owner: "Apex CIO Office",
    evidence: "Application tower owners and incumbent SMEs named.",
    nextAction: "Keep the KT roster attached to the transition plan.",
  },
  {
    id: "kt-shadow",
    phase: "Shadow",
    window: "Weeks 3-4",
    status: "complete",
    owner: "Selected vendor PM",
    evidence: "Critical incident, release, and batch-support shadow sessions logged.",
    nextAction: "Convert observed procedures into runbooks before reverse shadow.",
  },
  {
    id: "kt-reverse-shadow",
    phase: "Reverse Shadow",
    window: "Weeks 5-8",
    status: "active",
    owner: "AMS transition lead",
    evidence: "8-week onboarding control window in progress.",
    nextAction: "Prove the vendor can operate P1 incident response without incumbent lead.",
  },
  {
    id: "kt-cutover",
    phase: "Cutover",
    window: "Week 9",
    status: "at_risk",
    owner: "Apex CDO",
    evidence: "APX-CDP-2026 dependency must clear before data-migration freeze.",
    nextAction: "Resolve Q3 2026 CDP design/freeze window before cutover approval.",
  },
  {
    id: "kt-hypercare",
    phase: "Hypercare",
    window: "Weeks 10-14",
    status: "next",
    owner: "CIO Office + Vendor PM",
    evidence: "Hypercare service levels drafted but not signed.",
    nextAction: "Lock the week-1, week-2, and day-30 hypercare scorecards.",
  },
];

const WORKSTREAMS: SourceTransitionWorkstream[] = [
  {
    id: "ws-infrastructure",
    label: "Infrastructure",
    status: "green",
    owner: "Apex Infrastructure",
    signal: "Access model and environment list are ready for vendor onboarding.",
  },
  {
    id: "ws-kt",
    label: "Knowledge transfer",
    status: "amber",
    owner: "AMS transition lead",
    signal: "Phase 1 transfer is complete; Phase 2/3 application knowledge is still being validated.",
    blocker: "Reverse-shadow evidence must show vendor-led P1 incident handling.",
  },
  {
    id: "ws-staffing",
    label: "Vendor staffing",
    status: "green",
    owner: "Selected vendor PM",
    signal: "Named transition team and tower leads are present in the transition plan.",
  },
  {
    id: "ws-incumbent-exit",
    label: "Incumbent exit",
    status: "red",
    owner: "Apex Procurement",
    signal: "Incumbent extension backstop is not yet signed.",
    blocker: "Confirm 60-day extension option at current rates before transition starts.",
  },
];

const SIGNERS: SourceTransitionSigner[] = [
  {
    id: "sig-cio",
    name: "CIO Office",
    role: "CIO",
    status: "pending",
    requirement: "Accepts production-support accountability after cutover.",
  },
  {
    id: "sig-cdo",
    name: "CDO / Data Migration Lead",
    role: "CDO",
    status: "pending",
    requirement: "Confirms APX-CDP-2026 and Q3 2026 data-migration freeze alignment.",
  },
  {
    id: "sig-vendor-pm",
    name: "Selected Vendor PM",
    role: "Vendor PM",
    status: "pending",
    requirement: "Owns named transition team, runbook delivery, and hypercare cadence.",
  },
];

export function buildSourceTransitionReadinessModel(): SourceTransitionReadinessModel {
  const view = buildTransitionReadinessView();
  const greenish = WORKSTREAMS.filter((workstream) => workstream.status === "green").length;
  const amber = WORKSTREAMS.filter((workstream) => workstream.status === "amber").length;
  const readinessPercent = Math.round(
    ((greenish + amber * 0.5) / WORKSTREAMS.length) * 100,
  );

  return {
    view,
    milestones: MILESTONES,
    workstreams: WORKSTREAMS,
    signers: SIGNERS,
    goNoGoCriteria: view.goNoGoCriteria,
    risks: view.risks,
    readinessPercent,
    activeBlocker:
      WORKSTREAMS.find((workstream) => workstream.status === "red")?.blocker ??
      view.atlasGuidance,
    apxDependency:
      "APX-CDP-2026 Q3 2026 data-migration freeze window must clear before cutover approval.",
  };
}

export function transitionStatusLabel(status: TransitionReadinessStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "partial":
      return "Partial";
    case "blocked":
      return "Blocked";
    case "not_started":
      return "Not started";
    case "deferred":
      return "Deferred";
  }
}

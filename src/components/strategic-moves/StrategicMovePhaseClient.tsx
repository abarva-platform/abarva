"use client";

// StrategicMovePhaseClient · Strategic Moves Phase Workspace (P0–P5)
//
// Two-pane phase workspace: Nexus chat on the left, phase canvas on the right.
// Uses /api/chat/agent with surface `/strategic-moves/{moveId}/phase/{phaseNum}`
// and passes moveId + phase in surfaceContext so the agent route loads the
// correct phase pack (T-P0 through T-P5).
//
// Design reference: StrategicMoveOriginateClient.tsx (P0) — same shell,
// same chat patterns, phase-specific canvas on the right.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  extractArtifacts,
  visibleArtifactPendingText,
} from "@/lib/agent/artifacts";
import {
  CurrentStateReadinessPanel,
  WhereToStartBlock,
  IndicativePlanBlock,
} from "@/components/strategic-moves/CurrentStateReadinessPanel";
import { DeliverableArtifactCard } from "@/components/strategic-moves/DeliverableArtifactCard";
import type { ReadinessReport as CurrentStateReadinessReport } from "@/lib/programs/current-state-readiness";
import type { CurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import type { CurrentStatePlan } from "@/lib/programs/current-state-plan";
import {
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
} from "@/lib/agent/response-shape";
import type { StrategicMove } from "@/lib/programs/types.ui";
import { deliverableBelongsToPhase } from "@/lib/programs/phase-deliverables";
import { PHASE_CANONICAL_KEYS } from "@/lib/programs/deliverable-registry";
import styles from "./StrategicMoves.module.css";
import { PhaseRail } from "./PhaseRail";
import { PhaseApproveAndBuild } from "./PhaseApproveAndBuild";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { MoveEvidenceNeedsPanel } from "./MoveEvidenceNeedsPanel";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  agentName?: "Nexus";
  text: string;
};

type AttachmentStatus = "uploading" | "done" | "error";
interface PendingAttachment {
  id: string;
  name: string;
  status: AttachmentStatus;
  attachmentId?: string;
  feedbackCount?: number;
  errorMsg?: string;
}

// ── Phase metadata ─────────────────────────────────────────────────────────────

interface PhaseConfig {
  label: string;
  shortLabel: string;
  firstMessage: (move: StrategicMove) => string;
  suggestedPrompts: string[];
}

const PHASE_CONFIGS: Record<number, PhaseConfig> = {
  0: {
    label: "P0 Originate",
    shortLabel: "P0 ORIGINATE",
    firstMessage: (move) =>
      `**${move.name}** is in P0 Originate. The seed is approved for disciplined shaping, but P0 still has to leave behind a clean handoff: named sponsor, value hypothesis, scope boundary, evidence family, and Discovery capacity. We should close any remaining P0 evidence gaps, then advance to P1 Charter with a human-reviewed rationale.`,
    suggestedPrompts: [
      "Show me the P0 gate criteria",
      "What is missing before P1 Charter?",
      "Draft the P0 to P1 advance rationale",
    ],
  },
  1: {
    label: "P1 Charter",
    shortLabel: "P1 CHARTER",
    firstMessage: (move) => {
      const sponsorName = move.sponsor?.name ?? null;
      const p1Steps = [
        `**${move.name}** has been promoted to P1 Charter. The origination brief is complete — now we turn it into a sponsor-committed charter. The five P1 steps:`,
        "",
        "1. Confirm sponsor commitment",
        "2. Map stakeholders & decision rights",
        "3. Lock success metrics + value range",
        "4. Draft the charter document",
        "5. Prepare for gate review",
        "",
      ].join("\n");
      if (sponsorName) {
        return `${p1Steps}First up: has **${sponsorName}** formally committed to sponsoring this Move?`;
      }
      return `${p1Steps}First up: who should sponsor this Move — which executive owns the outcome it targets?`;
    },
    suggestedPrompts: [
      "Walk me through the P1 gate criteria",
      "What does the sponsor need to commit to?",
      "Help me draft the stakeholder map",
    ],
  },
  2: {
    label: "P2 Discover & Diagnose",
    shortLabel: "P2 DISCOVER",
    firstMessage: (move) =>
      `**${move.name}** has entered P2 Discover & Diagnose. The charter is signed — now we establish the evidence that decides whether this Move goes to P3 or stops here. The five P2 steps:\n\n1. Map the current-state process\n2. Capture baseline metrics (attested, with owners)\n3. Identify root causes\n4. Assess data readiness\n5. Make the continue / discontinue decision\n\nWhere do you want to start — process mapping or baseline data?`,
    suggestedPrompts: [
      "Start with current-state process mapping",
      "What baseline metrics do we need to capture?",
      "Walk me through the P2 gate criteria",
    ],
  },
  3: {
    label: "P3 Design Future State",
    shortLabel: "P3 DESIGN",
    firstMessage: (move) =>
      `P2 diagnosis is confirmed for **${move.name}**. P3 starts here: for each root cause identified in P2, we need to define the design element that addresses it. That traceability is the foundation. Once all root causes have a design counterpart, we'll work through the operating model shift and solution architecture. Ready to start with the first root cause?`,
    suggestedPrompts: [
      "Start the root cause trace",
      "Help me map the operating model shift",
      "What are the P3 gate criteria?",
    ],
  },
  4: {
    label: "P4 Roadmap & Business Case",
    shortLabel: "P4 ROADMAP",
    firstMessage: (move) =>
      `P3 design is signed off for **${move.name}**. P4 builds the plan and the economics. The four P4 steps:\n\n1. Roadmap construction from the P3 design\n2. Business case economics (derived from approved estimates/value only)\n3. Tower metric plan — the post-handoff success signals, locked alongside the business case, not after\n4. Gate review\n\nReady to start with the roadmap?`,
    suggestedPrompts: [
      "Start roadmap construction",
      "Help me draft the business case",
      "What should go in the Tower metric plan?",
    ],
  },
  5: {
    label: "P5 Mobilize & Handoff",
    shortLabel: "P5 MOBILIZE",
    firstMessage: (move) =>
      `P4 gate passed for **${move.name}**. P5 begins now: mobilize delivery and hand off to Tower. The five P5 steps:\n\n1. Team assembly + RACI confirmation\n2. Handoff package assembly\n3. Readiness verification\n4. Explicit Tower acceptance — a named Tower representative confirms the package is executable (not "sent", not "attended a session")\n5. Gate-out\n\nFirst: the delivery team. For each P4 workstream we need a named delivery lead with confirmed availability. Ready to go through the workstreams?`,
    suggestedPrompts: [
      "Confirm the delivery team RACI",
      "Assemble the Tower handoff package",
      "What does Tower acceptance require?",
    ],
  },
};

// ── Canvas section definitions per phase ──────────────────────────────────────

interface CanvasSection {
  id: string;
  label: string;
  placeholder: string;
}

const PHASE_CANVAS_SECTIONS: Record<number, CanvasSection[]> = {
  0: [
    {
      id: "seed",
      label: "Move seed",
      placeholder:
        "Problem signal, named outcome, and AI/transformation hypothesis",
    },
    {
      id: "sponsor-candidate",
      label: "Sponsor candidate",
      placeholder:
        "Named executive with plausible decision rights and approval path",
    },
    {
      id: "value-hypothesis",
      label: "Value hypothesis",
      placeholder:
        "Unvalidated value range, mechanism, and assumptions to test in Discovery",
    },
    {
      id: "scope-boundary",
      label: "Scope boundary",
      placeholder:
        "First cohort, use case, or disruption slice; what is explicitly out of scope",
    },
    {
      id: "evidence-family",
      label: "Evidence family",
      placeholder:
        "Current-state documents, datasets, interviews, and baselines P1/P2 must collect",
    },
  ],
  1: [
    {
      id: "sponsor",
      label: "Sponsor commitment",
      placeholder:
        "Confirm sponsor identity, commitment level, and decision rights",
    },
    {
      id: "stakeholders",
      label: "Stakeholders",
      placeholder: "Map who has decision rights, contributes, and can block",
    },
    {
      id: "success-metrics",
      label: "Success metrics",
      placeholder: "Lock the primary measurable metric and baseline path",
    },
    {
      id: "value-range",
      label: "Value range",
      placeholder:
        "Preliminary value range with stated assumptions (PRELIMINARY_ESTIMATE)",
    },
    {
      id: "scope",
      label: "Scope",
      placeholder: "Charter scope — more precise than the P0 scope boundary",
    },
  ],
  2: [
    {
      id: "baseline",
      label: "Current-state baseline",
      placeholder:
        "Document current metrics, process state, and pain points — attest with owner",
    },
    {
      id: "rootcause",
      label: "Root cause analysis",
      placeholder:
        "Identify root causes underpinning the problem this move addresses",
    },
    {
      id: "datareadiness",
      label: "Data & readiness assessment",
      placeholder:
        "Assess data foundation readiness — access, quality, governance, AI-readiness",
    },
    {
      id: "decision",
      label: "P2 decision",
      placeholder:
        "Continue to P3 or discontinue — requires gate evaluation first",
    },
  ],
  3: [
    {
      id: "design",
      label: "Target state design",
      placeholder:
        "Future workflow, AI/agent placement, human ownership, capability being built",
    },
    {
      id: "operatingmodel",
      label: "Operating model shift",
      placeholder:
        "Who works differently — roles, handoffs, responsibilities — Today → Tomorrow",
    },
    {
      id: "rootcause-trace",
      label: "Root cause → design trace",
      placeholder:
        "Every design element must trace to a P2 root cause (hard requirement)",
    },
    {
      id: "risks",
      label: "Risks & tradeoffs",
      placeholder: "5–7 named risks with likelihood, impact, and mitigation",
    },
  ],
  4: [
    {
      id: "roadmap",
      label: "Execution roadmap",
      placeholder:
        "Workstreams, estimates, timeline, milestones, dependencies, RACI",
    },
    {
      id: "businesscase",
      label: "Business case",
      placeholder:
        "ROM estimate, org-specific rate card, ROI summary — requires sponsor approval",
    },
    {
      id: "valueplan",
      label: "Value plan",
      placeholder:
        "Measurement contract: committed outcomes and how they will be measured",
    },
    {
      id: "towermetric",
      label: "Tower monitoring plan",
      placeholder:
        "Measurable signals Tower tracks post-handoff — must be drafted at mid-P4",
    },
  ],
  5: [
    {
      id: "raci",
      label: "Delivery RACI",
      placeholder:
        "Named delivery leads for every workstream — people, not roles",
    },
    {
      id: "handoffpack",
      label: "Tower handoff package",
      placeholder:
        "All phase artifacts assembled: roadmap, monitoring plan, value framework, risk register, RACI, change plan",
    },
    {
      id: "tower-acceptance",
      label: "Tower acceptance",
      placeholder:
        "Explicit Tower acceptance required — acknowledged ≠ accepted",
    },
  ],
};

// ── Phase capture → save-key + gate-deliverable + orchestrate-key mapping ─────
//
// The capture cards (section ids) map onto the snake_case keys the phase-capture
// backend (POST .../phase-capture) accepts: the section id with hyphens→
// underscores (e.g. "success-metrics" → "success_metrics", "rootcause-trace" →
// "rootcause_trace"). No per-phase save-key table is needed — the transform is
// uniform across phases and matches PHASE_CAPTURE.fields in the route.
//
// `deliverableTypeKey` is the deliverable type the phase gate checks signed_off
// against (verified against governance.ts) — used to seed reload state from the
// persisted Move. `orchestrateKey` is the orchestrate `key=` value for the
// Generate step (verified present in the archetype deliverablePack).
//
//   Phase  Save deliverableTypeKey  Gate criterion / findDeliverable        orchestrateKey
//   P1     charter                  charter_signed_off / 'charter'          program_charter
//   P2     discovery_report         discovery_report_signed_off / …         discovery_report
//   P3     design_spec              design_approved / 'design_spec','design'  ai_enabled_sdlc_architecture
//   P4     business_case            business_case_approved / …              business_case
//   P5     tower_handoff_plan       tower_handoff_plan_accepted (soft) / …  handoff_package

interface PhaseWorkflowConfig {
  deliverableTypeKey: string;
  orchestrateKey: string;
}

const PHASE_WORKFLOW: Record<number, PhaseWorkflowConfig> = {
  1: { deliverableTypeKey: "charter", orchestrateKey: "program_charter" },
  2: {
    deliverableTypeKey: "discovery_report",
    orchestrateKey: "discovery_report",
  },
  3: {
    deliverableTypeKey: "design_spec",
    orchestrateKey: "ai_enabled_sdlc_architecture",
  },
  4: { deliverableTypeKey: "business_case", orchestrateKey: "business_case" },
  5: {
    deliverableTypeKey: "tower_handoff_plan",
    orchestrateKey: "handoff_package",
  },
};

/** The phase-capture save key for a section id: hyphens → underscores. */
function sectionSaveKey(sectionId: string): string {
  return sectionId.replace(/-/g, "_");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateTurnId(): string {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Capture-slot fill derivation (presentational, derived state only) ─────────
//
// A capture section is "filled" when the Move already carries real content for
// it — the origination charter JSONB (`engagements.charter`, snake_case and
// camelCase variants both occur in the wild) or the structured Move fields
// (sponsor, participants, valueAtStake). Nothing is fabricated: no matching
// data → the slot stays hollow.

const SECTION_CHARTER_KEYS: Record<string, string[]> = {
  // P0
  seed: ["problem_statement", "problemStatement", "problem", "move_seed"],
  "sponsor-candidate": ["sponsor_candidate", "sponsorCandidate", "sponsor"],
  "value-hypothesis": [
    "value_hypothesis",
    "valueHypothesis",
    "target_outcome",
    "targetOutcome",
  ],
  "scope-boundary": ["scope_boundary", "scopeBoundary", "initial_scope"],
  "evidence-family": ["evidence_family", "evidenceFamily"],
  // P1
  sponsor: [
    "sponsor_commitment",
    "sponsorCommitment",
    "sponsor_candidate",
    "sponsorCandidate",
    "sponsor",
  ],
  stakeholders: ["stakeholders", "stakeholder_map", "stakeholderMap"],
  "success-metrics": [
    "success_metrics",
    "successMetrics",
    "primary_metric",
    "primaryMetric",
  ],
  "value-range": [
    "value_range",
    "valueRange",
    "value_hypothesis",
    "valueHypothesis",
  ],
  scope: [
    "scope",
    "charter_scope",
    "charterScope",
    "scope_boundary",
    "scopeBoundary",
  ],
};

function charterText(
  charter: Record<string, unknown> | null,
  keys: string[],
): string | null {
  for (const k of keys) {
    const v = charter?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Charter keys to probe for a section: explicit map + id-derived variants. */
function sectionCharterKeys(sectionId: string): string[] {
  const snake = sectionId.replace(/-/g, "_");
  const camel = snake.replace(/_(\w)/g, (_, c: string) => c.toUpperCase());
  return Array.from(
    new Set([...(SECTION_CHARTER_KEYS[sectionId] ?? []), snake, camel]),
  );
}

function formatUsdCompact(n: number): string {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${Math.round(n / 1000)}k`;
}

/**
 * The real content backing a capture section, or null when nothing has been
 * captured yet ("content beyond placeholder = filled").
 */
function sectionCapturedContent(
  move: StrategicMove,
  sectionId: string,
): string | null {
  const fromCharter = charterText(move.charter, sectionCharterKeys(sectionId));
  switch (sectionId) {
    case "sponsor":
    case "sponsor-candidate":
      if (move.sponsor?.name) {
        return `${move.sponsor.name} — ${move.sponsor.role}`;
      }
      return fromCharter;
    case "stakeholders":
      if (move.participants.length > 0) {
        return move.participants
          .map((p) => `${p.name} (${p.role})`)
          .join(" · ");
      }
      return fromCharter;
    case "value-range":
    case "value-hypothesis": {
      if (fromCharter) return fromCharter;
      const projected = move.valueAtStake.projected;
      if (projected) {
        return `Projected ${formatUsdCompact(projected.low)}–${formatUsdCompact(
          projected.high,
        )} ${projected.currency}`;
      }
      return null;
    }
    default:
      return fromCharter;
  }
}

// ── Progressive-disclosure panel keys + collapse shell ─────────────────────────

type PanelKey =
  | "gate"
  | "readiness"
  | "start"
  | "plan"
  | "capture"
  | "generate"
  | "artifacts";

/**
 * Native <details> collapse shell for a canvas panel. Controlled `open` so the
 * auto-expand state machine (and the capture chips) can drive it; user toggles
 * are synced back via onToggle. Wraps existing content — never replaces it.
 */
function CollapsePanel({
  id,
  title,
  meta,
  open,
  onOpenChange,
  children,
}: {
  id: string;
  title: string;
  meta?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details
      id={id}
      className={styles.panelCollapse}
      open={open}
      onToggle={(e) => {
        const isOpen = (e.currentTarget as HTMLDetailsElement).open;
        if (isOpen !== open) onOpenChange(isOpen);
      }}
    >
      <summary className={styles.panelSummary}>
        <span>{title}</span>
        {meta ? <span className={styles.panelSummaryMeta}>{meta}</span> : null}
        <span className={styles.panelChevron} aria-hidden>
          &#9656;
        </span>
      </summary>
      <div className={styles.panelBody}>{children}</div>
    </details>
  );
}

// ── Phase 4-step gated capture workflow (P1–P5) ───────────────────────────────
//
// Founder-locked sequence, generalized from the proven P1 charter workflow:
// (1) capture all → (2) Save the record (deterministic POST to /phase-capture,
// NOT chat) → (3) Approve the saved record (enabled only when all sections saved)
// → (4) Generate the board-grade artifact from the approved record (enabled only
// after approval). Each step is gated on the previous. Reload-safe: Save/Approve/
// Generate eligibility is SEEDED from persisted Move data on mount so a refresh
// keeps the user's place.

type GenState =
  | { status: "idle" }
  | { status: "generating"; pct?: number; label?: string }
  | {
      status: "done";
      qualityScore: number | null;
      pass: boolean;
      // When pass === false, the specific board-grade gate blockers, so the UI
      // can explain WHY it was held (not just "below gate") and the user can act.
      blockers?: string[];
    }
  | { status: "error"; message: string };

function CharterWorkflow({
  move,
  phaseNum,
  canvasSections,
  capturedSections,
  isCaptureCardOpen,
  setOpenCaptureCards,
}: {
  move: StrategicMove;
  phaseNum: number;
  canvasSections: CanvasSection[];
  capturedSections: { section: CanvasSection; content: string | null }[];
  isCaptureCardOpen: (id: string) => boolean;
  setOpenCaptureCards: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}) {
  const workflow = PHASE_WORKFLOW[phaseNum];
  const sectionIds = useMemo(
    () => canvasSections.map((s) => s.id),
    [canvasSections],
  );

  // Editable textarea values, seeded from already-captured content so pre-filled
  // slots prefill. Keyed by section id.
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      capturedSections.map(({ section, content }) => [
        section.id,
        content ?? "",
      ]),
    ),
  );

  // The persisted gate deliverable for THIS phase, used to seed reload state.
  const persistedDeliverable = move.deliverables.find(
    (d) => d.typeKey === workflow?.deliverableTypeKey,
  );

  // Save state. RELOAD-SEED `allSaved` from persisted data: every section already
  // carries captured content (sectionCapturedContent reads engagements.charter,
  // which the Save route wrote) → Approve stays enabled after a refresh.
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [allSaved, setAllSaved] = useState<boolean>(
    () =>
      capturedSections.length > 0 &&
      capturedSections.every(({ content }) => content !== null),
  );
  // deliverableId from the save response, or RELOAD-SEEDED from the existing
  // phase gate deliverable on the Move so Approve works without re-saving.
  const [deliverableId, setDeliverableId] = useState<string | null>(
    () => persistedDeliverable?.id ?? null,
  );

  // Approve state. RELOAD-SEED `approved` from the persisted deliverable status.
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approved, setApproved] = useState<boolean>(
    () => persistedDeliverable?.status === "signed_off",
  );

  // Generate state
  const [gen, setGen] = useState<GenState>({ status: "idle" });
  // Guard async polling against unmount so a 15-min poll loop stops if the user leaves.
  const genMounted = useRef(true);
  useEffect(() => {
    genMounted.current = true;
    return () => {
      genMounted.current = false;
    };
  }, []);

  const filledNow = sectionIds.filter((id) => (values[id] ?? "").trim()).length;

  const saveRecord = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const items: Record<string, string> = {};
      for (const id of sectionIds) {
        const v = (values[id] ?? "").trim();
        if (v) items[sectionSaveKey(id)] = v;
      }
      const res = await fetch(`/api/v1/programs/${move.id}/phase-capture`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: phaseNum, items }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        savedFields?: string[];
        allSaved?: boolean;
        recordCreated?: boolean;
        deliverableId?: string;
        recordError?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(
          data.detail || data.error || `Save failed (HTTP ${res.status})`,
        );
      }
      setSavedCount(data.savedFields?.length ?? 0);
      setAllSaved(Boolean(data.allSaved));
      if (data.deliverableId) setDeliverableId(data.deliverableId);
      if (data.recordCreated === false && data.recordError) {
        setSaveError(
          `Inputs saved, but record not created: ${data.recordError}`,
        );
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [move.id, phaseNum, sectionIds, values]);

  const approveRecord = useCallback(async () => {
    if (!deliverableId) {
      setApproveError("Save the record first.");
      return;
    }
    setApproving(true);
    setApproveError(null);
    try {
      // Rationale draws on the first captured section (sponsor for P1, the
      // phase's leading input otherwise); falls back to a generic attestation.
      const leadVal = (values[sectionIds[0]] ?? "").trim();
      const rationale = leadVal
        ? `Record reviewed and approved — ${leadVal.slice(0, 160)}`
        : "Phase record reviewed and approved.";
      const res = await fetch(
        `/api/v1/programs/${move.id}/deliverables/${deliverableId}/sign-off`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rationale }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(
          data.detail || data.error || `Approve failed (HTTP ${res.status})`,
        );
      }
      setApproved(true);
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setApproving(false);
    }
  }, [deliverableId, move.id, sectionIds, values]);

  const generateArtifact = useCallback(async () => {
    // Async generation: ENQUEUE then POLL. The board-grade charter is a multi-pass
    // (~minutes) build that cannot finish inside one HTTP request — the previous
    // synchronous call to /current-state/deliverable/orchestrate hit the ~240s gateway
    // timeout and surfaced "Generate failed (HTTP 504)" even though the durable worker
    // had actually produced the artifact. We now reuse the proven enqueue+poll path that
    // "Approve & Build" uses (POST /api/v1/deliverables/generate-phase → durable worker →
    // GET /api/v1/deliverables/runs/{id}), so the request returns immediately and the UI
    // tracks live progress to completion.
    setGen({ status: "generating", pct: 0, label: "Queued…" });
    const gateKey = workflow?.deliverableTypeKey;
    try {
      const enqueueRes = await fetch("/api/v1/deliverables/generate-phase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moveId: move.id,
          phase: phaseNum,
          useCaseArchetype: move.archetype,
          moveName: move.name,
          clientDisplayName: move.tenant.name,
        }),
      });
      const enqueue = (await enqueueRes.json().catch(() => ({}))) as {
        deliverables?: Array<{
          deliverableTypeKey: string;
          runId: string | null;
          status: string;
          error?: string;
        }>;
        error?: string;
        detail?: string;
      };
      if (!enqueueRes.ok || !Array.isArray(enqueue.deliverables)) {
        throw new Error(
          enqueue.detail ||
            enqueue.error ||
            `Generate failed (HTTP ${enqueueRes.status})`,
        );
      }
      // Track the phase's gate deliverable (the charter for P1), else the first queued run.
      const target =
        enqueue.deliverables.find(
          (d) => d.deliverableTypeKey === gateKey && d.runId,
        ) ?? enqueue.deliverables.find((d) => d.runId);
      if (!target?.runId) {
        const failed = enqueue.deliverables.find((d) => d.error);
        throw new Error(
          failed?.error || "Generation did not start (no run was queued).",
        );
      }
      const runId = target.runId;

      // Poll until terminal (succeeded/blocked/failed) or the 15-min ceiling.
      const POLL_MS = 4000;
      const MAX_MS = 15 * 60 * 1000;
      const startedAt = Date.now();
      while (true) {
        if (!genMounted.current) return;
        if (Date.now() - startedAt > MAX_MS) {
          throw new Error("Generation timed out after 15 minutes.");
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (!genMounted.current) return;
        let poll: {
          status?: string;
          progressPct?: number;
          progressLabel?: string | null;
          blockers?: string[];
          error?: string;
        } = {};
        try {
          const pollRes = await fetch(`/api/v1/deliverables/runs/${runId}`, {
            credentials: "include",
          });
          poll = (await pollRes.json().catch(() => ({}))) as typeof poll;
          if (!pollRes.ok) continue; // transient (e.g. 503) — keep polling
        } catch {
          continue; // network blip — keep polling
        }
        if (poll.status === "queued" || poll.status === "running") {
          setGen({
            status: "generating",
            pct: poll.progressPct ?? 0,
            label: poll.progressLabel ?? undefined,
          });
          continue;
        }
        if (poll.status === "succeeded") {
          setGen({ status: "done", qualityScore: null, pass: true });
          return;
        }
        if (poll.status === "blocked") {
          // The build completed but was held below the board-grade quality gate.
          // Surface the specific blockers so the user understands WHY and can
          // act (fix inputs / context) and re-run. The gate stays enforced — we
          // never bypass it; "Regenerate" just runs another board-grade pass.
          setGen({
            status: "done",
            qualityScore: null,
            pass: false,
            blockers: Array.isArray(poll.blockers) ? poll.blockers : undefined,
          });
          return;
        }
        throw new Error(poll.error || "Generation failed.");
      }
    } catch (err) {
      if (!genMounted.current) return;
      setGen({
        status: "error",
        message: err instanceof Error ? err.message : "Generate failed",
      });
    }
  }, [
    move.id,
    move.archetype,
    move.name,
    move.tenant.name,
    phaseNum,
    workflow,
  ]);

  // Derived enable/disable:
  //  • Save: enabled unless a save is in flight.
  //  • Approve: enabled only when all sections are saved AND a deliverableId
  //    exists, and not already approved / approving.
  //  • Generate: enabled only after approval, and not already generating.
  const canApprove = allSaved && Boolean(deliverableId) && !approved;
  const canGenerate = approved && gen.status !== "generating";

  const sequenceState = (n: 1 | 2 | 3): "done" | "active" | "" => {
    if (n === 1) return approved || allSaved ? "done" : "active";
    if (n === 2) return approved ? "done" : allSaved ? "active" : "";
    return gen.status === "done" ? "done" : approved ? "active" : "";
  };
  const stepClass = (n: 1 | 2 | 3) => {
    const s = sequenceState(n);
    return `${styles.charterStep} ${
      s === "done"
        ? styles.charterStepDone
        : s === "active"
          ? styles.charterStepActive
          : ""
    }`;
  };

  return (
    <>
      {/* Editable capture cards */}
      {capturedSections.map(({ section, content }) => {
        const val = values[section.id] ?? "";
        const isSaved = val.trim().length > 0;
        return (
          <section
            key={section.id}
            id={`ws-canvas-p${phaseNum}-${section.id}-panel`}
            className={styles.detailSection}
          >
            <details
              open={isCaptureCardOpen(section.id)}
              onToggle={(e) => {
                const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                setOpenCaptureCards((prev) =>
                  (prev[section.id] ?? true) === isOpen
                    ? prev
                    : { ...prev, [section.id]: isOpen },
                );
              }}
            >
              <summary className={styles.captureCardSummary}>
                <span
                  className={styles.detailSectionTitle}
                  style={{ marginBottom: 0 }}
                >
                  {section.label}
                </span>
                <span
                  className={
                    isSaved
                      ? styles.captureBadgeDone
                      : styles.captureBadgePending
                  }
                >
                  {isSaved ? "✓ Captured" : "Not captured"}
                </span>
              </summary>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--abarva-slate)",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  padding: "4px 0 2px",
                }}
              >
                {section.placeholder}
              </div>
              <textarea
                id={`ws-canvas-p${phaseNum}-${section.id}-input`}
                className={styles.captureTextarea}
                rows={3}
                value={val}
                placeholder={section.placeholder}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [section.id]: e.target.value,
                  }))
                }
                spellCheck
              />
              {content !== null && !val.trim() && (
                <div className={styles.captureContent}>{content}</div>
              )}
            </details>
          </section>
        );
      })}

      {/* Ordered Save → Approve → Generate sequence */}
      <section
        id={`ws-canvas-p${phaseNum}-charter-sequence`}
        className={styles.detailSection}
      >
        <div className={styles.detailSectionTitle}>
          Phase workflow &mdash; {filledNow} of {canvasSections.length} captured
        </div>
        <div className={styles.charterSequence}>
          {/* Step 1 — Save */}
          <div className={stepClass(1)} id={`ws-canvas-p${phaseNum}-step-save`}>
            <span className={styles.charterStepNum}>1 · Save record</span>
            <button
              type="button"
              className={styles.charterPrimaryBtn}
              onClick={() => void saveRecord()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save record"}
            </button>
            {savedCount !== null && !saveError && (
              <span className={styles.charterStepOk}>
                Saved ✓ — {savedCount} of {canvasSections.length}
                {allSaved ? " · all saved" : ""}
              </span>
            )}
            {saveError && (
              <span className={styles.charterStepError}>{saveError}</span>
            )}
            {savedCount === null && !saveError && (
              <span className={styles.charterStepHint}>
                Persists the {canvasSections.length} inputs to the backend.
              </span>
            )}
          </div>

          <span className={styles.charterStepArrow} aria-hidden>
            &rarr;
          </span>

          {/* Step 2 — Approve */}
          <div
            className={stepClass(2)}
            id={`ws-canvas-p${phaseNum}-step-approve`}
          >
            <span className={styles.charterStepNum}>2 · Approve</span>
            <button
              type="button"
              className={styles.charterPrimaryBtn}
              onClick={() => void approveRecord()}
              disabled={!canApprove || approving}
            >
              {approved
                ? "Approved ✓"
                : approving
                  ? "Approving…"
                  : "Approve record"}
            </button>
            {approveError && (
              <span className={styles.charterStepError}>{approveError}</span>
            )}
            {!approved && !approveError && (
              <span className={styles.charterStepHint}>
                {allSaved
                  ? deliverableId
                    ? "Sign off the saved record."
                    : "Save the record first."
                  : "Save all inputs first."}
              </span>
            )}
            {approved && !approveError && (
              <span className={styles.charterStepOk}>Record signed off ✓</span>
            )}
          </div>

          <span className={styles.charterStepArrow} aria-hidden>
            &rarr;
          </span>

          {/* Step 3 — Generate artifact */}
          <div
            className={stepClass(3)}
            id={`ws-canvas-p${phaseNum}-step-generate`}
          >
            <span className={styles.charterStepNum}>3 · Generate artifact</span>
            <button
              type="button"
              className={styles.charterPrimaryBtn}
              onClick={() => void generateArtifact()}
              disabled={!canGenerate}
            >
              {gen.status === "generating"
                ? "Generating…"
                : gen.status === "done"
                  ? gen.pass
                    ? "Regenerate artifact"
                    : "Regenerate at board-grade"
                  : "Generate artifact"}
            </button>
            {gen.status === "generating" && (
              <span className={styles.charterStepHint}>
                {gen.label
                  ? `${gen.label}${gen.pct ? ` · ${gen.pct}%` : ""}`
                  : "Drafting the board-grade charter — this runs in the background and can take a few minutes."}
              </span>
            )}
            {gen.status === "done" && gen.pass && (
              <span className={styles.charterStepOk}>
                {gen.qualityScore != null
                  ? `Quality ${gen.qualityScore} · `
                  : ""}
                Built ✓ ·{" "}
                <Link href={`/strategic-moves/${move.id}/evidence`}>
                  Open File Cabinet →
                </Link>
              </span>
            )}
            {gen.status === "done" && !gen.pass && (
              <div className={styles.gateDetail}>
                <span className={styles.charterStepError}>
                  Held below the board-grade gate
                  {gen.blockers?.length
                    ? ` — ${gen.blockers.length} reason${
                        gen.blockers.length > 1 ? "s" : ""
                      } to resolve before it can be approved:`
                    : ". Re-run, or refine the inputs and context, then regenerate."}
                </span>
                {gen.blockers?.length ? (
                  <div className={styles.charterAdvancedNote}>
                    {gen.blockers.map((b, i) => (
                      <span
                        key={i}
                        className={`${styles.gateLine} ${styles.gateLineRed}`}
                      >
                        <span className={styles.pulse} aria-hidden />
                        <span className={styles.statusText}>{b}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className={styles.charterStepHint}>
                  Use “Regenerate at board-grade” above to run another pass —
                  the gate stays enforced.{" "}
                  <Link href={`/strategic-moves/${move.id}/evidence`}>
                    Open File Cabinet →
                  </Link>
                </span>
              </div>
            )}
            {gen.status === "error" && (
              <span className={styles.charterStepError}>{gen.message}</span>
            )}
            {gen.status === "idle" && !approved && (
              <span className={styles.charterStepHint}>
                Approve the record first.
              </span>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  move: StrategicMove;
  phaseNum: number;
  readiness?: CurrentStateReadinessReport | null;
  recommendation?: CurrentStateRecommendation | null;
  plan?: CurrentStatePlan | null;
  evidenceNeedPackets?: MoveEvidenceNeedPacket[];
}

export function StrategicMovePhaseClient({
  move,
  phaseNum,
  readiness,
  recommendation,
  plan,
  evidenceNeedPackets = [],
}: Props) {
  const config = PHASE_CONFIGS[phaseNum];
  const canvasSections = PHASE_CANVAS_SECTIONS[phaseNum] ?? [];

  // Gate criteria come straight from `move.gateCriteria` — the SINGLE
  // criterion-id scheme and evaluator (`governance.evaluateGate`, surfaced
  // via `transformers.buildGateCriteria`). The detail page renders the same
  // list, so the two surfaces can never show divergent gate progress. The
  // workspace shows the gate for the move's current phase; when the viewed
  // phase is not the current one, there is no active gate to render.
  const isCurrentPhase = move.currentPhase === phaseNum;
  const gateItemsWithStatus = isCurrentPhase ? move.gateCriteria : [];

  const [turns, setTurns] = useState<ChatTurn[]>(() => [
    {
      id: "nexus-open-p" + phaseNum,
      role: "assistant",
      agentName: "Nexus",
      text: config.firstMessage(move),
    },
  ]);
  const [composer, setComposer] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

  const turnsRef = useRef<ChatTurn[]>(turns);
  turnsRef.current = turns;
  const threadRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewFeedbackCount = attachments.reduce(
    (sum, attachment) => sum + (attachment.feedbackCount ?? 0),
    0,
  );

  // Auto-scroll thread
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [turns]);

  const updateTurns = useCallback(
    (updater: ChatTurn[] | ((prev: ChatTurn[]) => ChatTurn[])) => {
      const next =
        typeof updater === "function" ? updater(turnsRef.current) : updater;
      turnsRef.current = next;
      setTurns(next);
    },
    [],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const pendingId = `att-${Date.now()}`;
      setAttachments((prev) => [
        ...prev,
        { id: pendingId, name: file.name, status: "uploading" },
      ]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("phase", String(phaseNum));
        fd.append("purpose", "artifact_review");
        fd.append(
          "artifactType",
          PHASE_CANONICAL_KEYS[phaseNum]?.[0] ?? "phase_artifact",
        );
        const res = await fetch(`/api/programs/workspace/${move.id}/upload`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          attachmentId: string;
          review?: { extractedFeedback?: Array<{ requestedChange: string }> };
        };
        const feedbackCount = data.review?.extractedFeedback?.length ?? 0;
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === pendingId
              ? {
                  ...a,
                  status: "done",
                  attachmentId: data.attachmentId,
                  feedbackCount,
                }
              : a,
          ),
        );
        if (feedbackCount > 0) {
          updateTurns((prev) => [
            ...prev,
            {
              id: generateTurnId(),
              role: "assistant",
              agentName: "Nexus",
              text:
                `I parsed **${feedbackCount}** review feedback item${feedbackCount === 1 ? "" : "s"} from **${file.name}**. ` +
                "Use **Regenerate artifact** after triage to apply approved changes into the next version.",
            },
          ]);
        }
      } catch (err) {
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === pendingId
              ? {
                  ...a,
                  status: "error",
                  errorMsg:
                    err instanceof Error ? err.message : "upload failed",
                }
              : a,
          ),
        );
      }
    },
    [move.id, phaseNum, updateTurns],
  );

  const send = useCallback(
    async (messageOverride?: string) => {
      const message = (messageOverride ?? composer).trim();
      if (!message || streaming) return;

      const doneAttachments = attachments.filter((a) => a.status === "done");
      const attachmentSuffix =
        doneAttachments.length > 0
          ? `\n\n[Attached: ${doneAttachments.map((a) => a.name).join(", ")}]`
          : "";
      const fullMessage = message + attachmentSuffix;

      const assistantTurnId = generateTurnId();
      updateTurns((prev) => [
        ...prev,
        { id: generateTurnId(), role: "user", text: fullMessage },
        {
          id: assistantTurnId,
          role: "assistant",
          agentName: "Nexus",
          text: "",
        },
      ]);
      if (!messageOverride) setComposer("");
      setAttachments([]);
      setStreaming(true);

      // A hung request must never brick the dock: abort after 3 minutes so
      // `finally` re-enables send and the user sees an honest error turn.
      const abort = new AbortController();
      const hangTimer = setTimeout(() => abort.abort(), 180_000);

      try {
        const conversationHistory = turnsRef.current
          .filter(
            (t) =>
              t.role === "user" ||
              (t.role === "assistant" && t.text.trim().length > 0),
          )
          .map((t) => ({ role: t.role, content: t.text }));

        const res = await fetch("/api/chat/agent", {
          method: "POST",
          signal: abort.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: fullMessage,
            tenantName: move.tenant.name,
            agentName: "Nexus",
            surface: `strategic-moves-workspace`,
            conversationHistory,
            surfaceContext: {
              moveId: move.id,
              phase: phaseNum,
              moveDisplayCode: move.displayCode,
              moveName: move.name,
              phaseLabel: config.label,
              attachmentIds: doneAttachments
                .map((a) => a.attachmentId)
                .filter(Boolean),
            },
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Agent returned ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let pendingBuffer = "";
        let committedVisible = "";
        const seenArtifacts = new Set<string>();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingBuffer += decoder.decode(value, { stream: true });
          const { visibleText, artifacts, remaining } =
            extractArtifacts(pendingBuffer);
          committedVisible += visibleText;
          pendingBuffer = remaining;

          for (const a of artifacts) {
            const key = JSON.stringify(a);
            if (!seenArtifacts.has(key)) {
              seenArtifacts.add(key);
              // Future: handle phase-specific artifacts (gate-update, etc.)
            }
          }

          const responseSurface = `/strategic-moves/${move.id}/phase/${phaseNum}`;
          const display = shapeStreamingAgentTextForSurface(
            responseSurface,
            committedVisible + visibleArtifactPendingText(pendingBuffer),
          ).trimEnd();
          updateTurns((prev) =>
            prev.map((t) =>
              t.id === assistantTurnId ? { ...t, text: display } : t,
            ),
          );
        }

        // Flush remaining buffer
        if (pendingBuffer.length > 0) {
          const final = extractArtifacts(pendingBuffer);
          committedVisible +=
            final.visibleText +
            (final.remaining.length > 0
              ? visibleArtifactPendingText(final.remaining)
              : "");
        }

        updateTurns((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId
              ? {
                  ...t,
                  text: shapeAgentResponseForSurface(
                    `/strategic-moves/${move.id}/phase/${phaseNum}`,
                    committedVisible,
                  ),
                }
              : t,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Agent error";
        updateTurns((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId
              ? {
                  ...t,
                  text: `I encountered an issue: ${msg}. Please try again.`,
                }
              : t,
          ),
        );
      } finally {
        clearTimeout(hangTimer);
        setStreaming(false);
      }
    },
    [
      composer,
      streaming,
      attachments,
      move,
      phaseNum,
      config.label,
      updateTurns,
    ],
  );

  const hardGateCount = gateItemsWithStatus.filter(
    (g) => g.severity === "hard",
  ).length;
  const hardGateDone = gateItemsWithStatus.filter(
    (g) => g.severity === "hard" && g.completed,
  ).length;
  const totalGateDone = gateItemsWithStatus.filter((g) => g.completed).length;

  // ── Progressive disclosure: derived capture state + auto-expand machine ────
  const capturedSections = canvasSections.map((section) => ({
    section,
    content: sectionCapturedContent(move, section.id),
  }));
  const filledCount = capturedSections.filter((c) => c.content !== null).length;
  const firstUnfilled =
    capturedSections.find((c) => c.content === null)?.section ?? null;
  const capturesIncomplete =
    canvasSections.length > 0 && filledCount < canvasSections.length;
  const hardGapCount =
    isCurrentPhase && readiness ? readiness.hardGaps.length : 0;

  // One state machine drives both the next-action strip and the auto-expand:
  // captures incomplete → CAPTURE; else hard gaps → READINESS; else GENERATE.
  const autoOpenPanel: PanelKey = capturesIncomplete
    ? "capture"
    : hardGapCount > 0
      ? "readiness"
      : "generate";
  const nextActionText = firstUnfilled
    ? `Next: work with Ava to capture — ${firstUnfilled.label}`
    : hardGapCount > 0
      ? `Next: upload evidence — ${hardGapCount} hard gap${
          hardGapCount > 1 ? "s" : ""
        } block${hardGapCount === 1 ? "s" : ""} the charter`
      : "Next: generate the phase deliverable, sign it off, then approve the gate";

  const [openPanels, setOpenPanels] = useState<
    Partial<Record<PanelKey, boolean>>
  >(() => ({ [autoOpenPanel]: true }));
  const isPanelOpen = (key: PanelKey) => openPanels[key] ?? false;
  const setPanelOpen = useCallback(
    (key: PanelKey, open: boolean) =>
      setOpenPanels((prev) =>
        (prev[key] ?? false) === open ? prev : { ...prev, [key]: open },
      ),
    [],
  );

  // Per-capture-card expansion (default open inside the CAPTURE panel).
  const [openCaptureCards, setOpenCaptureCards] = useState<
    Record<string, boolean>
  >({});
  const isCaptureCardOpen = (id: string) => openCaptureCards[id] ?? true;

  // Chip click: open the CAPTURE panel, expand that card, scroll to it.
  const focusCaptureSection = useCallback(
    (sectionId: string) => {
      setPanelOpen("capture", true);
      setOpenCaptureCards((prev) => ({ ...prev, [sectionId]: true }));
      requestAnimationFrame(() => {
        document
          .getElementById(`ws-canvas-p${phaseNum}-${sectionId}-panel`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    },
    [phaseNum, setPanelOpen],
  );

  const phaseArtifactCount = move.deliverables.filter((d) =>
    deliverableBelongsToPhase(
      d.typeKey,
      phaseNum,
      PHASE_CANONICAL_KEYS[phaseNum],
    ),
  ).length;
  const knownSoFarItems = [
    `Use case: ${move.name}`,
    `Sponsor: ${move.sponsor?.name ?? "Unassigned"}`,
    `Capture: ${filledCount} of ${canvasSections.length} inputs saved`,
    `Artifacts: ${phaseArtifactCount} phase artifact${phaseArtifactCount === 1 ? "" : "s"} on file`,
    gateItemsWithStatus.length > 0
      ? `Gate: ${totalGateDone} of ${gateItemsWithStatus.length} criteria met`
      : "Gate: no active outgoing gate on this viewed phase",
  ];

  return (
    <div id={`ws-phase-p${phaseNum}-page`} className={styles.page}>
      {/* Phase context bar */}
      <div
        id={`ws-phase-p${phaseNum}-context-bar`}
        className={styles.originContextBar}
      >
        <div className={styles.originContextLeft}>
          <span className={styles.originBranch} aria-hidden>
            &#8627;
          </span>
          <span className={styles.originLabel}>{move.displayCode}</span>
          <span className={styles.originDraftBadge}>{config.shortLabel}</span>
        </div>
        <Link
          className={styles.originCancel}
          href={`/strategic-moves/${move.id}`}
        >
          &#8592; Back to overview
        </Link>
      </div>

      {/* Two-pane shell */}
      <section id={`ws-phase-p${phaseNum}-grid`} className={styles.detailShell}>
        {/* Chat pane */}
        <aside id={`ws-chat-p${phaseNum}`} className={styles.chatPane}>
          <div className={styles.chatHead}>
            <div className={styles.agentRow}>
              <div className={styles.agentAvatar} aria-hidden>
                &#10022;
              </div>
              <div>
                <div className={styles.agentName}>Ava</div>
                <div className={styles.agentStatus}>
                  <span className={styles.agentStatusDot} aria-hidden />
                  {move.displayCode} &middot; {config.shortLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Chat thread */}
          <div
            id={`ws-chat-p${phaseNum}-thread`}
            className={styles.chatThread}
            ref={threadRef}
          >
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={
                  turn.role === "assistant"
                    ? styles.bubbleNexus
                    : styles.bubbleUser
                }
              >
                {turn.role === "assistant" && turn.text ? (
                  <AgentMarkdown text={turn.text} />
                ) : (
                  turn.text ||
                  (streaming && turn.role === "assistant" ? "…" : "")
                )}
              </div>
            ))}
          </div>

          {/* Suggested prompts */}
          <div className={styles.startFromBlock}>
            <div className={styles.suggestedPrompts}>
              {config.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className={styles.promptChip}
                  type="button"
                  onClick={() => void send(prompt)}
                  disabled={streaming}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat input */}
          <div id={`ws-chat-p${phaseNum}-input`} className={styles.chatInput}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.json"
              style={{ display: "none" }}
              onChange={(e) => void handleFileSelect(e)}
            />
            {attachments.length > 0 && (
              <div className={styles.attachmentStrip}>
                {attachments.map((a) => (
                  <span
                    key={a.id}
                    className={`${styles.attachmentChip} ${
                      a.status === "done"
                        ? styles.attachmentChipDone
                        : a.status === "error"
                          ? styles.attachmentChipError
                          : ""
                    }`}
                    title={
                      a.status === "error"
                        ? (a.errorMsg ?? "upload failed")
                        : a.name
                    }
                  >
                    {a.status === "uploading"
                      ? "⏳"
                      : a.status === "done"
                        ? "✓"
                        : "✗"}{" "}
                    {a.name}
                  </span>
                ))}
              </div>
            )}
            <div className={styles.inputRow}>
              <button
                className={styles.uploadBtn}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={streaming}
                aria-label="Attach file"
                title="Attach file"
              >
                &#x1F4CE;
              </button>
              <AvaAskMark className={styles.avaComposerMark} />
              <textarea
                id={`ws-chat-p${phaseNum}-input-field`}
                rows={1}
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={
                  streaming
                    ? "Ava is responding… you can type your next message"
                    : `Ask Ava about ${move.displayCode} ${config.label}…`
                }
                spellCheck
              />
              <button
                id={`ws-chat-p${phaseNum}-send-btn`}
                className={styles.sendBtn}
                type="button"
                onClick={() => void send()}
                disabled={streaming || !composer.trim()}
                aria-label="Send"
              >
                &#8593;
              </button>
            </div>
          </div>
        </aside>

        {/* Canvas pane */}
        <article id={`ws-canvas-p${phaseNum}`} className={styles.rightPane}>
          {/* Canvas head */}
          <div className={styles.detailHead}>
            <div className={styles.detailHeadTop}>
              <div className={styles.detailHeadLeft}>
                <div className={styles.detailBreadcrumb}>
                  <Link className={styles.detailCrumb} href="/strategic-moves">
                    Strategic Moves
                  </Link>
                  <span aria-hidden>&rsaquo;</span>
                  <span>{move.tenant.name}</span>
                  <span aria-hidden>&rsaquo;</span>
                  <Link
                    className={styles.detailCrumb}
                    href={`/strategic-moves/${move.id}`}
                  >
                    {move.displayCode}
                  </Link>
                  <span aria-hidden>&rsaquo;</span>
                  <span>{config.label}</span>
                </div>
                <h1 className={styles.detailTitle}>{move.name}</h1>
                <div className={styles.detailId}>
                  {move.archetype} &middot; {config.label} &middot; Sponsor:{" "}
                  {(move.sponsor?.name ?? "Unassigned").toUpperCase()}
                </div>
              </div>
            </div>
            <PhaseRail current={phaseNum} status={move.statusColor} />
          </div>

          {/* Canvas body */}
          <div className={styles.detailBody}>
            {/* Capture tracker — one chip per capture slot of this phase */}
            {canvasSections.length > 0 && (
              <div
                id={`ws-canvas-p${phaseNum}-capture-tracker`}
                className={styles.captureTracker}
              >
                <div className={styles.captureTrackerHead}>
                  P{phaseNum} capture &mdash; {filledCount} of{" "}
                  {canvasSections.length}
                </div>
                <div className={styles.captureChipRow}>
                  {capturedSections.map(({ section, content }) => (
                    <button
                      key={section.id}
                      id={`ws-canvas-p${phaseNum}-capture-chip-${section.id}`}
                      type="button"
                      className={`${styles.captureChip} ${
                        content !== null ? styles.captureChipFilled : ""
                      }`}
                      aria-pressed={
                        isCaptureCardOpen(section.id) && isPanelOpen("capture")
                      }
                      onClick={() => focusCaptureSection(section.id)}
                    >
                      {content !== null ? "✓ " : ""}
                      {section.label}
                    </button>
                  ))}
                </div>
                {/* Next-action strip — same state machine as the auto-expand */}
                <div
                  id={`ws-canvas-p${phaseNum}-next-action`}
                  className={styles.nextActionStrip}
                >
                  {nextActionText}
                </div>
              </div>
            )}

            <section
              id={`ws-canvas-p${phaseNum}-solution-context`}
              className={styles.detailSection}
            >
              <div className={styles.detailSectionTitle}>
                What we know so far
              </div>
              <div className={styles.captureChipRow}>
                {knownSoFarItems.map((item) => (
                  <span
                    key={item}
                    className={`${styles.captureChip} ${styles.captureChipFilled}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>

            {/* Gate criteria panel */}
            <CollapsePanel
              id={`ws-canvas-p${phaseNum}-gate-collapse`}
              title="Gate criteria"
              meta={
                gateItemsWithStatus.length > 0
                  ? `— ${totalGateDone} of ${gateItemsWithStatus.length} met (${hardGateDone} of ${hardGateCount} hard)`
                  : undefined
              }
              open={isPanelOpen("gate")}
              onOpenChange={(open) => setPanelOpen("gate", open)}
            >
              <section
                id={`ws-canvas-p${phaseNum}-gate-panel`}
                className={styles.detailSection}
              >
                <div className={styles.detailSectionTitle}>
                  {config.label.toUpperCase()} &middot; Gate criteria
                  {gateItemsWithStatus.length > 0 && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontWeight: 400,
                        textTransform: "none",
                      }}
                    >
                      &mdash; {totalGateDone} of {gateItemsWithStatus.length}{" "}
                      met ({hardGateDone} of {hardGateCount} hard)
                    </span>
                  )}
                </div>
                {gateItemsWithStatus.length === 0 ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--abarva-stone)",
                      margin: 0,
                    }}
                  >
                    {isCurrentPhase
                      ? "No outgoing gate for this phase — there are no further gate criteria to evaluate."
                      : "Gate criteria are shown on the phase the Move is currently in."}
                  </p>
                ) : (
                  <ul
                    id={`ws-canvas-p${phaseNum}-gate-list`}
                    className={styles.critList}
                  >
                    {gateItemsWithStatus.map((item) => (
                      <li
                        key={item.id}
                        id={`ws-canvas-p${phaseNum}-gate-item-${item.id}`}
                      >
                        <span
                          className={`${styles.critCheck} ${item.completed ? styles.critCheckDone : ""}`}
                          aria-hidden
                        >
                          {item.completed ? "✓" : ""}
                        </span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {!item.verified && (
                          <span
                            style={{
                              fontSize: 9,
                              fontFamily: "var(--abarva-mono)",
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              fontWeight: 700,
                              color: "var(--abarva-stone)",
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            Not yet verified
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 9,
                            fontFamily: "var(--abarva-mono)",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            color:
                              item.severity === "hard"
                                ? "var(--canon-red)"
                                : "var(--abarva-stone)",
                            flexShrink: 0,
                            marginLeft: 8,
                          }}
                        >
                          {item.severity}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </CollapsePanel>

            {/* Current-state readiness panel (estate-derived instruments) */}
            {isCurrentPhase &&
              readiness &&
              readiness.instruments.length > 0 && (
                <CollapsePanel
                  id={`ws-canvas-p${phaseNum}-readiness-collapse`}
                  title="Current-state readiness"
                  meta={`— ${readiness.coverageScore}% collected${
                    hardGapCount > 0
                      ? ` · ${hardGapCount} hard gap${hardGapCount > 1 ? "s" : ""}`
                      : ""
                  }`}
                  open={isPanelOpen("readiness")}
                  onOpenChange={(open) => setPanelOpen("readiness", open)}
                >
                  <CurrentStateReadinessPanel
                    readiness={readiness}
                    programId={move.id}
                  />
                </CollapsePanel>
              )}

            {/* Where to start (estate-derived recommendation) */}
            {isCurrentPhase &&
              readiness &&
              recommendation &&
              recommendation.ranking.length > 0 && (
                <CollapsePanel
                  id={`ws-canvas-p${phaseNum}-where-to-start-collapse`}
                  title="Where to start"
                  open={isPanelOpen("start")}
                  onOpenChange={(open) => setPanelOpen("start", open)}
                >
                  <WhereToStartBlock recommendation={recommendation} />
                </CollapsePanel>
              )}

            {/* Indicative plan & cost */}
            {isCurrentPhase &&
              readiness &&
              plan &&
              plan.roadmap.phases.length > 0 && (
                <CollapsePanel
                  id={`ws-canvas-p${phaseNum}-plan-collapse`}
                  title="Indicative plan & cost"
                  open={isPanelOpen("plan")}
                  onOpenChange={(open) => setPanelOpen("plan", open)}
                >
                  <IndicativePlanBlock plan={plan} />
                </CollapsePanel>
              )}

            {/* Phase capture sections */}
            <CollapsePanel
              id={`ws-canvas-p${phaseNum}-capture-collapse`}
              title="Capture details"
              meta={
                canvasSections.length > 0
                  ? `— ${filledCount} of ${canvasSections.length} captured`
                  : undefined
              }
              open={isPanelOpen("capture")}
              onOpenChange={(open) => setPanelOpen("capture", open)}
            >
              {PHASE_WORKFLOW[phaseNum] && canvasSections.length > 0 ? (
                <CharterWorkflow
                  move={move}
                  phaseNum={phaseNum}
                  canvasSections={canvasSections}
                  capturedSections={capturedSections}
                  isCaptureCardOpen={isCaptureCardOpen}
                  setOpenCaptureCards={setOpenCaptureCards}
                />
              ) : (
                capturedSections.map(({ section, content }) => (
                  <section
                    key={section.id}
                    id={`ws-canvas-p${phaseNum}-${section.id}-panel`}
                    className={styles.detailSection}
                  >
                    <details
                      open={isCaptureCardOpen(section.id)}
                      onToggle={(e) => {
                        const isOpen = (e.currentTarget as HTMLDetailsElement)
                          .open;
                        setOpenCaptureCards((prev) =>
                          (prev[section.id] ?? true) === isOpen
                            ? prev
                            : { ...prev, [section.id]: isOpen },
                        );
                      }}
                    >
                      <summary className={styles.captureCardSummary}>
                        <span
                          className={styles.detailSectionTitle}
                          style={{ marginBottom: 0 }}
                        >
                          {section.label}
                        </span>
                        <span
                          className={
                            content !== null
                              ? styles.captureBadgeDone
                              : styles.captureBadgePending
                          }
                        >
                          {content !== null ? "✓ Captured" : "Not captured"}
                        </span>
                      </summary>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--abarva-slate)",
                          fontStyle: "italic",
                          lineHeight: 1.5,
                          padding: "4px 0 2px",
                        }}
                      >
                        {section.placeholder}
                      </div>
                      {content !== null ? (
                        <div className={styles.captureContent}>{content}</div>
                      ) : (
                        <div
                          style={{
                            marginTop: 8,
                            padding: "8px 10px",
                            borderRadius: 6,
                            background: "rgba(0,102,204,0.04)",
                            border: "1px dashed rgba(0,102,204,0.18)",
                            fontSize: 12,
                            color: "var(--abarva-slate)",
                          }}
                        >
                          Work with Ava in the chat pane to populate this
                          section.
                        </div>
                      )}
                    </details>
                  </section>
                ))
              )}
            </CollapsePanel>

            {/* Generate & documents */}
            <CollapsePanel
              id={`ws-canvas-p${phaseNum}-generate-collapse`}
              title="Generate & documents"
              open={isPanelOpen("generate")}
              onOpenChange={(open) => setPanelOpen("generate", open)}
            >
              {/* Grounded deliverable draft (P1 Charter) */}
              {isCurrentPhase && phaseNum === 1 && (
                <DeliverableArtifactCard programId={move.id} />
              )}

              {/* Generate full package */}
              <section
                id={`ws-canvas-p${phaseNum}-generate`}
                className={styles.detailSection}
              >
                <div className={styles.detailSectionTitle}>
                  Generate full package
                </div>
                {PHASE_WORKFLOW[phaseNum] && canvasSections.length > 0 && (
                  <div className={styles.charterAdvancedNote}>
                    Manual / advanced path — the gated Save → Approve → Generate
                    sequence above is the primary route.
                  </div>
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--abarva-slate)",
                    marginBottom: 10,
                    lineHeight: 1.5,
                  }}
                >
                  Approve &amp; Build assembles all available context —
                  engagement data, prior-phase deliverables, client segments,
                  matched patterns, and phase methodology — and builds every{" "}
                  {config.label} deliverable in one governed batch. Saves to the
                  Evidence Hub.
                </div>
                <MoveEvidenceNeedsPanel
                  packets={evidenceNeedPackets}
                  title="What We Need Before This Package Is Final"
                  compact
                />
                <div
                  data-testid="moves-review-feedback-loop"
                  style={{
                    marginBottom: 10,
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(27,43,92,0.14)",
                    background: "rgba(27,43,92,0.04)",
                    fontSize: 12,
                    color: "var(--abarva-slate)",
                    lineHeight: 1.45,
                  }}
                >
                  <strong>Review feedback loop:</strong>{" "}
                  {reviewFeedbackCount > 0
                    ? `${reviewFeedbackCount} requested edit${
                        reviewFeedbackCount === 1 ? "" : "s"
                      } parsed from uploaded review files. Re-run this phase to create the next artifact version with the approved changes.`
                    : "Upload client comments or review notes with the paperclip. AbarVa will extract requested edits, show them here, and the next phase run becomes the regenerated version."}
                </div>
                <PhaseApproveAndBuild
                  moveId={move.id}
                  phaseNum={phaseNum}
                  phaseLabel={config.label}
                  archetype={move.archetype}
                  moveName={move.name}
                  clientDisplayName={move.tenant.name}
                  evidenceNeedPackets={evidenceNeedPackets}
                />
              </section>
            </CollapsePanel>

            {/* Artifact shelf */}
            <CollapsePanel
              id={`ws-canvas-p${phaseNum}-artifacts-collapse`}
              title="Artifacts"
              meta={`— ${phaseArtifactCount}`}
              open={isPanelOpen("artifacts")}
              onOpenChange={(open) => setPanelOpen("artifacts", open)}
            >
              <section
                id={`ws-canvas-p${phaseNum}-artifact-shelf`}
                className={styles.detailSection}
              >
                <div className={styles.detailSectionTitle}>
                  {config.label} &middot; Artifacts
                </div>
                {move.deliverables.filter((d) =>
                  deliverableBelongsToPhase(
                    d.typeKey,
                    phaseNum,
                    PHASE_CANONICAL_KEYS[phaseNum],
                  ),
                ).length === 0 ? (
                  <div
                    id={`ws-canvas-p${phaseNum}-artifact-empty-state`}
                    style={{
                      fontSize: 13,
                      color: "var(--abarva-slate)",
                      fontStyle: "italic",
                      padding: "4px 0",
                    }}
                  >
                    No {config.label} artifacts yet. Ava will generate artifacts
                    as you work through the phase steps.
                  </div>
                ) : (
                  <div className={styles.evidenceList}>
                    {move.deliverables
                      .filter((d) =>
                        deliverableBelongsToPhase(
                          d.typeKey,
                          phaseNum,
                          PHASE_CANONICAL_KEYS[phaseNum],
                        ),
                      )
                      .map((deliverable) => (
                        <a
                          key={deliverable.id}
                          className={styles.evItem}
                          href={deliverable.url}
                        >
                          <span className={styles.evNum}>
                            {deliverable.typeKey}
                          </span>
                          <span className={styles.evText}>
                            {deliverable.title}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontFamily: "var(--abarva-mono)",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              fontWeight: 700,
                              color:
                                deliverable.status === "signed"
                                  ? "var(--canon-teal)"
                                  : "var(--abarva-stone)",
                              flexShrink: 0,
                            }}
                          >
                            {deliverable.status}
                          </span>
                          <span className={styles.evLink} aria-hidden>
                            &#8599;
                          </span>
                        </a>
                      ))}
                  </div>
                )}
              </section>
            </CollapsePanel>
          </div>
        </article>
      </section>
    </div>
  );
}

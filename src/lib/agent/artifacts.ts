// Agent streaming artifacts · Surface 1 PR2 of Programs Strict Completion v1.2
//
// Reactive workspace channel: agents emit structured artifacts inline
// with their text response so the right pane can materialize without
// the chat dumping pattern IDs, JSON, or other noise into the prose.
//
// Sentinel grammar:
//   [[artifact:<type>]]<JSON-payload>[[/artifact]]
//
// The opening sentinel names the artifact type; the closing sentinel
// makes the parser tolerant of newlines / brackets / quotes inside the
// JSON. Both sentinels are stripped from the visible text by the chat
// client; only the JSON payload is dispatched to the workspace.
//
// Per kickoff §0 dimension 2: "the right pane materializes the agent's
// reasoning as it happens. No static dashboards next to active
// conversations. Structured artifacts assemble in real-time as the
// agent reasons."

// EXPORT-4 · type-only import of the exports taxonomy. Artifacts.ts
// stays runtime-pure (the import erases at compile time) and the
// `deliverable-ready` artifact carries kind/format strings the
// renderer round-trip already validated.
import type {
  DeliverableFormat,
  DeliverableKind,
} from '@/lib/programs/exports/types';

export type ArtifactType =
  | 'brief-field' // {field: 'programName' | 'problemStatement' | …, value: string}
  | 'pattern-match' // {patternId, name, summary, successRatePct?, deploymentCount?, typicalDurationMonths?}
  | 'cross-program-dependency' // {programId, programName, currentPhase}
  | 'classification' // {archetype, archetypeLabel, confidence?}
  // Surface 2 — program-detail artifacts. Nexus reasons live; the right
  // pane materializes that reasoning via these structured cards
  // alongside (and eventually instead of) the static dashboard.
  | 'gate-evaluation' // {gate, status, detail?, reasoning?}
  | 'evidence-highlight' // {evidenceId, label, reason}
  | 'phase-recommendation' // {phase, recommendation, blockers?, nextActions?}
  | 'program-focus' // {programId, name, currentPhase} — Nexus shifts focus to a program
  // Surface 2 PR-B — phase-pack visibility. Nexus emits these based on
  // its conversational read of the chat (not from DB queries) so the
  // user sees doctrine being applied in real time. Packs remain static
  // doctrine; the runtime evidence-evaluation layer is deferred to the
  // future knowledge-broker work.
  | 'phase-progress' // {evidenceItemId, label, severity, status, detail?}
  | 'anti-pattern-flag' // {antiPatternId, label, detectedSignal, whatToFlag, mitigation}
  // Surface 2 PR-G' (Wave 2) · question-resolution tracking. Phase
  // packs declare rightQuestions sequenced open / converge / close.
  // When the conversation resolves a question, Nexus emits this
  // artifact; the panel renders a checkmark card and (more importantly)
  // the conversation history shows the resolution so future turns
  // don't re-ask the same opener. Closes the "Nexus repeats itself"
  // observation from the surface-area doc §2 horizontal track.
  | 'question-resolved' // {questionId, questionText, resolutionSummary?}
  // PR-Q (Wave 2 polish, founder feedback) · navigation tool.
  // When the user wants to be taken somewhere — to a phase module,
  // to /programs/new for origination, to a specific program —
  // the navigate_to tool emits this artifact via ctx.writer.
  // AtlasPageStateProvider intercepts it post-stream and calls
  // router.push(target). Same pattern as program-phase-changed →
  // router.refresh() (PR-L). Closes the founder feedback "Nexus
  // does not help me navigate to phase 1" by giving Nexus a real
  // navigation primitive instead of "I don't have a tool".
  | 'navigate-to' // {target, rationale?, replace?}
  // Surface 2 PR-L · emitted by the advance_phase tool (via ctx.writer)
  // after a successful gate evaluation + DB mutation. The client uses
  // this to refresh server data in place via router.refresh() — the
  // React tree (chat history, reactive panel, AtlasPageState) survives
  // the phase transition, so the user keeps the conversation across
  // P3 → P4 instead of starting from a blank Nexus on a reloaded page.
  | 'program-phase-changed' // {programId, fromPhase, toPhase, snapshotId?}
  // Surface 2 PR-INT-D · Sentinel-side knowledge artifacts. Sentinel
  // (the librarian agent) emits these on /intelligence to materialize
  // graph traversals + contradiction templates as cards in the
  // reactive knowledge pane.
  | 'graph-neighborhood' // {rootId, rootLabel, nodeCount, edgeCount, topEdges[]}
  | 'contradiction-flag' // {contradictionId, label, severity, partyA, partyB, detectionDescription, resolutionPath}
  // PR-SRC-D · Sentinel-on-Sourcing artifacts. These mirror the
  // Programs/Intelligence reactive-workspace channel while using
  // procurement-specific cards for vendor, pricing, contract, BAFO,
  // walkaway, and stage-pack reasoning.
  | 'vendor-card' // {vendorId, name, tier, positioning, riskFlags?, patternId?}
  | 'pricing-benchmark' // {category, metric, median, p25?, p75?, source, sampleSize?, patternId?}
  | 'contract-clause' // {clauseId, title, currentLanguage?, recommendedLanguage, leverage, patternId?}
  | 'bafo-scoreboard' // {vendors[], dimensions[], scoresMatrix, notes?}
  | 'walkaway-signal' // {credibility, reasoning, recommendation}
  | 'source-event-created' // {eventId, eventCode, eventName, lifecycleState, approvalAuthority, approvalUrl?}
  | 'sourcing-stage-progress' // {evidenceItemId, label, severity, status, detail?}
  | 'sourcing-stage-changed' // {eventId, fromStage, toStage, snapshotId?}
  // OV2-1a (founder feedback) · /programs/new right-pane content. Brief
  // fills in field-by-field; overlap alert fires when this new program
  // collides with an existing program in the tenant's portfolio.
  | 'brief-progress' // {fieldsTotal, fieldsFilled, fields: Array<{id,label,status,value?}>}
  | 'overlap-alert' // {overlappingProgramId, overlappingProgramName, overlappingProgramPhase?, overlapKind, overlapDetail}
  // OV2-FM-FLAG-ARTIFACT · top-level "I just flagged failure mode #N" card.
  // Anti-pattern flags are phase-local; this artifact ties a flag back to
  // the cross-cutting 10-failure-mode catalog so the platform's value-prop
  // (forced success-thinking against the 10) is visible per program AND
  // can be rolled up cross-program in telemetry per design doc Part E.5.
  | 'failure-mode-flagged' // {failureModeId, failureModeName, phase, detectedSignal, consequence, redirect, severity}
  // CB-6 · server-side artifact emitted by /api/chat/agent at the START
  // of the response stream. Carries the full ContextBundle that grounded
  // the agent's answer (Postgres facts + graph paths + Pinecone chunks
  // + corpus pattern hits + provenance + warnings). Surfaces consume
  // this to render the "Context Assembled" panel beside the answer.
  | 'context-bundle' // {bundle: ContextBundle}
  // EXPORT-4 · format-aware deliverable export. Emitted at the END of
  // a `compose_artifact` step once the agent has produced the spec.
  // The reactive panel renders a download chip; clicking it POSTs the
  // cached spec id to the export route, which renders + serves the
  // binary. The server-side compose helper stores the spec via
  // storeSpec() (lib/programs/exports/spec-cache.ts) and the agent
  // emits the returned id as the artifact's specId.
  | 'deliverable-ready' // {kind, format, title, exportUrl, programId, specId?}
  // TD-7 · cross-program signal as a first-class artifact. Surfaces the
  // multi-program dependency / conflict / shared-resource constraints the
  // tenant-data layer carries (cross_program_signals records, mapped via
  // TD-4 into broker bundle items of kind 'cross_program_signal'). The
  // agent emits one of these proactively when reasoning surfaces a
  // dependency relevant to the user's question on /programs/<id>. Design
  // refs: PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md Part B.4 + E.5;
  // TENANT_DATA_INTEGRATION_DESIGN.md §7.
  | 'cross-program-signal'; // {signalId, title, programs[], severity, recommendation, sourceRecordId?}

// ── Strongly-typed artifact payloads ──────────────────────────────────────────

export interface BriefFieldArtifact {
  type: 'brief-field';
  field:
    | 'programName'
    | 'problemStatement'
    | 'targetOutcome'
    | 'timeline'
    | 'classification'
    | 'sponsor'
    | 'lead';
  value: string;
}

export interface PatternMatchArtifact {
  type: 'pattern-match';
  patternId: string;
  name: string;
  summary: string;
  successRatePct?: number;
  deploymentCount?: number;
  typicalDurationMonths?: number;
}

export interface CrossProgramDependencyArtifact {
  type: 'cross-program-dependency';
  programId: string;
  programName: string;
  currentPhase: string;
}

export interface ClassificationArtifact {
  type: 'classification';
  archetype: string;
  archetypeLabel: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface GateEvaluationArtifact {
  type: 'gate-evaluation';
  /** Short label or criterion name, e.g. "Build gate · privacy architecture sign-off". */
  gate: string;
  /** Current evaluation outcome. */
  status: 'met' | 'unmet' | 'pending' | 'blocked';
  /** Optional one-liner detail (what's needed / what's verified). */
  detail?: string;
  /** Optional Nexus reasoning narrative. */
  reasoning?: string;
}

export interface EvidenceHighlightArtifact {
  type: 'evidence-highlight';
  /** Stable id from the evidence map; the panel highlights the matching card. */
  evidenceId: string;
  /** Human label for when the id can't render (yet). */
  label?: string;
  /** Why Nexus is calling this out. */
  reason: string;
}

export interface PhaseRecommendationArtifact {
  type: 'phase-recommendation';
  /** Phase id the recommendation applies to (0..6). */
  phase: number;
  /** Nexus's recommended next move. */
  recommendation: string;
  /** Outstanding blockers preventing the next move. */
  blockers?: string[];
  /** Concrete next actions Nexus suggests. */
  nextActions?: string[];
}

export interface ProgramFocusArtifact {
  type: 'program-focus';
  programId: string;
  name: string;
  currentPhase: string;
}

/**
 * Phase-pack DoD progress card. Nexus emits one per evidence item it
 * has formed an opinion on during the conversation. The status is
 * Nexus's *conversational read* — not the result of a DB query — so
 * the value can be 'unknown' when the chat hasn't surfaced enough to
 * judge. The pack remains static doctrine; the future knowledge-broker
 * layer will compute these against real evidence tables.
 */
export interface PhaseProgressArtifact {
  type: 'phase-progress';
  /** Stable id from the active pack's definitionOfDone. */
  evidenceItemId: string;
  /** Human label from the pack — denormalized so the panel can render without re-resolving. */
  label: string;
  /** Mirrors the pack item's severity. */
  severity: 'hard' | 'soft';
  /** Nexus's conversational read of where this evidence stands. */
  status: 'met' | 'unmet' | 'unknown';
  /** Optional one-line elaboration on why Nexus reached this status. */
  detail?: string;
}

/**
 * Phase-pack anti-pattern flag. Nexus emits when conversation shows the
 * detectionHint signal. The mitigation field carries forward the pack's
 * redirect language so the panel can render a coherent "what to do next"
 * card without Nexus paraphrasing each time.
 */
export interface AntiPatternFlagArtifact {
  type: 'anti-pattern-flag';
  /** Stable id from the active pack's antiPatterns. */
  antiPatternId: string;
  /** Human label from the pack — e.g. "The Phantom Sponsor". */
  label: string;
  /** What Nexus saw that triggered the flag — usually a quote or paraphrase from chat. */
  detectedSignal: string;
  /** Mirrors the pack's whatToFlag — the consequence Nexus is naming. */
  whatToFlag: string;
  /** Mirrors the pack's mitigation — what to redirect toward. */
  mitigation: string;
}

/**
 * PR-L · emitted by the advance_phase tool after a successful gate
 * evaluation + DB mutation. ProgramDetailPage's onArtifact handler
 * uses this to call router.refresh() — the React tree survives, the
 * server-side phase data refreshes, and the chat thread persists
 * through P3 → P4 instead of being thrown away by a hard navigation.
 */
export interface ProgramPhaseChangedArtifact {
  type: 'program-phase-changed';
  programId: string;
  fromPhase: number;
  toPhase: number;
  /** Optional snapshot id from the advance mutation; useful for telemetry. */
  snapshotId?: string;
}

/**
 * PR-G' (Wave 2) · question-resolution tracking. Phase packs declare
 * `rightQuestions` (open / converge / close) — Nexus reads them at
 * every turn to know what to ask. Without resolution tracking, Nexus
 * re-asks the same opener two turns later because the prompt-side
 * doctrine has no signal that the user already answered.
 *
 * This artifact closes the loop: when Nexus determines a pack
 * question has been answered (the user supplied a satisfying answer
 * in the conversation), it emits one of these. The reactive panel
 * renders a checkmark card; more importantly, the conversation
 * history visibly preserves the resolution so the next turn's prompt
 * context shows Nexus that the question is closed.
 *
 * `questionId` matches the pack's right-question id (kebab-case,
 * unique within the pack). Panel dedupes by id so re-emits upsert.
 */
export interface QuestionResolvedArtifact {
  type: 'question-resolved';
  /** Stable id from the pack's rightQuestions (open / converge / close). */
  questionId: string;
  /** Verbatim or paraphrased question text — denormalized so the panel renders without re-resolving. */
  questionText: string;
  /** Optional one-line summary of how the user answered. Surfaces in the card. */
  resolutionSummary?: string;
}

/**
 * PR-Q · navigate-to artifact. Emitted by the navigate_to tool (or
 * directly by the agent's text stream when the chat surface registers
 * the tool). The AtlasPageStateProvider intercepts these post-stream
 * and calls router.push(target) — same pattern as
 * program-phase-changed → router.refresh() in PR-L.
 *
 * `target` is a relative path (`/programs/new`, `/programs/<id>`,
 * `/programs/<id>/report`). Absolute URLs are rejected at parse time
 * to prevent agents from redirecting users off-app.
 *
 * `replace` defaults to false (history.push). Set true for
 * "consolidating" navigations like origination → active program where
 * the prior URL shouldn't survive a back-button press.
 */
export interface NavigateToArtifact {
  type: 'navigate-to';
  target: string;
  rationale?: string;
  replace?: boolean;
}

/**
 * PR-INT-D · graph-neighborhood card. Sentinel emits one when it
 * walks the pattern graph (pattern_neighborhood tool, future broker
 * graph traversal). The card renders a compact hub-and-spoke or
 * ASCII-edge layout; topEdges is capped at 8 in the renderer to keep
 * the card under ~200px tall even on noisy patterns. nodeCount /
 * edgeCount carry the full traversal scope so the agent can narrate
 * "(showing 8 of 23 neighbors)" without re-counting.
 */
export interface GraphNeighborhoodArtifact {
  type: 'graph-neighborhood';
  rootId: string;
  rootLabel: string;
  nodeCount: number;
  edgeCount: number;
  /** Top edges, max 8 in the card; the bundle has more available. */
  topEdges: Array<{
    targetId: string;
    targetLabel: string;
    edgeType: 'co_applies_with' | 'contradicts' | 'depends_on' | 'precedes';
  }>;
}

/**
 * PR-INT-D · contradiction-flag card. Reuses the shape of
 * ContradictionTemplate from src/lib/intelligence/seed-types.ts so
 * pack/broker contradiction templates flow through unchanged. PR-INT-E's
 * validate_synthesis tool emits one of these when a synthesis text
 * triggers a contradiction; future cross-agent relays (Wave 2) can
 * also emit them when Sentinel finds a Vendor-vs-measured-reality
 * mismatch in evidence.
 */
export interface ContradictionFlagArtifact {
  type: 'contradiction-flag';
  contradictionId: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  partyA: string;
  partyB: string;
  detectionDescription: string;
  resolutionPath: string;
}

export interface VendorCardArtifact {
  type: 'vendor-card';
  vendorId: string;
  name: string;
  tier: 'enterprise' | 'mid-market' | 'specialist' | 'emerging' | 'incumbent';
  positioning: string;
  riskFlags?: string[];
  patternId?: string;
}

export interface PricingBenchmarkArtifact {
  type: 'pricing-benchmark';
  category: string;
  metric: string;
  median: number;
  p25?: number;
  p75?: number;
  source: string;
  sampleSize?: number;
  patternId?: string;
}

export interface ContractClauseArtifact {
  type: 'contract-clause';
  clauseId: string;
  title: string;
  currentLanguage?: string;
  recommendedLanguage: string;
  leverage: string;
  patternId?: string;
}

export interface BafoScoreboardArtifact {
  type: 'bafo-scoreboard';
  vendors: Array<{ vendorId: string; name: string }>;
  dimensions: Array<{ label: string; weight: number }>;
  scoresMatrix: number[][];
  notes?: string;
}

export interface WalkawaySignalArtifact {
  type: 'walkaway-signal';
  credibility: 'strong' | 'soft' | 'theatre';
  reasoning: string;
  recommendation: string;
}

export interface SourceEventCreatedArtifact {
  type: 'source-event-created';
  eventId: string;
  eventCode: string;
  eventName: string;
  lifecycleState: 'waiting_on_client' | 'active' | 'archived' | string;
  approvalAuthority: string;
  approvalUrl?: string;
}

export interface SourcingStageProgressArtifact {
  type: 'sourcing-stage-progress';
  evidenceItemId: string;
  label: string;
  severity: 'hard' | 'soft';
  status: 'met' | 'unmet' | 'unknown';
  detail?: string;
}

export interface SourcingStageChangedArtifact {
  type: 'sourcing-stage-changed';
  eventId: string;
  fromStage: number;
  toStage: number;
  snapshotId?: string;
}

// OV2-1a · /programs/new brief-builder progress card. Replaces the
// pattern-match cards on this surface (founder feedback: wrong content).
export interface BriefProgressArtifact {
  type: 'brief-progress';
  fieldsTotal: number;
  fieldsFilled: number;
  fields: Array<{
    id: string;
    label: string;
    status: 'empty' | 'partial' | 'filled';
    value?: string;
  }>;
}

// OV2-1a · overlap with existing tenant program (archetype/sponsor/system).
export interface OverlapAlertArtifact {
  type: 'overlap-alert';
  overlappingProgramId: string;
  overlappingProgramName: string;
  overlappingProgramPhase?: string;
  overlapKind: 'archetype' | 'sponsor' | 'system' | 'multiple';
  overlapDetail: string;
}

// CB-6 · context-bundle artifact. Type-only import so the server-only
// boundary on `@/lib/knowledge/context-broker` is preserved (the
// broker module imports `'server-only'` and would error if pulled
// into a client bundle, but type-only imports are erased at compile
// time and never traverse webpack's import graph).
import type { ContextBundle } from '@/lib/knowledge/context-broker';

export interface ContextBundleArtifact {
  type: 'context-bundle';
  /** The full assembled ContextBundle that grounded the agent's answer. */
  bundle: ContextBundle;
}

// OV2-FM-FLAG-ARTIFACT · top-level failure-mode flag.
export interface FailureModeFlaggedArtifact {
  type: 'failure-mode-flagged';
  /** 1..10, references FAILURE_MODES.id */
  failureModeId: number;
  /** Failure mode short name (denormalized so the panel renders without resolving). */
  failureModeName: string;
  /** Phase the flag was raised in (0..6). */
  phase: number;
  /** What the agent observed in chat or evidence that triggered this flag. */
  detectedSignal: string;
  /** What this means for the program if unaddressed (<= 1 sentence). */
  consequence: string;
  /** Recommended next move to address (<= 1 sentence). */
  redirect: string;
  /** Severity — 'soft' = note, 'hard' = blocks advance until resolved. */
  severity: 'soft' | 'hard';
}

// EXPORT-4 · format-aware deliverable export · download-chip card.
// Emitted at the end of a compose_artifact step once the agent has
// produced the deliverable's structured spec. The reactive panel
// renders a download chip; clicking it POSTs `{ specId }` to the
// `exportUrl` and the export route renders + serves the binary.
//
// `specId` is the opaque key returned by `storeSpec()` in
// lib/programs/exports/spec-cache.ts. It is OPTIONAL on the artifact
// shape itself so legacy emitters (or pre-cached re-emits) can still
// surface a download chip — the panel falls back to "open the export
// route" when no specId is present, leaving the user to click into
// the agent for a re-compose.
export interface DeliverableReadyArtifact {
  type: 'deliverable-ready';
  /** Deliverable kind discriminator. Mirrors the export taxonomy. */
  kind: DeliverableKind;
  /** Format the deliverable was rendered as. Mirrors the export taxonomy. */
  format: DeliverableFormat;
  /** Human-readable title shown on the download chip. */
  title: string;
  /**
   * Path-relative download URL the chip POSTs to. Always rooted at
   * `/api/programs/{programId}/deliverables/{kind}/export`. Stored on
   * the artifact (vs derived in the panel) so the panel doesn't have
   * to know URL routing — the agent owns the URL shape.
   */
  exportUrl: string;
  /** Program id the deliverable belongs to. */
  programId: string;
  /**
   * Spec id from the in-memory cache (`storeSpec` return value). When
   * present, the chip POSTs `{ specId }` and the route resolves the
   * cached spec. Optional so the artifact still parses if the agent
   * is on the inline-spec path.
   */
  specId?: string;
}

/**
 * TD-7 · cross-program-signal artifact. Surfaces a tenant-data
 * `cross_program_signal` (a multi-program dependency, conflict, or
 * shared-resource constraint) as a first-class artifact card on
 * /programs/<id>. The signal MUST be grounded in the broker bundle's
 * cross_program_signal items — the agent does not invent these. The
 * canonical fields (signalId, title, programs, severity, recommendation)
 * mirror the persisted record so the panel can render and the rollup
 * (design doc Part E.5) can aggregate by signalId without re-resolution.
 */
export interface CrossProgramSignalArtifact {
  type: 'cross-program-signal';
  /** Stable signal id from data_inventory_records.record_id (e.g. `cross_program_signals:xprog:apex:001`). */
  signalId: string;
  /** Human-readable title — e.g. "Priya Iyer leads two critical-path programs simultaneously". */
  title: string;
  /** Programs implicated. Array of program ids/codes (e.g. ['apex-cdp-2026', 'apex-cc-ai-2026']). */
  programs: string[];
  /** Severity drives the panel's left-edge stripe color. */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Concrete next move — what to do about the signal. */
  recommendation: string;
  /** Optional source-of-truth pointer back to the persisted layer (typically the same as signalId). */
  sourceRecordId?: string;
}

export type Artifact =
  | BriefFieldArtifact
  | PatternMatchArtifact
  | CrossProgramDependencyArtifact
  | ClassificationArtifact
  | GateEvaluationArtifact
  | EvidenceHighlightArtifact
  | PhaseRecommendationArtifact
  | ProgramFocusArtifact
  | PhaseProgressArtifact
  | AntiPatternFlagArtifact
  | ProgramPhaseChangedArtifact
  | QuestionResolvedArtifact
  | NavigateToArtifact
  | GraphNeighborhoodArtifact
  | ContradictionFlagArtifact
  | VendorCardArtifact
  | PricingBenchmarkArtifact
  | ContractClauseArtifact
  | BafoScoreboardArtifact
  | WalkawaySignalArtifact
  | SourceEventCreatedArtifact
  | SourcingStageProgressArtifact
  | SourcingStageChangedArtifact
  | BriefProgressArtifact
  | OverlapAlertArtifact
  | FailureModeFlaggedArtifact
  | ContextBundleArtifact
  | DeliverableReadyArtifact
  | CrossProgramSignalArtifact;

// ── Parser ────────────────────────────────────────────────────────────────────
//
// Caller pattern: pass the accumulated streamed text through
// `extractArtifacts(buffer)` after each chunk. The function returns
//   { visibleText, artifacts, remaining }
// where `visibleText` is the text the chat should render (artifacts
// stripped), `artifacts` is the array of parsed artifacts, and
// `remaining` is the unparsed tail (which the caller carries forward
// for the next chunk so a sentinel split across chunks resolves cleanly).

const OPEN_SENTINEL = /\[\[artifact:([a-z-]+)\]\]/;
const CLOSE_SENTINEL = '[[/artifact]]';

export interface ExtractResult {
  /** Text with artifact tuples removed — what the chat should render. */
  visibleText: string;
  /** Successfully parsed artifacts in order of appearance. */
  artifacts: Artifact[];
  /**
   * Tail of the input that may contain a partial artifact (open sentinel
   * found but no close yet). The caller carries this forward to the next
   * chunk and feeds it back through `extractArtifacts` so streaming
   * artifacts resolve cleanly without blocking on chunk boundaries.
   */
  remaining: string;
}

export function sanitizeArtifactDebugText(text: string): string {
  return text
    .replace(/\[\[artifact:[a-z-]+ parse-failed\]\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trimStart();
}

export function visibleArtifactPendingText(pending: string): string {
  if (
    pending.includes('[[artifact:') ||
    pending.includes('[[/artifact') ||
    isPartialOpenSentinel(pending)
  ) {
    return '';
  }
  return sanitizeArtifactDebugText(pending);
}

export function stripArtifactsForDisplay(text: string): string {
  const parsed = extractArtifacts(text);
  return sanitizeArtifactDebugText(
    parsed.visibleText + visibleArtifactPendingText(parsed.remaining),
  );
}

export function isKnownArtifactType(type: string): type is ArtifactType {
  return (
    type === 'brief-field' ||
    type === 'pattern-match' ||
    type === 'cross-program-dependency' ||
    type === 'classification' ||
    type === 'gate-evaluation' ||
    type === 'evidence-highlight' ||
    type === 'phase-recommendation' ||
    type === 'program-focus' ||
    type === 'phase-progress' ||
    type === 'anti-pattern-flag' ||
    type === 'program-phase-changed' ||
    type === 'question-resolved' ||
    type === 'navigate-to' ||
    type === 'graph-neighborhood' ||
    type === 'contradiction-flag' ||
    type === 'vendor-card' ||
    type === 'pricing-benchmark' ||
    type === 'contract-clause' ||
    type === 'bafo-scoreboard' ||
    type === 'walkaway-signal' ||
    type === 'source-event-created' ||
    type === 'sourcing-stage-progress' ||
    type === 'sourcing-stage-changed' ||
    type === 'brief-progress' ||
    type === 'overlap-alert' ||
    type === 'failure-mode-flagged' ||
    type === 'context-bundle' ||
    type === 'deliverable-ready' ||
    type === 'cross-program-signal'
  );
}

/**
 * Heuristic check: does `tail` look like the start of an open sentinel
 * (`[[artifact:type]]`) that hasn't fully streamed in yet? Used by
 * `extractArtifacts` to defer partial opens to the next chunk instead
 * of committing them as visible text. This was the bug behind the
 * `[[artifact:brief-fie` raw-tuple regression in production: the open
 * sentinel got split across stream chunks and the parser flushed the
 * partial as visible.
 */
function isPartialOpenSentinel(tail: string): boolean {
  // Possible legitimate prefixes of `[[artifact:foo-bar]]`:
  //   `[`, `[[`, `[[a`, `[[ar`, …, `[[artifact`, `[[artifact:`,
  //   `[[artifact:f`, `[[artifact:foo`, `[[artifact:foo-`, etc.
  // Permissive regex that matches any of these prefixes anchored at end.
  return /^\[(?:\[(?:a(?:r(?:t(?:i(?:f(?:a(?:c(?:t(?::[a-z-]*)?)?)?)?)?)?)?)?)?)?$/.test(tail);
}

/**
 * Same idea for the close sentinel `[[/artifact]]` — but the existing
 * "open found, close missing" branch already defers content via
 * `remaining`, so partial close inside an in-flight artifact is handled
 * naturally. This helper is here for future symmetry if the deferral
 * strategy changes.
 */

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item) => typeof item === 'string' && item.length > 0) as string[];
  return strings.length > 0 ? strings : undefined;
}

function isSourceStage(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 7;
}

function tryParseArtifact(type: string, json: string): Artifact | null {
  if (!isKnownArtifactType(type)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  // The agent may or may not include a `type` field in the payload; we
  // ignore it and stamp our own from the open sentinel so the typed
  // discriminated union holds.
  const obj = parsed as Record<string, unknown>;
  switch (type) {
    case 'brief-field': {
      const field = obj.field;
      const value = obj.value;
      if (typeof field !== 'string' || typeof value !== 'string') return null;
      const allowed: ReadonlySet<BriefFieldArtifact['field']> = new Set([
        'programName',
        'problemStatement',
        'targetOutcome',
        'timeline',
        'classification',
        'sponsor',
        'lead',
      ]);
      if (!allowed.has(field as BriefFieldArtifact['field'])) return null;
      return { type, field: field as BriefFieldArtifact['field'], value };
    }
    case 'pattern-match': {
      const patternId = obj.patternId;
      const name = obj.name;
      const summary = obj.summary;
      if (typeof patternId !== 'string' || typeof name !== 'string' || typeof summary !== 'string') {
        return null;
      }
      return {
        type,
        patternId,
        name,
        summary,
        successRatePct: typeof obj.successRatePct === 'number' ? obj.successRatePct : undefined,
        deploymentCount: typeof obj.deploymentCount === 'number' ? obj.deploymentCount : undefined,
        typicalDurationMonths:
          typeof obj.typicalDurationMonths === 'number' ? obj.typicalDurationMonths : undefined,
      };
    }
    case 'cross-program-dependency': {
      const programId = obj.programId;
      const programName = obj.programName;
      const currentPhase = obj.currentPhase;
      if (
        typeof programId !== 'string' ||
        typeof programName !== 'string' ||
        typeof currentPhase !== 'string'
      ) {
        return null;
      }
      return { type, programId, programName, currentPhase };
    }
    case 'classification': {
      // Permissive: agents emit different field names depending on
      // how they read the instruction layer. Accept any of the common
      // shapes (`archetype` / `archetypeLabel` / `name` / `label` /
      // `value`) and normalize to the canonical {archetype, archetypeLabel}.
      const pickStr = (...keys: string[]): string | null => {
        for (const k of keys) {
          const v = obj[k];
          if (typeof v === 'string' && v.trim().length > 0) return v;
        }
        return null;
      };
      // Strict-source archetype: only accept it as-is when the agent
      // gave it under the canonical `archetype` key. Otherwise we
      // synthesize from the label (uppercase + underscore-collapse).
      const strictArchetype = pickStr('archetype');
      const archetypeLabel = pickStr('archetypeLabel', 'label', 'name', 'value', 'archetype');
      if (!archetypeLabel && !strictArchetype) return null;
      const labelFinal = archetypeLabel ?? strictArchetype!;
      const archetype = strictArchetype
        ?? labelFinal.toUpperCase().replace(/\s+/g, '_');
      const confidence = obj.confidence;
      const validConfidence =
        confidence === 'high' || confidence === 'medium' || confidence === 'low'
          ? confidence
          : undefined;
      return { type, archetype, archetypeLabel: labelFinal, confidence: validConfidence };
    }
    case 'gate-evaluation': {
      const gate = obj.gate;
      const status = obj.status;
      if (typeof gate !== 'string' || gate.trim().length === 0) return null;
      const validStatus =
        status === 'met' || status === 'unmet' || status === 'pending' || status === 'blocked'
          ? status
          : null;
      if (!validStatus) return null;
      return {
        type,
        gate,
        status: validStatus,
        detail: typeof obj.detail === 'string' ? obj.detail : undefined,
        reasoning: typeof obj.reasoning === 'string' ? obj.reasoning : undefined,
      };
    }
    case 'evidence-highlight': {
      const evidenceId = obj.evidenceId;
      const reason = obj.reason;
      if (typeof evidenceId !== 'string' || typeof reason !== 'string') return null;
      return {
        type,
        evidenceId,
        reason,
        label: typeof obj.label === 'string' ? obj.label : undefined,
      };
    }
    case 'phase-recommendation': {
      const phase = obj.phase;
      const recommendation = obj.recommendation;
      if (typeof phase !== 'number' || phase < 0 || phase > 6) return null;
      if (typeof recommendation !== 'string' || recommendation.trim().length === 0) return null;
      const blockers = Array.isArray(obj.blockers)
        ? (obj.blockers.filter((s) => typeof s === 'string') as string[])
        : undefined;
      const nextActions = Array.isArray(obj.nextActions)
        ? (obj.nextActions.filter((s) => typeof s === 'string') as string[])
        : undefined;
      return { type, phase, recommendation, blockers, nextActions };
    }
    case 'program-focus': {
      const programId = obj.programId;
      const name = obj.name;
      const currentPhase = obj.currentPhase;
      if (
        typeof programId !== 'string' ||
        typeof name !== 'string' ||
        typeof currentPhase !== 'string'
      ) {
        return null;
      }
      return { type, programId, name, currentPhase };
    }
    case 'phase-progress': {
      const evidenceItemId = obj.evidenceItemId;
      const label = obj.label;
      const severity = obj.severity;
      const status = obj.status;
      if (typeof evidenceItemId !== 'string' || evidenceItemId.length === 0) return null;
      if (typeof label !== 'string' || label.length === 0) return null;
      if (severity !== 'hard' && severity !== 'soft') return null;
      if (status !== 'met' && status !== 'unmet' && status !== 'unknown') return null;
      return {
        type,
        evidenceItemId,
        label,
        severity,
        status,
        detail: typeof obj.detail === 'string' && obj.detail.length > 0 ? obj.detail : undefined,
      };
    }
    case 'anti-pattern-flag': {
      const antiPatternId = obj.antiPatternId;
      const label = obj.label;
      const detectedSignal = obj.detectedSignal;
      const whatToFlag = obj.whatToFlag;
      const mitigation = obj.mitigation;
      if (typeof antiPatternId !== 'string' || antiPatternId.length === 0) return null;
      if (typeof label !== 'string' || label.length === 0) return null;
      if (typeof detectedSignal !== 'string' || detectedSignal.length === 0) return null;
      if (typeof whatToFlag !== 'string' || whatToFlag.length === 0) return null;
      if (typeof mitigation !== 'string' || mitigation.length === 0) return null;
      return { type, antiPatternId, label, detectedSignal, whatToFlag, mitigation };
    }
    case 'program-phase-changed': {
      const programId = obj.programId;
      const fromPhase = obj.fromPhase;
      const toPhase = obj.toPhase;
      if (typeof programId !== 'string' || programId.length === 0) return null;
      if (typeof fromPhase !== 'number' || fromPhase < 0 || fromPhase > 6) return null;
      if (typeof toPhase !== 'number' || toPhase < 0 || toPhase > 6) return null;
      const snapshotId =
        typeof obj.snapshotId === 'string' && obj.snapshotId.length > 0 ? obj.snapshotId : undefined;
      return { type, programId, fromPhase, toPhase, snapshotId };
    }
    case 'question-resolved': {
      const questionId = obj.questionId;
      const questionText = obj.questionText;
      if (typeof questionId !== 'string' || questionId.length === 0) return null;
      if (typeof questionText !== 'string' || questionText.length === 0) return null;
      const resolutionSummary =
        typeof obj.resolutionSummary === 'string' && obj.resolutionSummary.length > 0
          ? obj.resolutionSummary
          : undefined;
      return { type, questionId, questionText, resolutionSummary };
    }
    case 'navigate-to': {
      const target = obj.target;
      if (typeof target !== 'string' || target.length === 0) return null;
      // Reject absolute URLs to prevent agents redirecting off-app.
      // Relative paths only — must start with '/'.
      if (!target.startsWith('/')) return null;
      // Reject anything that looks like protocol-relative or
      // off-host, even with a leading slash.
      if (target.startsWith('//')) return null;
      const rationale =
        typeof obj.rationale === 'string' && obj.rationale.length > 0 ? obj.rationale : undefined;
      const replace = obj.replace === true;
      return { type, target, rationale, replace };
    }
    case 'graph-neighborhood': {
      const rootId = obj.rootId;
      const rootLabel = obj.rootLabel;
      const nodeCount = obj.nodeCount;
      const edgeCount = obj.edgeCount;
      const topEdgesRaw = obj.topEdges;
      if (typeof rootId !== 'string' || rootId.length === 0) return null;
      if (typeof rootLabel !== 'string' || rootLabel.length === 0) return null;
      if (typeof nodeCount !== 'number' || nodeCount < 0) return null;
      if (typeof edgeCount !== 'number' || edgeCount < 0) return null;
      if (!Array.isArray(topEdgesRaw)) return null;
      const topEdges: GraphNeighborhoodArtifact['topEdges'] = [];
      for (const raw of topEdgesRaw) {
        if (!raw || typeof raw !== 'object') continue;
        const edge = raw as Record<string, unknown>;
        const targetId = edge.targetId;
        const targetLabel = edge.targetLabel;
        const edgeType = edge.edgeType;
        if (typeof targetId !== 'string' || targetId.length === 0) continue;
        if (typeof targetLabel !== 'string' || targetLabel.length === 0) continue;
        if (
          edgeType !== 'co_applies_with' &&
          edgeType !== 'contradicts' &&
          edgeType !== 'depends_on' &&
          edgeType !== 'precedes'
        ) {
          continue;
        }
        topEdges.push({ targetId, targetLabel, edgeType });
      }
      return { type, rootId, rootLabel, nodeCount, edgeCount, topEdges };
    }
    case 'contradiction-flag': {
      const contradictionId = obj.contradictionId;
      const label = obj.label;
      const severity = obj.severity;
      const partyA = obj.partyA;
      const partyB = obj.partyB;
      const detectionDescription = obj.detectionDescription;
      const resolutionPath = obj.resolutionPath;
      if (typeof contradictionId !== 'string' || contradictionId.length === 0) return null;
      if (typeof label !== 'string' || label.length === 0) return null;
      if (severity !== 'low' && severity !== 'medium' && severity !== 'high') return null;
      if (typeof partyA !== 'string' || partyA.length === 0) return null;
      if (typeof partyB !== 'string' || partyB.length === 0) return null;
      if (typeof detectionDescription !== 'string' || detectionDescription.length === 0) return null;
      if (typeof resolutionPath !== 'string' || resolutionPath.length === 0) return null;
      return {
        type,
        contradictionId,
        label,
        severity,
        partyA,
        partyB,
        detectionDescription,
        resolutionPath,
      };
    }
    case 'vendor-card': {
      const vendorId = obj.vendorId;
      const name = obj.name;
      const tier = obj.tier;
      const positioning = obj.positioning;
      if (typeof vendorId !== 'string' || vendorId.length === 0) return null;
      if (typeof name !== 'string' || name.length === 0) return null;
      if (
        tier !== 'enterprise' &&
        tier !== 'mid-market' &&
        tier !== 'specialist' &&
        tier !== 'emerging' &&
        tier !== 'incumbent'
      ) {
        return null;
      }
      if (typeof positioning !== 'string' || positioning.length === 0) return null;
      return {
        type,
        vendorId,
        name,
        tier,
        positioning,
        riskFlags: stringArray(obj.riskFlags),
        patternId: optionalString(obj.patternId),
      };
    }
    case 'pricing-benchmark': {
      const category = obj.category;
      const metric = obj.metric;
      const median = obj.median;
      const source = obj.source;
      if (typeof category !== 'string' || category.length === 0) return null;
      if (typeof metric !== 'string' || metric.length === 0) return null;
      if (typeof median !== 'number') return null;
      if (typeof source !== 'string' || source.length === 0) return null;
      return {
        type,
        category,
        metric,
        median,
        p25: typeof obj.p25 === 'number' ? obj.p25 : undefined,
        p75: typeof obj.p75 === 'number' ? obj.p75 : undefined,
        source,
        sampleSize:
          typeof obj.sampleSize === 'number' && Number.isInteger(obj.sampleSize)
            ? obj.sampleSize
            : undefined,
        patternId: optionalString(obj.patternId),
      };
    }
    case 'contract-clause': {
      const clauseId = obj.clauseId;
      const title = obj.title;
      const recommendedLanguage = obj.recommendedLanguage;
      const leverage = obj.leverage;
      if (typeof clauseId !== 'string' || clauseId.length === 0) return null;
      if (typeof title !== 'string' || title.length === 0) return null;
      if (typeof recommendedLanguage !== 'string' || recommendedLanguage.length === 0) return null;
      if (typeof leverage !== 'string' || leverage.length === 0) return null;
      return {
        type,
        clauseId,
        title,
        currentLanguage: optionalString(obj.currentLanguage),
        recommendedLanguage,
        leverage,
        patternId: optionalString(obj.patternId),
      };
    }
    case 'bafo-scoreboard': {
      const vendorsRaw = obj.vendors;
      const dimensionsRaw = obj.dimensions;
      const scoresMatrixRaw = obj.scoresMatrix;
      if (!Array.isArray(vendorsRaw) || !Array.isArray(dimensionsRaw) || !Array.isArray(scoresMatrixRaw)) {
        return null;
      }
      const vendors: BafoScoreboardArtifact['vendors'] = [];
      for (const raw of vendorsRaw) {
        if (!raw || typeof raw !== 'object') continue;
        const vendor = raw as Record<string, unknown>;
        if (typeof vendor.vendorId !== 'string' || vendor.vendorId.length === 0) continue;
        if (typeof vendor.name !== 'string' || vendor.name.length === 0) continue;
        vendors.push({ vendorId: vendor.vendorId, name: vendor.name });
      }
      const dimensions: BafoScoreboardArtifact['dimensions'] = [];
      for (const raw of dimensionsRaw) {
        if (!raw || typeof raw !== 'object') continue;
        const dimension = raw as Record<string, unknown>;
        if (typeof dimension.label !== 'string' || dimension.label.length === 0) continue;
        if (typeof dimension.weight !== 'number') continue;
        dimensions.push({ label: dimension.label, weight: dimension.weight });
      }
      const scoresMatrix = scoresMatrixRaw.filter(
        (row): row is number[] =>
          Array.isArray(row) &&
          row.length === dimensions.length &&
          row.every((score) => typeof score === 'number'),
      );
      if (vendors.length === 0 || dimensions.length === 0) return null;
      if (scoresMatrix.length !== vendors.length) return null;
      return {
        type,
        vendors,
        dimensions,
        scoresMatrix,
        notes: optionalString(obj.notes),
      };
    }
    case 'walkaway-signal': {
      const credibility = obj.credibility;
      const reasoning = obj.reasoning;
      const recommendation = obj.recommendation;
      if (credibility !== 'strong' && credibility !== 'soft' && credibility !== 'theatre') return null;
      if (typeof reasoning !== 'string' || reasoning.length === 0) return null;
      if (typeof recommendation !== 'string' || recommendation.length === 0) return null;
      return { type, credibility, reasoning, recommendation };
    }
    case 'source-event-created': {
      const eventId = obj.eventId;
      const eventCode = obj.eventCode;
      const eventName = obj.eventName;
      const lifecycleState = obj.lifecycleState;
      const approvalAuthority = obj.approvalAuthority;
      if (typeof eventId !== 'string' || eventId.length === 0) return null;
      if (typeof eventCode !== 'string' || eventCode.length === 0) return null;
      if (typeof eventName !== 'string' || eventName.length === 0) return null;
      if (typeof lifecycleState !== 'string' || lifecycleState.length === 0) return null;
      if (typeof approvalAuthority !== 'string' || approvalAuthority.length === 0) return null;
      return {
        type,
        eventId,
        eventCode,
        eventName,
        lifecycleState,
        approvalAuthority,
        approvalUrl: optionalString(obj.approvalUrl),
      };
    }
    case 'sourcing-stage-progress': {
      const evidenceItemId = obj.evidenceItemId;
      const label = obj.label;
      const severity = obj.severity;
      const status = obj.status;
      if (typeof evidenceItemId !== 'string' || evidenceItemId.length === 0) return null;
      if (typeof label !== 'string' || label.length === 0) return null;
      if (severity !== 'hard' && severity !== 'soft') return null;
      if (status !== 'met' && status !== 'unmet' && status !== 'unknown') return null;
      return {
        type,
        evidenceItemId,
        label,
        severity,
        status,
        detail: optionalString(obj.detail),
      };
    }
    case 'sourcing-stage-changed': {
      const eventId = obj.eventId;
      const fromStage = obj.fromStage;
      const toStage = obj.toStage;
      if (typeof eventId !== 'string' || eventId.length === 0) return null;
      if (!isSourceStage(fromStage) || !isSourceStage(toStage)) return null;
      return {
        type,
        eventId,
        fromStage,
        toStage,
        snapshotId: optionalString(obj.snapshotId),
      };
    }
    case 'brief-progress': {
      // OV2-1a · brief-builder progress card.
      const fieldsTotal = obj.fieldsTotal;
      const fieldsFilled = obj.fieldsFilled;
      const fieldsRaw = obj.fields;
      if (typeof fieldsTotal !== 'number' || !Number.isInteger(fieldsTotal) || fieldsTotal <= 0) {
        return null;
      }
      if (
        typeof fieldsFilled !== 'number' ||
        !Number.isInteger(fieldsFilled) ||
        fieldsFilled < 0 ||
        fieldsFilled > fieldsTotal
      ) {
        return null;
      }
      if (!Array.isArray(fieldsRaw)) return null;
      const fields: BriefProgressArtifact['fields'] = [];
      for (const raw of fieldsRaw) {
        if (!raw || typeof raw !== 'object') return null;
        const field = raw as Record<string, unknown>;
        const id = field.id;
        const label = field.label;
        const status = field.status;
        if (typeof id !== 'string' || id.length === 0) return null;
        if (typeof label !== 'string' || label.length === 0) return null;
        if (status !== 'empty' && status !== 'partial' && status !== 'filled') return null;
        const value =
          typeof field.value === 'string' && field.value.length > 0 ? field.value : undefined;
        fields.push({ id, label, status, value });
      }
      return { type, fieldsTotal, fieldsFilled, fields };
    }
    case 'overlap-alert': {
      // OV2-1a · alert when this brief overlaps an existing program.
      const overlappingProgramId = obj.overlappingProgramId;
      const overlappingProgramName = obj.overlappingProgramName;
      const overlapKind = obj.overlapKind;
      const overlapDetail = obj.overlapDetail;
      if (typeof overlappingProgramId !== 'string' || overlappingProgramId.length === 0) return null;
      if (typeof overlappingProgramName !== 'string' || overlappingProgramName.length === 0) {
        return null;
      }
      if (
        overlapKind !== 'archetype' &&
        overlapKind !== 'sponsor' &&
        overlapKind !== 'system' &&
        overlapKind !== 'multiple'
      ) {
        return null;
      }
      if (typeof overlapDetail !== 'string' || overlapDetail.length === 0) return null;
      return {
        type,
        overlappingProgramId,
        overlappingProgramName,
        overlappingProgramPhase: optionalString(obj.overlappingProgramPhase),
        overlapKind,
        overlapDetail,
      };
    }
    case 'failure-mode-flagged': {
      // OV2-FM-FLAG-ARTIFACT · top-level failure-mode flag against the 10
      // catalog. Parser guards the type only; it intentionally does NOT
      // import FAILURE_MODES to verify the id exists in the catalog
      // (avoids a lib/agent -> lib/programs circular dep). Authoring
      // bugs surface in telemetry rollups, not at parse time.
      const failureModeId = obj.failureModeId;
      const failureModeName = obj.failureModeName;
      const phase = obj.phase;
      const detectedSignal = obj.detectedSignal;
      const consequence = obj.consequence;
      const redirect = obj.redirect;
      const severity = obj.severity;
      if (
        typeof failureModeId !== 'number' ||
        !Number.isInteger(failureModeId) ||
        failureModeId < 1 ||
        failureModeId > 10
      ) {
        return null;
      }
      if (typeof failureModeName !== 'string' || failureModeName.length === 0) return null;
      if (typeof phase !== 'number' || !Number.isInteger(phase) || phase < 0 || phase > 6) {
        return null;
      }
      if (typeof detectedSignal !== 'string' || detectedSignal.length === 0) return null;
      if (typeof consequence !== 'string' || consequence.length === 0) return null;
      if (typeof redirect !== 'string' || redirect.length === 0) return null;
      if (severity !== 'soft' && severity !== 'hard') return null;
      return {
        type,
        failureModeId,
        failureModeName,
        phase,
        detectedSignal,
        consequence,
        redirect,
        severity,
      };
    }
    case 'context-bundle': {
      // CB-6 · context-bundle artifact. Validates the minimum-viable
      // shape of a ContextBundle so a malformed payload doesn't crash
      // the chat surface. We accept the JSON when it looks like a
      // bundle (has the keys the panel reads) without exhaustively
      // re-validating every nested object — the broker is the source
      // of truth and the bundle was produced server-side.
      const bundle = obj.bundle;
      if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) return null;
      const b = bundle as Record<string, unknown>;
      if (typeof b.query !== 'string') return null;
      if (
        b.mode !== 'generic' &&
        b.mode !== 'corpus' &&
        b.mode !== 'tenant' &&
        b.mode !== 'full'
      ) {
        return null;
      }
      // tenantKey: string | null per ContextBundle.tenantKey
      if (b.tenantKey !== null && typeof b.tenantKey !== 'string') return null;
      if (!Array.isArray(b.facts)) return null;
      if (!Array.isArray(b.graphPaths)) return null;
      if (!Array.isArray(b.semanticChunks)) return null;
      if (!Array.isArray(b.corpusPatterns)) return null;
      if (!Array.isArray(b.provenance)) return null;
      if (!Array.isArray(b.warnings)) return null;
      // CB-10 · `infoTags` is the success-metadata channel split out
      // from `warnings`. Older serialized bundles may not carry it; we
      // accept missing/non-array (treat as empty) rather than rejecting,
      // since the panel renders empty info-tag strips harmlessly.
      if (b.infoTags === undefined) {
        b.infoTags = [];
      } else if (!Array.isArray(b.infoTags)) {
        return null;
      }
      if (typeof b.assembledAt !== 'string') return null;
      // Pass through the bundle verbatim. Type assertion is safe because
      // we've validated every load-bearing key the panel reads; cost
      // of a deep clone here would be wasteful (the bundle can carry
      // hundreds of records / chunks at full mode).
      return { type, bundle: bundle as unknown as ContextBundleArtifact['bundle'] };
    }
    case 'deliverable-ready': {
      // EXPORT-4 · download-chip artifact. Parser validates kind +
      // format against the closed sets so a typo on either side
      // surfaces as a parse-failure card instead of a broken chip.
      const kind = obj.kind;
      const format = obj.format;
      const title = obj.title;
      const exportUrl = obj.exportUrl;
      const programId = obj.programId;
      if (typeof kind !== 'string' || !DELIVERABLE_KIND_SET.has(kind)) return null;
      if (typeof format !== 'string' || !DELIVERABLE_FORMAT_SET.has(format)) return null;
      if (typeof title !== 'string' || title.length === 0) return null;
      if (typeof exportUrl !== 'string' || exportUrl.length === 0) return null;
      // Reject absolute / off-host URLs the same way navigate-to does
      // — protects the user from agent-emitted cross-origin POSTs.
      if (!exportUrl.startsWith('/') || exportUrl.startsWith('//')) return null;
      if (typeof programId !== 'string' || programId.length === 0) return null;
      const specId = optionalString(obj.specId);
      return {
        type,
        kind: kind as DeliverableKind,
        format: format as DeliverableFormat,
        title,
        exportUrl,
        programId,
        specId,
      };
    }
    case 'cross-program-signal': {
      // TD-7 · cross-program-signal. Strict validation on every field
      // because the artifact is meant to mirror the persisted record —
      // a malformed payload should surface as parse-failed, not silently
      // render a half-empty card. Severity is closed-set
      // 'low'|'medium'|'high'|'critical'; programs must be a non-empty
      // string array; signalId, title, and recommendation are non-empty
      // strings.
      const signalId = obj.signalId;
      const title = obj.title;
      const programsRaw = obj.programs;
      const severity = obj.severity;
      const recommendation = obj.recommendation;
      if (typeof signalId !== 'string' || signalId.length === 0) return null;
      if (typeof title !== 'string' || title.length === 0) return null;
      if (
        severity !== 'low' &&
        severity !== 'medium' &&
        severity !== 'high' &&
        severity !== 'critical'
      ) {
        return null;
      }
      if (typeof recommendation !== 'string' || recommendation.length === 0) return null;
      if (!Array.isArray(programsRaw)) return null;
      const programs = programsRaw.filter(
        (p): p is string => typeof p === 'string' && p.length > 0,
      );
      if (programs.length === 0) return null;
      return {
        type,
        signalId,
        title,
        programs,
        severity,
        recommendation,
        sourceRecordId: optionalString(obj.sourceRecordId),
      };
    }
  }
}

/** EXPORT-4 · runtime sets used by the parser to validate the
 * artifact's kind + format. Sourced from types.ts (compile-time) and
 * mirrored here as runtime sets to avoid pulling the renderer modules
 * into the agent bundle.
 */
const DELIVERABLE_KIND_SET: ReadonlySet<string> = new Set<string>([
  'program-charter',
  'discovery-report',
  'okr-baseline',
  'stakeholder-map',
  'synthesis-options-table',
  'architecture-sketch',
  'execution-plan',
  'pilot-result-report',
  'outcome-report',
  'bafo-scoreboard',
  'meeting-notes',
  'decision-log',
  'roadmap',
  'financial-baseline',
  'archetype-primer',
  'workshop-facilitator-guide',
]);
const DELIVERABLE_FORMAT_SET: ReadonlySet<string> = new Set<string>([
  'html',
  'xlsx',
  'docx',
  'pdf',
]);

/**
 * If `text` ends with what could be the start of an open sentinel
 * (e.g. `…[[arti`), split off that suffix so the caller can defer it
 * to the next chunk. Returns `{ committed, deferred }` where
 * `committed` is safe to render and `deferred` should be carried
 * forward via `remaining`.
 */
function splitTrailingPartialOpen(text: string): { committed: string; deferred: string } {
  // Walk back from the end. Check every `[` in the bounded scan window
  // — the LEFTMOST `[` whose tail is a valid partial-open prefix wins,
  // because that maximizes the deferred suffix (safer to defer than
  // commit; we re-extract on the next chunk anyway).
  //
  // We can't break early on a `[` mismatch: a rightmost `[` may match
  // a single-bracket prefix while an earlier `[` matches the longer
  // `[[…` prefix — both are valid partial opens, and the leftmost one
  // is what we want to defer.
  const limit = Math.max(0, text.length - 64);
  let earliest = -1;
  for (let i = text.length - 1; i >= limit; i--) {
    if (text[i] !== '[') continue;
    if (isPartialOpenSentinel(text.slice(i))) {
      earliest = i;
    }
  }
  if (earliest === -1) return { committed: text, deferred: '' };
  return { committed: text.slice(0, earliest), deferred: text.slice(earliest) };
}

export function extractArtifacts(input: string): ExtractResult {
  const artifacts: Artifact[] = [];
  let visible = '';
  let cursor = 0;

  while (cursor < input.length) {
    const tail = input.slice(cursor);
    const openMatch = OPEN_SENTINEL.exec(tail);
    if (!openMatch) {
      // No more *complete* open sentinels — but the tail may still end
      // with a *partial* open whose `]]` is in the next stream chunk.
      // Defer that suffix instead of committing it as visible text.
      const { committed, deferred } = splitTrailingPartialOpen(tail);
      visible += committed;
      return { visibleText: visible, artifacts, remaining: deferred };
    }

    const openStart = cursor + openMatch.index;
    const openEnd = openStart + openMatch[0].length;
    const type = openMatch[1];

    // Append everything before the open sentinel as visible text.
    visible += input.slice(cursor, openStart);

    // Look for the close sentinel after the open.
    const closeIndex = input.indexOf(CLOSE_SENTINEL, openEnd);
    if (closeIndex === -1) {
      // Open without close — partial artifact still streaming. Carry
      // forward unparsed via `remaining` so the next chunk can complete.
      const remaining = input.slice(openStart);
      return { visibleText: visible, artifacts, remaining };
    }

    const json = input.slice(openEnd, closeIndex);
    const artifact = tryParseArtifact(type, json);
    if (artifact) {
      artifacts.push(artifact);
    } else {
      // Malformed artifact: surface the raw payload as visible text so
      // the user sees the bug rather than silent loss. Production
      // logs can later catch these via the F0.3 validator.
      visible += `[[artifact:${type} parse-failed]]`;
    }
    cursor = closeIndex + CLOSE_SENTINEL.length;
  }

  return { visibleText: visible, artifacts, remaining: '' };
}

// ── Instruction-layer text ────────────────────────────────────────────────────
//
// Each surface that wants the artifact channel composes this snippet
// into its agent system prompt (after F0.3 instructions, before any
// task-specific guidance). The text describes the grammar and gives
// concrete examples so Steward / Nexus / etc. emit clean artifacts
// instead of dumping IDs in the chat.

export const ARTIFACT_CHANNEL_INSTRUCTIONS = `REACTIVE WORKSPACE — STRUCTURED ARTIFACTS:

The user's right pane materializes structured artifacts as you reason.
Emit them inline with your text using this grammar:

[[artifact:<type>]]<JSON>[[/artifact]]

The chat client strips these sentinels from your visible text and
dispatches the artifact to the right pane. Reference the artifact in
your prose by name, not by raw ID. The user sees the rich card on the
right; the chat stays conversational.

EMIT ARTIFACTS PROACTIVELY — DON'T WAIT FOR CONFIRMATION:

As soon as the user states something concrete (a program name, a
problem statement, a target outcome, a sponsor, a lead, a timeline),
emit a brief-field artifact immediately so the brief panel populates
in real time. The user can correct you if you misheard — that's fine,
just emit a new artifact for the same field. Don't sit on extracted
information waiting for "is this right?" — populate the brief first,
let the user see what you heard, ask for corrections if any.

WRONG: "I matched this to [PAT-PRG-AMS-CONSOLIDATION-001]."
RIGHT: "I matched this to AMS Consolidation — see the pattern card on your right."
        [[artifact:pattern-match]]{"patternId":"PAT-PRG-AMS-CONSOLIDATION-001","name":"AMS Consolidation","summary":"Rationalize application + managed-services footprint with AI-driven signals.","successRatePct":78,"deploymentCount":12,"typicalDurationMonths":9}[[/artifact]]

WRONG: "Let me note that as the program name in the brief."
RIGHT: "Got it — the program name is in the brief on your right."
        [[artifact:brief-field]]{"field":"programName","value":"AMS Consolidation 2026"}[[/artifact]]

Available artifact types and their EXACT JSON shapes:

1. brief-field — single-field update on the program brief (Surface 1
   /programs/new). Other surfaces ignore.
   Shape: {"field": <field-name>, "value": <string>}
   field ∈ {programName, problemStatement, targetOutcome, timeline,
           classification, sponsor, lead}
   Example:
   [[artifact:brief-field]]{"field":"sponsor","value":"Sarah Chen"}[[/artifact]]

2. classification — the high-level archetype (e.g. AMS_CONSOLIDATION).
   Often emit alongside a pattern-match.
   Shape: {"archetype": <UPPER_SNAKE_KEY>, "archetypeLabel": <Human Readable>, "confidence": "high"|"medium"|"low"}
   Example:
   [[artifact:classification]]{"archetype":"AMS_CONSOLIDATION","archetypeLabel":"AMS Consolidation","confidence":"high"}[[/artifact]]

3. pattern-match — full pattern card. Use when you've classified the
   use case to a named pattern; the right pane renders a clickable card.
   Shape: {"patternId": <PAT-…>, "name": <string>, "summary": <string>,
           "successRatePct"?: <number>, "deploymentCount"?: <number>,
           "typicalDurationMonths"?: <number>}
   Example:
   [[artifact:pattern-match]]{"patternId":"PAT-PRG-CDP-001","name":"CDP Activation","summary":"Customer data platform programme lifecycle.","successRatePct":72,"deploymentCount":18}[[/artifact]]

4. cross-program-dependency — emit one per linked program when you
   surface a dependency.
   Shape: {"programId": <APX-…>, "programName": <string>, "currentPhase": <string>}
   Example:
   [[artifact:cross-program-dependency]]{"programId":"APX-CDP-2026","programName":"Apex Retail CDP Activation","currentPhase":"P3 Design"}[[/artifact]]

5. gate-evaluation — Surface 2 (program detail). Emit one per gate
   criterion as you reason through the current phase's gate. The panel
   renders a status pill and reasoning narrative.
   Shape: {"gate": <criterion label>, "status": "met"|"unmet"|"pending"|"blocked",
           "detail"?: <string>, "reasoning"?: <string>}
   Example:
   [[artifact:gate-evaluation]]{"gate":"Build gate · privacy architecture sign-off","status":"unmet","detail":"Vendor C SOC-2 attestation pending","reasoning":"Privacy team needs the attestation file before the architecture review can sign off."}[[/artifact]]

6. evidence-highlight — Surface 2. When you reference a specific
   evidence item in your reasoning, emit one of these so the matching
   card on the page can highlight.
   Shape: {"evidenceId": <stable-id>, "label"?: <string>, "reason": <string>}
   Example:
   [[artifact:evidence-highlight]]{"evidenceId":"EV-CDP-013","label":"Vendor C contract draft","reason":"Privacy clauses missing on page 14."}[[/artifact]]

7. phase-recommendation — Surface 2. Emit when you've reasoned about
   the next move for the current phase. The panel renders a "Nexus
   recommends" card with blockers + next-actions.
   Shape: {"phase": <0..6>, "recommendation": <string>,
           "blockers"?: [<string>], "nextActions"?: [<string>]}
   Example:
   [[artifact:phase-recommendation]]{"phase":3,"recommendation":"Hold on advancing to Build until Vendor C contract is signed.","blockers":["Privacy attestation outstanding","Architecture review unscheduled"],"nextActions":["Schedule privacy review for next week","Confirm BAFO award timeline with sourcing"]}[[/artifact]]

8. program-focus — Surface 2. Emit when you shift focus to a different
   program inside a multi-program reasoning thread (cross-portfolio).
   Shape: {"programId": <APX-…>, "name": <string>, "currentPhase": <string>}
   Example:
   [[artifact:program-focus]]{"programId":"APX-CC-2026","name":"Contact Center AI","currentPhase":"P4 Build"}[[/artifact]]

9. phase-progress — Surface 2. When the active phase pack has a
   definitionOfDone item and the conversation gives you signal on its
   status, emit a phase-progress card. The status reflects YOUR
   conversational read — use 'unknown' freely when the chat hasn't
   surfaced enough to judge. Use 'met' when the user has confirmed the
   evidence exists, 'unmet' when the conversation reveals a clear gap.
   Use the evidenceItemId from the active pack — match the pack's id
   exactly so the panel can dedupe across turns.
   Shape: {"evidenceItemId": <pack-item-id>, "label": <pack-item-label>,
           "severity": "hard"|"soft", "status": "met"|"unmet"|"unknown",
           "detail"?: <one-line elaboration>}
   Example (P2 Synthesis pack item charter-signed-off):
   [[artifact:phase-progress]]{"evidenceItemId":"charter-signed-off","label":"Charter signed off by sponsor","severity":"hard","status":"unmet","detail":"User said the charter is in draft; sponsor has not signed yet."}[[/artifact]]

10. anti-pattern-flag — Surface 2. When the conversation reveals an
    active pack anti-pattern signal, emit a flag card. The detectedSignal
    field carries forward what you saw (paraphrase the user's words);
    whatToFlag and mitigation should mirror the pack's text so the user
    sees a coherent flag. Surface these PROACTIVELY — the pack tells
    you what to flag, and the user benefits most when you flag it the
    moment you see the signal.
    Shape: {"antiPatternId": <pack-anti-pattern-id>, "label": <pack-label>,
            "detectedSignal": <what you observed>,
            "whatToFlag": <consequence — mirror pack>,
            "mitigation": <redirect — mirror pack>}
    Example (P2 Synthesis pack anti-pattern phantom-sponsor):
    [[artifact:anti-pattern-flag]]{"antiPatternId":"phantom-sponsor","label":"The Phantom Sponsor","detectedSignal":"User said the sponsor is the CIO but cannot describe any specific calendar commitment","whatToFlag":"Sponsor pattern looks delegated, not personal. The program has high probability of stalling at the first real decision — this is the #1 reason charters fail in P3.","mitigation":"Insist on a recurring sponsor cadence on the calendar before close, AND name a succession owner. If the sponsor will not commit, the charter is not ready to advance."}[[/artifact]]

When an artifact updates a value already in the panel, just emit a new
artifact of the same type — the panel replaces or upserts as
appropriate. Don't repeat artifacts you've already emitted for fields
that haven't changed.

For phase-progress: do NOT emit cards for items where the chat has
given you no signal. 'unknown' is reserved for when the user has
brushed a topic but you don't have enough to commit to met/unmet —
not "I have no idea yet."

For anti-pattern-flag: only emit when the detectionHint signal is
genuinely visible. False positives are worse than missed flags here —
a wrongly-flagged Phantom Sponsor will erode trust in the platform.

11. question-resolved — Surface 2. When the user has answered a
    rightQuestion from the active phase pack to a satisfying degree,
    emit one of these. Use the questionId from the active pack — it's
    a stable kebab-case id like "who-benefits-who-loses" or
    "synthesis-options-compared". The reactive panel renders a
    checkmark card; more importantly, the conversation history visibly
    preserves the resolution so YOUR NEXT TURN can see that this
    question is closed and you don't repeat the opener.
    Use this aggressively. The pack arc (open / converge / close)
    only works if the conversation tracks which questions are
    answered. Without it, you re-ask the same opener two turns later
    and the user loses confidence in the coaching.
    What counts as resolved: the user gave a substantive answer that
    satisfies the question (the pack's explicit reason for asking).
    Vague or evasive answers do NOT resolve — keep probing.
    Shape: {"questionId": <pack-question-id>,
            "questionText": <verbatim or paraphrased question>,
            "resolutionSummary"?: <one-line summary of the user's answer>}
    Example (P2 Synthesis pack question who-benefits-who-loses):
    [[artifact:question-resolved]]{"questionId":"who-benefits-who-loses","questionText":"Who personally benefits if this works, and who personally loses?","resolutionSummary":"Sarah Chen (CIO) benefits via consolidated ops; legacy AMS vendor loses the renewal — named dissenter."}[[/artifact]]

12. graph-neighborhood — Sentinel-side. Emit when you've walked the
    pattern graph and the user benefits from a structural summary of
    the neighborhood (vs. a wall of pattern-match cards). topEdges is
    capped at 8 in the renderer; nodeCount + edgeCount carry the full
    traversal scope so you can narrate "showing 8 of N" honestly.
    Emit ALONGSIDE pattern-match cards for the individual neighbors —
    the graph card is the structural summary, the pattern-match cards
    are the per-pattern details.
    Shape: {"rootId": <pattern-id>, "rootLabel": <pattern-name>,
            "nodeCount": <int>, "edgeCount": <int>,
            "topEdges": [{"targetId": <pattern-id>, "targetLabel": <name>,
                          "edgeType": "co_applies_with"|"contradicts"|"depends_on"|"precedes"}]}
    Example:
    [[artifact:graph-neighborhood]]{"rootId":"pattern_ai_use_case_portfolio","rootLabel":"AI Use Case Portfolio Management","nodeCount":11,"edgeCount":11,"topEdges":[{"targetId":"pattern_analytics_modernization","targetLabel":"Analytics Modernization","edgeType":"co_applies_with"},{"targetId":"pattern_responsible_ai","targetLabel":"Responsible AI Governance","edgeType":"co_applies_with"}]}[[/artifact]]

12. contradiction-flag — Sentinel-side. Emit when a pattern's
    contradictionTemplate fires against the user's claim or synthesis,
    when evidence in the data room conflicts with a vendor claim, or
    when validate_synthesis finds a contradiction. Reuses the shape of
    pack/seed ContradictionTemplate so authored data flows through
    unchanged. partyA / partyB name the contradicting sources (e.g.
    "Vendor claim" vs "Measured reality"); detectionDescription explains
    when it fires; resolutionPath is the redirect.
    Shape: {"contradictionId": <stable-id>, "label": <human label>,
            "severity": "low"|"medium"|"high",
            "partyA": <source-A>, "partyB": <source-B>,
            "detectionDescription": <when this fires>,
            "resolutionPath": <what to do next>}
    Example:
    [[artifact:contradiction-flag]]{"contradictionId":"vendor-savings-vs-measured","label":"Vendor savings claim vs measured reality","severity":"high","partyA":"Vendor benchmark","partyB":"Measured run-rate","detectionDescription":"Vendor cites 22% savings against an unverified baseline; tenant's measured run-rate shows 7% over the same window.","resolutionPath":"Pull the baseline source-of-truth into the broker citation and ask Sentinel to evidence-check the vendor claim before signing."}[[/artifact]]

13. vendor-card — Sourcing-side. Emit one per vendor when Sentinel
    compares a vendor set, names an incumbent posture, or summarizes a
    qualified candidate. Keep positioning citation-aware and concise.
    Shape: {"vendorId": <stable-id>, "name": <vendor-name>,
            "tier": "enterprise"|"mid-market"|"specialist"|"emerging"|"incumbent",
            "positioning": <why this vendor is in the set>,
            "riskFlags"?: [<risk-label>], "patternId"?: <PAT-SRC-VEN-*|pattern-id>}
    Example:
    [[artifact:vendor-card]]{"vendorId":"ven-servicenow","name":"ServiceNow","tier":"enterprise","positioning":"Strong incumbent for ITSM-led AMS consolidation; validate integration depth before shortlist.","riskFlags":["Incumbent lock-in","Workflow customization sprawl"],"patternId":"PAT-SRC-VEN-ITSM-AMS"}[[/artifact]]

14. pricing-benchmark — Sourcing-side. Emit when Sentinel cites pricing
    ranges, median economics, or category-level commercial baselines.
    source is required; do not emit uncited benchmarks.
    Shape: {"category": <category>, "metric": <unit>, "median": <number>,
            "p25"?: <number>, "p75"?: <number>, "source": <citation>,
            "sampleSize"?: <int>, "patternId"?: <PAT-SRC-PRC-*|pattern-id>}
    Example:
    [[artifact:pricing-benchmark]]{"category":"AMS managed services","metric":"monthly run-rate per application","median":4200,"p25":3100,"p75":6100,"source":"Apex sourcing benchmark pack, Q1 2026","sampleSize":18,"patternId":"PAT-SRC-PRC-AMS-RUN-RATE"}[[/artifact]]

15. contract-clause — Sourcing-side. Emit when Sentinel identifies a
    clause gap, proposed language, or buyer leverage point. recommendedLanguage
    is required because the card should be actionable.
    Shape: {"clauseId": <stable-id>, "title": <clause-title>,
            "currentLanguage"?: <vendor-proposed-text>,
            "recommendedLanguage": <buyer-ask>,
            "leverage": <why buyer can push>, "patternId"?: <PAT-SRC-CON-*|pattern-id>}
    Example:
    [[artifact:contract-clause]]{"clauseId":"exit-assistance-rate-card","title":"Exit assistance rate card","currentLanguage":"Vendor provides reasonable transition assistance.","recommendedLanguage":"Attach named transition roles, rate caps, and a 120-day knowledge-transfer window.","leverage":"BAFO is still open and two challengers offered capped transition support.","patternId":"PAT-SRC-CON-EXIT-ASSISTANCE"}[[/artifact]]

16. bafo-scoreboard — Sourcing-side. Emit when comparing final offers
    across weighted dimensions. scoresMatrix is [vendor][dimension] and
    must align with vendors and dimensions exactly.
    Shape: {"vendors": [{"vendorId": <id>, "name": <name>}],
            "dimensions": [{"label": <dimension>, "weight": <number>}],
            "scoresMatrix": [[<number>]], "notes"?: <string>}
    Example:
    [[artifact:bafo-scoreboard]]{"vendors":[{"vendorId":"ven-a","name":"Vendor A"},{"vendorId":"ven-b","name":"Vendor B"}],"dimensions":[{"label":"Commercial fit","weight":35},{"label":"Transition risk","weight":25}],"scoresMatrix":[[82,68],[76,84]],"notes":"Vendor B carries less transition risk, but Vendor A remains stronger on commercial fit."}[[/artifact]]

17. walkaway-signal — Sourcing-side. Emit when the user's leverage,
    alternatives, or sequence design make the walkaway credible or not.
    Shape: {"credibility": "strong"|"soft"|"theatre",
            "reasoning": <why>, "recommendation": <next move>}
    Example:
    [[artifact:walkaway-signal]]{"credibility":"soft","reasoning":"The team has two alternatives, but neither has implementation dates or executive air cover yet.","recommendation":"Do not threaten walkaway in BAFO. First lock challenger availability and sponsor backing."}[[/artifact]]

18. sourcing-stage-progress — Sourcing-side. Parallel to phase-progress.
    Emit when the active sourcing stage pack has an evidence item and
    the conversation gives signal on status. Dedupe uses evidenceItemId.
    Shape: {"evidenceItemId": <stage-pack-item-id>, "label": <label>,
            "severity": "hard"|"soft", "status": "met"|"unmet"|"unknown",
            "detail"?: <one-line elaboration>}
    Example:
    [[artifact:sourcing-stage-progress]]{"evidenceItemId":"bafo-calendar-locked","label":"BAFO calendar locked before final concessions","severity":"hard","status":"unmet","detail":"User said dates are still tentative, so final concessions are premature."}[[/artifact]]

19. sourcing-stage-changed — Sourcing-side. Emitted by future
    advance_sourcing_stage tooling after a successful gated mutation so
    the client can refresh server data in place. Do not emit this from
    ordinary conversation.
    Shape: {"eventId": <source-event-id>, "fromStage": <0..7>,
            "toStage": <0..7>, "snapshotId"?: <mutation-snapshot-id>}
    Example:
    [[artifact:sourcing-stage-changed]]{"eventId":"apex-retail-ams-outsourcing-2026","fromStage":5,"toStage":6,"snapshotId":"snap-src-2026-04-29-001"}[[/artifact]]

20. navigate-to — Tool-emitted only. The navigate_to tool emits this
    artifact; the client routes the user post-stream. Do NOT emit this
    artifact from ordinary conversation — call the navigate_to tool
    instead. The tool exists because describing where the user should
    go is not the same as taking them there. Use it whenever the user
    says "take me to …", "open …", "go to …", and ALSO whenever the
    current surface is wrong for the user's intent (on /programs the
    user says "let's set up a new program" → call navigate_to with
    target "/programs/new"; on /tower the user picks a program to dive
    into → call navigate_to with target "/programs/<id>"). Always tell
    the user briefly where you are taking them and why; the navigation
    fires when your turn ends.
    Shape: {"target": <relative-path>, "rationale"?: <string>, "replace"?: <boolean>}
    Example (the tool emits this for you — shown for parser reference):
    [[artifact:navigate-to]]{"target":"/programs/new","rationale":"Origination intent; Steward owns the new-program flow."}[[/artifact]]

21. brief-progress — Strategic Moves origination (/strategic-moves/new) only. Emit
    on EVERY Nexus turn after each new field is captured so the right
    pane materializes the brief filling in field-by-field. The 7-field P0 scaffold
    uses FIXED ids — any other id is silently ignored by the right pane.
    Required ids (in order): problem-statement, archetype, sponsor-candidate,
    scope-boundary, evidence-family, value-hypothesis, foundation-readiness.
    Emit one artifact per turn covering all 7 fields with their current status.
    Shape: {"fieldsTotal": 7, "fieldsFilled": <int>,
            "fields": [{"id": <one-of-7-ids-above>, "label": <human label>,
                        "status": "empty"|"partial"|"filled",
                        "value"?: <short current value>}]}
    Example:
    [[artifact:brief-progress]]{"fieldsTotal":7,"fieldsFilled":2,"fields":[{"id":"problem-statement","label":"What's the bet / hypothesis","status":"filled","value":"AMS spend up 22% YoY — consolidate to 3 vendors"},{"id":"archetype","label":"Archetype classification","status":"empty"},{"id":"sponsor-candidate","label":"Sponsor candidate","status":"filled","value":"Sarah Chen (CIO)"},{"id":"scope-boundary","label":"Scope / boundary","status":"empty"},{"id":"evidence-family","label":"Evidence family selection","status":"empty"},{"id":"value-hypothesis","label":"Value hypothesis seed","status":"empty"},{"id":"foundation-readiness","label":"Foundation readiness","status":"empty"}]}[[/artifact]]

22. overlap-alert — Surface 1 (/programs/new) origination only. Emit
    when the broker bundle (tenant program inventory) reveals an
    existing program that overlaps the brief being built — same
    archetype, same sponsor, or same system footprint. Use real program
    ids and names from the bundle, not placeholders. Use
    overlapKind="multiple" when more than one dimension overlaps.
    Shape: {"overlappingProgramId": <real-program-id>,
            "overlappingProgramName": <real-program-name>,
            "overlappingProgramPhase"?: <e.g. "P3 Design">,
            "overlapKind": "archetype"|"sponsor"|"system"|"multiple",
            "overlapDetail": <one-line human-readable detail>}
    Example:
    [[artifact:overlap-alert]]{"overlappingProgramId":"APX-CDP-2026","overlappingProgramName":"Apex Retail CDP Activation","overlappingProgramPhase":"P3 Design","overlapKind":"sponsor","overlapDetail":"Sarah Chen is already sponsoring APX-CDP-2026 in P3; double-check sponsor bandwidth before originating."}[[/artifact]]

23. failure-mode-flagged — Programs-side, all phases. Emit when you observe
    a signal that one of the 10 platform failure modes (the ones in your
    THE 10 FAILURES YOU EXIST TO PREVENT block) is happening in this
    program. Use the canonical id and name from the catalog; reference
    the phase you're in. detectedSignal must paraphrase the user's words;
    consequence and redirect must mirror the doctrine in the relevant
    phase pack's anti-pattern when applicable. Severity 'hard' only when
    the flag genuinely blocks advance (e.g. sponsor check unmet at gate
    close); otherwise 'soft'.
    Use sparingly and accurately. False positives erode trust in the
    platform faster than missed flags. When uncertain, ask the user a
    clarifying question rather than flag.
    Shape: {"failureModeId": <1..10>, "failureModeName": <catalog name>,
            "phase": <0..6>, "detectedSignal": <what you observed>,
            "consequence": <what this means if unaddressed>,
            "redirect": <recommended next move>,
            "severity": "soft"|"hard"}
    Example:
    [[artifact:failure-mode-flagged]]{"failureModeId":1,"failureModeName":"Lack of executive sponsorship and ownership","phase":0,"detectedSignal":"User said the CIO 'mentioned it' but cannot describe a calendar commitment.","consequence":"Sponsor pattern looks delegated; air cover collapses at the first hard tradeoff.","redirect":"Schedule a sponsor 1:1 in the next 5 days; capture calendar cadence and escalation authority before P0 closes.","severity":"soft"}[[/artifact]]

24. deliverable-ready — EXPORT-4. Emit AT THE END of a compose_artifact
    step once you have produced the deliverable's structured payload
    AND the server-side compose helper has stored it via storeSpec()
    (which returns a short-lived cache id). The user's reactive panel
    renders a download chip; clicking it POSTs the spec id to the
    export URL and downloads the binary.
    Do NOT emit until you have actually composed the artifact's
    content. The chip is the user-visible signal that "the deliverable
    is ready to download" — emitting it speculatively (before the
    content is composed) yields a 404 / spec_not_found when the user
    clicks. Emit ONCE per compose_artifact step. Re-emit only if the
    spec materially changes (the panel dedupes by kind+programId so
    re-emits replace the chip cleanly).
    Format must match the kind's canonical format (or an allowed
    override). Title is the human-readable name shown on the chip
    (e.g. "Apex CDP Activation 2026 — Charter v1"). exportUrl is
    relative; absolute / off-host URLs are rejected at parse time.
    Shape: {"kind": <DeliverableKind>, "format": "html"|"xlsx"|"docx"|"pdf",
            "title": <chip-label>,
            "exportUrl": "/api/programs/<programId>/deliverables/<kind>/export",
            "programId": <program-id>, "specId"?: <cache-id>}
    Example:
    [[artifact:deliverable-ready]]{"kind":"program-charter","format":"docx","title":"Apex CDP Activation 2026 — Charter v1","exportUrl":"/api/programs/APX-CDP-2026/deliverables/program-charter/export","programId":"APX-CDP-2026","specId":"a8f3e9c1-7d2b-4f6a-9c3e-1a2b3c4d5e6f"}[[/artifact]]

25. cross-program-signal — TD-7. Programs-side. Emit when reasoning
    surfaces a dependency, conflict, or shared-resource constraint
    across programs. The signal MUST be grounded in tenant data — the
    broker bundle's CROSS-PROGRAM SIGNALS block lists the canonical
    signals for this tenant. Use the canonical signalId, title,
    programs list, severity, and recommendation from the bundle. Do
    NOT invent signals; do NOT paraphrase severity or recommendation.
    Surface PROACTIVELY when relevant to the user's question — the
    panel renders a colored card with a severity-driven left-edge
    stripe. Dedupe in the panel is by signalId, so re-emits upsert.
    Shape: {"signalId": <stable-record-id>, "title": <signal title>,
            "programs": [<program-id>],
            "severity": "low"|"medium"|"high"|"critical",
            "recommendation": <one-sentence next move>,
            "sourceRecordId"?: <source pointer; usually = signalId>}
    Example:
    [[artifact:cross-program-signal]]{"signalId":"cross_program_signals:xprog:apex:001","title":"Priya Iyer leads two critical-path programs simultaneously","programs":["apex-cdp-2026","apex-cc-ai-2026"],"severity":"medium","recommendation":"Identify second program lead for one of the two programs by end of Q2 FY2026.","sourceRecordId":"cross_program_signals:xprog:apex:001"}[[/artifact]]`;

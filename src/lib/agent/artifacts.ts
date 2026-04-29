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
  // Surface 2 PR-L · emitted by the advance_phase tool (via ctx.writer)
  // after a successful gate evaluation + DB mutation. The client uses
  // this to refresh server data in place via router.refresh() — the
  // React tree (chat history, reactive panel, AtlasPageState) survives
  // the phase transition, so the user keeps the conversation across
  // P3 → P4 instead of starting from a blank Nexus on a reloaded page.
  | 'program-phase-changed'; // {programId, fromPhase, toPhase, snapshotId?}

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
  | ProgramPhaseChangedArtifact;

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

function isKnownArtifactType(type: string): type is ArtifactType {
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
    type === 'program-phase-changed'
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
  }
}

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
a wrongly-flagged Phantom Sponsor will erode trust in the platform.`;

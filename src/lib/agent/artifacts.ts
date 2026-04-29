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
  | 'classification'; // {archetype, archetypeLabel, confidence?}

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

export type Artifact =
  | BriefFieldArtifact
  | PatternMatchArtifact
  | CrossProgramDependencyArtifact
  | ClassificationArtifact;

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
    type === 'classification'
  );
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
      const archetype = obj.archetype;
      const archetypeLabel = obj.archetypeLabel;
      if (typeof archetype !== 'string' || typeof archetypeLabel !== 'string') return null;
      const confidence = obj.confidence;
      const validConfidence =
        confidence === 'high' || confidence === 'medium' || confidence === 'low'
          ? confidence
          : undefined;
      return { type, archetype, archetypeLabel, confidence: validConfidence };
    }
  }
}

export function extractArtifacts(input: string): ExtractResult {
  const artifacts: Artifact[] = [];
  let visible = '';
  let cursor = 0;

  while (cursor < input.length) {
    const tail = input.slice(cursor);
    const openMatch = OPEN_SENTINEL.exec(tail);
    if (!openMatch) {
      // No more open sentinels — flush the rest as visible.
      visible += tail;
      cursor = input.length;
      break;
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

WRONG: "I matched this to [PAT-PRG-AMS-CONSOLIDATION-001]."
RIGHT: "I matched this to AMS Consolidation — see the pattern card on your right."
        [[artifact:pattern-match]]{"patternId":"PAT-PRG-AMS-CONSOLIDATION-001","name":"AMS Consolidation","summary":"…","successRatePct":78,"deploymentCount":12,"typicalDurationMonths":9}[[/artifact]]

WRONG: "Let me note that as the program name in the brief."
RIGHT: "Got it — the program name is in the brief on your right."
        [[artifact:brief-field]]{"field":"programName","value":"AMS Consolidation 2026"}[[/artifact]]

Available artifact types:

- brief-field — single-field update on the program brief.
  field ∈ {programName, problemStatement, targetOutcome, timeline,
          classification, sponsor, lead}
  value: the string to display.

- pattern-match — full pattern card. Use when you've classified the use
  case to a named pattern; the right pane renders a clickable card.

- cross-program-dependency — when you surface a linked program as a
  dependency, emit one of these per dependency. The brief will render
  it as a chip linked to that program.

- classification — the high-level archetype (e.g. AMS_CONSOLIDATION).
  Often emit alongside a pattern-match.

When an artifact updates a field already in the brief, just emit a new
brief-field artifact for the same field — the panel replaces the old
value. Don't repeat artifacts you've already emitted for fields that
haven't changed.`;

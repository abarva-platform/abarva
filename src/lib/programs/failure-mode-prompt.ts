// Slice OV2-WIRE-AND-FM-PROMPT — failure-mode catalog system-prompt block.
// Sources canonical names from FAILURE_MODES so the prompt and the catalog
// never drift. Design ref: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Section C.6.
//
// Slice OV2-FM-DOCTRINE — adds the doctrine block that teaches the agent
// WHEN to emit `failure-mode-flagged` (vs the per-phase `anti-pattern-flag`),
// how to ground every emission in the user's words, severity discipline, and
// cadence. Pairs with the catalog block: catalog = WHAT the 10 are; doctrine
// = HOW to flag them. Design ref: Parts C.4, C.6, E.5.

import { FAILURE_MODES } from '@/lib/programs/failure-modes';
import type { BriefOverlapMatch } from '@/lib/programs/origination-overlap';
import type { AttachmentChipRef } from '@/lib/programs/attachments/types';
import type { AttachmentTextPreview } from '@/lib/programs/attachments/extract-text';
import type { EnterpriseAgentContextItem } from '@/lib/knowledge/agent-context-broker';

const PROGRAMS_SURFACE_PREFIXES = ['/programs', '/demo/programs', '/tower', '/strategic-moves'];

/** Programs surfaces eligible for the failure-mode catalog block. */
export function isProgramsSurface(surface: string | null | undefined): boolean {
  if (!surface || typeof surface !== 'string') return false;
  return PROGRAMS_SURFACE_PREFIXES.some(
    (prefix) => surface === prefix || surface.startsWith(`${prefix}/`),
  );
}

/**
 * Render the canonical 10-failure-mode catalog as a system-prompt block.
 * Names are pulled from FAILURE_MODES so renaming a mode in one place
 * updates the prompt. Returns the same string every call — deterministic.
 */
// Detection hooks paired with each failure mode. Kept in the same order
// as FAILURE_MODES so index alignment is guaranteed. These are the SIGNALS
// the agent should recognise — not a restatement of the name.
const FM_DETECTION_HOOKS: Readonly<Record<number, string>> = {
  1:  'No named sponsor · no confirmed budget authority · "we got funding, now what?" · sponsor not named before Discovery spend · budget approved but no executive owns the outcome',
  2:  'Vague objective ("improve operations" / "leverage AI") · no testable hypothesis · starting build before the problem is validated · hypothesis never written down',
  3:  'Unknown data ownership · no data access · quality undefined · no data lineage · "we think we have the data" without verification',
  4:  'Model accuracy reported without business-metric baseline · missing production monitoring · ROI projected but not tracked · no A/B comparison after go-live',
  5:  'Security/governance not involved until late · privacy impact not assessed · HITL skipped · compliance review deferred · "we\'ll fix it in production"',
  6:  'Build started before vendor/infra decision settled · architecture rework mid-program · cloud commitment without workload shape · no infra sizing done',
  7:  'Stakeholder support assumed but not tested · critical team not engaged in Design · change management skipped · adoption assumed · training plan absent',
  8:  'No delivery plan for P4 or later · no defined build milestone · "agile will figure it out" · no sprint cadence · timeline undefined',
  9:  'Success defined as "the model runs" · no business KPI baseline · outcome measurement deferred · no way to attribute value to the AI intervention',
  10: 'Simultaneously running 10+ AI pilots · scope keeps expanding beyond the original use case · new features bolted on · trying to solve every problem at once',
};

export function formatFailureModeCatalogForPrompt(): string {
  const lines = FAILURE_MODES.map((mode) => {
    const num = String(mode.id).padStart(2, ' ');
    const hook = FM_DETECTION_HOOKS[mode.id] ? ` — detect when: ${FM_DETECTION_HOOKS[mode.id]}` : '';
    return `${num}. ${mode.name}${hook}`;
  });

  return [
    'THE 10 FAILURES YOU EXIST TO PREVENT:',
    '',
    'These are the failure modes AI programs hit, grounded in published research (Gartner, RAND, MIT/BCG, McKinsey, Forrester). Each line lists the mode name and the concrete signals that indicate it is happening right now. When you detect a signal, surface it.',
    '',
    ...lines,
  ].join('\n');
}

/**
 * Compose the failure-mode catalog block iff the surface qualifies.
 * Empty string on non-Programs surfaces so the route's filter strips it.
 */
export function composeFailureModeBlock(surface: string | null | undefined): string {
  if (!isProgramsSurface(surface)) return '';
  return formatFailureModeCatalogForPrompt();
}

/**
 * Render the doctrine block — HOW to emit `failure-mode-flagged` artifacts
 * relative to `anti-pattern-flag`. The catalog block teaches the agent
 * WHAT the 10 are; this block teaches discipline: when to fire, when to
 * stay silent, severity rules, field grounding, cadence.
 *
 * Voice-matched to the artifact-channel instructions in artifacts.ts —
 * senior-practitioner instruction, opinionated, examples-driven. Does NOT
 * restate the 10 names (the catalog above already carries them).
 *
 * Deterministic — returns the same string every call.
 */
export function formatFailureModeDoctrineForPrompt(): string {
  return [
    'FAILURE-MODE DOCTRINE:',
    '',
    "Emit `failure-mode-flagged` when the user, evidence, or broker bundle shows a SIGNAL — specific, observable — that one of the 10 (see catalog above) is being committed in this program right now. Not vibes. Not hypotheticals.",
    '',
    'Emit when: the signal is present in this turn or the visible context, AND no active phase-pack `anti-pattern-flag` already captures it cleanly.',
    '',
    'Do NOT emit when:',
    '- You only suspect the failure could happen later. This artifact is for present signals, not future risks. Coach the risk in chat.',
    '- A pack `anti-pattern-flag` fits cleanly (e.g. `phantom-sponsor` in P0). Prefer the pack flag — it carries phase-specific mitigation.',
    '- You are uncertain. Ask a clarifying question. False positives erode trust faster than missed flags.',
    '',
    'Relationship to `anti-pattern-flag`: the pack flag is phase-local doctrine; `failure-mode-flagged` is the cross-phase platform catalog. They CAN co-occur — when a pack anti-pattern is a specific instance of one of the 10, emit both. Example: `phantom-sponsor` (P0) → FM #1; emit both. Telemetry aggregates by catalog id.',
    '',
    "Severity: `'soft'` for note-and-redirect signals where the program continues with awareness — this is the default. `'hard'` only when the signal genuinely blocks phase advance: sponsor commitment unmet at P0 gate close, baseline missing at P1→P2, kill criterion missing at P2→P3, value attribution undefined at P5 outcome.",
    '',
    'Common misclassifications to avoid:',
    '- "No confirmed budget" or "funding approved but sponsor unnamed" → FM #1 (sponsorship), NOT FM #10 (sprawl). Sprawl is about running too many initiatives simultaneously, not about missing funding authority.',
    '- "Unclear value / no hypothesis" → FM #2 (problem definition), not FM #1. FM #1 requires a sponsor gap specifically.',
    '- "AI everywhere at once, bolting on features" → FM #10 (sprawl). FM #2 is about the core problem being poorly defined; FM #10 is about scope metastasising.',
    '',
    'Field discipline:',
    '- `failureModeId` MUST match the canonical id 1..10. Quote by id, not guessed name.',
    '- `failureModeName` MUST match the catalog name verbatim.',
    "- `phase` is the program's current phase (0..5) at the moment of flagging.",
    "- `detectedSignal` paraphrases the user's actual words (≤ 20 words) — not a generic restatement of the failure mode.",
    "- `consequence` mirrors the matching pack anti-pattern's `whatToFlag` when one applies; else senior-practitioner voice from the catalog's preventionMechanism.",
    "- `redirect` mirrors the pack's `mitigation` when relevant; else the platform's preventionMechanism. Concrete next move, not a slogan.",
    '',
    'Cadence: at most one `failure-mode-flagged` per `failureModeId` per turn unless the user surfaces multiple distinct signals. Do not bulk-emit the catalog.',
    '',
    'You are the senior practitioner walking alongside the program lead. Surface failure-mode signals when they are present, with evidence, sparingly enough that the user trusts each one.',
  ].join('\n');
}

/**
 * Compose the doctrine block iff the surface qualifies. Empty string on
 * non-Programs surfaces so the route's filter strips it. Always emitted
 * alongside the catalog block — the two are paired.
 */
export function composeFailureModeDoctrineBlock(
  surface: string | null | undefined,
): string {
  if (!isProgramsSurface(surface)) return '';
  return formatFailureModeDoctrineForPrompt();
}

/**
 * Compose the OVERLAP CANDIDATES block for /programs/new from the top
 * matches returned by detectBriefOverlap. Empty string when matches is
 * empty. Caller is responsible for slicing to the top N (typically 3).
 */
export function composeOverlapBlock(matches: readonly BriefOverlapMatch[]): string {
  if (!matches || matches.length === 0) return '';

  const matchLines = matches.flatMap((m) => {
    const phase = m.programPhase ? m.programPhase : 'unknown';
    return [
      `  - ${m.programName} (${m.programId})  ·  current phase: ${phase}`,
      `    Overlap kind: ${m.overlapKind}.  ${m.overlapDetail}`,
    ];
  });

  return [
    'OVERLAP CANDIDATES (existing programs in this tenant that may overlap with the brief in progress):',
    '',
    ...matchLines,
    '',
    "When the user's brief reveals real overlap with one of these, emit an `overlap-alert` artifact (see channel instructions) using the canonical programId / name / phase / kind / detail above. Do NOT invent overlap; only use these candidates. If none of the candidates is a real match given the user's actual problem statement, do not emit overlap-alert.",
  ].join('\n');
}

/**
 * One-line directive that nudges Steward to emit `brief-progress` on
 * every turn that captures or refines a brief field. The artifact-channel
 * instructions teach the *shape*; this teaches the *cadence*.
 * Empty string off program-origination canvases.
 */
export function composeBriefProgressCadenceDirective(
  surface: string | null | undefined,
): string {
  if (
    surface !== '/programs' &&
    surface !== '/programs/new' &&
    surface !== '/demo/programs/new' &&
    surface !== '/strategic-moves/new'
  ) {
    return '';
  }
  return "- After every turn that captures or refines a new-program brief field, emit a `brief-progress` artifact summarizing the 8-field state. The user's right pane only updates when you emit it.";
}

/**
 * Slice OV2-4c — compose the ATTACHMENTS block for the agent's system
 * prompt. Lists recent uploads (most recent first) by name, mime, and
 * size. For attachments whose content was parsed into a text snippet
 * (markdown / plain text / DOCX), surfaces the snippet inline so the
 * agent reads it as evidence-grade context. For binary formats (PDF,
 * XLSX, images, etc.) renders the chip line only with a "content not
 * parsed" hint.
 *
 * Empty string when no attachments OR when the surface isn't a Programs
 * surface — uploads only land in Programs surfaces today, but the surface
 * gate keeps prompts clean for non-Programs callers.
 *
 * Caller is responsible for slicing `attachments` to the most recent N
 * (the route uses 3) before calling. We don't slice here so the
 * composer stays pure.
 */
export function composeAttachmentContextBlock(
  surface: string | null | undefined,
  attachments: readonly AttachmentChipRef[],
  textPreviews: readonly AttachmentTextPreview[],
): string {
  if (!isProgramsSurface(surface)) return '';
  if (!attachments || attachments.length === 0) return '';

  const previewById = new Map<string, AttachmentTextPreview>();
  for (const preview of textPreviews) {
    previewById.set(preview.attachmentId, preview);
  }

  const lines: string[] = [
    'ATTACHMENTS THE USER HAS UPLOADED (most recent first):',
    '',
  ];

  for (const att of attachments) {
    lines.push(
      `  - ${att.originalName} (${att.mimeType}, ${att.sizeBytes} bytes)`,
    );
    const preview = previewById.get(att.id);
    if (preview && preview.parsedTextSnippet.length > 0) {
      const truncatedTail = preview.truncated ? ' [truncated]' : '';
      // Indent the snippet two spaces deeper than the chip line for
      // visual grouping. Keep the snippet as-is (no further escaping)
      // — the system prompt is plain text.
      lines.push(`    ${preview.parsedTextSnippet}${truncatedTail}`);
    } else {
      lines.push(
        '    (content not parsed — file is binary or in an unsupported format)',
      );
    }
  }

  return lines.join('\n');
}

/**
 * TD-7 · render the broker bundle's cross_program_signal items into a
 * system-prompt block that the agent can use to emit grounded
 * `cross-program-signal` artifacts. Surfaces the canonical signalId,
 * title, programs list, severity, and recommendation per signal so the
 * agent does not have to re-resolve any field — it copies them
 * verbatim into the artifact JSON when the user's question makes the
 * signal relevant.
 *
 * Constraint (TD-7 brief): the broker / mapper / adapter must not
 * change. The mapper composes a deterministic `summary` of the form
 * `Programs: <a>, <b>; severity <Sev>; <recommendation>` (any segment
 * may be absent). This helper parses that summary back into structured
 * fields. If the summary doesn't yield a programs array (malformed or
 * empty), the entry is skipped so the prompt only carries actionable
 * signals.
 *
 * Returns '' when there are no usable signals so the route's prompt
 * filter strips the block cleanly.
 */
export function composeCrossProgramSignalsBlock(
  signals: readonly EnterpriseAgentContextItem[],
): string {
  if (!signals || signals.length === 0) return '';

  const parsed = signals
    .filter((s) => s.kind === 'cross_program_signal')
    .map(parseCrossProgramSignalItem)
    .filter(
      (
        entry,
      ): entry is {
        signalId: string;
        title: string;
        programs: string[];
        severity: string;
        recommendation: string;
      } => entry !== null,
    );

  if (parsed.length === 0) return '';

  const lines: string[] = [
    'CROSS-PROGRAM SIGNALS (this tenant has the following multi-program dependencies / conflicts; surface as `cross-program-signal` artifacts when relevant to the user\'s question):',
    '',
  ];

  for (const entry of parsed) {
    lines.push(
      `  - signal-id: ${entry.signalId}`,
      `    title: ${entry.title}`,
      `    programs: ${entry.programs.join(', ')}`,
      `    severity: ${entry.severity}`,
      `    recommendation: ${entry.recommendation}`,
      '',
    );
  }

  lines.push(
    'Use these canonical fields verbatim when emitting `cross-program-signal` artifacts. Do NOT invent signals; do NOT paraphrase severity or recommendation. Severity must be one of `low` / `medium` / `high` / `critical` (lowercase the catalog value if needed).',
  );

  return lines.join('\n');
}

/**
 * Parse a single broker `cross_program_signal` context item back into the
 * structured fields the mapper composed it from. Tightly coupled to
 * `mapCrossProgramSignal` in `tenant-data/mapper.ts` — both modules read
 * the same record shape but the broker boundary forbids the prompt
 * helper from importing the mapper directly. Keep this in sync.
 *
 * Returns null when the summary cannot yield a programs array — the
 * agent emission needs at least one program id, so a malformed item is
 * dropped rather than surfaced as a half-empty signal.
 */
function parseCrossProgramSignalItem(
  item: EnterpriseAgentContextItem,
): {
  signalId: string;
  title: string;
  programs: string[];
  severity: string;
  recommendation: string;
} | null {
  // The mapper namespaces context-item ids as `tenant-data:<recordId>`.
  // Strip the prefix so the agent gets the canonical record id.
  const signalId = item.id.startsWith('tenant-data:')
    ? item.id.slice('tenant-data:'.length)
    : item.id;
  const title = item.title.trim();
  if (signalId.length === 0 || title.length === 0) return null;

  const segments = item.summary
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let programs: string[] = [];
  let severity: string | null = null;
  let recommendation: string | null = null;

  for (const segment of segments) {
    if (segment.startsWith('Programs:')) {
      programs = segment
        .slice('Programs:'.length)
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    } else if (segment.toLowerCase().startsWith('severity ')) {
      severity = segment.slice('severity '.length).trim().toLowerCase();
    } else {
      // The mapper places recommendation as the last unlabeled segment.
      // First-wins so a future schema doesn't accidentally collapse two
      // free-form segments into one.
      if (recommendation === null) {
        recommendation = segment;
      }
    }
  }

  if (programs.length === 0) return null;
  if (!severity || !['low', 'medium', 'high', 'critical'].includes(severity)) {
    // Default to 'medium' when severity is missing or non-canonical.
    // The artifact parser still requires a closed-set value, so we
    // normalize here rather than skip — the agent should still see the
    // signal even if the upstream record under-specifies severity.
    severity = 'medium';
  }
  if (!recommendation || recommendation.length === 0) {
    return null;
  }

  return {
    signalId,
    title,
    programs,
    severity,
    recommendation,
  };
}

/**
 * TD-7 · compose the cross-program-signals block iff the surface
 * qualifies (Programs surfaces only). Empty string elsewhere so the
 * route's prompt-array filter strips it cleanly.
 */
export function composeCrossProgramSignalsBlockForSurface(
  surface: string | null | undefined,
  signals: readonly EnterpriseAgentContextItem[],
): string {
  if (!isProgramsSurface(surface)) return '';
  return composeCrossProgramSignalsBlock(signals);
}

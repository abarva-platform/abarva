// Stage 2 of surfacing real "carries forward" content in the Moves Next-
// Phase Readiness Pack (see memory: project_moves_readiness_pack_and_
// generation_pipeline). Reads a Move's latest generated deliverable content
// for a given type and extracts real signal snippets via Stage 1's
// `extractExhibitContent`. Never fabricates: a signal with no real matching
// content is simply absent from the result, not invented or guessed.

import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import { extractExhibitContent } from "@/lib/deliverables/exhibit-content-extractor";
import { getGateArtifacts } from "@/lib/programs/deliverable-registry";

export interface DeliverableContentSignal {
  /** Stable key for the signal, e.g. "workstreams", "owners", "metrics". */
  key: string;
  /** The real heading or table header the content was found under. */
  heading: string;
  /** Real extracted text — never fabricated. */
  snippet: string;
  /** Canonical deliverable type key that supplied this signal. */
  sourceDeliverableTypeKey?: string;
}

/**
 * Keyword vocabulary reused from `golden-bar.ts`'s `extractExhibitKinds` —
 * the full real marker set already used to detect whether a required
 * visual/table is present in generated Moves deliverables — plus two
 * additions confirmed against a real generated `target_state_architecture`
 * artifact (CANARY, Move 37ee2d85, generated via the live Approve & generate
 * flow): "wave" (real heading "Implementation waves") and broadening
 * "decision record" to "decision" (real heading "AI decision & control
 * flow" — the premium generation path doesn't literally say "decision
 * record"). Each signal tries its keywords in order and keeps the first
 * real match; a signal with no match at all is simply absent, never
 * fabricated.
 */
const SIGNAL_KEYWORDS: ReadonlyArray<{ key: string; keywords: readonly string[] }> = [
  { key: "workstreams", keywords: ["workstream", "roadmap", "timeline", "trajectory", "wave"] },
  { key: "owners", keywords: ["raci", "stakeholder"] },
  { key: "metrics", keywords: ["kpi", "scorecard", "baseline"] },
  { key: "decisions", keywords: ["decision", "tradeoff", "options"] },
  { key: "cost", keywords: ["cost"] },
  { key: "evidence_limits", keywords: ["evidentiary limits", "evidence confidence", "evidence limitations"] },
  { key: "readiness_gaps", keywords: ["unvalidated", "readiness gap", "not established"] },
  { key: "open_inputs", keywords: ["open inputs required"] },
  { key: "hypotheses", keywords: ["root-cause tree", "hypothesis"] },
];

interface LatestDeliverableContentRow {
  content: string;
  version: number;
}

async function readLatestDeliverableContent(
  moveId: string,
  deliverableTypeKey: string,
  signedOffOnly = false,
): Promise<LatestDeliverableContentRow | null> {
  // Prefer the client-approved version over a later, unreviewed regeneration.
  // Prior-phase decision inputs can require approval and fail closed if absent.
  const signedOffClause = signedOffOnly
    ? "AND d.signed_off_version IS NOT NULL AND dv.version = d.signed_off_version "
    : "";
  const rows = await azureRead.query<LatestDeliverableContentRow>(
    "SELECT dv.content, dv.version " +
      "FROM deliverable_versions dv " +
      "JOIN deliverables_v2 d ON d.id = dv.deliverable_id " +
      "WHERE d.engagement_id = $1 AND d.deliverable_type_key = $2 " +
      signedOffClause +
      "ORDER BY (dv.version = d.signed_off_version) DESC, dv.version DESC " +
      "LIMIT 1",
    [moveId, deliverableTypeKey],
    { missingTable: "empty" },
  );
  return rows[0] ?? null;
}

/**
 * Reads a Move's latest generated deliverable of the given type and extracts
 * real content signals (workstreams, owners, metrics, decisions, cost) from
 * it. Returns an empty array when the deliverable hasn't been generated yet,
 * or when none of the signal keywords have a real matching heading/table —
 * this is expected and honest, not an error.
 */
export async function readDeliverableContentSignals(
  moveId: string,
  deliverableTypeKey: string,
  options: { signedOffOnly?: boolean } = {},
): Promise<DeliverableContentSignal[]> {
  const latest = await readLatestDeliverableContent(
    moveId,
    deliverableTypeKey,
    options.signedOffOnly,
  );
  if (!latest?.content) return [];

  const signals: DeliverableContentSignal[] = [];
  for (const { key, keywords } of SIGNAL_KEYWORDS) {
    for (const keyword of keywords) {
      const match = extractExhibitContent(latest.content, keyword);
      if (match) {
        signals.push({
          key,
          heading: match.heading,
          snippet: match.snippet,
          sourceDeliverableTypeKey: deliverableTypeKey,
        });
        break;
      }
    }
  }
  return signals;
}

async function readPhaseGateContentSignalsWithPolicy(
  moveId: string,
  phase: number,
  signedOffOnly: boolean,
): Promise<DeliverableContentSignal[]> {
  const gateArtifacts = getGateArtifacts(phase);
  const signalsByArtifact = await Promise.all(
    gateArtifacts.map((artifact) =>
      readDeliverableContentSignals(moveId, artifact.deliverableTypeKey, {
        signedOffOnly,
      }),
    ),
  );
  const seenKeys = new Set<string>();
  return signalsByArtifact.flat().filter((signal) => {
    if (seenKeys.has(signal.key)) return false;
    seenKeys.add(signal.key);
    return true;
  });
}

export function readPhaseGateContentSignals(
  moveId: string,
  phase: number,
): Promise<DeliverableContentSignal[]> {
  return readPhaseGateContentSignalsWithPolicy(moveId, phase, false);
}

export function readApprovedPhaseGateContentSignals(
  moveId: string,
  phase: number,
): Promise<DeliverableContentSignal[]> {
  return readPhaseGateContentSignalsWithPolicy(moveId, phase, true);
}

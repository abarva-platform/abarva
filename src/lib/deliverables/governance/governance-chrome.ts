/**
 * Required governance markers, checked on the RENDERED file.
 *
 * Found by a blind human-proxy review and by no deterministic gate: the composed
 * deck silently dropped the "AI-generated working draft — not approved" banner
 * that the existing renderer carries. Lineage, claim prohibitions,
 * cross-projection and physical integrity all passed while a required marker
 * vanished from the artifact. That is the canvas defect in a different costume —
 * every check green, the artifact wrong, caught only by someone looking at it.
 *
 * So the markers are checked where the reader sees them, not requested in a
 * prompt. A marker present only in speaker notes is absent.
 */

export type ChromeMarker = 'provenance' | 'data_basis' | 'producer';

export interface ChromeRequirement {
  marker: ChromeMarker;
  /** Any one of these, seen on a slide face, satisfies it. */
  patterns: RegExp[];
  why: string;
}

export interface ChromeFinding {
  marker: ChromeMarker;
  message: string;
  why: string;
}

export interface ChromeVerdict {
  ok: boolean;
  present: ChromeMarker[];
  findings: ChromeFinding[];
}

/**
 * The producer mark is the FIRM, never the internal agent or product name.
 *
 * An internal name on a steering-committee surface is builder vocabulary in
 * front of a CXO. Client branding is deliberately absent from this contract: a
 * client's mark on an advisor's deliverable implies client authorship, and real
 * client identity is restricted under the context/corpus policy, so
 * auto-applying a logo would build a disclosure path into the renderer. The
 * client is named in the title block, which is where a reader expects it.
 */
export const DEFAULT_CHROME: ChromeRequirement[] = [
  {
    marker: 'provenance',
    patterns: [/\bAI[- ]generated\b/i, /\bworking draft\b/i, /\bnot approved\b/i, /\bdraft\b.*\bfor review\b/i],
    why: 'a reader must be able to tell a generated draft from an approved artifact',
  },
  {
    marker: 'data_basis',
    patterns: [/\bsynthetic\b/i, /\bplanning[- ]grade\b/i, /\billustrative\b/i, /\bnot (?:client |production )?data\b/i],
    why: 'an artifact built on synthetic data must say so on its face',
  },
  {
    marker: 'producer',
    patterns: [/\bAbarVa\b/i],
    why: 'the producing firm is named; internal agent and product names are not',
  },
];

/** Internal names that must never appear on a client-facing surface. */
const BUILDER_VOCABULARY = /\b(nexus|sentinel|atlas|steward|composer|orchestrator)\b/i;

export interface ChromeInput {
  /** Text a reader sees on slide faces. Speaker notes do not count. */
  visibleText: string;
  requirements?: ChromeRequirement[];
  /** Only assert the synthetic label when the corpus actually says so. */
  requireDataBasis?: boolean;
}

export function checkGovernanceChrome(input: ChromeInput): ChromeVerdict {
  const requirements = (input.requirements ?? DEFAULT_CHROME).filter(
    (r) => r.marker !== 'data_basis' || input.requireDataBasis !== false,
  );
  const findings: ChromeFinding[] = [];
  const present: ChromeMarker[] = [];

  for (const requirement of requirements) {
    if (requirement.patterns.some((p) => p.test(input.visibleText))) {
      present.push(requirement.marker);
      continue;
    }
    findings.push({
      marker: requirement.marker,
      message: `required ${requirement.marker.replace('_', ' ')} marker does not appear on any slide face`,
      why: requirement.why,
    });
  }

  const leaked = input.visibleText.match(BUILDER_VOCABULARY);
  if (leaked) {
    findings.push({
      marker: 'producer',
      message: `internal name "${leaked[0]}" appears on a client-facing surface`,
      why: 'builder vocabulary does not belong where a CXO reads',
    });
  }

  return { ok: findings.length === 0, present, findings };
}

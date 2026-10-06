/**
 * Claim boundaries as a typed contract, normalised at ingest.
 *
 * The prohibition gate built for the composer proof works, but it infers the
 * rule from sentence wording on every run. Its first pass produced six findings
 * and all six were false — a denial written with "nothing", a column header, a
 * conditional value hypothesis, a sentence carrying the very qualifier the rule
 * demanded. Four tightenings fixed those, and each tightening was a guess about
 * English rather than a statement of the rule.
 *
 * The rule should be stated once, where the evidence is loaded. Prose stays, so
 * Claude can narrate the boundary to a reader; the gate reads the structure.
 * Text matching remains the fallback for corpora not yet normalised, and is
 * labelled as a fallback rather than presented as the mechanism.
 */

export type ClaimState = 'prohibited' | 'conditional' | 'permitted';

export interface ClaimConstraint {
  id: string;
  subject: string;
  assertion: string;
  state: ClaimState;
  /** Evidence that, once present, moves a conditional claim to permitted. */
  requiredEvidenceIds: string[];
  sourceRefs: string[];
  reason: string;
}

export interface ResolvedConstraint extends ClaimConstraint {
  effectiveState: ClaimState;
  /** Which required evidence is still absent. Named, because "blocked" alone gets disabled. */
  missingEvidenceIds: string[];
}

/**
 * Resolve each constraint against the evidence actually present.
 *
 * A conditional claim whose evidence has arrived becomes permitted and stops
 * blocking. One whose evidence is partly absent stays conditional and names what
 * is missing — a gate that says "blocked" without saying why is a gate someone
 * switches off.
 */
export function resolveClaimConstraints(
  constraints: ClaimConstraint[],
  presentEvidenceIds: string[],
): ResolvedConstraint[] {
  const present = new Set(presentEvidenceIds);
  return constraints.map((c) => {
    const missing = c.requiredEvidenceIds.filter((id) => !present.has(id));
    if (c.state !== 'conditional') {
      return { ...c, effectiveState: c.state, missingEvidenceIds: missing };
    }
    return {
      ...c,
      effectiveState: missing.length === 0 ? 'permitted' : 'conditional',
      missingEvidenceIds: missing,
    };
  });
}

/** Subjects an artifact may not assert, given what evidence is present. */
export function blockedSubjects(resolved: ResolvedConstraint[]): string[] {
  return resolved.filter((c) => c.effectiveState !== 'permitted').map((c) => c.subject);
}

/**
 * Normalise a prose prohibition into a constraint.
 *
 * The fallback path, for corpora that carry prohibitions only as sentences. It
 * produces a constraint with no `requiredEvidenceIds`, which means it can never
 * resolve to permitted — correct, because nothing in the prose says what would
 * clear it. That limitation is the point: it should be uncomfortable enough to
 * prompt normalising the source.
 */
export function constraintFromProse(statement: string, sourceRef: string, index: number): ClaimConstraint {
  const subject = statement
    .replace(/^do not (claim|cite|present|treat|state)\s*/i, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('_')
    .toLowerCase();
  return {
    id: `prose-${index}`,
    subject: subject || `prose_${index}`,
    assertion: statement,
    state: 'prohibited',
    requiredEvidenceIds: [],
    sourceRefs: [sourceRef],
    reason: 'carried as prose; not yet normalised, so nothing declares what would clear it',
  };
}

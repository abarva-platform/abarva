/**
 * Coverage and containment — the two halves, and they are mirrors.
 *
 * Coverage asks whether the right evidence is present. Containment asks whether
 * anything else got in. The earlier funnel had only the first half, and so
 * reported 13 of 13 uploaded facts arriving while 103 inadmissible items sat in
 * the same bundle.
 */

import type { EvidenceAdmissionDecision, EvidenceAdmissionPolicy, EvidenceCandidate } from './move-scope';

export type UtilisationState = 'used' | 'declared_not_applicable' | 'unused';

/** How one Move-uploaded item ended up. Silently unused is a defect. */
export interface UtilisationRecord {
  evidenceId: string;
  state: UtilisationState;
  /** Required when declared not applicable. */
  reason?: string;
  actorId?: string;
}

export type CoverageFinding =
  | { kind: 'move_upload_unused'; evidenceId: string; phase?: string; message: string }
  | { kind: 'declaration_incomplete'; evidenceId: string; message: string }
  | { kind: 'family_below_minimum'; family: string; have: number; need: number; message: string }
  | { kind: 'required_key_missing'; family: string; key: string; message: string };

export interface CoverageVerdict {
  ok: boolean;
  moveUploads: { total: number; used: number; declared: number; unused: number };
  families: { family: string; admitted: number; minItems: number }[];
  findings: CoverageFinding[];
}

export interface CoverageInput {
  policy: EvidenceAdmissionPolicy;
  candidates: EvidenceCandidate[];
  decisions: EvidenceAdmissionDecision[];
  utilisation: UtilisationRecord[];
  /** Evidence keys actually present in the artifact, for requiredEvidenceKeys. */
  presentEvidenceKeys: string[];
}

export function checkCoverage(input: CoverageInput): CoverageVerdict {
  const { policy, candidates, decisions, utilisation, presentEvidenceKeys } = input;
  const findings: CoverageFinding[] = [];

  // ── Tier A: per item, no minimum ──────────────────────────────────────────
  // A percentage here would let the pipeline choose which of the client's own
  // evidence to ignore, which is exactly what it must not be able to do.
  const uploads = candidates.filter((c) => c.fromMoveUpload);
  const byId = new Map(utilisation.map((u) => [u.evidenceId, u]));
  let used = 0;
  let declared = 0;
  let unused = 0;

  for (const upload of uploads) {
    const record = byId.get(upload.evidenceId);
    if (!record || record.state === 'unused') {
      unused += 1;
      findings.push({
        kind: 'move_upload_unused',
        evidenceId: upload.evidenceId,
        ...(upload.uploadedAtPhase !== undefined ? { phase: upload.uploadedAtPhase } : {}),
        message: `evidence uploaded through the Move process${upload.uploadedAtPhase ? ` at ${upload.uploadedAtPhase}` : ''} was neither used nor declared not applicable`,
      });
      continue;
    }
    if (record.state === 'declared_not_applicable') {
      // A declaration without a reason and an actor is silence with extra steps.
      if (!record.reason?.trim() || !record.actorId?.trim()) {
        findings.push({
          kind: 'declaration_incomplete',
          evidenceId: upload.evidenceId,
          message: 'declared not applicable without both a reason and an actor',
        });
      }
      declared += 1;
      continue;
    }
    used += 1;
  }

  // ── Tier B: family minimums, and named decision-critical keys ─────────────
  const admittedByFamily = new Map<string, number>();
  for (const d of decisions) {
    if (!d.admitted) continue;
    admittedByFamily.set(d.family, (admittedByFamily.get(d.family) ?? 0) + 1);
  }

  const present = new Set(presentEvidenceKeys);
  const families = policy.required.map((r) => {
    const have = admittedByFamily.get(r.family) ?? 0;
    if (have < r.minItems) {
      findings.push({
        kind: 'family_below_minimum',
        family: r.family,
        have,
        need: r.minItems,
        message: `required family "${r.family}" has ${have} admitted items; the policy requires ${r.minItems}`,
      });
    }
    // minItems alone is insufficient: a family at its minimum is still
    // incomplete if the one item the decision rests on is the missing one.
    for (const key of r.requiredEvidenceKeys ?? []) {
      if (!present.has(key)) {
        findings.push({
          kind: 'required_key_missing',
          family: r.family,
          key,
          message: `decision-critical evidence "${key}" is required by policy and absent from the artifact`,
        });
      }
    }
    return { family: r.family, admitted: have, minItems: r.minItems };
  });

  return {
    ok: findings.length === 0,
    moveUploads: { total: uploads.length, used, declared, unused },
    families,
    findings,
  };
}

// ── containment ──────────────────────────────────────────────────────────────

export type ContainmentFinding =
  | { kind: 'no_admission_decision'; evidenceId: string; stage: string; message: string }
  | { kind: 'inadmissible_reached_stage'; evidenceId: string; stage: string; reason: string; message: string }
  | { kind: 'benchmark_outside_appendix'; evidenceId: string; message: string }
  | { kind: 'benchmark_unlabelled'; evidenceId: string; message: string };

export interface ContainmentVerdict {
  ok: boolean;
  checked: { packed: number; cited: number; rendered: number };
  findings: ContainmentFinding[];
}

export interface ContainmentInput {
  decisions: EvidenceAdmissionDecision[];
  packed: string[];
  cited: string[];
  rendered: string[];
  /** Evidence ids rendered outside the appendix. */
  renderedInCoreStory?: string[];
  /** Evidence ids rendered with a visible benchmark label. */
  labelledAsBenchmark?: string[];
}

export function checkContainment(input: ContainmentInput): ContainmentVerdict {
  const { decisions, packed, cited, rendered } = input;
  const core = new Set(input.renderedInCoreStory ?? []);
  const labelled = new Set(input.labelledAsBenchmark ?? []);
  const byId = new Map(decisions.map((d) => [d.evidenceId, d]));
  const findings: ContainmentFinding[] = [];
  const seen = new Set<string>();

  for (const [stage, ids] of [['packed', packed], ['cited', cited], ['rendered', rendered]] as const) {
    for (const id of ids) {
      const decision = byId.get(id);
      if (!decision) {
        findings.push({
          kind: 'no_admission_decision',
          evidenceId: id,
          stage,
          message: `${stage} evidence "${id}" traces to no admission decision`,
        });
        continue;
      }
      if (!decision.admitted && !seen.has(`${id}:${stage}`)) {
        seen.add(`${id}:${stage}`);
        findings.push({
          kind: 'inadmissible_reached_stage',
          evidenceId: id,
          stage,
          reason: decision.reason,
          // Off-scope material is a defect even when it is factually correct.
          message: `inadmissible evidence "${id}" reached ${stage} — ${decision.reason}`,
        });
      }
    }
  }

  for (const id of rendered) {
    const decision = byId.get(id);
    if (decision?.admittedBy !== 'benchmark') continue;
    if (core.has(id)) {
      findings.push({
        kind: 'benchmark_outside_appendix',
        evidenceId: id,
        message: `benchmark evidence "${id}" appears in the core story; policy confines it to the appendix`,
      });
    }
    if (!labelled.has(id)) {
      findings.push({
        kind: 'benchmark_unlabelled',
        evidenceId: id,
        message: `benchmark evidence "${id}" is rendered without a visible benchmark label`,
      });
    }
  }

  return {
    ok: findings.length === 0,
    checked: { packed: packed.length, cited: cited.length, rendered: rendered.length },
    findings,
  };
}

// ── shadow report ────────────────────────────────────────────────────────────

export interface ShadowReport {
  availableEvidence: number;
  admitted: number;
  wouldExclude: number;
  retrieved: number;
  packed: number;
  cited: number;
  rendered: number;
  flags: {
    inadmissibleRetrieved: string[];
    inadmissibleInProse: string[];
    inadmissibleInDeck: string[];
    requiredAdmittedNeverRetrieved: string[];
    moveUploadsNeverUsedOrDeclared: string[];
  };
}

/**
 * Reports before it gates.
 *
 * Per the graph adoption rule: run in shadow, compare against what the artifact
 * actually used, and adopt only when the comparison holds. On the run that
 * prompted this control the shadow report would have read "103 of 159
 * inadmissible, 20 of them reaching the deck" — a finding, before it is a block.
 */
export function buildShadowReport(input: {
  decisions: EvidenceAdmissionDecision[];
  retrieved: string[];
  packed: string[];
  cited: string[];
  rendered: string[];
  coverage: CoverageVerdict;
}): ShadowReport {
  const { decisions, retrieved, packed, cited, rendered, coverage } = input;
  const admittedIds = new Set(decisions.filter((d) => d.admitted).map((d) => d.evidenceId));
  const inadmissible = (ids: string[]) => ids.filter((id) => !admittedIds.has(id));
  const retrievedSet = new Set(retrieved);

  return {
    availableEvidence: decisions.length,
    admitted: admittedIds.size,
    wouldExclude: decisions.length - admittedIds.size,
    retrieved: retrieved.length,
    packed: packed.length,
    cited: cited.length,
    rendered: rendered.length,
    flags: {
      inadmissibleRetrieved: inadmissible(retrieved),
      inadmissibleInProse: inadmissible(cited),
      inadmissibleInDeck: inadmissible(rendered),
      // The quiet failure: admitted, required, and retrieval never surfaced it.
      requiredAdmittedNeverRetrieved: [...admittedIds].filter((id) => !retrievedSet.has(id)),
      moveUploadsNeverUsedOrDeclared: coverage.findings
        .filter((f) => f.kind === 'move_upload_unused')
        .map((f) => (f as { evidenceId: string }).evidenceId),
    },
  };
}

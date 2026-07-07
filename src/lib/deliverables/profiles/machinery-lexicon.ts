// Deliverable Quality Transformation — machinery lexicon (W0)
//
// The de-machinery gate flags these terms when they appear in a CLIENT-FACING
// narrative (they are allowed in the working binder and in appendices). The goal
// is not censorship — it is to keep the system's vocabulary out of the client's
// reading experience. Evidence stays traceable underneath; the narrative reads
// like a senior consultant wrote it.
//
// Source: transformation spec §4 (banned/minimised) + §14 (before/after).

/** Internal phase labels that must not leak into client narrative. */
export const PHASE_LABEL_TERMS: ReadonlyArray<string> = [
  "P0",
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
];

/** System/evidence machinery vocabulary. */
export const MACHINERY_TERMS: ReadonlyArray<string> = [
  "source register",
  "evidence register",
  "context rows",
  "tower rows",
  "substrate",
  "entity graph",
  "enterprise_context",
  "client to complete",
  "client-to-complete",
  "not authorized to build",
  "not authorized",
  "authorized to build",
  "governance-correct",
];

/**
 * Suggested human-consultant replacements (spec §4). Advisory — surfaced to the
 * author/rewrite pass, not a mechanical find-replace.
 */
export const MACHINERY_REWRITES: Readonly<Record<string, string>> = {
  "P1/P2/P3 phase labels": "discovery, design, implementation planning, investment decision, executive handoff",
  "source register / evidence register":
    "what the evidence indicates / what we know / what remains to validate",
  "not authorized to build":
    "do not approve build yet; approve the next validation gate",
  "substrate / context rows / tower rows":
    "enterprise context, client records, operating data, architecture data",
  "client to complete (repeated inline)": "a single Open Inputs Required table",
  "governance-correct": "control-ready / compliant by design",
  "legalistic disclaimers": "clear decision guardrails",
};

/**
 * The full client-narrative banned set. The gate scans client-facing artifacts
 * (evidenceMode !== 'working_binder') for these and reports overuse.
 */
export const CLIENT_NARRATIVE_BANNED_TERMS: ReadonlyArray<string> = [
  ...PHASE_LABEL_TERMS,
  ...MACHINERY_TERMS,
];

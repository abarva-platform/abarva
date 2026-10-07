/**
 * May the product tell a reader that required evidence can be waived?
 *
 * An evidence need packet is rendered on the live phase workspace — the needs
 * panel, the Approve & Build panel, and the phase canvas all print its
 * sentences. Three of those sentences offered a waiver as the way past a
 * required evidence item that the client cannot supply:
 *
 *   - `waiverOption`, a field whose whole purpose is to name the waiver;
 *   - the "blocked until this evidence is uploaded or formally waived" label;
 *   - the "must wait until <family> is uploaded or formally waived" caveat.
 *
 * No surface in Moves can record one. `MoveEvidenceNeedStatus` has a `waived`
 * member and three readers treat it as satisfying
 * (`phase-progress-readiness`, `phase-templates/phase-workflow`,
 * `phase-templates/p3-option-assembler`), but nothing produces it: the only
 * waiver controls in the repo belong to Source's gate-criteria and artifact
 * acceptance routes, which do not write a Move's evidence status, and the one
 * Moves-side `<option value="waived">` lives under the `/programs/:id` subtree
 * that is redirected away.
 *
 * That makes the offer worse than silence. A required evidence item blocks the
 * phase's Approve & Build, so the reader is already stuck; being told a sponsor
 * may record a waiver sends them looking for a control that is not there, and
 * away from the two that are — upload the source file, or have an authorized
 * owner approve the pending review in Files & Evidence.
 *
 * So the availability is declared here, once, and the copy is derived from it.
 * This is deliberately NOT a feature flag and NOT a policy change: waiving
 * required evidence stays exactly as (un)available as it is today. Only what
 * the product claims about it changes. When a producer is built, flip
 * `MOVE_EVIDENCE_WAIVER_AVAILABLE` and every sentence comes back in one edit,
 * which is why the available-wording is kept here rather than deleted.
 */

/**
 * True only when some product surface can record a waiver against a Move's
 * evidence need — i.e. can put a need packet into `status: "waived"`.
 *
 * Keep this false until such a producer exists. The guard suite beside this
 * module asserts that while it is false no packet sentence mentions a waiver,
 * so a re-introduction of the copy fails rather than shipping.
 */
export const MOVE_EVIDENCE_WAIVER_AVAILABLE = false;

/**
 * What a reader is told about closing a required evidence item. Named for the
 * two controls that do exist on the phase workspace.
 */
export const EVIDENCE_CLOSE_PATH =
  "uploaded and approved in Files & Evidence";

/**
 * The `waiverOption` sentence, or `null` when the product cannot record one.
 * `null` rather than a replacement sentence: the field exists to name a waiver,
 * and the panel already omits the row when it is absent.
 */
export function waiverOptionSentence(required: boolean): string | null {
  if (!MOVE_EVIDENCE_WAIVER_AVAILABLE) return null;
  return required
    ? "A sponsor or accountable owner may record a waiver, but final artifacts must carry the waiver caveat."
    : "Optional input; waive only if the team accepts a lower-readiness artifact.";
}

/** "Final generation is blocked until this evidence is …" */
export function blockedUntilSentence(): string {
  return MOVE_EVIDENCE_WAIVER_AVAILABLE
    ? "Final generation is blocked until this evidence is uploaded or formally waived."
    : `Final generation is blocked until this evidence is ${EVIDENCE_CLOSE_PATH}.`;
}

/** "Do not present final or board-ready output until this evidence is …" */
export function doNotPresentSentence(): string {
  return MOVE_EVIDENCE_WAIVER_AVAILABLE
    ? "Do not present final or board-ready output until this evidence is covered or waived."
    : `Do not present final or board-ready output until this evidence is ${EVIDENCE_CLOSE_PATH}.`;
}

/** "Final generation must wait until <family> is …" */
export function mustWaitSentence(familyLabelLowercase: string): string {
  return MOVE_EVIDENCE_WAIVER_AVAILABLE
    ? `A preliminary draft lane is not active for this phase. Final generation must wait until ${familyLabelLowercase} is uploaded or formally waived.`
    : `A preliminary draft lane is not active for this phase. Final generation must wait until ${familyLabelLowercase} is ${EVIDENCE_CLOSE_PATH}.`;
}

/**
 * The ask printed for a family no guidance table authored. Same rule: it may
 * only offer a waiver while one can be recorded.
 */
export function unauthoredNextActionSentence(): string {
  return MOVE_EVIDENCE_WAIVER_AVAILABLE
    ? "Upload the source file or record a human waiver with rationale."
    : "Upload the source file, then have an authorized owner approve it in Files & Evidence.";
}

/**
 * The refusal detail when a phase build is held by required evidence. The
 * count is the caller's; only the closing clause is decided here.
 */
export function buildHeldByEvidenceDetail(count: number): string {
  const subject = `${count} required evidence item${count === 1 ? " is" : "s are"}`;
  return MOVE_EVIDENCE_WAIVER_AVAILABLE
    ? `${subject} not yet approved, covered, or formally waived. No phase build was queued.`
    : `${subject} not yet approved in Files & Evidence. No phase build was queued.`;
}

/** What to do about missing required evidence, as one imperative sentence. */
export function closeRequiredEvidenceInstruction(): string {
  return MOVE_EVIDENCE_WAIVER_AVAILABLE
    ? "Upload the missing evidence or record a human waiver before advancing."
    : "Upload the missing evidence, then have an authorized owner approve it in Files & Evidence, before advancing.";
}

/** The gap register's per-family remediation line. */
export function gapRemediationSentence(
  format: string,
  likelySource: string,
): string {
  return MOVE_EVIDENCE_WAIVER_AVAILABLE
    ? `Upload ${format} from ${likelySource} or record a human waiver before P3.`
    : `Upload ${format} from ${likelySource} and have an authorized owner approve it before P3.`;
}

/**
 * The phase-capture header's reminder that saved answers are not completion.
 * Stated as the condition that actually releases the hold.
 */
export function requiredEvidenceCompletionNotice(): string {
  return MOVE_EVIDENCE_WAIVER_AVAILABLE
    ? "Required evidence must be approved or formally waived before these inputs can show complete or the phase can advance."
    : "Required evidence must be approved in Files & Evidence before these inputs can show complete or the phase can advance.";
}
